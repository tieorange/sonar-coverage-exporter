import { CoverageGroup, CoverageReport } from './types';

const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleString();
  } catch (_error) {
    return isoString;
  }
};

const guessLanguage = (filePath: string): string => {
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
};

const formatRange = (group: CoverageGroup): string =>
  group.startLine === group.endLine
    ? `line ${group.startLine}`
    : `lines ${group.startLine}\u2013${group.endLine}`;

const buildSnippet = (group: CoverageGroup): string => {
  const width = String(group.lines[group.lines.length - 1].lineNumber).length;
  return group.lines
    .map((line) => {
      const prefix = String(line.lineNumber).padStart(width, ' ');
      const code = line.code.length ? line.code : ' ';
      return `${prefix}| ${code}`;
    })
    .join('\n');
};

const summariseGroup = (group: CoverageGroup): string => {
  const snippet = group.lines.map((line) => line.code.trim()).find((entry) => entry.length > 0);
  return snippet ?? '[blank line]';
};

const sanitiseForFileName = (input: string): string =>
  input.replace(/[\\/]+/g, '_').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');

export const generateMarkdown = (report: CoverageReport): { fileName: string; content: string } => {
  const language = guessLanguage(report.filePath);
  const quickRanges = report.groups.map((group) => `- ${formatRange(group)}`).join('\n');
  const groupSections = report.groups
    .map((group) => {
      const rangeLabel = formatRange(group);
      const snippet = buildSnippet(group);
      const codeFenceOpen = language ? `\`\`\`${language}` : '```';
      return [
        `### ${rangeLabel}`,
        '',
        codeFenceOpen,
        snippet,
        '```',
        '',
      ].join('\n');
    })
    .join('\n');

  const descriptiveBullets = report.groups
    .map((group) => `- ${formatRange(group)} — ${summariseGroup(group)}`)
    .join('\n');

  const promptHeaderLines = report.groups.map((group) => `  * ${formatRange(group)}`).join('\n');
  const prompt = [
    'You are assisting with increasing automated test coverage based on SonarQube new-code analysis.',
    `Focus on **${report.filePath}** within project **${report.projectName}**.`,
    `Target the following ${report.groups.length} uncovered block(s):`,
    promptHeaderLines,
    'For each block, propose or implement tests that execute the code paths shown in the snippets above so SonarQube reports full coverage.',
    `Reference the SonarQube page for context: ${report.url}`,
    'Limit changes to the impacted file and related test suites only.',
  ]
    .filter(Boolean)
    .join('\n');

  const sections = [
    '# SonarQube New-Code Coverage Gaps',
    '',
    `- **Project**: ${report.projectName}`,
    `- **File**: \`${report.filePath}\``,
    `- **Generated**: ${formatDateTime(report.generatedAt)}`,
    `- **SonarQube page**: ${report.url}`,
    '',
    '## Quick Snapshot',
    `- Uncovered new-code lines: **${report.totalUncoveredLines}**`,
    `- Blocks captured: **${report.groups.length}**`,
    '',
    '### Line ranges',
    quickRanges,
    '',
    '### Notable statements',
    descriptiveBullets,
    '',
    '## Code gaps',
    groupSections,
    '---',
    '## Ready-to-use Prompt',
    '```text',
    prompt,
    '```',
    '',
  ];

  const timestamp = sanitiseForFileName(new Date().toISOString());
  const fileSafePath = sanitiseForFileName(report.filePath);
  const fileName = `sonar-coverage_${fileSafePath}_${timestamp}.md`;

  return {
    fileName,
    content: sections.join('\n'),
  };
};
