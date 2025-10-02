interface FileLink {
  href: string;
  label: string;
}

type FileLinkMap = Map<string, FileLink>;

export class SonarFileLinkCollector {
  public collectFromDocument(root: Document): FileLinkMap {
    const selector = 'a[href*="selected="]';
    const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>(selector));

    const files: FileLinkMap = new Map();

    anchors.forEach((anchor) => {
      const rawHref = anchor.getAttribute('href');
      if (!rawHref) {
        return;
      }

      let absolute: URL;
      try {
        absolute = new URL(rawHref, window.location.href);
      } catch (_error) {
        return;
      }

      const selected = absolute.searchParams.get('selected');
      if (!selected || files.has(selected)) {
        return;
      }

      const label = anchor.getAttribute('title')?.trim() ?? anchor.textContent?.trim() ?? selected;
      files.set(selected, { href: absolute.toString(), label });
    });

    return files;
  }
}

export type { FileLink, FileLinkMap };
