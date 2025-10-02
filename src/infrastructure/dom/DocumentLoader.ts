import { SourceContainerSelector } from './SonarSourceAnalyzer';
import { EXPLICIT_NEW_CODE_SELECTORS } from './parsing/SourceRowParser';

const DEFAULT_LOAD_TIMEOUT_MS = 20000;
const WAIT_INTERVAL_MS = 300;
const WAIT_TIMEOUT_MS = 12000;
const SOURCE_ROW_SELECTOR = 'tr[data-line-number]';
const NEW_CODE_SELECTORS = EXPLICIT_NEW_CODE_SELECTORS;

const waitForElement = (
  doc: Document,
  selector: string,
  timeoutMs: number,
  intervalMs: number,
): Promise<void> => waitForSelectors(doc, [selector], timeoutMs, intervalMs);

const waitForSelectors = (
  doc: Document,
  selectors: readonly string[],
  timeoutMs: number,
  intervalMs: number,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (selectors.some((selector) => doc.querySelector(selector))) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error(`Timed out waiting for selectors: ${selectors.join(', ')}`));
        return;
      }
      window.setTimeout(check, intervalMs);
    };

    check();
  });

export class DocumentLoader {
  public async fetchDocument(href: string): Promise<Document> {
    const response = await fetch(href, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  public async loadDocumentViaIframe(href: string): Promise<Document> {
    return new Promise((resolve, reject) => {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.width = '0';
      container.style.height = '0';
      container.style.overflow = 'hidden';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';

      const iframe = document.createElement('iframe');
      iframe.style.border = '0';
      iframe.style.width = '1280px';
      iframe.style.height = '720px';
      iframe.src = href;

      const cleanup = () => {
        iframe.src = 'about:blank';
        container.remove();
      };

      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Timed out loading file view.'));
      }, DEFAULT_LOAD_TIMEOUT_MS);

      iframe.addEventListener('load', () => {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) {
          window.clearTimeout(timeout);
          cleanup();
          reject(new Error('Unable to access file document.'));
          return;
        }

        waitForElement(iframeDoc, SourceContainerSelector, WAIT_TIMEOUT_MS, WAIT_INTERVAL_MS)
          .then(() => waitForElement(iframeDoc, SOURCE_ROW_SELECTOR, WAIT_TIMEOUT_MS, WAIT_INTERVAL_MS))
          .then(() =>
            waitForSelectors(iframeDoc, NEW_CODE_SELECTORS, 3000, 200).catch(() => {
              console.debug('[DocumentLoader] No explicit new-code markers detected within timeout; continuing.');
              return undefined;
            }),
          )
          .then(() => {
            window.clearTimeout(timeout);
            resolve(iframeDoc);
            cleanup();
          })
          .catch((error) => {
            window.clearTimeout(timeout);
            cleanup();
            reject(error);
          });
      });

      container.appendChild(iframe);
      document.body.appendChild(container);
    });
  }
}
