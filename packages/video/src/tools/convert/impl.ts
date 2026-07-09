import { ProcessingError, ValidationError } from "@tinykite/core";
import { fetchFile } from "@ffmpeg/util";

import {
  DEFAULT_CONVERT_QUALITY,
  OUTPUT_EXTENSION,
  OUTPUT_MIME,
  inputVirtualName,
  parseMaxHeight,
  qualityToCrf,
  type VideoOutputFormat
} from "../../lib/formats.js";
import {
  attachProgress,
  deleteIfExists,
  getFFmpeg,
  readOutputFile,
  writeInputFile
} from "../../lib/ffmpeg-loader.js";
import type { ConvertVideoOptions, ConvertVideoResult } from "./types.js";

function resolveFormat(value: string | undefined): VideoOutputFormat {
  if (value === "webm") {
    return "webm";
  }
  return "mp4";
}

function scaleFilter(maxHeight: number | null): string | null {
  if (maxHeight == null) {
    return null;
  }
  // Even dimensions help most encoders; only downscale when taller than cap.
  // Escape commas for ffmpeg filtergraph (no shell quoting in wasm exec argv).
  return `scale=-2:min(${maxHeight}\\,ih)`;
}

export function buildConvertArgs(options: {
  inputName: string;
  outputName: string;
  format: VideoOutputFormat;
  quality: number;
  maxHeight: number | null;
}): string[] {
  const crf = String(qualityToCrf(options.quality));
  const vf = scaleFilter(options.maxHeight);
  const args = ["-i", options.inputName];

  if (vf) {
    args.push("-vf", vf);
  }

  if (options.format === "webm") {
    args.push(
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      crf,
      "-c:a",
      "libopus",
      "-b:a",
      "128k"
    );
  } else {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      crf,
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart"
    );
  }

  args.push("-y", options.outputName);
  return args;
}

export async function convertVideo(options: ConvertVideoOptions): Promise<ConvertVideoResult> {
  const {
    video,
    filename = "video.mp4",
    format: formatRaw = "mp4",
    quality = DEFAULT_CONVERT_QUALITY,
    maxHeight: maxHeightRaw,
    onProgress
  } = options;

  if (!video) {
    throw new ValidationError("Video file is required.");
  }

  const format = resolveFormat(String(formatRaw));
  const maxHeight = parseMaxHeight(maxHeightRaw);
  const extension = OUTPUT_EXTENSION[format];
  const mimeType = OUTPUT_MIME[format];
  const inputName = inputVirtualName(filename);
  const outputName = `output.${extension}`;

  const ffmpeg = await getFFmpeg(onProgress);
  onProgress?.(18, "Reading video...");

  const inputData = await fetchFile(video instanceof Blob ? video : new Blob([video as BlobPart]));
  await deleteIfExists(ffmpeg, inputName);
  await deleteIfExists(ffmpeg, outputName);
  await writeInputFile(ffmpeg, inputName, inputData);

  onProgress?.(22, `Converting to ${format.toUpperCase()}...`);
  const detach = attachProgress(ffmpeg, onProgress, 22, 90, `Converting to ${format.toUpperCase()}...`);

  try {
    const args = buildConvertArgs({
      inputName,
      outputName,
      format,
      quality: Number(quality) || DEFAULT_CONVERT_QUALITY,
      maxHeight
    });
    // 10 minute safety timeout for large files / slow devices
    const code = await ffmpeg.exec(args, 600_000);
    if (code !== 0) {
      throw new ProcessingError(
        `Video conversion failed (ffmpeg exit ${code}). The codec may be unsupported in the browser engine — try an H.264 MP4/MOV source.`
      );
    }
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Video conversion failed";
    throw new ProcessingError(message);
  } finally {
    detach();
  }

  onProgress?.(92, "Reading output...");
  const data = await readOutputFile(ffmpeg, outputName);
  await deleteIfExists(ffmpeg, inputName);
  await deleteIfExists(ffmpeg, outputName);
  onProgress?.(100, "Done");

  if (data.byteLength === 0) {
    throw new ProcessingError("Conversion produced an empty file.");
  }

  return { data, mimeType, extension, format };
}
