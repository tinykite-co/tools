import { describe, expect, it } from "vitest";
import { WorkerPool } from "../src/worker";
import {
  ToolError,
  ValidationError,
  UnsupportedError,
  ProcessingError,
  CancelledError
} from "../src/errors";
import {
  sanitizeFileName,
  deriveOutputName,
  buildBatchName
} from "../src/naming";
import {
  createJobContext,
  createCancellationToken,
  throwIfCancelled
} from "../src/job";
import { toProgressEvent } from "../src/asset";

describe("WorkerPool", () => {
  it("acquires and releases workers", () => {
    const pool = new WorkerPool(1);
    const handle = pool.acquire();
    expect(handle?.busy).toBe(true);
    if (handle) {
      pool.release(handle);
    }
    const next = pool.acquire();
    expect(next).toBeTruthy();
  });
});

describe("Error taxonomy", () => {
  it("ValidationError has correct code and name", () => {
    const err = new ValidationError("bad input");
    expect(err.code).toBe("validation_error");
    expect(err.name).toBe("ValidationError");
    expect(err).toBeInstanceOf(ToolError);
    expect(err).toBeInstanceOf(Error);
  });

  it("UnsupportedError has correct code and name", () => {
    const err = new UnsupportedError("not supported");
    expect(err.code).toBe("unsupported_error");
    expect(err.name).toBe("UnsupportedError");
    expect(err).toBeInstanceOf(ToolError);
  });

  it("ProcessingError has correct code and name", () => {
    const err = new ProcessingError("failed");
    expect(err.code).toBe("processing_error");
    expect(err.name).toBe("ProcessingError");
    expect(err).toBeInstanceOf(ToolError);
  });

  it("CancelledError has correct code and default message", () => {
    const err = new CancelledError();
    expect(err.code).toBe("cancelled");
    expect(err.name).toBe("CancelledError");
    expect(err.message).toBe("Operation cancelled.");
    expect(err).toBeInstanceOf(ToolError);
  });
});

describe("Naming utilities", () => {
  it("sanitizeFileName replaces special characters", () => {
    expect(sanitizeFileName("my file (1).png")).toBe("my_file_1_.png");
  });

  it("sanitizeFileName collapses multiple underscores", () => {
    expect(sanitizeFileName("a   b")).toBe("a_b");
  });

  it("sanitizeFileName trims leading/trailing underscores", () => {
    expect(sanitizeFileName(" hello ")).toBe("hello");
  });

  it("deriveOutputName builds name from input", () => {
    expect(deriveOutputName("photo.jpg", "-resized", ".webp"))
      .toBe("photo-resized.webp");
  });

  it("deriveOutputName handles input without extension", () => {
    expect(deriveOutputName("readme", "-copy", "txt"))
      .toBe("readme-copy.txt");
  });

  it("buildBatchName pads index", () => {
    expect(buildBatchName("resize", 1, ".png")).toBe("resize-001.png");
    expect(buildBatchName("resize", 42, "png")).toBe("resize-042.png");
  });
});

describe("JobContext and cancellation", () => {
  it("createJobContext returns valid context", () => {
    const { token } = createCancellationToken();
    const ctx = createJobContext("job-1", token);
    expect(ctx.jobId).toBe("job-1");
    expect(ctx.cancellation.cancelled).toBe(false);
  });

  it("throwIfCancelled does not throw when not cancelled", () => {
    const { token } = createCancellationToken();
    expect(() => throwIfCancelled(token)).not.toThrow();
  });

  it("throwIfCancelled throws CancelledError when cancelled", () => {
    const { token, cancel } = createCancellationToken();
    cancel();
    expect(() => throwIfCancelled(token)).toThrow(CancelledError);
  });

  it("onProgress callback receives events", () => {
    const events: unknown[] = [];
    const { token } = createCancellationToken();
    const ctx = createJobContext("job-2", token, (e) => events.push(e));
    ctx.onProgress({ jobId: "job-2", percent: 50, message: "halfway" });
    expect(events).toHaveLength(1);
  });

  it("toProgressEvent converts ProgressUpdate to ProgressEvent", () => {
    const event = toProgressEvent("job-3", { percent: 75, message: "done" });
    expect(event.jobId).toBe("job-3");
    expect(event.percent).toBe(75);
    expect(event.message).toBe("done");
  });
});
