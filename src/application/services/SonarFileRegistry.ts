import { DocumentLoader } from '../../infrastructure/dom/DocumentLoader';
import {
  SonarFileLinkCollector,
  type FileLink,
  type FileLinkMap,
} from '../../infrastructure/dom/SonarFileLinkCollector';

export class SonarFileRegistry {
  constructor(
    private readonly collector = new SonarFileLinkCollector(),
    private readonly loader = new DocumentLoader(),
  ) {}

  public async gather(activeDocument: Document, currentUrl: string): Promise<FileLinkMap> {
    const filesFromDom = this.collector.collectFromDocument(activeDocument);
    if (filesFromDom.size > 0) {
      return filesFromDom;
    }

    try {
      const fetched = await this.loader.fetchDocument(currentUrl);
      return this.collector.collectFromDocument(fetched);
    } catch (_error) {
      return new Map<string, FileLink>();
    }
  }
}

export type { FileLink, FileLinkMap };
