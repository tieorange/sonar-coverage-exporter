import { CoverageLineModel } from '../../domain/coverage';

const SOURCE_CONTAINER_SELECTOR = '.source-viewer';
const UNCOVERED_TEXT_PATTERN = /not\s+covered/i;
const INDICATOR_ATTRIBUTES = ['aria-label', 'aria-describedby', 'title', 'data-tooltip'] as const;

type IndicatorAttribute = (typeof INDICATOR_ATTRIBUTES)[number];

export interface CoverageExtractionStats {
  totalRows: number;
  filteredRows: number;
  uncoveredIndicatorRows: number;
  newCodeMarkerRows: number;
  uncoveredNewCodeRows: number;
  indicatorWithoutNewCodeRows: number;
  newCodeWithoutIndicatorRows: number;
  heuristicNewCodeRows: number;
}

export interface CoverageExtractionOptions {
  treatIndicatorAsNewCode?: boolean;
  debugLabel?: string;
}

export class SonarSourceAnalyzer {
  private readonly tooltipCache = new Map<string, string>();
  private extractionStats: CoverageExtractionStats | null = null;
  private useIndicatorFallback = false;

  constructor(private readonly documentRef: Document) {}

  public findSourceContainers(): Element[] {
    return Array.from(this.documentRef.querySelectorAll(SOURCE_CONTAINER_SELECTOR));
  }

  public collectUncoveredLines(
    containers: Element[],
    options: CoverageExtractionOptions = {},
  ): CoverageLineModel[] {
    const lines = new Map<number, CoverageLineModel>();
    this.useIndicatorFallback = options.treatIndicatorAsNewCode ?? false;
    const stats: CoverageExtractionStats = {
      totalRows: 0,
      filteredRows: 0,
      uncoveredIndicatorRows: 0,
      newCodeMarkerRows: 0,
      uncoveredNewCodeRows: 0,
      indicatorWithoutNewCodeRows: 0,
      newCodeWithoutIndicatorRows: 0,
      heuristicNewCodeRows: 0,
    };

    containers.forEach((container) => {
      const rows = Array.from(container.querySelectorAll('tr[data-line-number]'));
      rows.forEach((row) => {
        const codeCell = row.querySelector<HTMLElement>('td.it__source-line-code');
        const hasIndicator = this.rowHasUncoveredIndicator(row);
        const hasExplicitMarker = this.containsNewCodeMarker(row as HTMLElement, codeCell ?? undefined);
        const isHeuristic = !hasExplicitMarker && this.useIndicatorFallback && this.rowIndicatesFilteredNewCode(row as HTMLElement, codeCell ?? undefined);
        const isNewCode = hasExplicitMarker || isHeuristic;

        stats.totalRows += 1;
        if ((row as HTMLElement).classList.contains('it__source-line-filtered')) {
          stats.filteredRows += 1;
        }
        if (hasIndicator) {
          stats.uncoveredIndicatorRows += 1;
        }
        if (isNewCode) {
          stats.newCodeMarkerRows += 1;
        }

        if (!hasIndicator && !isNewCode) {
          return;
        }
        if (hasIndicator && !isNewCode) {
          if (!this.useIndicatorFallback) {
            stats.indicatorWithoutNewCodeRows += 1;
            return;
          }
          stats.indicatorWithoutNewCodeRows += 1;
        }
        if (!hasIndicator && isNewCode) {
          stats.newCodeWithoutIndicatorRows += 1;
          return;
        }

        const lineNumber = this.parseLineNumber(row);
        if (lineNumber == null) {
          return;
        }

        const code = this.extractCodeText(row);
        lines.set(lineNumber, new CoverageLineModel(lineNumber, code));
        stats.uncoveredNewCodeRows += 1;
        if (isHeuristic) {
          stats.heuristicNewCodeRows += 1;
          console.debug('[CoverageExtractor] Treating indicator-only row as new code', {
            debugLabel: options.debugLabel,
            lineNumber,
          });
        }
      });
    });

    this.useIndicatorFallback = false;
    if (!stats.uncoveredNewCodeRows) {
      console.debug('[CoverageExtractor] No uncovered lines detected, stats snapshot:', stats);
    }

    this.extractionStats = stats;
    return Array.from(lines.values()).sort((a, b) => a.lineNumber - b.lineNumber);
  }

  public getLastExtractionStats(): CoverageExtractionStats | null {
    return this.extractionStats ? { ...this.extractionStats } : null;
  }

  public getBreadcrumbSegments(): string[] {
    const nav = this.documentRef.querySelector('nav[aria-label="Breadcrumbs"]');
    if (!nav) {
      return [];
    }

    return Array.from(nav.querySelectorAll('li a'))
      .map((anchor) => anchor.textContent?.trim() ?? '')
      .filter((segment) => segment.length > 0);
  }

  private parseLineNumber(row: Element): number | null {
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
  }

  private extractCodeText(row: Element): string {
    const codeCell = row.querySelector<HTMLElement>('td.it__source-line-code');
    if (!codeCell) {
      return '';
    }
    const target = codeCell.querySelector<HTMLElement>('pre') ?? codeCell;
    const text = target.textContent ?? '';
    return text.replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n').replace(/\n$/, '');
  }

  private rowHasUncoveredIndicator(row: Element): boolean {
    const statusCells = Array.from(row.querySelectorAll<HTMLTableCellElement>('td')).filter(
      (cell) => !cell.classList.contains('it__source-line-code'),
    );
    if (statusCells.length) {
      return statusCells.some((cell) => this.cellContainsUncoveredIndicator(cell));
    }

    return this.cellContainsUncoveredIndicator(row);
  }

  private cellContainsUncoveredIndicator(cell: Element): boolean {
    const nodes: Element[] = [cell, ...Array.from(cell.querySelectorAll<HTMLElement>('*'))];
    return nodes.some((node) => this.gatherIndicatorTexts(node).some((text) => UNCOVERED_TEXT_PATTERN.test(text)));
  }

  private gatherIndicatorTexts(element: Element): string[] {
    const values = INDICATOR_ATTRIBUTES.flatMap((attribute) => this.getAttributeTexts(element, attribute));
    const textContent = element.textContent?.trim();
    if (textContent) {
      values.push(textContent);
    }
    return values;
  }

  private getAttributeTexts(element: Element, attribute: IndicatorAttribute): string[] {
    if (attribute === 'aria-describedby') {
      const describedBy = element.getAttribute(attribute);
      if (!describedBy) {
        return [];
      }

      return describedBy
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .map((token) => this.getTooltipText(token))
        .filter((value): value is string => Boolean(value));
    }

    const value = element.getAttribute(attribute);
    return value ? [value] : [];
  }

  private getTooltipText(id: string): string | undefined {
    if (this.tooltipCache.has(id)) {
      const cached = this.tooltipCache.get(id);
      return cached ? cached : undefined;
    }

    const element = this.documentRef.getElementById(id);
    const text = element?.textContent?.trim() ?? '';
    this.tooltipCache.set(id, text);
    return text || undefined;
  }

  // Sonar marks "new" lines with a light blue background (applied either inline or via pseudo-elements).
  // We treat a row as new when we can detect that blue tint across the ancestors/pseudo-elements that Sonar uses.
  private isNewCodeRow(row: Element): boolean {
    if (!(row instanceof HTMLElement)) {
      return false;
    }

    const codeCell = row.querySelector<HTMLElement>('td.it__source-line-code');

    if (this.useIndicatorFallback && this.rowIndicatesFilteredNewCode(row as HTMLElement, codeCell ?? undefined)) {
      return true;
    }

    if (this.containsNewCodeMarker(row as HTMLElement, codeCell ?? undefined)) {
      return true;
    }

    const inlineBackground = this.extractLineBackground(row);
    if (this.hasBlueTint(inlineBackground)) {
      return true;
    }

    const computedBackground = window
      .getComputedStyle(row)
      .getPropertyValue('--line-background')
      .trim();
    if (this.hasBlueTint(computedBackground)) {
      return true;
    }

    const rowBackground = window.getComputedStyle(row).backgroundColor;
    if (this.hasBlueTint(rowBackground)) {
      return true;
    }

    if (!codeCell) {
      return false;
    }

    const codeBackground = window.getComputedStyle(codeCell).backgroundColor;
    if (this.hasBlueTint(codeBackground)) {
      return true;
    }

    const beforeBackground = this.getPseudoBackgroundColor(codeCell, '::before');
    if (this.hasBlueTint(beforeBackground)) {
      return true;
    }

    const afterBackground = this.getPseudoBackgroundColor(codeCell, '::after');
    return this.hasBlueTint(afterBackground);
  }

  private extractLineBackground(row: HTMLElement): string {
    const inlineValue = row.style.getPropertyValue('--line-background');
    if (inlineValue) {
      return inlineValue.trim();
    }

    const styleAttr = row.getAttribute('style');
    if (!styleAttr) {
      return '';
    }

    const tokens = styleAttr.split(';');
    for (const token of tokens) {
      const [rawProp, ...rawValueParts] = token.split(':');
      if (!rawValueParts.length) {
        continue;
      }
      const prop = rawProp.trim();
      if (prop !== '--line-background') {
        continue;
      }
      const joined = rawValueParts.join(':');
      const sanitized = joined.split('<')[0]?.replace(/["']/g, '').trim();
      return sanitized ?? '';
    }

    return '';
  }

  private getPseudoBackgroundColor(element: HTMLElement, pseudo: '::before' | '::after'): string {
    try {
      return window.getComputedStyle(element, pseudo).backgroundColor;
    } catch (_error) {
      return '';
    }
  }

  private hasBlueTint(color: string | null | undefined): boolean {
    if (!color) {
      return false;
    }

    if (color.includes('linear-gradient')) {
      return true;
    }

    const parsed = this.parseColor(color);
    if (!parsed) {
      return false;
    }

    const [r, g, b, a] = parsed;
    if (a === 0) {
      return false;
    }

    const maxOther = Math.max(r, g);
    const blueDominance = b - maxOther;
    if (blueDominance < 12) {
      return false;
    }

    return b >= 100;
  }

  private parseColor(color: string): [number, number, number, number] | null {
    const normalised = color.trim().toLowerCase();
    const match = normalised.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const components = match[1].match(/[\d.]+/g);
    if (!components || components.length < 3) {
      return null;
    }

    const numeric = components.map((component) => Number.parseFloat(component));
    if (numeric.some((value) => Number.isNaN(value))) {
      return null;
    }

    const [r, g, b] = numeric;
    const alpha = numeric.length >= 4 ? numeric[3] : 1;
    return [r, g, b, alpha];
  }

  private containsNewCodeMarker(row: HTMLElement, codeCell?: HTMLElement): boolean {
    if (row.querySelector('[data-testid*="new-code"]')) {
      return true;
    }

    if (row.className.includes('new-code')) {
      return true;
    }

    if (codeCell?.className.includes('new-code')) {
      return true;
    }

    if (codeCell?.querySelector('[data-testid*="new-code"]')) {
      return true;
    }

    if (codeCell?.querySelector('[class*="new-code"]')) {
      return true;
    }

    if (codeCell?.querySelector('[class*="underline"]')) {
      return true;
    }

    return false;
  }

  private rowIndicatesFilteredNewCode(row: HTMLElement, codeCell?: HTMLElement): boolean {
    if (row.classList.contains('it__source-line-filtered')) {
      return true;
    }

    if (row.querySelector<HTMLElement>('div[data-testid="new-code-underline"]')) {
      return true;
    }

    if (codeCell?.querySelector('[data-testid="new-code-underline"]')) {
      return true;
    }

    return false;
  }
}

export const SourceContainerSelector = SOURCE_CONTAINER_SELECTOR;
