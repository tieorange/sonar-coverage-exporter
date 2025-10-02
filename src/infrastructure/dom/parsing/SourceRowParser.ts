const CODE_CELL_SELECTOR = 'td.it__source-line-code';
const STATUS_CELL_SELECTOR = 'td';

const INDICATOR_TEXT_ATTRIBUTES = [
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'title',
  'data-tooltip',
  'data-original-title',
  'data-help',
  'data-status',
  'data-indicator',
  'data-coverage',
] as const;

const STRUCTURAL_ATTRIBUTE_CANDIDATES = [
  'class',
  'data-testid',
  'data-test',
  'data-test-id',
  'data-qa',
  'data-purpose',
  'data-role',
  'data-state',
  'data-line-status',
  'data-line-type',
  'data-diff-type',
  'data-filter',
  'role',
  'aria-label',
  'id',
] as const;

const INDICATOR_KEYWORDS = [
  'not covered',
  'line not covered',
  'lines not covered',
  'no coverage',
  'missing coverage',
  'without coverage',
  'uncovered',
  'coverage missing',
  'kein test',
  'keine abdeckung',
  'nicht abgedeckt',
  'nicht gedeckt',
  'pas couvert',
  'non couvert',
  'sin cobertura',
  'sem cobertura',
  'cobertura ausente',
  'cobertura faltante',
  'not tested',
  'missing tests',
];

export const EXPLICIT_NEW_CODE_SELECTORS = [
  '[data-testid="new-code-underline"]',
  '[data-testid*="new-code-line"]',
  '[data-testid*="new-code-marker"]',
  '[data-testid*="new-code-indicator"]',
  '[data-test*="new-code-line"]',
  '[data-qa*="new-code-line"]',
  '[class*="new-code-underline"]',
  '[class*="new-code-indicator"]',
];

const EXPLICIT_NEW_CODE_KEYWORDS = [
  'new-code-underline',
  'new-code-line',
  'new-code-marker',
  'new-code-indicator',
  'new-code-highlight',
  'new-code',
  'new_code',
  'newcode',
  'nc__line',
];

const FALLBACK_KEYWORDS = [
  'new code only',
  'new-code-only',
  'new code filter',
  'filtered new code',
  'new-code-filtered',
  'new code filtered',
  'new code scope',
  'new code range',
  'new code summary',
  'new code lines',
  'source-line-filtered',
  'line-filtered',
];

interface IndicatorAnalysis {
  hasIndicator: boolean;
  texts: string[];
  normalisedTexts: string[];
}

export interface SourceRowSnapshot {
  lineNumber: number | null;
  codeText: string;
  isFiltered: boolean;
  hasIndicator: boolean;
  hasExplicitMarker: boolean;
  fallbackEligible: boolean;
}

export class SourceRowParser {
  private readonly tooltipCache = new Map<string, string>();

  constructor(private readonly documentRef: Document) {}

  public snapshot(rowElement: HTMLElement): SourceRowSnapshot {
    const codeCell = rowElement.querySelector<HTMLElement>(CODE_CELL_SELECTOR);
    const indicator = this.analyseIndicator(rowElement, codeCell);
    const hasExplicitMarker = this.hasExplicitNewCodeMarker(rowElement, codeCell);

    return {
      lineNumber: this.resolveLineNumber(rowElement),
      codeText: this.extractCodeText(codeCell),
      isFiltered: this.isFiltered(rowElement, codeCell),
      hasIndicator: indicator.hasIndicator,
      hasExplicitMarker,
      fallbackEligible: this.isFallbackEligible(rowElement, codeCell, indicator, hasExplicitMarker),
    };
  }

  private analyseIndicator(row: HTMLElement, codeCell: HTMLElement | null): IndicatorAnalysis {
    const nodes = this.findIndicatorNodes(row, codeCell);
    const values = new Set<string>();

    nodes.forEach((node) => this.collectIndicatorTexts(node, values));

    const texts = Array.from(values).filter((value) => value.length > 0);
    const normalisedTexts = texts.map((value) => this.normalise(value));
    const hasIndicator = normalisedTexts.some((value) => this.matchesIndicator(value));

    return { hasIndicator, texts, normalisedTexts };
  }

  private findIndicatorNodes(row: HTMLElement, codeCell: HTMLElement | null): Element[] {
    const statusCells = Array.from(row.querySelectorAll<HTMLTableCellElement>(STATUS_CELL_SELECTOR)).filter(
      (cell) => !cell.classList.contains('it__source-line-code'),
    );

    if (statusCells.length) {
      return statusCells.flatMap((cell) => [cell, ...Array.from(cell.querySelectorAll<HTMLElement>('*'))]);
    }

    const descriptiveSelector = [
      '[aria-label]',
      '[aria-labelledby]',
      '[aria-describedby]',
      '[data-tooltip]',
      '[data-original-title]',
      '[data-help]',
      '[data-status]',
      '[data-indicator]',
      '[data-coverage]',
      '[role="img"]',
      '[role="status"]',
    ].join(', ');

    const nodes = Array.from(row.querySelectorAll<HTMLElement>(descriptiveSelector));
    const filtered = codeCell ? nodes.filter((node) => !codeCell.contains(node)) : nodes;

    if (filtered.length) {
      return filtered;
    }

    return codeCell ? [codeCell] : [row];
  }

  private collectIndicatorTexts(element: Element, bucket: Set<string>): void {
    INDICATOR_TEXT_ATTRIBUTES.forEach((attribute) => {
      this.getAttributeValues(element, attribute).forEach((value) => bucket.add(value));
    });

    const htmlElement = element as HTMLElement;
    const dataset = htmlElement.dataset;
    if (dataset) {
      Object.values(dataset).forEach((value) => {
        if (value) {
          bucket.add(value);
        }
      });
    }

    const textContent = element.textContent?.trim();
    if (textContent) {
      bucket.add(textContent);
    }
  }

  private getAttributeValues(element: Element, attribute: (typeof INDICATOR_TEXT_ATTRIBUTES)[number]): string[] {
    const value = element.getAttribute(attribute);
    if (!value) {
      return [];
    }

    if (attribute === 'aria-describedby' || attribute === 'aria-labelledby') {
      return value
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .map((token) => this.resolveTooltipText(token))
        .filter((result): result is string => Boolean(result));
    }

    return [value];
  }

  private resolveTooltipText(id: string): string | undefined {
    if (this.tooltipCache.has(id)) {
      const cached = this.tooltipCache.get(id);
      return cached ? cached : undefined;
    }

    const element = this.documentRef.getElementById(id);
    const text = element?.textContent?.trim() ?? '';
    this.tooltipCache.set(id, text);
    return text || undefined;
  }

  private hasExplicitNewCodeMarker(row: HTMLElement, codeCell: HTMLElement | null): boolean {
    if (this.matchesAnySelector(row, EXPLICIT_NEW_CODE_SELECTORS)) {
      return true;
    }

    if (codeCell && this.matchesAnySelector(codeCell, EXPLICIT_NEW_CODE_SELECTORS)) {
      return true;
    }

    if (this.hasAttributeKeyword(row, EXPLICIT_NEW_CODE_KEYWORDS)) {
      return true;
    }

    if (codeCell && this.hasAttributeKeyword(codeCell, EXPLICIT_NEW_CODE_KEYWORDS)) {
      return true;
    }

    return false;
  }

  private matchesAnySelector(root: HTMLElement, selectors: string[]): boolean {
    return selectors.some((selector) => root.matches(selector) || Boolean(root.querySelector(selector)));
  }

  private hasAttributeKeyword(element: HTMLElement, keywords: string[]): boolean {
    const values = this.collectStructuralValues(element);
    if (!values.length) {
      return false;
    }

    return values
      .map((value) => this.normalise(value))
      .some((value) => keywords.some((keyword) => value.includes(keyword)));
  }

  private collectStructuralValues(element: HTMLElement): string[] {
    const values = new Set<string>();

    STRUCTURAL_ATTRIBUTE_CANDIDATES.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value) {
        values.add(value);
      }
    });

    const dataset = element.dataset;
    if (dataset) {
      Object.values(dataset).forEach((value) => {
        if (value) {
          values.add(value);
        }
      });
    }

    return Array.from(values);
  }

  private isFallbackEligible(
    row: HTMLElement,
    codeCell: HTMLElement | null,
    indicator: IndicatorAnalysis,
    hasExplicitMarker: boolean,
  ): boolean {
    if (hasExplicitMarker) {
      return false;
    }

    if (row.classList.contains('it__source-line-filtered')) {
      return true;
    }

    if (row.dataset?.lineFiltered === 'true' || row.dataset?.filtered === 'true') {
      return true;
    }

    if (codeCell?.classList.contains('it__source-line-filtered')) {
      return true;
    }

    if (codeCell?.dataset?.lineFiltered === 'true' || codeCell?.dataset?.filtered === 'true') {
      return true;
    }

    if (indicator.normalisedTexts.some((text) => text.includes('new code'))) {
      return true;
    }

    const structuralSources = [row, codeCell].filter((value): value is HTMLElement => Boolean(value));
    const structuralValues = structuralSources
      .flatMap((element) => this.collectStructuralValues(element))
      .map((value) => this.normalise(value));

    return structuralValues.some((value) => this.matchesFallbackKeyword(value));
  }

  private matchesFallbackKeyword(value: string): boolean {
    if (!value) {
      return false;
    }

    if (value.includes('new code') && (value.includes('filter') || value.includes('only') || value.includes('line'))) {
      return true;
    }

    return FALLBACK_KEYWORDS.some((keyword) => value.includes(keyword));
  }

  private resolveLineNumber(row: HTMLElement): number | null {
    const candidates: string[] = [];

    this.pushCandidate(candidates, row.getAttribute('data-line-number'));
    this.pushCandidate(candidates, row.dataset?.lineNumber);
    this.pushCandidate(candidates, row.dataset?.line);

    const nested = Array.from(row.querySelectorAll<HTMLElement>('[data-line-number], [data-line]'));
    nested.forEach((element) => {
      this.pushCandidate(candidates, element.getAttribute('data-line-number'));
      this.pushCandidate(candidates, element.dataset?.lineNumber);
      this.pushCandidate(candidates, element.dataset?.line);
    });

    const triggerElements = Array.from(
      row.querySelectorAll<HTMLElement>('[id^="line-number-trigger-"], [aria-label*="Line"], [role="rowheader"]'),
    );

    triggerElements.forEach((element) => {
      this.pushCandidate(candidates, element.getAttribute('aria-label'));
      const text = element.textContent?.trim();
      if (text) {
        this.pushCandidate(candidates, text);
      }
    });

    for (const candidate of candidates) {
      const match = candidate.match(/\d+/);
      if (!match) {
        continue;
      }
      const parsed = Number.parseInt(match[0], 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private pushCandidate(candidates: string[], value: string | null | undefined): void {
    if (!value) {
      return;
    }
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  }

  private extractCodeText(codeCell: HTMLElement | null): string {
    if (!codeCell) {
      return '';
    }
    const target = codeCell.querySelector<HTMLElement>('pre') ?? codeCell;
    const text = target.textContent ?? '';
    return text.replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n').replace(/\n$/, '');
  }

  private isFiltered(row: HTMLElement, codeCell: HTMLElement | null): boolean {
    if (row.classList.contains('it__source-line-filtered')) {
      return true;
    }

    if (row.dataset?.lineFiltered === 'true' || row.dataset?.filtered === 'true') {
      return true;
    }

    if (codeCell?.classList.contains('it__source-line-filtered')) {
      return true;
    }

    if (codeCell?.dataset?.lineFiltered === 'true' || codeCell?.dataset?.filtered === 'true') {
      return true;
    }

    return false;
  }

  private matchesIndicator(value: string): boolean {
    if (!value) {
      return false;
    }

    return INDICATOR_KEYWORDS.some((keyword) => value.includes(keyword));
  }

  private normalise(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}
