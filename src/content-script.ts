import type { CollectCoverageMessage, CollectCoverageResponse } from './types';
import { CoverageCollector } from './application/services/CoverageCollector';

class ContentScriptController {
  private readonly collector = new CoverageCollector();

  constructor(private readonly documentRef: Document, private readonly currentUrl: string) {}

  public initialise(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }

  private handleMessage = (
    message: CollectCoverageMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: CollectCoverageResponse) => void,
  ): true | void => {
    if (message.type === 'COLLECT_COVERAGE') {
      this.handleCollectSingle(sendResponse);
      return;
    }

    if (message.type === 'COLLECT_ALL_COVERAGE') {
      this.handleCollectAll(sendResponse);
      return true;
    }

    return;
  };

  private handleCollectSingle(sendResponse: (response: CollectCoverageResponse) => void): void {
    try {
      const report = this.collector.collectCurrent(this.documentRef, this.currentUrl).toDto();
      sendResponse({ success: true, kind: 'single', report });
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Unable to build coverage report.';
      sendResponse({ success: false, error: fallbackMessage });
    }
  }

  private handleCollectAll(sendResponse: (response: CollectCoverageResponse) => void): void {
    this.collector
      .collectAll(this.documentRef, this.currentUrl)
      .then(({ reports, skipped }) => {
        const payload = reports.map((report) => report.toDto());
        sendResponse({ success: true, kind: 'all', reports: payload, skipped });
      })
      .catch((error: unknown) => {
        const fallbackMessage =
          error instanceof Error ? error.message : 'Unable to collect coverage reports.';
        sendResponse({ success: false, error: fallbackMessage });
      });
  }
}

new ContentScriptController(document, window.location.href).initialise();
