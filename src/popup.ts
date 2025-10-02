import {
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

const allButton = document.getElementById('export-all-button') as HTMLButtonElement | null;
const errorButton = document.getElementById('export-errors-button') as HTMLButtonElement | null;
const statusElement = document.getElementById('status') as HTMLParagraphElement | null;
const progressContainer = document.getElementById('progress') as HTMLDivElement | null;
const progressLabel = document.getElementById('progress-label') as HTMLSpanElement | null;
const progressPercent = document.getElementById('progress-percent') as HTMLSpanElement | null;
const progressFill = document.getElementById('progress-fill') as HTMLDivElement | null;
const progressCount = document.getElementById('progress-count') as HTMLSpanElement | null;
const progressEta = document.getElementById('progress-eta') as HTMLSpanElement | null;

let errorLog: LoggedError[] = [];

const setStatus = (message: string, isError = false) => {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
};

const refreshErrorButtonLabel = () => {
  if (!errorButton) {
    return;
  }
  const count = errorLog.length;
  errorButton.textContent = count ? `Download error log (${count})` : 'Download error log';
};

const resetProgress = () => {
  if (progressContainer) {
    progressContainer.classList.remove('visible');
  }
  if (progressLabel) {
    progressLabel.textContent = 'Preparing…';
  }
  if (progressPercent) {
    progressPercent.textContent = '0%';
  }
  if (progressFill) {
    progressFill.style.width = '0%';
  }
  if (progressCount) {
    progressCount.textContent = '0 / 0';
  }
  if (progressEta) {
    progressEta.textContent = 'ETA: --';
  }
};

const formatEta = (ms: number): string => {
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
};

const updateProgressUI = (payload: ProgressPayload) => {
  if (
    !progressContainer ||
    !progressLabel ||
    !progressPercent ||
    !progressFill ||
    !progressCount ||
    !progressEta
  ) {
    return;
  }

  progressContainer.classList.add('visible');
  progressLabel.textContent = payload.label;

  const percentage = payload.total
    ? Math.min(100, Math.max(0, Math.round((payload.processed / payload.total) * 100)))
    : 0;

  progressPercent.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;
  progressCount.textContent = `${Math.min(payload.processed, payload.total)} / ${payload.total}`;

  if (payload.processed === 0 || payload.total === 0) {
    progressEta.textContent = 'ETA: --';
  } else {
    const elapsed = Date.now() - payload.startedAt;
    const avgPerItem = elapsed / payload.processed;
    const remaining = Math.max(payload.total - payload.processed, 0);
    const etaMs = avgPerItem * remaining;
    progressEta.textContent = `ETA: ${formatEta(etaMs)}`;
  }
};

const completeProgressUI = (payload: ProgressCompletePayload) => {
  if (!progressContainer || !progressLabel || !progressPercent || !progressFill || !progressCount || !progressEta) {
    return;
  }

  progressContainer.classList.add('visible');
  progressLabel.textContent = 'Done';
  progressPercent.textContent = '100%';
  progressFill.style.width = '100%';
  progressCount.textContent = `${payload.total} / ${payload.total}`;
  progressEta.textContent = 'ETA: 0s';

  window.setTimeout(() => {
    resetProgress();
  }, 600);
};

const recordError = async (entry: Omit<LoggedError, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: string;
}) => {
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

  errorLog = [logged, ...errorLog];
  refreshErrorButtonLabel();
};

void (async () => {
  errorLog = [];
  refreshErrorButtonLabel();
  resetProgress();
  setStatus('');
})();

const toErrorResponse = (error: string): CollectCoverageResponse => ({ success: false, error });

const setButtonsDisabled = (disabled: boolean) => {
  if (allButton) {
    allButton.disabled = disabled;
  }
  if (errorButton) {
    errorButton.disabled = disabled;
  }
};

const queryActiveTab = async (): Promise<chrome.tabs.Tab | undefined> =>
  new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        const message = chrome.runtime.lastError.message ?? 'Unable to query active tab.';
        reject(new Error(message));
        return;
      }
      resolve(tabs[0]);
    });
  });

const sendCollectCoverage = async (
  tabId: number,
  message: CollectCoverageMessage,
): Promise<CollectCoverageResponse> =>
  new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        const lastErrorMessage =
          chrome.runtime.lastError.message ?? 'Content script unavailable.';
        resolve(toErrorResponse(lastErrorMessage));
        return;
      }
      if (!response) {
        resolve(toErrorResponse('No response from the content script.'));
        return;
      }
      resolve(response as CollectCoverageResponse);
    });
  });

const triggerDownload = async (fileName: string, content: string): Promise<void> => {
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
};

const exportAllCoverageReports = async () => {
  if (!allButton) {
    return;
  }

  let activeTab: chrome.tabs.Tab | undefined;

  resetProgress();
  setButtonsDisabled(true);
  setStatus('Collecting uncovered lines across all files…');

  try {
    activeTab = await queryActiveTab();
    if (!activeTab?.id) {
      throw new Error('No active SonarQube tab detected.');
    }

    const response = await sendCollectCoverage(activeTab.id, { type: 'COLLECT_ALL_COVERAGE' });
    if (!response.success) {
      throw new Error(response.error);
    }
    if (response.kind !== 'all') {
      throw new Error('Received unexpected response type.');
    }

    const bundleResponse = response as CollectAllCoverageSuccess;

    bundleResponse.skipped.forEach((skipped) => {
      console.warn('[Sonar Coverage Exporter] skipped file', skipped);
      void recordError({
        source: 'skipped',
        message: skipped.error,
        url: skipped.url ?? activeTab?.url,
        details: skipped.details,
      });
    });

    if (!bundleResponse.reports.length) {
      const aggregated = bundleResponse.skipped
        .map((entry) => `• ${entry.error}`)
        .join('\n');
      const message =
        bundleResponse.skipped.length > 0
          ? `All ${bundleResponse.skipped.length} file(s) were skipped.\n${aggregated}`
          : 'No uncovered files detected in this view.';
      throw new Error(message);
    }

    const { fileName, content } = generateBundleMarkdown(bundleResponse.reports, {
      skipped: bundleResponse.skipped,
    });
    await triggerDownload(fileName, content);

    const skippedNote = bundleResponse.skipped.length
      ? ` (${bundleResponse.skipped.length} file(s) skipped)`
      : '';
    setStatus(`Bundle exported as ${fileName}${skippedNote}`);
  } catch (error) {
    const fallback = error instanceof Error ? error.message : 'Unexpected error occurred.';
    const details = error instanceof Error ? error.stack ?? error.message : String(error);
    const source: LoggedError['source'] =
      fallback === 'Received unexpected response type.' ? 'system' : 'bundle';
    void recordError({ source, message: fallback, url: activeTab?.url, details });
    console.error('[Sonar Coverage Exporter] bundle export failed:', error);
    setStatus(fallback, true);
    resetProgress();
  } finally {
    setButtonsDisabled(false);
  }
};

const exportErrorLog = async () => {
  if (!errorButton) {
    return;
  }

  if (!errorLog.length) {
    setStatus('No errors recorded yet.', true);
    return;
  }

  errorButton.disabled = true;

  try {
    const { fileName, content } = generateErrorLogMarkdown(errorLog);
    await triggerDownload(fileName, content);
    setStatus(`Error log exported (${errorLog.length} entries).`);
  } catch (error) {
    const fallback = error instanceof Error ? error.message : 'Failed to export error log.';
    setStatus(fallback, true);
  } finally {
    errorButton.disabled = false;
  }
};

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'COVERAGE_PROGRESS_UPDATE' && message.payload) {
    updateProgressUI(message.payload as ProgressPayload);
  } else if (message?.type === 'COVERAGE_PROGRESS_COMPLETE' && message.payload) {
    completeProgressUI(message.payload as ProgressCompletePayload);
  }
});

if (allButton) {
  allButton.addEventListener('click', () => {
    void exportAllCoverageReports();
  });
}

if (errorButton) {
  errorButton.addEventListener('click', () => {
    void exportErrorLog();
  });
}
