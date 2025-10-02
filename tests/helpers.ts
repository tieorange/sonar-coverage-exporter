import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { SonarSourceAnalyzer } from '../src/infrastructure/dom/SonarSourceAnalyzer';

interface AnalyzerFixtureResult {
  analyzer: SonarSourceAnalyzer;
  containers: Element[];
  document: Document;
}

export function createAnalyzerFromFixture(fileName: string): AnalyzerFixtureResult {
  const html = readFileSync(join('source-sonar-qube', fileName), 'utf8');
  const dom = new JSDOM(html, { url: `https://local-sonar.example/${fileName}` });
  const document = dom.window.document;
  const analyzer = new SonarSourceAnalyzer(document);
  const containers = analyzer.findSourceContainers();

  if (!containers.length) {
    throw new Error(`Fixture ${fileName} does not contain any source containers.`);
  }

  return { analyzer, containers, document };
}

export function summariseStats(stats: ReturnType<SonarSourceAnalyzer['getLastExtractionStats']>) {
  return stats ?? {
    totalRows: 0,
    filteredRows: 0,
    uncoveredIndicatorRows: 0,
    newCodeMarkerRows: 0,
    uncoveredNewCodeRows: 0,
    indicatorWithoutNewCodeRows: 0,
    newCodeWithoutIndicatorRows: 0,
    heuristicNewCodeRows: 0,
  };
}
