import {
  CollectAllCoverageSuccess,
  CollectCoverageMessage,
  CollectCoverageResponse,
  CollectCoverageSuccess,
} from './types';
import { generateBundleMarkdown, generateMarkdown } from './markdown';

const singleButton = document.getElementById('export-button') as HTMLButtonElement | null;
const allButton = document.getElementById('export-all-button') as HTMLButtonElement | null;
const statusElement = document.getElementById('status') as HTMLParagraphElement | null;

const setStatus = (message: string, isError = false) => {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message;
  statusElement.style.color = isError ? '#c0392b' : 'inherit';
};

const toErrorResponse = (error: string): CollectCoverageResponse => ({ success: false, error });

const setButtonsDisabled = (disabled: boolean) => {
  if (singleButton) {
    singleButton.disabled = disabled;
  }
  if (allButton) {
    allButton.disabled = disabled;
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

const exportCoverageReport = async () => {
  if (!singleButton) {
    return;
  }

  setButtonsDisabled(true);
  setStatus('Collecting uncovered lines…');

  try {
    const tab = await queryActiveTab();
    if (!tab?.id) {
      throw new Error('No active SonarQube tab detected.');
    }

    const response = await sendCollectCoverage(tab.id, { type: 'COLLECT_COVERAGE' });
    if (!response.success) {
      throw new Error(response.error);
    }
    if (response.kind !== 'single') {
      throw new Error('Received unexpected response type.');
    }

    const { report } = response as CollectCoverageSuccess;
    const { fileName, content } = generateMarkdown(report);
    await triggerDownload(fileName, content);
    setStatus(`Report exported as ${fileName}`);
  } catch (error) {
    const fallback = error instanceof Error ? error.message : 'Unexpected error occurred.';
    setStatus(fallback, true);
  } finally {
    setButtonsDisabled(false);
  }
};

const exportAllCoverageReports = async () => {
  if (!allButton) {
    return;
  }

  setButtonsDisabled(true);
  setStatus('Collecting uncovered lines across all files…');

  try {
    const tab = await queryActiveTab();
    if (!tab?.id) {
      throw new Error('No active SonarQube tab detected.');
    }

    const response = await sendCollectCoverage(tab.id, { type: 'COLLECT_ALL_COVERAGE' });
    if (!response.success) {
      throw new Error(response.error);
    }
    if (response.kind !== 'all') {
      throw new Error('Received unexpected response type.');
    }

    const bundleResponse = response as CollectAllCoverageSuccess;
    if (!bundleResponse.reports.length) {
      throw new Error('No uncovered files detected in this view.');
    }

    const { fileName, content } = generateBundleMarkdown(bundleResponse.reports, {
      skipped: bundleResponse.skipped,
    });
    await triggerDownload(fileName, content);

    const skippedNote = bundleResponse.skipped.length
      ? ` (${bundleResponse.skipped.length} file(s) skipped)`
      : '';
    setStatus(`Bundle exported as ${fileName}${skippedNote}`);

    if (bundleResponse.skipped.length) {
      console.warn('Sonar Coverage Exporter skipped files:', bundleResponse.skipped);
    }
  } catch (error) {
    const fallback = error instanceof Error ? error.message : 'Unexpected error occurred.';
    setStatus(fallback, true);
  } finally {
    setButtonsDisabled(false);
  }
};

if (singleButton) {
  singleButton.addEventListener('click', () => {
    void exportCoverageReport();
  });
}

if (allButton) {
  allButton.addEventListener('click', () => {
    void exportAllCoverageReports();
  });
}
