import { CoverageGroupModel, CoverageReportModel } from '../../domain/coverage';
import { SonarSourceAnalyzer, type CoverageExtractionStats } from '../../infrastructure/dom/SonarSourceAnalyzer';
import { CoverageGrouper } from '../services/CoverageGrouper';

export class NoNewCoverageError extends Error {
  constructor(
    message =
      'No uncovered new-code lines detected. Ensure the "New Code" filter is active or that this file has uncovered lines.',
  ) {
    super(message);
    this.name = 'NoNewCoverageError';
  }
}

interface BuildContext {
  documentRef: Document;
  sourceUrl: string;
}

export class CoverageReportBuilder {
  private readonly grouper: CoverageGrouper;

  constructor(grouper?: CoverageGrouper) {
    this.grouper = grouper ?? new CoverageGrouper();
  }

  public build({ documentRef, sourceUrl }: BuildContext): CoverageReportModel {
    const analyzer = new SonarSourceAnalyzer(documentRef);
    const containers = analyzer.findSourceContainers();

    if (!containers.length) {
      throw new Error(
        'Unable to locate the SonarQube source viewer. Open a file-level "Measures" view and try again.',
      );
    }

    const url = new URL(sourceUrl);
    const debugLabel = this.friendlyFileLabel(url);
    const treatIndicator = this.shouldTreatIndicatorAsNewCode(url);

    let uncoveredLines = analyzer.collectUncoveredLines(containers, {
      treatIndicatorAsNewCode: false,
      debugLabel,
    });
    let stats = analyzer.getLastExtractionStats();

    if (!uncoveredLines.length && this.shouldRetryWithIndicatorFallback(treatIndicator, stats)) {
      console.debug('[CoverageReportBuilder] Retrying extraction with indicator heuristic', {
        url: url.toString(),
        debugLabel,
        stats,
      });
      uncoveredLines = analyzer.collectUncoveredLines(containers, {
        treatIndicatorAsNewCode: true,
        debugLabel,
      });
      stats = analyzer.getLastExtractionStats();
    }

    if (!uncoveredLines.length) {
      throw new NoNewCoverageError(this.buildNoCoverageMessage(stats));
    }

    const groups: CoverageGroupModel[] = this.grouper.group(uncoveredLines);
    const breadcrumbSegments = analyzer.getBreadcrumbSegments();
    const projectName = breadcrumbSegments[0] ?? url.searchParams.get('id') ?? 'SonarQube project';
    const filePathSegments = breadcrumbSegments.length > 1 ? breadcrumbSegments.slice(1) : [];
    const filePathFromBreadcrumbs = filePathSegments.join('/');
    const filePath = filePathFromBreadcrumbs || this.fallbackFilePathFromUrl(url) || 'Unknown file path';

    return new CoverageReportModel(projectName, filePath, url.toString(), groups);
  }

  private fallbackFilePathFromUrl(url: URL): string {
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
  }

  private buildNoCoverageMessage(stats: CoverageExtractionStats | null | undefined): string {
    if (!stats) {
      return 'No uncovered new-code lines detected. Ensure the "New Code" filter is active or that this file has uncovered lines.';
    }

    const parts = [
      `No uncovered new-code lines detected (rows: ${stats.totalRows}, filtered: ${stats.filteredRows})`,
      `Indicators: ${stats.uncoveredIndicatorRows}, new-code markers: ${stats.newCodeMarkerRows}`,
      `Matches: ${stats.uncoveredNewCodeRows}, indicator-only: ${stats.indicatorWithoutNewCodeRows}, new-code-only: ${stats.newCodeWithoutIndicatorRows}`,
      `Heuristic matches: ${stats.heuristicNewCodeRows}`,
    ];

    return parts.join(' · ');
  }

  private shouldTreatIndicatorAsNewCode(url: URL): boolean {
    const metric = url.searchParams.get('metric') ?? '';
    if (metric.startsWith('new_')) {
      return true;
    }
    const view = url.searchParams.get('view') ?? '';
    if (view.includes('new')) {
      return true;
    }
    return url.searchParams.has('pullRequest');
  }

  private shouldRetryWithIndicatorFallback(
    treatIndicator: boolean,
    stats: CoverageExtractionStats | null | undefined,
  ): boolean {
    if (!treatIndicator || !stats) {
      return false;
    }

    if (stats.indicatorWithoutNewCodeRows > 0) {
      return true;
    }

    if (stats.filteredRows > 0 && stats.uncoveredIndicatorRows > 0) {
      return true;
    }

    return false;
  }

  private friendlyFileLabel(url: URL): string {
    return this.fallbackFilePathFromUrl(url) || url.pathname;
  }
}
