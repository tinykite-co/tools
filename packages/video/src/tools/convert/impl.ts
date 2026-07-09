import { ProcessingError, ValidationError } from "@tinykite/core";
import { fetchFile } from "@ffmpeg/util";

import {
  DEFAULT_CONVERT_MODE,
  DEFAULT_CONVERT_QUALITY,
  DEFAULT_MAX_HEIGHT,
  OUTPUT_EXTENSION,
  OUTPUT_MIME,
  inputVirtualName,
  parseMaxHeight,
  qualityToCrf,
  type ConvertMode,
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

const REMUX_TIMEOUT_MS = 120_000;
const ENCODE_TIMEOUT_MS = 600_000;

function resolveFormat(value: string | undefined): VideoOutputFormat {
  if (value === "webm") {
    return "webm";
  }
  return "mp4";
}

function resolveMode(value: string | undefined): ConvertMode {
  if (value === "encode") {
    return "encode";
  }
  return "fast";
}

function scaleFilter(maxHeight: number | null): string | null {
  if (maxHeight == null) {
    return null;
  }
  // Even dimensions help most encoders; only downscale when taller than cap.
  return `scale=-2:min(${maxHeight}\\,ih)`;
}

/** Stream-copy remux — fastest path (no decode/encode). MP4 only. */
export function buildRemuxArgs(inputName: string, outputName: string): string[] {
  return [
    "-i",
    inputName,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    "-y",
    outputName
  ];
}

/**
 * Re-encode args tuned for browser WASM speed:
 * - libx264 ultrafast (VP9 is much slower — avoid unless requested)
 * - copy audio when possible (skips audio encode)
 * - optional downscale
 */
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
    // VP9 is slow in WASM — only when user explicitly picks WebM.
    args.push(
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      crf,
      "-cpu-used",
      "8",
      "-row-mt",
      "1",
      "-c:a",
      "libopus",
      "-b:a",
      "96k"
    );
  } else {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "fastdecode",
      "-crf",
      crf,
      "-pix_fmt",
      "yuv420p",
      // Copy audio when the source is already AAC/compatible; falls back if copy fails at exec time.
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-ac",
      "2",
      "-movflags",
      "+faststart"
    );
  }

  args.push("-y", options.outputName);
  return args;
}

async function runExec(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  args: string[],
  timeoutMs: number
): Promise<number> {
  return ffmpeg.exec(args, timeoutMs);
}

export async function convertVideo(options: ConvertVideoOptions): Promise<ConvertVideoResult> {
  const {
    video,
    filename = "video.mp4",
    format: formatRaw = "mp4",
    mode: modeRaw = DEFAULT_CONVERT_MODE,
    quality = DEFAULT_CONVERT_QUALITY,
    maxHeight: maxHeightRaw = DEFAULT_MAX_HEIGHT,
    onProgress
  } = options;

  if (!video) {
    throw new ValidationError("Video file is required.");
  }

  const mode = resolveMode(String(modeRaw));
  let format = resolveFormat(String(formatRaw));
  // Remux only makes sense for MP4; force MP4 in fast mode.
  if (mode === "fast") {
    format = "mp4";
  }

  const maxHeight =
    mode === "fast"
      ? parseMaxHeight(DEFAULT_MAX_HEIGHT)
      : parseMaxHeight(maxHeightRaw);
  const encodeQuality =
    mode === "fast" ? DEFAULT_CONVERT_QUALITY : Number(quality) || DEFAULT_CONVERT_QUALITY;

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

  let usedRemux = false;

  if (mode === "fast" && format === "mp4") {
    onProgress?.(22, "Fast remux (stream copy)...");
    const detach = attachProgress(ffmpeg, onProgress, 22, 90, "Remuxing...");
    try {
      const code = await runExec(ffmpeg, buildRemuxArgs(inputName, outputName), REMUX_TIMEOUT_MS);
      if (code === 0) {
        const data = await readOutputFile(ffmpeg, outputName);
        if (data.byteLength > 0) {
          usedRemux = true;
          await deleteIfExists(ffmpeg, inputName);
          await deleteIfExists(ffmpeg, outputName);
          onProgress?.(100, "Done (remux)");
          return { data, mimeType, extension, format, usedRemux };
        }
      }
    } catch {
      // Fall through to re-encode
    } finally {
      detach();
      await deleteIfExists(ffmpeg, outputName);
    }
    onProgress?.(28, "Remux not possible — light re-encode...");
  }

  onProgress?.(30, `Encoding ${format.toUpperCase()} (ultrafast)...`);
  const detach = attachProgress(
    ffmpeg,
    onProgress,
    30,
    90,
    `Encoding ${format.toUpperCase()}...`
  );

  try {
    const args = buildConvertArgs({
      inputName,
      outputName,
      format,
      quality: encodeQuality,
      maxHeight
    });
    const code = await runExec(ffmpeg, args, ENCODE_TIMEOUT_MS);
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

  return { data, mimeType, extension, format, usedRemux };
}
