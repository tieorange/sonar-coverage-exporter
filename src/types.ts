import type {
  CoverageLineDto,
  CoverageGroupDto,
  CoverageReportDto,
} from './domain/coverage';

export { CoverageLineModel, CoverageGroupModel, CoverageReportModel } from './domain/coverage';

export type CoverageLine = CoverageLineDto;
export type CoverageGroup = CoverageGroupDto;
export type CoverageReport = CoverageReportDto;

export type CoverageMessageType = 'COLLECT_COVERAGE' | 'COLLECT_ALL_COVERAGE';

export type CollectCoverageMessage =
  | { type: 'COLLECT_COVERAGE' }
  | { type: 'COLLECT_ALL_COVERAGE' };

export interface CollectCoverageSuccess {
  success: true;
  kind: 'single';
  report: CoverageReport;
}

export type CollectCoverageFailureReason = 'NO_NEW_COVERAGE' | 'UNEXPECTED_ERROR';

export interface CollectCoverageFailure {
  success: false;
  url?: string;
  label?: string;
  error: string;
  details?: string;
  reason?: CollectCoverageFailureReason;
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
