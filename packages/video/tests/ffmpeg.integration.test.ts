import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { convertVideo, extractStoryboard } from "../src/index.js";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "sample.mp4"
);

const runIntegration = process.env.VIDEO_INTEGRATION === "1";

describe.runIf(runIntegration)("ffmpeg.wasm integration", () => {
  it(
    "converts sample mp4 and builds a storyboard",
    async () => {
      const bytes = readFileSync(fixturePath);
      const blob = new Blob([bytes], { type: "video/mp4" });

      const converted = await convertVideo({
        video: blob,
        filename: "sample.mp4",
        format: "mp4",
        quality: 70,
        maxHeight: 240
      });

      expect(converted.data.byteLength).toBeGreaterThan(1000);
      expect(converted.mimeType).toBe("video/mp4");

      const board = await extractStoryboard({
        video: blob,
        filename: "sample.mp4",
        intervalSeconds: 1,
        maxFrames: 5,
        maxWidth: 320,
        layout: "both",
        includeTimestamps: true
      });

      expect(board.frameCount).toBeGreaterThan(0);
      expect(board.sheets.length).toBeGreaterThan(0);
      expect(board.frames.length).toBe(board.frameCount);
      expect(board.sheets[0]?.data.byteLength).toBeGreaterThan(500);
    },
    180_000
  );
});
