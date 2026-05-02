import type { JobResult, ProgressEvent, ProgressUpdate } from "../asset";
import { CancelledError } from "../errors";

export interface CancellationToken {
  readonly cancelled: boolean;
}

export interface JobContext {
  jobId: string;
  cancellation: CancellationToken;
  onProgress: (event: ProgressEvent) => void;
}

export function createCancellationToken(): {
  token: CancellationToken;
  cancel: () => void;
} {
  const state = { cancelled: false };
  return {
    token: state,
    cancel: (): void => {
      state.cancelled = true;
    }
  };
}

export function createJobContext(
  jobId: string,
  cancellation: CancellationToken,
  onProgress?: (event: ProgressEvent) => void
): JobContext {
  return {
    jobId,
    cancellation,
    onProgress: onProgress ?? ((): void => {})
  };
}

export function throwIfCancelled(token: CancellationToken): void {
  if (token.cancelled) {
    throw new CancelledError();
  }
}

export type JobHandler<TInput, TOutput> = (
  input: TInput,
  onProgress?: (update: ProgressUpdate) => void
) => Promise<JobResult<TOutput>>;

export class JobRunner<TInput, TOutput> {
  constructor(private readonly handler: JobHandler<TInput, TOutput>) {}

  run(
    input: TInput,
    onProgress?: (update: ProgressUpdate) => void
  ): Promise<JobResult<TOutput>> {
    return this.handler(input, onProgress);
  }
}
