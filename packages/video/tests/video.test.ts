import { describe, expect, it } from "vitest";

import {
  buildConvertArgs,
  computeSheetLayout,
  extensionFromFilename,
  extractVideoInput,
  formatTimestamp,
  fpsFilter,
  qualityToCrf,
  buildStoryboardArgs
} from "../src/index.js";
import { ValidationError } from "@tinykite/core";

describe("formats", () => {
  it("maps quality to CRF (higher quality → lower CRF)", () => {
    expect(qualityToCrf(100)).toBeLessThan(qualityToCrf(50));
    expect(qualityToCrf(50)).toBeLessThan(qualityToCrf(1));
    expect(qualityToCrf(100)).toBe(18);
    expect(qualityToCrf(1)).toBe(36);
  });

  it("builds fps filter for interval seconds", () => {
    expect(fpsFilter(1)).toBe("fps=1/1");
    expect(fpsFilter(2)).toBe("fps=1/2");
    expect(fpsFilter(0.5)).toBe("fps=1/0.5");
  });

  it("formats timestamps", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(3661)).toBe("1:01:01");
  });

  it("reads extension from filename", () => {
    expect(extensionFromFilename("clip.MOV")).toBe("mov");
    expect(extensionFromFilename("noext")).toBe("mp4");
  });
});

describe("extractVideoInput", () => {
  it("accepts FieldInput nested image wrapper under video key", () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "video/mp4" });
    const input = extractVideoInput({
      video: { image: blob, filename: "demo.mov" },
      format: "mp4"
    });
    expect(input.filename).toBe("demo.mov");
    expect(input.blob.size).toBe(3);
  });

  it("accepts raw Blob", () => {
    const blob = new Blob([new Uint8Array([9])]);
    const input = extractVideoInput(blob, "fallback.mp4");
    expect(input.filename).toBe("fallback.mp4");
  });

  it("throws when missing", () => {
    expect(() => extractVideoInput(null)).toThrow(ValidationError);
  });
});

describe("buildConvertArgs", () => {
  it("builds mp4 args with scale, ultrafast x264, and fastdecode tune", () => {
    const args = buildConvertArgs({
      inputName: "input.mov",
      outputName: "output.mp4",
      format: "mp4",
      quality: 55,
      maxHeight: 720
    });
    expect(args).toContain("-i");
    expect(args).toContain("libx264");
    expect(args).toContain("ultrafast");
    expect(args).toContain("fastdecode");
    expect(args).toContain("aac");
    expect(args).toContain("-vf");
    expect(args.join(" ")).toContain("min(720\\,ih)");
  });

  it("builds remux args as stream copy", async () => {
    const { buildRemuxArgs } = await import("../src/tools/convert/impl.js");
    const args = buildRemuxArgs("input.mov", "output.mp4");
    expect(args).toEqual([
      "-i",
      "input.mov",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      "-y",
      "output.mp4"
    ]);
  });

  it("builds webm args with high cpu-used for speed", () => {
    const args = buildConvertArgs({
      inputName: "input.mp4",
      outputName: "output.webm",
      format: "webm",
      quality: 55,
      maxHeight: null
    });
    expect(args).toContain("libvpx-vp9");
    expect(args).toContain("libopus");
    expect(args).toContain("-cpu-used");
    expect(args).toContain("8");
    expect(args).not.toContain("-vf");
  });
});

describe("buildStoryboardArgs", () => {
  it("requests capped fps extraction as jpegs", () => {
    const args = buildStoryboardArgs({
      inputName: "input.mp4",
      intervalSeconds: 2,
      maxFrames: 30,
      maxWidth: 1280
    });
    expect(args.join(" ")).toContain("fps=1/2");
    expect(args.join(" ")).toContain("scale=1280:-2");
    expect(args).toContain("-frames:v");
    expect(args).toContain("30");
    expect(args.at(-1)).toBe("frame_%04d.jpg");
  });
});

describe("computeSheetLayout", () => {
  it("computes grid size for frames", () => {
    const layout = computeSheetLayout(10, {
      columns: 4,
      cellWidth: 320,
      gap: 8,
      includeTimestamps: true
    });
    expect(layout.columns).toBe(4);
    expect(layout.rows).toBe(3);
    expect(layout.width).toBe(4 * 320 + 5 * 8);
    expect(layout.labelHeight).toBeGreaterThan(0);
  });

  it("can omit timestamp row height", () => {
    const layout = computeSheetLayout(1, { includeTimestamps: false });
    expect(layout.labelHeight).toBe(0);
  });
});
