import { JSDOM } from 'jsdom';
import { expect, test } from './testing';
import { createAnalyzerFromFixture } from './helpers';
import { SonarSourceAnalyzer } from '../src/infrastructure/dom/SonarSourceAnalyzer';

const collectLineNumbers = (analyzer: SonarSourceAnalyzer, containers: Element[], treatIndicatorAsNewCode: boolean) =>
  analyzer
    .collectUncoveredLines(containers, { treatIndicatorAsNewCode, debugLabel: 'test-run' })
    .map((line) => line.lineNumber);

test('source1 fixture yields expected uncovered lines with explicit markers', () => {
  const { analyzer, containers } = createAnalyzerFromFixture('source1.html');
  const lines = collectLineNumbers(analyzer, containers, false);
  expect(lines).toEqual([70, 114, 116, 117, 118]);

  const stats = analyzer.getLastExtractionStats();
  expect(stats?.heuristicNewCodeRows ?? -1).toBe(0);
  expect(stats?.uncoveredNewCodeRows ?? -1).toBe(5);
});

test('source2 fixture includes multiple explicit new-code segments', () => {
  const { analyzer, containers } = createAnalyzerFromFixture('source2.html');
  const lines = collectLineNumbers(analyzer, containers, false);
  expect(lines).toEqual([
    124, 126, 127, 128, 130,
    131, 135, 139, 141, 142,
    145, 146, 147, 148, 149,
    150, 154, 155, 158, 159,
    160, 161, 163, 165,
  ]);

  const stats = analyzer.getLastExtractionStats();
  expect(stats?.newCodeMarkerRows ?? -1).toBeGreaterThan(20);
  expect(stats?.heuristicNewCodeRows ?? -1).toBe(0);
});

test('sourceNoNewCode fixture keeps indicator-only rows out of results', () => {
  const { analyzer, containers } = createAnalyzerFromFixture('sourceNoNewCode.html');
  const lines = collectLineNumbers(analyzer, containers, false);
  expect(lines.length).toBe(2);
  expect(lines).toEqual([311, 313]);

  const stats = analyzer.getLastExtractionStats();
  expect(stats?.indicatorWithoutNewCodeRows ?? -1).toBeGreaterThan(50);
});

test('indicator fallback promotes filtered indicator rows when explicit markers are absent', () => {
  const html = `
    <html><body>
      <table class="source-viewer">
        <tbody>
          <tr data-line-number="10" class="it__source-line-filtered" data-test="filtered-row">
            <td class="status" aria-label="Line not covered"></td>
            <td class="it__source-line-code"><pre>const value = 1;</pre></td>
          </tr>
        </tbody>
      </table>
    </body></html>
  `;

  const dom = new JSDOM(html, { url: 'https://local-sonar.test/fallback' });
  const analyzer = new SonarSourceAnalyzer(dom.window.document);
  const containers = analyzer.findSourceContainers();
  expect(containers.length).toBe(1);

  const primary = collectLineNumbers(analyzer, containers, false);
  expect(primary).toEqual([]);

  const fallback = collectLineNumbers(analyzer, containers, true);
  expect(fallback).toEqual([10]);

  const stats = analyzer.getLastExtractionStats();
  expect(stats?.heuristicNewCodeRows ?? -1).toBe(1);
  expect(stats?.uncoveredNewCodeRows ?? -1).toBe(1);
});
