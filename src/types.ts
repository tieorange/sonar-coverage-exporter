export type CoverageMessageType = 'COLLECT_COVERAGE' | 'COLLECT_ALL_COVERAGE';

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

export type CollectCoverageMessage =
  | { type: 'COLLECT_COVERAGE' }
  | { type: 'COLLECT_ALL_COVERAGE' };

export interface CollectCoverageSuccess {
  success: true;
  kind: 'single';
  report: CoverageReport;
}

export interface CollectCoverageFailure {
  success: false;
  url?: string;
  label?: string;
  error: string;
  details?: string;
}

export interface CollectAllCoverageSuccess {
  success: true;
  kind: 'all';
  reports: CoverageReport[];
  skipped: CollectCoverageFailure[];
}

export type CollectCoverageResponse =
  | CollectCoverageSuccess
  | CollectAllCoverageSuccess
  | CollectCoverageFailure;

export type LoggedErrorSource = 'single' | 'bundle' | 'skipped' | 'system';

export interface LoggedError {
  id: string;
  timestamp: string;
  source: LoggedErrorSource;
  message: string;
  url?: string;
  details?: string;
}
