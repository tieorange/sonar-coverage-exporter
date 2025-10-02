import type { CollectCoverageFailure } from '../../types';
import { CoverageReportModel } from '../../domain/coverage';
import { CoverageReportBuilder, NoNewCoverageError } from '../builders/CoverageReportBuilder';
import { SonarFileRegistry, type FileLinkMap } from './SonarFileRegistry';
import { DocumentLoader } from '../../infrastructure/dom/DocumentLoader';
import { ProgressReporter } from '../../infrastructure/browser/ProgressReporter';

interface CollectAllResult {
  reports: CoverageReportModel[];
  skipped: CollectCoverageFailure[];
}

export class CoverageCollector {
  constructor(
    private readonly reportBuilder = new CoverageReportBuilder(),
    private readonly fileRegistry = new SonarFileRegistry(),
    private readonly loader = new DocumentLoader(),
  ) {}

  public collectCurrent(documentRef: Document, sourceUrl: string): CoverageReportModel {
    return this.reportBuilder.build({ documentRef, sourceUrl });
  }

  public async collectAll(documentRef: Document, currentUrl: string): Promise<CollectAllResult> {
    const files = await this.fileRegistry.gather(documentRef, currentUrl);

    if (!files.size) {
      throw new Error(
        'Could not find any file links on this page. Switch to the project "New Code" list view and try again.',
      );
    }

    const reports: CoverageReportModel[] = [];
    const skipped: CollectCoverageFailure[] = [];
    const progress = new ProgressReporter(files.size);

    progress.start();

    for (const { href, label } of files.values()) {
      try {
        let lastError: Error | null = null;

        const tryBuildFromDocument = async (doc: Document): Promise<void> => {
          const report = this.reportBuilder.build({ documentRef: doc, sourceUrl: href });
          reports.push(report);
          progress.emit(label);
        };

        try {
          const fetchedDoc = await this.loader.fetchDocument(href);
          await tryBuildFromDocument(fetchedDoc);
          continue;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }

        try {
          const iframeDoc = await this.loader.loadDocumentViaIframe(href);
          await tryBuildFromDocument(iframeDoc);
          continue;
        } catch (iframeError) {
          const detailsParts: string[] = [];
          if (lastError) {
            detailsParts.push(`Fetch attempt: ${lastError.message}`);
            if (lastError.stack) {
              detailsParts.push(lastError.stack);
            }
          }
          if (iframeError instanceof Error) {
            detailsParts.push(`Iframe attempt: ${iframeError.message}`);
            if (iframeError.stack) {
              detailsParts.push(iframeError.stack);
            }
          } else {
            detailsParts.push(`Iframe attempt: ${String(iframeError)}`);
          }

          const details = detailsParts.join('\n');
          const message = iframeError instanceof Error ? iframeError.message : String(iframeError);
          const reason = iframeError instanceof NoNewCoverageError ? 'NO_NEW_COVERAGE' : 'UNEXPECTED_ERROR';
          skipped.push({
            success: false,
            url: href,
            label,
            error: `${label}: ${message}`,
            details,
            reason,
          });
          if (reason === 'NO_NEW_COVERAGE') {
            console.warn('[CoverageCollector] No new coverage detected (iframe)', {
              label,
              url: href,
              message,
            });
          } else {
            console.error('[CoverageCollector] Unable to build report via iframe', {
              label,
              url: href,
              message,
            });
          }
          progress.emit(reason === 'NO_NEW_COVERAGE' ? `${label} (no new code)` : `${label} (skipped)`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to build coverage report for this file.';
        const details = error instanceof Error && error.stack ? error.stack : undefined;
        const reason = error instanceof NoNewCoverageError ? 'NO_NEW_COVERAGE' : 'UNEXPECTED_ERROR';
        skipped.push({
          success: false,
          url: href,
          label,
          error: `${label}: ${message}`,
          details,
          reason,
        });
        if (reason === 'NO_NEW_COVERAGE') {
          console.warn('[CoverageCollector] No new coverage detected after all attempts', {
            label,
            url: href,
            message,
          });
        } else {
          console.error('[CoverageCollector] Failed to build coverage report', {
            label,
            url: href,
            message,
            details,
          });
        }
        progress.emit(reason === 'NO_NEW_COVERAGE' ? `${label} (no new code)` : `${label} (error)`);
      }
    }

    progress.complete();

    return { reports, skipped };
  }
}
