import type { WorkerRequest, WorkerResponse } from "./workerClient";

export type WorkerHandler<TInput = unknown, TOutput = unknown> = (
  payload: TInput
) => Promise<TOutput> | TOutput;

export type WorkerRouter = Record<string, WorkerHandler<any, unknown>>;

export function registerHandler<TInput, TOutput>(
  handler: WorkerHandler<TInput, TOutput>
) {
  registerRouter({ default: handler }, true);
}

export function registerRouter(handlers: WorkerRouter, allowDefault = false) {
  self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
    const { id, payload, type } = event.data;
    const handler = handlers[type ?? ""] ?? (allowDefault ? handlers.default : undefined);
    if (!handler) {
      const response: WorkerResponse = {
        id,
        status: "error",
        error: `No handler for ${type ?? ""}`
      };
      self.postMessage(response);
      return;
    }
    try {
      const result = await handler(payload);
      const response: WorkerResponse = { id, status: "done", payload: result };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        id,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      };
      self.postMessage(response);
    }
  };
}
