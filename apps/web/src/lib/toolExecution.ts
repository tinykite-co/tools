import { CancelledError } from "@tinykite/core";
import { runInWorker, runOnMain } from "./runnerClient";

export interface ProgressState {
  label: string;
  percent: number;
}

const phases: ProgressState[] = [
  { label: "Gathering…", percent: 20 },
  { label: "Working…", percent: 60 },
  { label: "Almost there…", percent: 100 }
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function executeTool(params: {
  runner: string;
  input: unknown;
  useWorker: boolean;
  signal?: AbortSignal;
  onProgress?: (state: ProgressState) => void;
}) {
  const { runner, input, useWorker, signal, onProgress } = params;

  if (signal?.aborted) {
    throw new CancelledError();
  }

  onProgress?.(phases[0]);
  await sleep(80);
  if (signal?.aborted) {
    throw new CancelledError();
  }

  onProgress?.(phases[1]);
  const output = useWorker
    ? await runInWorker(runner, input, signal)
    : await runOnMain(runner, input, signal);

  onProgress?.(phases[2]);
  return output;
}
