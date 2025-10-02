type ProgressPayload = {
  processed: number;
  total: number;
  label: string;
  startedAt: number;
};

type ProgressCompletePayload = {
  processed: number;
  total: number;
};

export class ProgressReporter {
  private processed = 0;
  private readonly startedAt = Date.now();

  constructor(private readonly total: number) {}

  public start(): void {
    this.emitMessage('COVERAGE_PROGRESS_UPDATE', {
      processed: this.processed,
      total: this.total,
      label: 'Preparing…',
      startedAt: this.startedAt,
    });
  }

  public emit(label: string): void {
    this.processed = Math.min(this.processed + 1, this.total);
    this.emitMessage('COVERAGE_PROGRESS_UPDATE', {
      processed: this.processed,
      total: this.total,
      label,
      startedAt: this.startedAt,
    });
  }

  public complete(): void {
    this.emitMessage('COVERAGE_PROGRESS_COMPLETE', {
      processed: this.processed,
      total: this.total,
    });
  }

  private emitMessage(type: string, payload: ProgressPayload | ProgressCompletePayload): void {
    chrome.runtime.sendMessage({ type, payload });
  }
}

export type { ProgressPayload, ProgressCompletePayload };
