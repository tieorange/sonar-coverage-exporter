import {
  CollectCoverageMessage,
  CollectCoverageResponse,
  CollectCoverageSuccess,
} from './types';
import { generateMarkdown } from './markdown';

const button = document.getElementById('export-button') as HTMLButtonElement | null;
const statusElement = document.getElementById('status') as HTMLParagraphElement | null;

const setStatus = (message: string, isError = false) => {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message;
  statusElement.style.color = isError ? '#c0392b' : 'inherit';
};

const toErrorResponse = (error: string): CollectCoverageResponse => ({ success: false, error });

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

const sendCollectCoverage = async (tabId: number): Promise<CollectCoverageResponse> =>
  new Promise((resolve) => {
    const message: CollectCoverageMessage = { type: 'COLLECT_COVERAGE' };
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        const message = chrome.runtime.lastError.message ?? 'Content script unavailable.';
        resolve(toErrorResponse(message));
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
  if (!button) {
    return;
  }

  button.disabled = true;
  setStatus('Collecting uncovered lines…');

  try {
    const tab = await queryActiveTab();
    if (!tab?.id) {
      throw new Error('No active SonarQube tab detected.');
    }

    const response = await sendCollectCoverage(tab.id);
    if (!response.success) {
      throw new Error(response.error);
    }

    const { report } = response as CollectCoverageSuccess;
    const { fileName, content } = generateMarkdown(report);
    await triggerDownload(fileName, content);
    setStatus(`Report exported as ${fileName}`);
  } catch (error) {
    const fallback = error instanceof Error ? error.message : 'Unexpected error occurred.';
    setStatus(fallback, true);
  } finally {
    button.disabled = false;
  }
};

if (button) {
  button.addEventListener('click', () => {
    void exportCoverageReport();
  });
}
