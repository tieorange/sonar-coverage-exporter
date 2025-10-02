export type CoverageMessageType = 'COLLECT_COVERAGE';

export interface CoverageLine {
  lineNumber: number;
  code: string;
}

export interface CoverageGroup {
  startLine: number;
  endLine: number;
  lines: CoverageLine[];
}

export interface CoverageReport {
  projectName: string;
  filePath: string;
  url: string;
  generatedAt: string;
  totalUncoveredLines: number;
  groups: CoverageGroup[];
}

export interface CollectCoverageMessage {
  type: CoverageMessageType;
}

export interface CollectCoverageSuccess {
  success: true;
  report: CoverageReport;
}

export interface CollectCoverageFailure {
  success: false;
  error: string;
}

export type CollectCoverageResponse = CollectCoverageSuccess | CollectCoverageFailure;
