import {
  CollectCoverageMessage,
  CollectCoverageResponse,
  CoverageGroup,
  CoverageLine,
  CoverageReport,
} from './types';

type MessageListener = (
  message: CollectCoverageMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: CollectCoverageResponse) => void,
) => true | void;

const SOURCE_CONTAINER_SELECTOR = '.source-viewer';
const UNCOVERED_TEXT_PATTERN = /not\s+covered/i;
const INDICATOR_ATTRIBUTES = ['aria-label', 'aria-describedby', 'title', 'data-tooltip'] as const;
type IndicatorAttribute = (typeof INDICATOR_ATTRIBUTES)[number];

const tooltipCache = new Map<string, string>();

const getTooltipText = (id: string): string | undefined => {
  if (tooltipCache.has(id)) {
    const cached = tooltipCache.get(id);
    return cached ? cached : undefined;
  }

  const element = document.getElementById(id);
  const text = element?.textContent?.trim() ?? '';
  tooltipCache.set(id, text);
  return text || undefined;
};

const getAttributeTexts = (element: Element, attribute: IndicatorAttribute): string[] => {
  if (attribute === 'aria-describedby') {
    const describedBy = element.getAttribute(attribute);
    if (!describedBy) {
      return [];
    }

    return describedBy
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .map((token) => getTooltipText(token))
      .filter((value): value is string => Boolean(value));
  }

  const value = element.getAttribute(attribute);
  return value ? [value] : [];
};

const gatherIndicatorTexts = (element: Element): string[] => {
  const values = INDICATOR_ATTRIBUTES.flatMap((attribute) => getAttributeTexts(element, attribute));
  const textContent = element.textContent?.trim();
  if (textContent) {
    values.push(textContent);
  }
  return values;
};

const cellContainsUncoveredIndicator = (cell: Element): boolean => {
  const nodes: Element[] = [cell, ...Array.from(cell.querySelectorAll<HTMLElement>('*'))];
  return nodes.some((node) => gatherIndicatorTexts(node).some((text) => UNCOVERED_TEXT_PATTERN.test(text)));
};

const rowHasUncoveredIndicator = (row: Element): boolean => {
  const statusCells = Array.from(row.querySelectorAll<HTMLTableCellElement>('td')).filter(
    (cell) => !cell.classList.contains('it__source-line-code'),
  );
  if (statusCells.length) {
    return statusCells.some(cellContainsUncoveredIndicator);
  }

  return cellContainsUncoveredIndicator(row);
};

const parseLineNumber = (row: Element): number | null => {
  const candidates: Array<string | null | undefined> = [
    row.getAttribute('data-line-number'),
    (row as HTMLElement).dataset?.lineNumber,
  ];

  const nestedCell = row.querySelector<HTMLElement>('[data-line-number]');
  if (nestedCell && nestedCell !== row) {
    candidates.push(nestedCell.getAttribute('data-line-number'));
    candidates.push(nestedCell.dataset?.lineNumber);
  }

  const triggerElements = Array.from(
    row.querySelectorAll<HTMLElement>('[id^="line-number-trigger-"], [aria-label^="Line"]'),
  );
  triggerElements.forEach((element) => {
    const label = element.getAttribute('aria-label');
    if (label) {
      const match = label.match(/\d+/);
      if (match) {
        candidates.push(match[0]);
      }
    }
    const text = element.textContent?.trim();
    if (text) {
      candidates.push(text);
    }
  });

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const extractCodeText = (row: Element): string => {
  const codeCell = row.querySelector<HTMLElement>('td.it__source-line-code');
  if (!codeCell) {
    return '';
  }
  const target = codeCell.querySelector<HTMLElement>('pre') ?? codeCell;
  const text = target.textContent ?? '';
  return text.replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n').replace(/\n$/, '');
};

const collectUncoveredLines = (containers: Element[]): CoverageLine[] => {
  const lines = new Map<number, CoverageLine>();

  containers.forEach((container) => {
    const rows = Array.from(container.querySelectorAll('tr[data-line-number]'));
    rows.forEach((row) => {
      if (!rowHasUncoveredIndicator(row)) {
        return;
      }

      const lineNumber = parseLineNumber(row);
      if (lineNumber == null) {
        return;
      }

      const code = extractCodeText(row);
      lines.set(lineNumber, { lineNumber, code });
    });
  });

  return Array.from(lines.values()).sort((a, b) => a.lineNumber - b.lineNumber);
};

const findSourceContainers = (): Element[] => Array.from(document.querySelectorAll(SOURCE_CONTAINER_SELECTOR));

const groupLines = (lines: CoverageLine[]): CoverageGroup[] => {
  if (!lines.length) {
    return [];
  }

  const groups: CoverageGroup[] = [];
  let current: CoverageGroup | null = null;

  lines.forEach((line) => {
    if (!current || line.lineNumber > current.endLine + 1) {
      current = {
        startLine: line.lineNumber,
        endLine: line.lineNumber,
        lines: [line],
      };
      groups.push(current);
      return;
    }

    current.endLine = line.lineNumber;
    current.lines.push(line);
  });

  return groups;
};

const getBreadcrumbSegments = (): string[] => {
  const nav = document.querySelector('nav[aria-label="Breadcrumbs"]');
  if (!nav) {
    return [];
  }

  return Array.from(nav.querySelectorAll('li a'))
    .map((anchor) => anchor.textContent?.trim() ?? '')
    .filter((segment) => segment.length > 0);
};

const fallbackFilePathFromUrl = (url: URL): string => {
  const selected = url.searchParams.get('selected');
  if (selected) {
    const decoded = decodeURIComponent(selected);
    const parts = decoded.split(':');
    return parts[parts.length - 1] ?? '';
  }
  const id = url.searchParams.get('id');
  if (id) {
    const decoded = decodeURIComponent(id);
    const colonIndex = decoded.indexOf(':');
    if (colonIndex >= 0 && colonIndex + 1 < decoded.length) {
      return decoded.slice(colonIndex + 1);
    }
  }
  return '';
};

const buildCoverageReport = (): CoverageReport => {
  const containers = findSourceContainers();
  if (!containers.length) {
    throw new Error(
      'Unable to locate the SonarQube source viewer. Open a file-level "Measures" view and try again.',
    );
  }

  const uncovered = collectUncoveredLines(containers);
  if (!uncovered.length) {
    throw new Error(
      'No uncovered new-code lines detected. Ensure the "New Code" filter is active or that this file has uncovered lines.',
    );
  }

  const groups = groupLines(uncovered);
  const url = new URL(window.location.href);
  const breadcrumbSegments = getBreadcrumbSegments();
  const projectName = breadcrumbSegments[0] ?? (url.searchParams.get('id') ?? 'SonarQube project');
  const filePathSegments = breadcrumbSegments.length > 1 ? breadcrumbSegments.slice(1) : [];
  const filePathFromBreadcrumbs = filePathSegments.join('/');
  const filePath = filePathFromBreadcrumbs || fallbackFilePathFromUrl(url) || 'Unknown file path';

  const report: CoverageReport = {
    projectName,
    filePath,
    url: url.toString(),
    generatedAt: new Date().toISOString(),
    totalUncoveredLines: uncovered.length,
    groups,
  };

  return report;
};

const handleMessage: MessageListener = (message, _sender, sendResponse) => {
  if (message.type !== 'COLLECT_COVERAGE') {
    return;
  }

  try {
    const report = buildCoverageReport();
    sendResponse({ success: true, report });
  } catch (error) {
    const fallbackMessage =
      error instanceof Error ? error.message : 'Unable to build coverage report.';
    sendResponse({ success: false, error: fallbackMessage });
  }
};

chrome.runtime.onMessage.addListener(handleMessage);
