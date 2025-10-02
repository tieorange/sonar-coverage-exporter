import { CoverageLineModel } from '../../domain/coverage';
import { SourceRowParser, type SourceRowSnapshot } from './parsing/SourceRowParser';

const SOURCE_CONTAINER_SELECTOR = '.source-viewer';

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

interface RowClassification {
  classifiesAsNewCode: boolean;
  include: boolean;
  viaFallback: boolean;
}

class ExtractionStatsBuilder {
  private readonly stats: CoverageExtractionStats = {
    totalRows: 0,
    filteredRows: 0,
    uncoveredIndicatorRows: 0,
    newCodeMarkerRows: 0,
    uncoveredNewCodeRows: 0,
    indicatorWithoutNewCodeRows: 0,
    newCodeWithoutIndicatorRows: 0,
    heuristicNewCodeRows: 0,
  };

  public recordBase(snapshot: SourceRowSnapshot): void {
    this.stats.totalRows += 1;
    if (snapshot.isFiltered) {
      this.stats.filteredRows += 1;
    }
    if (snapshot.hasIndicator) {
      this.stats.uncoveredIndicatorRows += 1;
    }
    if (snapshot.hasExplicitMarker) {
      this.stats.newCodeMarkerRows += 1;
    }
  }

  public recordOutcome(snapshot: SourceRowSnapshot, classification: RowClassification): void {
    if (snapshot.hasIndicator && !classification.classifiesAsNewCode) {
      this.stats.indicatorWithoutNewCodeRows += 1;
    }
    if (!snapshot.hasIndicator && classification.classifiesAsNewCode) {
      this.stats.newCodeWithoutIndicatorRows += 1;
    }
    if (classification.include) {
      this.stats.uncoveredNewCodeRows += 1;
      if (classification.viaFallback) {
        this.stats.heuristicNewCodeRows += 1;
      }
    }
  }

  public build(): CoverageExtractionStats {
    return { ...this.stats };
  }
}

export class SonarSourceAnalyzer {
  private readonly parser: SourceRowParser;
  private extractionStats: CoverageExtractionStats | null = null;

  constructor(private readonly documentRef: Document) {
    this.parser = new SourceRowParser(documentRef);
  }

  public findSourceContainers(): Element[] {
    return Array.from(this.documentRef.querySelectorAll(SOURCE_CONTAINER_SELECTOR));
  }

  public collectUncoveredLines(
    containers: Element[],
    options: CoverageExtractionOptions = {},
  ): CoverageLineModel[] {
    const treatIndicatorAsNewCode = options.treatIndicatorAsNewCode ?? false;
    const debugLabel = options.debugLabel;

    const statsBuilder = new ExtractionStatsBuilder();
    const lines = new Map<number, CoverageLineModel>();

    containers.forEach((container) => {
      const rows = Array.from(container.querySelectorAll<HTMLElement>('tr[data-line-number]'));
      rows.forEach((row) => {
        const snapshot = this.parser.snapshot(row);
        statsBuilder.recordBase(snapshot);

        const fallbackTriggered =
          treatIndicatorAsNewCode &&
          snapshot.hasIndicator &&
          !snapshot.hasExplicitMarker &&
          snapshot.fallbackEligible;

        const classifiesAsNewCode = snapshot.hasExplicitMarker || fallbackTriggered;
        const include =
          snapshot.lineNumber != null && snapshot.hasIndicator && classifiesAsNewCode;
        const viaFallback = include && fallbackTriggered;

        statsBuilder.recordOutcome(snapshot, {
          classifiesAsNewCode,
          include,
          viaFallback,
        });

        if (!include || snapshot.lineNumber == null) {
          if (snapshot.lineNumber == null && snapshot.hasIndicator && classifiesAsNewCode) {
            console.debug('[CoverageExtractor] Skipping indicator row without line number', {
              debugLabel,
            });
          }
          return;
        }

        const lineNumber = snapshot.lineNumber;
        if (!lines.has(lineNumber)) {
          lines.set(lineNumber, new CoverageLineModel(lineNumber, snapshot.codeText));
        }

        if (viaFallback) {
          console.debug('[CoverageExtractor] Treating indicator-only row as new code', {
            debugLabel,
            lineNumber,
          });
        }
      });
    });

    const uncoveredLines = Array.from(lines.values()).sort((a, b) => a.lineNumber - b.lineNumber);
    const stats = statsBuilder.build();

    if (!uncoveredLines.length) {
      console.debug('[CoverageExtractor] No uncovered lines detected, stats snapshot:', stats);
    }

    this.extractionStats = stats;
    return uncoveredLines;
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
}

export const SourceContainerSelector = SOURCE_CONTAINER_SELECTOR;
