import {
  convertVideo,
  extractVideoInput,
  type ConvertMode,
  type MaxHeightOption,
  type VideoOutputFormat
} from "@tinykite/video";
import { deriveOutputName, type JobContext, type OutputAsset } from "@tinykite/core";

export interface ConvertVideoPayload {
  video?: unknown;
  filename?: string;
  mode?: ConvertMode | string;
  format?: VideoOutputFormat | string;
  quality?: number | string;
  maxHeight?: MaxHeightOption | string | number;
  [key: string]: unknown;
}

function parseQuality(value: number | string | undefined): number {
  if (value === undefined || value === "") {
    return 55;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 55;
}

export async function convertVideoTask(
  payload: ConvertVideoPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[]; format: string; sizeBytes: number; usedRemux: boolean }> {
  const { blob, filename } = extractVideoInput(payload);
  const mode = payload.mode === "encode" ? "encode" : "fast";
  const format = payload.format === "webm" ? "webm" : "mp4";
  const quality = parseQuality(payload.quality);
  const maxHeight = payload.maxHeight ?? "720";

  const result = await convertVideo({
    video: blob,
    filename,
    mode,
    format,
    quality,
    maxHeight,
    onProgress: (percent, message) => {
      ctx?.reportProgress?.(percent, message);
    }
  });

  const suffix = result.usedRemux ? "-remuxed" : "-converted";
  const outFileName = deriveOutputName(filename, suffix, result.extension);
  const sizeMb = (result.data.byteLength / (1024 * 1024)).toFixed(2);
  const pathLabel = result.usedRemux ? "remux" : "encode";
  const asset: OutputAsset = {
    id: `converted-video-${Date.now()}`,
    kind: "file",
    label: `${result.format.toUpperCase()} · ${sizeMb} MB · ${pathLabel}`,
    fileName: outFileName,
    mimeType: result.mimeType,
    data: result.data,
    sizeBytes: result.data.byteLength
  };

  return {
    assets: [asset],
    format: result.format,
    sizeBytes: result.data.byteLength,
    usedRemux: result.usedRemux
  };
}
