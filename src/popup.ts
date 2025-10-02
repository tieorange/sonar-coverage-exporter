import type {
  CollectAllCoverageSuccess,
  CollectCoverageMessage,
  CollectCoverageResponse,
  LoggedError,
} from './types';
import { generateBundleMarkdown, generateErrorLogMarkdown } from './markdown';

type ProgressPayload = {
  processed: number;
  total: number;
  label: string;
  startedAt: number;
};

type ProgressCompletePayload = {
  processed: number;
  total: number;
};

class StatusDisplay {
  constructor(private readonly element: HTMLParagraphElement | null) {}

  public setMessage(message: string, isError = false): void {
    if (!this.element) {
      return;
    }
    this.element.textContent = message;
    this.element.classList.toggle('error', isError);
  }
}

class ProgressDisplay {
  constructor(
    private readonly container: HTMLDivElement | null,
    private readonly label: HTMLSpanElement | null,
    private readonly percent: HTMLSpanElement | null,
    private readonly fill: HTMLDivElement | null,
    private readonly count: HTMLSpanElement | null,
    private readonly eta: HTMLSpanElement | null,
  ) {}

  public reset(): void {
    this.container?.classList.remove('visible');
    if (this.label) {
      this.label.textContent = 'Preparing…';
    }
    if (this.percent) {
      this.percent.textContent = '0%';
    }
    if (this.fill) {
      this.fill.style.width = '0%';
    }
    if (this.count) {
      this.count.textContent = '0 / 0';
    }
    if (this.eta) {
      this.eta.textContent = 'ETA: --';
    }
  }

  public update(payload: ProgressPayload): void {
    if (!this.container || !this.label || !this.percent || !this.fill || !this.count || !this.eta) {
      return;
    }

    this.container.classList.add('visible');
    this.label.textContent = payload.label;

    const percentage = payload.total
      ? Math.min(100, Math.max(0, Math.round((payload.processed / payload.total) * 100)))
      : 0;

    this.percent.textContent = `${percentage}%`;
    this.fill.style.width = `${percentage}%`;
    this.count.textContent = `${Math.min(payload.processed, payload.total)} / ${payload.total}`;

    if (payload.processed === 0 || payload.total === 0) {
      this.eta.textContent = 'ETA: --';
    } else {
      const elapsed = Date.now() - payload.startedAt;
      const avgPerItem = elapsed / payload.processed;
      const remaining = Math.max(payload.total - payload.processed, 0);
      const etaMs = avgPerItem * remaining;
      this.eta.textContent = `ETA: ${ProgressDisplay.formatEta(etaMs)}`;
    }
  }

  public complete(payload: ProgressCompletePayload): void {
    if (!this.container || !this.label || !this.percent || !this.fill || !this.count || !this.eta) {
      return;
    }

    this.container.classList.add('visible');
    this.label.textContent = 'Done';
    this.percent.textContent = '100%';
    this.fill.style.width = '100%';
    this.count.textContent = `${payload.total} / ${payload.total}`;
    this.eta.textContent = 'ETA: 0s';

    window.setTimeout(() => {
      this.reset();
    }, 600);
  }

  private static formatEta(ms: number): string {
    if (!Number.isFinite(ms) || ms <= 0) {
      return '--';
    }

    const totalSeconds = Math.max(1, Math.round(ms / 1000));
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
}

class ErrorLogManager {
  private entries: LoggedError[] = [];

  constructor(private readonly button: HTMLButtonElement | null) {}

  public reset(): void {
    this.entries = [];
    this.refreshLabel();
  }

  public getErrors(): LoggedError[] {
    return [...this.entries];
  }

  public async record(entry: Omit<LoggedError, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<void> {
    const id = entry.id ?? (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    const timestamp = entry.timestamp ?? new Date().toISOString();
    const logged: LoggedError = {
      id,
      timestamp,
      source: entry.source,
      message: entry.message,
      url: entry.url,
      details: entry.details,
    };

    this.entries = [logged, ...this.entries];
    this.refreshLabel();
  }

  private refreshLabel(): void {
    if (!this.button) {
      return;
    }
    const count = this.entries.length;
    this.button.textContent = count ? `Download error log (${count})` : 'Download error log';
    this.button.style.display = count ? '' : 'none';
  }
}

class PopupController {
  private readonly status: StatusDisplay;
  private readonly progress: ProgressDisplay;
  private readonly errors: ErrorLogManager;

  constructor(
    private readonly allButton: HTMLButtonElement | null,
    private readonly errorButton: HTMLButtonElement | null,
    statusElement: HTMLParagraphElement | null,
    progressContainer: HTMLDivElement | null,
    progressLabel: HTMLSpanElement | null,
    progressPercent: HTMLSpanElement | null,
    progressFill: HTMLDivElement | null,
    progressCount: HTMLSpanElement | null,
    progressEta: HTMLSpanElement | null,
  ) {
    this.status = new StatusDisplay(statusElement);
    this.progress = new ProgressDisplay(
      progressContainer,
      progressLabel,
      progressPercent,
      progressFill,
      progressCount,
      progressEta,
    );
    this.errors = new ErrorLogManager(errorButton);
  }

  public initialise(): void {
    this.errors.reset();
    this.progress.reset();
    this.status.setMessage('');
    this.bindEvents();
    this.registerRuntimeListeners();
  }

  private bindEvents(): void {
    this.allButton?.addEventListener('click', () => {
      void this.exportAllCoverageReports();
    });

    this.errorButton?.addEventListener('click', () => {
      void this.exportErrorLog();
    });
  }

  private registerRuntimeListeners(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'COVERAGE_PROGRESS_UPDATE' && message.payload) {
        this.progress.update(message.payload as ProgressPayload);
      } else if (message?.type === 'COVERAGE_PROGRESS_COMPLETE' && message.payload) {
        this.progress.complete(message.payload as ProgressCompletePayload);
      }
    });
  }

  private async exportAllCoverageReports(): Promise<void> {
    if (!this.allButton) {
      return;
    }

    this.progress.reset();
    this.setButtonsDisabled(true);
    this.status.setMessage('Collecting uncovered lines across all files…');

    let activeTab: chrome.tabs.Tab | undefined;

    try {
      activeTab = await this.queryActiveTab();
      if (!activeTab?.id) {
        throw new Error('No active SonarQube tab detected.');
      }

      const response = await this.sendCollectCoverage(activeTab.id, { type: 'COLLECT_ALL_COVERAGE' });
      if (!response.success) {
        throw new Error(response.error);
      }
      if (response.kind !== 'all') {
        throw new Error('Received unexpected response type.');
      }

      const bundleResponse = response as CollectAllCoverageSuccess;

      const informationalSkips = bundleResponse.skipped.filter(
        (entry) => entry.reason === 'NO_NEW_COVERAGE',
      );
      const failureSkips = bundleResponse.skipped.filter(
        (entry) => entry.reason !== 'NO_NEW_COVERAGE',
      );

      failureSkips.forEach((skipped) => {
        console.warn('[Sonar Coverage Exporter] skipped file', skipped);
        void this.errors.record({
          source: 'skipped',
          message: skipped.error,
          url: skipped.url ?? activeTab?.url,
          details: skipped.details,
        });
      });

      informationalSkips.forEach((skipped) => {
        console.info('[Sonar Coverage Exporter] no new coverage required', skipped);
        void this.errors.record({
          source: 'skipped',
          message: skipped.error,
          url: skipped.url ?? activeTab?.url,
          details: skipped.details,
        });
      });

      if (!bundleResponse.reports.length) {
        if (failureSkips.length) {
          const aggregated = failureSkips.map((entry) => `• ${entry.error}`).join('\n');
          const message = `All ${failureSkips.length} file(s) were skipped.\n${aggregated}`;
          throw new Error(message);
        }

        this.status.setMessage('No uncovered files detected in this view.');
        return;
      }

      const { fileName, content } = generateBundleMarkdown(bundleResponse.reports, {
        skipped: bundleResponse.skipped,
      });
      await this.triggerDownload(fileName, content);

      const skippedNote = failureSkips.length
        ? ` (${failureSkips.length} file(s) with issues)`
        : informationalSkips.length
            ? ` (${informationalSkips.length} file(s) already covered)`
            : '';
      this.status.setMessage(`Bundle exported as ${fileName}${skippedNote}`);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'Unexpected error occurred.';
      const details = error instanceof Error ? error.stack ?? error.message : String(error);
      const source: LoggedError['source'] =
        fallback === 'Received unexpected response type.' ? 'system' : 'bundle';
      void this.errors.record({ source, message: fallback, url: activeTab?.url, details });
      console.error('[Sonar Coverage Exporter] bundle export failed:', error);
      this.status.setMessage(fallback, true);
      this.progress.reset();
    } finally {
      this.setButtonsDisabled(false);
    }
  }

  private async exportErrorLog(): Promise<void> {
    if (!this.errorButton) {
      return;
    }

    const errors = this.errors.getErrors();
    if (!errors.length) {
      this.status.setMessage('No errors recorded yet.', true);
      return;
    }

    this.errorButton.disabled = true;

    try {
      const { fileName, content } = generateErrorLogMarkdown(errors);
      await this.triggerDownload(fileName, content);
      this.status.setMessage(`Error log exported (${errors.length} entries).`);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'Failed to export error log.';
      this.status.setMessage(fallback, true);
    } finally {
      this.errorButton.disabled = false;
    }
  }

  private setButtonsDisabled(disabled: boolean): void {
    if (this.allButton) {
      this.allButton.disabled = disabled;
    }
    if (this.errorButton) {
      this.errorButton.disabled = disabled;
    }
  }

  private queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          const message = chrome.runtime.lastError.message ?? 'Unable to query active tab.';
          reject(new Error(message));
          return;
        }
        resolve(tabs[0]);
      });
    });
  }

  private sendCollectCoverage(
    tabId: number,
    message: CollectCoverageMessage,
  ): Promise<CollectCoverageResponse> {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          const lastErrorMessage = chrome.runtime.lastError.message ?? 'Content script unavailable.';
          resolve({ success: false, error: lastErrorMessage });
          return;
        }
        if (!response) {
          resolve({ success: false, error: 'No response from the content script.' });
          return;
        }
        resolve(response as CollectCoverageResponse);
      });
    });
  }

  private async triggerDownload(fileName: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      await new Promise<void>((resolve, reject) => {
        chrome.downloads.download(
          {
            url,
            filename: fileName,
            conflictAction: 'overwrite',
            saveAs: true,
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              const message = chrome.runtime.lastError.message ?? 'Download could not be started.';
              reject(new Error(message));
              return;
            }
            if (typeof downloadId !== 'number') {
              reject(new Error('Download was not started.'));
              return;
            }
            resolve();
          },
        );
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

}

const controller = new PopupController(
  document.getElementById('export-all-button') as HTMLButtonElement | null,
  document.getElementById('export-errors-button') as HTMLButtonElement | null,
  document.getElementById('status') as HTMLParagraphElement | null,
  document.getElementById('progress') as HTMLDivElement | null,
  document.getElementById('progress-label') as HTMLSpanElement | null,
  document.getElementById('progress-percent') as HTMLSpanElement | null,
  document.getElementById('progress-fill') as HTMLDivElement | null,
  document.getElementById('progress-count') as HTMLSpanElement | null,
  document.getElementById('progress-eta') as HTMLSpanElement | null,
);

controller.initialise();
