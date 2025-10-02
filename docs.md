# Sonar Coverage Exporter – Project Guide

This document explains how the Chrome extension is organised, how the core components interact, and how humans or other AI systems can collaborate with the codebase to extend or troubleshoot the exporter. Everything is written from the perspective of the clean-architecture refactor that now powers the project.

---

## 1. Runtime Overview

The extension has three entry points:

1. **`src/content-script.ts`** – injected into SonarQube pages. It orchestrates coverage extraction for a single file or the entire “New Code” list.
2. **`src/popup.ts`** – the UI logic for the popup window. It requests coverage data, displays status/progress, and downloads the resulting Markdown reports.
3. **`src/markdown.ts`** – converts CoverageReport DTOs into human-friendly Markdown summaries and bundles.

Supporting infrastructure is split into several layers:

- **Domain (`src/domain`)** – Pure data models (`CoverageLineModel`, `CoverageGroupModel`, `CoverageReportModel`). They manage grouping lines and DTO serialisation.
- **Application (`src/application`)** – Use-cases. Builders and services combine domain objects with infrastructure providers.
- **Infrastructure (`src/infrastructure`)** – Concrete adapters for DOM traversal, iframe loading, link collection, and Chrome messaging.

Type definitions live in **`src/types.ts`**, re-exporting domain DTOs for convenience alongside message contracts and log types.

---

## 2. Key Flows

### 2.1 Single File Export

1. `content-script.ts` receives the `COLLECT_COVERAGE` message.
2. It instantiates `CoverageCollector`, which defers to `CoverageReportBuilder`.
3. `CoverageReportBuilder`
   - Creates a `SonarSourceAnalyzer` with the current document.
   - Identifies source containers, extracts uncovered lines, and groups them.
   - Produces a `CoverageReportModel` DTO.
4. The DTO is returned to the popup, which renders it via `generateMarkdown()` and triggers a download.

### 2.2 Bulk Export

1. `CoverageCollector.collectAll()` first discovers file links via `SonarFileRegistry` (DOM scan + HTML fetch).
2. For each file, it tries to fetch the HTML. If that fails or produces no new-code lines, it falls back to loading the page in a hidden iframe (where dynamic scripts can run).
3. Progress updates are published (`ProgressReporter`) so the popup can show live status.
4. Successful reports and skipped files (with rich diagnostics) are returned to `popup.ts`, which then calls `generateBundleMarkdown()` for the final summary.

---

## 3. Important Files & Responsibilities

| Path | Purpose |
| --- | --- |
| `src/content-script.ts` | Chrome message listener. Delegates to the application layer. |
| `src/popup.ts` | Popup UI controller: handles button clicks, progress updates, error logging, and downloads. |
| `src/markdown.ts` | Markdown composers for single reports, bundles, and error logs. |
| `src/types.ts` | Shared types: message contracts, DTO exports, log entries. |
| `src/domain/coverage.ts` | Domain models + DTO helpers. Immutable-ish shapes that ensure grouping logic is consistent. |
| `src/application/builders/CoverageReportBuilder.ts` | Core use-case of transforming a Sonar page into a CoverageReport. Has retry heuristics for "indicator-only" rows. |
| `src/application/services/CoverageCollector.ts` | Bulk orchestration. Handles fetch/iframe retries, progress, skip reasons. |
| `src/application/services/CoverageGrouper.ts` | Groups adjacent uncovered lines into ranges. |
| `src/application/services/SonarFileRegistry.ts` | Finds file-level links in the Sonar UI (DOM or fetched HTML). |
| `src/infrastructure/dom/SonarSourceAnalyzer.ts` | DOM scraping utilities. Detects new-code markers, indicators, heuristics, breadcrumbs, etc. |
| `src/infrastructure/dom/parsing/SourceRowParser.ts` | Normalises Sonar source rows into reusable snapshots for the analyzer and stats builder. |
| `src/infrastructure/dom/DocumentLoader.ts` | Fetches HTML or loads Sonar pages in hidden iframes. Waits for source rows & new-code highlights. |
| `src/infrastructure/dom/SonarFileLinkCollector.ts` | Extracts file links from a Sonar page snapshot. |
| `src/infrastructure/browser/ProgressReporter.ts` | Simple Chrome message emitter for progress/complete events. |

---

## 4. Coverage Extraction Details

`SonarSourceAnalyzer` is the heart of the system. It conducts two passes:

1. **Primary (explicit markers)** – Only lines with Sonar’s underline markers (`data-testid="new-code-underline"`, hashed classes like `css-1b9zxbc`, etc.) count as new code.
2. **Secondary (fallback)** – If the primary pass finds nothing and the page appears to contain filtered new code (rows tagged with `it__source-line-filtered`), the extractor is re-run with the fallback enabled. This time, uncovered indicators can qualify as new code, but the fallback rows are tracked separately in `CoverageExtractionStats.heuristicNewCodeRows` for transparency.

The builder logs the stats after each attempt; if both passes fail we throw a `NoNewCoverageError`, embedding the stats in the message so skips show exactly what was inspected.

---

## 5. Collaborating with LLMs / AI Agents

When asking another model to modify or extend the project:

1. **Reference this folder structure** to ground discussions (“Add a new DOM extractor under `src/infrastructure/dom`”).
2. **Respect the clean architecture boundaries** – domain should stay pure, application orchestrates, infrastructure touches the DOM and external APIs.
3. **Lean on the stats** – before changing heuristics, read the stats logged by `SonarSourceAnalyzer`. They indicate whether the fallback is over- or under-matching.
4. **Tests / Typecheck** – run `npm run typecheck` (TypeScript only). Parser-focused regression tests live under `tests/` (invoke with `npm test`) and reuse the saved Sonar HTML fixtures.
5. **Logging** – debug statements already funnel through the console. Add structured logs rather than `alert()`s so they appear in the downloaded error log.
6. **Data contracts** – when expanding messages, modify `src/types.ts` and mirror changes in both the popup and content script.

Typical prompts for LLMs:
- “Add support for detecting class `css-abc123` as a new-code underline in `SonarSourceAnalyzer`.”
- “Extend `SonarFileRegistry` to fall back to Sonar’s REST API when the DOM lacks links.”
- “Refine `generateMarkdown` output to include coverage percentages per file.”

---

## 6. Development & Troubleshooting Tips

- **Page snapshots** – `source-sonar-qube/` contains SingleFile exports for debugging offline. Load them in a browser to inspect the DOM.
- **Hidden iframe** – If extraction fails after the fetch attempt, confirm the iframe is reaching the correct URL and that the selectors still match (`.source-viewer`, `tr[data-line-number]`).
- **Skip reasons** – Check the popup’s error log (Download error log) for structured diagnostics, including `NO_NEW_COVERAGE` vs `UNEXPECTED_ERROR` and the stats snapshot.
- **Markdown templates** – `src/markdown.ts` has multiple sections annotated with emojis for readability. Keep additions consistent.
- **Chrome permissions** – All interactions happen within the active Sonar tab; no extra permissions are needed beyond `activeTab`/`scripting`.

---

## 7. Extending Functionality

Ideas informed by the current architecture:

- **REST fallback** – Add an `infrastructure/http/SonarApiClient` and update `CoverageCollector` to fetch coverage JSON when DOM scraping fails.
- **Selective export** – Extend the popup to offer checkboxes for files before triggering the bulk export.
- **Automated testing** – Introduce Playwright or Jest with jsdom to load the HTML snapshots and verify the extractor outputs only the expected ranges.
- **Localization** – Wrap user-facing strings (status messages, errors) in a simple i18n helper to support additional languages.

Each of these extends a specific layer without breaking the clean separation.

---

## 8. Command Reference

| Command | Description |
| --- | --- |
| `npm run typecheck` | TypeScript `--noEmit` check (required before shipping). |
| `npm run build` | Runs typecheck then bundles `content-script.ts` & `popup.ts` with esbuild (output in `dist/`). |
| `npm run clean` | Removes the `dist/` folder. |
| `npm test` | Executes the jsdom-based parser regression suite. |

---

## 9. Glossary

- **Indicator Fallback** – The heuristic mode where uncovered status cells imply new code even if Sonar doesn’t render the underline. Used only when explicit markers are missing but the page suggests filtered new-code results.
- **CoverageExtractionStats** – A snapshot of the extractor run. Review this before adjusting heuristics.
- **Skip reason** – Classified as `NO_NEW_COVERAGE` or `UNEXPECTED_ERROR`, enabling different handling in the popup.

---

## 10. Support Data

There are helper files under `source-sonar-qube/`:

- `master-page.html` – Sample Snapdragon page with the “New Code” list.
- `source1.html`, `source2.html`, `sourceNoNewCode.html` – File-level snapshots with varying amounts of uncovered code.
- `requirements.md` – Historical task specification and evolution of the feature set.

Use these to reproduce issues offline and to feed deterministic HTML into new parsers or tests.

---

## 11. Conclusion

The exporter now has a reusable architecture: domain models are portable, application services compose them, and infrastructure adapters handle the messy DOM work. When enhancing the system, make changes in the appropriate layer, keep the extractor stats truthful, and rely on the clean abstractions to minimise regression risk.
