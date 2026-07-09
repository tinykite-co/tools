import {
  extractStoryboard,
  extractVideoInput,
  type StoryboardLayout
} from "@tinykite/video";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface StoryboardPayload {
  video?: unknown;
  intervalSeconds?: number | string;
  maxFrames?: number | string;
  maxWidth?: number | string;
  layout?: StoryboardLayout | string;
  includeTimestamps?: boolean | string;
  [key: string]: unknown;
}

export async function videoStoryboardTask(
  payload: StoryboardPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[]; frameCount: number; intervalSeconds: number }> {
  const { blob, filename } = extractVideoInput(payload);

  const result = await extractStoryboard({
    video: blob,
    filename,
    intervalSeconds: payload.intervalSeconds,
    maxFrames: payload.maxFrames,
    maxWidth: payload.maxWidth,
    layout: payload.layout,
    includeTimestamps: payload.includeTimestamps,
    onProgress: (percent, message) => {
      ctx?.reportProgress?.(percent, message);
    }
  });

  const assets: OutputAsset[] = [];
  const stamp = Date.now();

  for (const sheet of result.sheets) {
    assets.push({
      id: `storyboard-sheet-${stamp}-${sheet.index}`,
      kind: "file",
      label: result.sheets.length > 1 ? `The story · ${sheet.index + 1}` : "The whole story",
      fileName: sheet.fileName,
      mimeType: sheet.mimeType,
      data: sheet.data,
      sizeBytes: sheet.data.byteLength
    });
  }

  for (const frame of result.frames) {
    assets.push({
      id: `storyboard-frame-${stamp}-${frame.index}`,
      kind: "file",
      label: `Moment ${frame.index + 1}`,
      fileName: frame.fileName,
      mimeType: frame.mimeType,
      data: frame.data,
      sizeBytes: frame.data.byteLength
    });
  }

  if (assets.length === 0) {
    throw new Error("No storyboard assets were produced.");
  }

  return {
    assets,
    frameCount: result.frameCount,
    intervalSeconds: result.intervalSeconds
  };
}
