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

const NOT_COVERED_ARIA_LABEL = 'Not covered by tests.';

const parseLineNumber = (row: Element): number | null => {
  const direct = row.getAttribute('data-line-number');
  if (direct) {
    const parsed = Number.parseInt(direct, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const fallbackCell = row.querySelector<HTMLElement>('[data-line-number]');
  if (!fallbackCell) {
    return null;
  }
  const fallback = fallbackCell.getAttribute('data-line-number');
  if (!fallback) {
    return null;
  }
  const parsed = Number.parseInt(fallback, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractCodeText = (row: Element): string => {
  const codeCell = row.querySelector<HTMLPreElement>('td.it__source-line-code pre');
  if (!codeCell) {
    return '';
  }
  const text = codeCell.textContent ?? '';
  return text.replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\n$/, '');
};

const collectUncoveredLines = (): CoverageLine[] => {
  const containers = Array.from(document.querySelectorAll('.source-viewer'));
  if (!containers.length) {
    return [];
  }

  const lines = new Map<number, CoverageLine>();

  containers.forEach((container) => {
    const indicators = Array.from(
      container.querySelectorAll(`[aria-label="${NOT_COVERED_ARIA_LABEL}"]`),
    );

    indicators.forEach((indicator) => {
      const row = indicator.closest('tr[data-line-number]');
      if (!row) {
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
  const uncovered = collectUncoveredLines();
  if (!uncovered.length) {
    throw new Error('No uncovered new-code lines detected on this view.');
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
