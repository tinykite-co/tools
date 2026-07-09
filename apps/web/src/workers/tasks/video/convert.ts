import {
  convertVideo,
  extractVideoInput,
  type MaxHeightOption,
  type VideoOutputFormat
} from "@tinykite/video";
import { deriveOutputName, type JobContext, type OutputAsset } from "@tinykite/core";

export interface ConvertVideoPayload {
  video?: unknown;
  filename?: string;
  format?: VideoOutputFormat | string;
  quality?: number | string;
  maxHeight?: MaxHeightOption | string | number;
  [key: string]: unknown;
}

function parseQuality(value: number | string | undefined): number {
  if (value === undefined || value === "") {
    return 75;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 75;
}

export async function convertVideoTask(
  payload: ConvertVideoPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[]; format: string; sizeBytes: number }> {
  const { blob, filename } = extractVideoInput(payload);
  const format = payload.format === "webm" ? "webm" : "mp4";
  const quality = parseQuality(payload.quality);
  const maxHeight = payload.maxHeight ?? "original";

  const result = await convertVideo({
    video: blob,
    filename,
    format,
    quality,
    maxHeight,
    onProgress: (percent, message) => {
      ctx?.reportProgress?.(percent, message);
    }
  });

  const outFileName = deriveOutputName(filename, "-converted", result.extension);
  const asset: OutputAsset = {
    id: `converted-video-${Date.now()}`,
    kind: "file",
    label: `${result.format.toUpperCase()} · ${(result.data.byteLength / (1024 * 1024)).toFixed(2)} MB`,
    fileName: outFileName,
    mimeType: result.mimeType,
    data: result.data,
    sizeBytes: result.data.byteLength
  };

  return {
    assets: [asset],
    format: result.format,
    sizeBytes: result.data.byteLength
  };
}
