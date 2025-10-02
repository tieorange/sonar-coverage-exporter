import type { CollectCoverageFailure, CoverageGroup, CoverageReport, LoggedError } from './types';

const MAX_SUMMARY_LENGTH = 120;
const CLUSTER_GAP = 4;

interface CoverageCluster {
  startLine: number;
  endLine: number;
  groups: CoverageGroup[];
}

class MarkdownFormatter {
  public static formatDateTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      if (Number.isNaN(date.getTime())) {
        return isoString;
      }
      return date.toLocaleString();
    } catch (_error) {
      return isoString;
    }
  }

  public static guessLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'ts';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'java':
        return 'java';
      case 'kt':
        return 'kotlin';
      case 'cs':
        return 'csharp';
      case 'py':
        return 'python';
      case 'rb':
        return 'ruby';
      case 'php':
        return 'php';
      case 'go':
        return 'go';
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'hpp':
        return 'cpp';
      case 'c':
      case 'h':
        return 'c';
      case 'rs':
        return 'rust';
      case 'swift':
        return 'swift';
      case 'scss':
      case 'css':
        return 'css';
      case 'dart':
        return 'dart';
      case 'scala':
        return 'scala';
      case 'sql':
        return 'sql';
      default:
        return '';
    }
  }

  public static formatRange(group: CoverageGroup): string {
    return group.startLine === group.endLine
      ? `line ${group.startLine}`
      : `lines ${group.startLine}-${group.endLine}`;
  }

  public static buildSnippet(group: CoverageGroup): string {
    const width = String(group.lines[group.lines.length - 1].lineNumber).length;
    return group.lines
      .map((line) => {
        const prefix = String(line.lineNumber).padStart(width, ' ');
        const code = line.code.length ? line.code : ' ';
        return `${prefix}| ${code}`;
      })
      .join('\n');
  }

  public static escapeTableCell(value: string): string {
    return value.replace(/\|/g, '\\|').replace(/\n/g, '<br />');
  }

  public static summariseGroup(group: CoverageGroup): string {
    const snippet = group.lines.map((line) => line.code.trim()).find((entry) => entry.length > 0);
    if (!snippet) {
      return '[blank line]';
    }
    if (snippet.length > MAX_SUMMARY_LENGTH) {
      return `${snippet.slice(0, MAX_SUMMARY_LENGTH - 3)}...`;
    }
    return snippet;
  }

  public static sanitiseForFileName(input: string): string {
    return input.replace(/[\\/]+/g, '_').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');
  }

  public static clusterGroups(groups: CoverageGroup[]): CoverageCluster[] {
    if (!groups.length) {
      return [];
    }

    const clusters: CoverageCluster[] = [];
    let current: CoverageCluster | null = null;

    groups.forEach((group) => {
      if (!current || group.startLine - current.endLine > CLUSTER_GAP) {
        current = {
          startLine: group.startLine,
          endLine: group.endLine,
          groups: [group],
        };
        clusters.push(current);
        return;
      }

      current.endLine = Math.max(current.endLine, group.endLine);
      current.groups.push(group);
    });

    return clusters;
  }

  public static formatLinesCount(count: number): string {
    return count === 1 ? '1 line' : `${count} lines`;
  }

  public static formatClusterRange(cluster: CoverageCluster): string {
    return cluster.startLine === cluster.endLine
      ? `line ${cluster.startLine}`
      : `lines ${cluster.startLine}-${cluster.endLine}`;
  }

  public static summariseCluster(cluster: CoverageCluster): string {
    const snippets = cluster.groups
      .map((group) => MarkdownFormatter.summariseGroup(group))
      .filter((snippet) => snippet !== '[blank line]');
    if (!snippets.length) {
      return 'Exercise the logic in this region.';
    }
    if (snippets.length === 1) {
      return snippets[0];
    }
    const uniqueSnippets = Array.from(new Set(snippets));
    if (uniqueSnippets.length === 1) {
      return uniqueSnippets[0];
    }
    return `${uniqueSnippets[0]} … ${uniqueSnippets[uniqueSnippets.length - 1]}`;
  }
}

class CoverageMarkdownComposer {
  private readonly language: string;
  private readonly clusters: CoverageCluster[];

  constructor(private readonly report: CoverageReport) {
    this.language = MarkdownFormatter.guessLanguage(report.filePath);
    this.clusters = MarkdownFormatter.clusterGroups(report.groups);
  }

  public generate(options: { baseLevel?: number; title?: string; includeShareLine?: boolean } = {}): string {
    const baseLevel = options.baseLevel ?? 1;
    const includeShareLine = options.includeShareLine ?? true;
    const heading = (offset: number, text: string): string =>
      `${'#'.repeat(Math.min(baseLevel + offset, 6))} ${text}`;

    const longestBlock = this.report.groups.reduce<{
      lines: number;
      range: string;
    } | null>((acc, group) => {
      const length = group.lines.length;
      if (!acc || length > acc.lines) {
        return { lines: length, range: MarkdownFormatter.formatRange(group) };
      }
      return acc;
    }, null);

    const longestBlockText = longestBlock
      ? `${longestBlock.range} (${MarkdownFormatter.formatLinesCount(longestBlock.lines)})`
      : 'n/a';

    const rangeBulletList = this.report.groups
      .map((group) => `- ${MarkdownFormatter.formatRange(group)}`)
      .join('\n');

    const rangeTable = [
      '| Range | Lines | Highlight |',
      '| :---- | ----: | :-------- |',
      ...this.report.groups.map((group) =>
        `| ${MarkdownFormatter.formatRange(group)} | ${group.lines.length} | ${MarkdownFormatter.escapeTableCell(MarkdownFormatter.summariseGroup(group))} |`,
      ),
    ].join('\n');

    const clusterChecklist = this.clusters.length
      ? this.clusters.map((cluster) => {
          const totalLines = cluster.groups.reduce((sum, group) => sum + group.lines.length, 0);
          return `- 🔥 ${MarkdownFormatter.formatClusterRange(cluster)} · ${cluster.groups.length} block(s), ${MarkdownFormatter.formatLinesCount(totalLines)} – ${MarkdownFormatter.summariseCluster(cluster)}`;
        })
      : this.report.groups
          .slice(0, Math.min(10, this.report.groups.length))
          .map((group) => `- ✅ ${MarkdownFormatter.formatRange(group)} – ${MarkdownFormatter.summariseGroup(group)}`);

    const notableItems = this.buildNotableItems();

    const prompt = this.buildPrompt();
    const codeSections = this.buildCodeSections(heading);

    const sections = [
      heading(0, options.title ?? 'SonarQube Coverage Gaps 📉'),
      '',
      `- **Project**: ${this.report.projectName}`,
      `- **File**: \`${this.report.filePath}\``,
      `- **Generated**: ${MarkdownFormatter.formatDateTime(this.report.generatedAt)}`,
      `- **SonarQube page**: ${this.report.url}`,
      '',
      heading(1, 'Quick Snapshot 📊'),
      `- 🔢 Uncovered new-code lines: **${this.report.totalUncoveredLines}**`,
      `- 🔁 Blocks captured: **${this.report.groups.length}**`,
      `- 🧵 Longest block: ${longestBlockText}`,
      `- 🔥 Hotspot groups: **${this.clusters.length}**`,
      '',
      heading(2, 'Testing Checklist ✅'),
      clusterChecklist.length ? clusterChecklist.join('\n') : '_No hotspots detected via clustering._',
      '',
      heading(2, 'Range Overview 🗂️'),
      rangeTable,
      '',
      heading(2, 'Noteworthy Logic 📌'),
      notableItems,
      '',
      heading(1, 'Code Gaps 🔍'),
      rangeBulletList,
      '',
      codeSections,
      '---',
      heading(1, 'Ready-to-use Prompt 🤖'),
      '```text',
      prompt,
      '```',
      '',
      heading(1, 'Guidance & Constraints 🛠️'),
      '- Review existing automated tests and documentation for reference patterns.',
      '- Follow the project conventions defined in `.cursorrules`.',
      '- Keep code changes scoped to the impacted areas and their related test suites.',
      '- Deliver concrete test updates or code snippets that measurably improve coverage.',
      '',
    ];

    if (includeShareLine) {
      sections.push('🚀 Share this report with your tooling or teammates to close the coverage gaps efficiently.');
    }

    return sections.join('\n');
  }

  private buildNotableItems(): string {
    const interestingGroups = this.report.groups
      .map((group) => ({ group, summary: MarkdownFormatter.summariseGroup(group) }))
      .filter(({ summary }) => summary !== '[blank line]')
      .filter(({ summary }) => {
        const normalized = summary.trim().toLowerCase();
        return !normalized.startsWith('log') && !normalized.startsWith('print') && normalized.length > 3;
      })
      .slice(0, 8);

    const notableItems =
      interestingGroups.length
        ? interestingGroups
        : this.report.groups.slice(0, 5).map((group) => ({ group, summary: MarkdownFormatter.summariseGroup(group) }));

    return notableItems
      .map(({ group, summary }) => `- 📌 ${MarkdownFormatter.formatRange(group)} – ${summary ?? MarkdownFormatter.summariseGroup(group)}`)
      .join('\n');
  }

  private buildPrompt(): string {
    const promptHeaderLines = this.report.groups.map((group) => `  * ${MarkdownFormatter.formatRange(group)}`).join('\n');
    return [
      'You are assisting with increasing automated test coverage based on SonarQube new-code analysis.',
      `Focus on **${this.report.filePath}** within project **${this.report.projectName}**.`,
      `Target the following ${this.report.groups.length} uncovered block(s):`,
      promptHeaderLines,
      'For each block, propose or implement tests that execute the code paths shown in the snippets above so SonarQube reports full coverage.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildCodeSections(heading: (offset: number, text: string) => string): string {
    return this.report.groups
      .map((group) => {
        const rangeLabel = MarkdownFormatter.formatRange(group);
        const snippet = MarkdownFormatter.buildSnippet(group);
        const codeFenceOpen = this.language ? `\`\`\`${this.language}` : '```';
        return [
          heading(2, `🔸 ${rangeLabel}`),
          '',
          codeFenceOpen,
          snippet,
          '```',
          '',
        ].join('\n');
      })
      .join('\n');
  }
}

class BundleMarkdownComposer {
  constructor(private readonly reports: CoverageReport[], private readonly options: { skipped?: CollectCoverageFailure[] } = {}) {}

  public compose(): { fileName: string; content: string } {
    if (!this.reports.length) {
      throw new Error('No coverage reports to export.');
    }

    const timestamp = MarkdownFormatter.sanitiseForFileName(new Date().toISOString());
    const fileName = `sonar-coverage_bundle_${timestamp}.md`;
    const totalLines = this.reports.reduce((sum, report) => sum + report.totalUncoveredLines, 0);
    const totalBlocks = this.reports.reduce((sum, report) => sum + report.groups.length, 0);
    const projects = Array.from(new Set(this.reports.map((report) => report.projectName)));

    const overviewTable = [
      '| File | Project | Blocks | Lines |',
      '| :---- | :------ | ----: | ----: |',
      ...this.reports.map((report) =>
        `| ${MarkdownFormatter.escapeTableCell(report.filePath)} | ${MarkdownFormatter.escapeTableCell(report.projectName)} | ${report.groups.length} | ${report.totalUncoveredLines} |`,
      ),
    ].join('\n');

    const sections: string[] = [
      '# SonarQube Coverage Rollup 📈',
      '',
      `- 🗂️ Files analysed: **${this.reports.length}**`,
      `- 🔢 Total uncovered lines: **${totalLines}**`,
      `- 🔁 Total uncovered blocks: **${totalBlocks}**`,
      `- 🏷️ Projects: ${projects.map((project) => `\`${project}\``).join(', ') || 'n/a'}`,
    ];

    if (this.options.skipped?.length) {
      sections.push('', '> ⚠️ Some files could not be processed:');
      this.options.skipped.forEach((skipped) => {
        const note = skipped.error ?? 'Unknown error';
        sections.push(`> - ${note}`);
        if (skipped.details) {
          sections.push('>```text');
          sections.push(...skipped.details.split('\n').map((line) => `> ${line}`));
          sections.push('>```');
        }
      });
    }

    sections.push('', '## File Overview', overviewTable, '', '## Detailed Reports');

    this.reports.forEach((report) => {
      const composer = new CoverageMarkdownComposer(report);
      sections.push('', composer.generate({
        baseLevel: 2,
        title: `📄 ${report.filePath}`,
        includeShareLine: false,
      }));
    });

    sections.push('', '🚀 Share this bundle with your tooling or teammates to close the coverage gaps efficiently.');

    return {
      fileName,
      content: sections.join('\n'),
    };
  }
}

class ErrorLogMarkdownComposer {
  constructor(private readonly errors: LoggedError[]) {}

  public compose(): { fileName: string; content: string } {
    const timestamp = MarkdownFormatter.sanitiseForFileName(new Date().toISOString());
    const fileName = `sonar-coverage_errors_${timestamp}.md`;

    if (!this.errors.length) {
      return {
        fileName,
        content: '# Sonar Coverage Exporter Errors\n\n_No errors have been recorded in this session._',
      };
    }

    const totalBySource = this.errors.reduce<Record<string, number>>((acc, error) => {
      acc[error.source] = (acc[error.source] ?? 0) + 1;
      return acc;
    }, {});

    const overviewTable = [
      '| Recorded | Source | Message | URL |',
      '| :------- | :----- | :------ | :-- |',
      ...this.errors.map((error) =>
        `| ${MarkdownFormatter.formatDateTime(error.timestamp)} | ${MarkdownFormatter.escapeTableCell(error.source)} | ${MarkdownFormatter.escapeTableCell(error.message)} | ${MarkdownFormatter.escapeTableCell(error.url ?? '-')}`,
      ),
    ].join('\n');

    const detailSections = this.errors
      .map((error, index) => {
        const heading = `### ❗ Error ${index + 1}`;
        const lines = [
          heading,
          '',
          `- **Source**: ${error.source}`,
          `- **Recorded**: ${MarkdownFormatter.formatDateTime(error.timestamp)}`,
          error.url ? `- **URL**: ${error.url}` : null,
          `- **Message**: ${error.message}`,
        ].filter(Boolean) as string[];

        if (error.details) {
          lines.push('', '```text', error.details, '```');
        }

        return lines.join('\n');
      })
      .join('\n\n');

    const sourceSummary = Object.entries(totalBySource)
      .map(([source, count]) => `- ${source}: **${count}**`)
      .join('\n');

    const sections = [
      '# Sonar Coverage Exporter Errors 📋',
      '',
      `- Total entries: **${this.errors.length}**`,
      sourceSummary ? `- Breakdown by source:\n${sourceSummary}` : '',
      '',
      '## Error Overview',
      overviewTable,
      '',
      '## Detailed Records',
      detailSections,
    ].filter(Boolean);

    return {
      fileName,
      content: sections.join('\n'),
    };
  }
}

export const generateMarkdown = (report: CoverageReport): { fileName: string; content: string } => {
  const timestamp = MarkdownFormatter.sanitiseForFileName(new Date().toISOString());
  const fileSafePath = MarkdownFormatter.sanitiseForFileName(report.filePath);
  const fileName = `sonar-coverage_${fileSafePath}_${timestamp}.md`;
  const content = new CoverageMarkdownComposer(report).generate();
  return { fileName, content };
};

export const generateBundleMarkdown = (
  reports: CoverageReport[],
  options: { skipped?: CollectCoverageFailure[] } = {},
): { fileName: string; content: string } => new BundleMarkdownComposer(reports, options).compose();

export const generateErrorLogMarkdown = (errors: LoggedError[]): {
  fileName: string;
  content: string;
} => new ErrorLogMarkdownComposer(errors).compose();
