import { ProcessingError, ValidationError } from "@tinykite/core";
import { fetchFile } from "@ffmpeg/util";

import { buildContactSheets, type StoryboardFrame } from "../../lib/contact-sheet.js";
import {
  CONTACT_SHEET_MAX_FRAMES_PER_PAGE,
  DEFAULT_FRAME_INTERVAL_SEC,
  DEFAULT_FRAME_MAX_WIDTH,
  DEFAULT_MAX_FRAMES,
  formatTimestamp,
  fpsFilter,
  inputVirtualName
} from "../../lib/formats.js";
import {
  deleteIfExists,
  getFFmpeg,
  listFrameFiles,
  readOutputFile,
  writeInputFile
} from "../../lib/ffmpeg-loader.js";
import type {
  StoryboardFrameAsset,
  StoryboardLayout,
  StoryboardOptions,
  StoryboardResult
} from "./types.js";

const FRAME_PREFIX = "frame_";
const FRAME_MIME = "image/jpeg";
/** Per-command timeout — keep short so seek past EOF fails fast. */
const SEEK_TIMEOUT_MS = 20_000;
const BULK_TIMEOUT_MS = 120_000;

function parsePositiveNumber(value: number | string | undefined, fallback: number): number {
  if (value === undefined || value === "") {
    return fallback;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

function resolveLayout(value: string | undefined): StoryboardLayout {
  if (value === "frames" || value === "both") {
    return value;
  }
  return "contact-sheet";
}

function parseBool(value: boolean | string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return value === "true" || value === "1" || value === "yes";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error) {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg) {
      return msg;
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Storyboard processing failed";
  }
}

/** Pure helper for bulk fps extraction filter. */
export function buildFrameExtractFilter(intervalSeconds: number, maxWidth: number): string {
  // Keep the graph simple — no escaped commas needed when only using fps + fixed scale.
  const width = Math.max(64, Math.round(maxWidth));
  return `${fpsFilter(intervalSeconds)},scale=${width}:-2`;
}

export function buildStoryboardArgs(options: {
  inputName: string;
  intervalSeconds: number;
  maxFrames: number;
  maxWidth: number;
}): string[] {
  return [
    "-i",
    options.inputName,
    "-vf",
    buildFrameExtractFilter(options.intervalSeconds, options.maxWidth),
    "-frames:v",
    String(options.maxFrames),
    "-q:v",
    "3",
    "-y",
    "frame_%04d.jpg"
  ];
}

export function buildSeekFrameArgs(options: {
  inputName: string;
  timestampSec: number;
  maxWidth: number;
  outputName: string;
}): string[] {
  const width = Math.max(64, Math.round(options.maxWidth));
  return [
    "-ss",
    options.timestampSec.toFixed(3),
    "-i",
    options.inputName,
    "-frames:v",
    "1",
    "-vf",
    `scale=${width}:-2`,
    "-q:v",
    "3",
    "-y",
    options.outputName
  ];
}

async function cleanupNamed(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  names: string[]
): Promise<void> {
  for (const name of names) {
    await deleteIfExists(ffmpeg, name);
  }
}

async function readFramesFromFs(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  intervalSeconds: number
): Promise<StoryboardFrame[]> {
  const frameNames = await listFrameFiles(ffmpeg, FRAME_PREFIX);
  const rawFrames: StoryboardFrame[] = [];
  for (let i = 0; i < frameNames.length; i += 1) {
    const name = frameNames[i];
    if (!name) continue;
    try {
      const data = await readOutputFile(ffmpeg, name);
      if (data.byteLength === 0) continue;
      rawFrames.push({
        data,
        mimeType: FRAME_MIME,
        timestampSec: i * intervalSeconds,
        index: rawFrames.length
      });
    } catch {
      // skip unreadable
    }
  }
  await cleanupNamed(ffmpeg, frameNames);
  return rawFrames;
}

async function extractViaFps(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  inputName: string,
  intervalSeconds: number,
  maxFrames: number,
  maxWidth: number
): Promise<StoryboardFrame[]> {
  const args = buildStoryboardArgs({
    inputName,
    intervalSeconds,
    maxFrames,
    maxWidth
  });
  const code = await ffmpeg.exec(args, BULK_TIMEOUT_MS);
  if (code !== 0) {
    throw new ProcessingError("Could not extract frames from this video.");
  }
  return readFramesFromFs(ffmpeg, intervalSeconds);
}

async function extractViaSeek(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  inputName: string,
  intervalSeconds: number,
  maxFrames: number,
  maxWidth: number,
  onProgress?: StoryboardOptions["onProgress"]
): Promise<StoryboardFrame[]> {
  const rawFrames: StoryboardFrame[] = [];
  // Cap seek attempts — short clips finish early via empty/failed reads.
  const attempts = Math.min(maxFrames, 30);

  for (let i = 0; i < attempts; i += 1) {
    const timestampSec = i * intervalSeconds;
    const outputName = `frame_${String(i + 1).padStart(4, "0")}.jpg`;
    onProgress?.(
      30 + Math.round((i / attempts) * 50),
      `Moment ${i + 1}…`
    );

    try {
      const code = await ffmpeg.exec(
        buildSeekFrameArgs({
          inputName,
          timestampSec,
          maxWidth,
          outputName
        }),
        SEEK_TIMEOUT_MS
      );
      if (code !== 0) {
        await deleteIfExists(ffmpeg, outputName);
        break;
      }
      const data = await readOutputFile(ffmpeg, outputName);
      await deleteIfExists(ffmpeg, outputName);
      if (data.byteLength < 32) {
        break;
      }
      rawFrames.push({
        data,
        mimeType: FRAME_MIME,
        timestampSec,
        index: rawFrames.length
      });
    } catch {
      await deleteIfExists(ffmpeg, outputName);
      break;
    }
  }
  return rawFrames;
}

async function sheetsFromCanvas(
  rawFrames: StoryboardFrame[],
  includeTimestamps: boolean
): Promise<StoryboardFrameAsset[]> {
  const pages = await buildContactSheets(rawFrames, { includeTimestamps });
  const assets: StoryboardFrameAsset[] = [];
  for (const page of pages) {
    const data = new Uint8Array(await page.blob.arrayBuffer());
    assets.push({
      data,
      mimeType: page.mimeType,
      fileName:
        pages.length > 1 ? `storyboard-${page.pageIndex + 1}.jpg` : "storyboard.jpg",
      label:
        pages.length > 1
          ? `Storyboard page ${page.pageIndex + 1} (${page.frameCount} frames)`
          : `Storyboard (${page.frameCount} frames)`,
      timestampSec: 0,
      index: page.pageIndex
    });
  }
  return assets;
}

function toFrameAssets(rawFrames: StoryboardFrame[]): StoryboardFrameAsset[] {
  return rawFrames.map((frame) => ({
    data: frame.data,
    mimeType: frame.mimeType,
    fileName: `frame-${String(frame.index + 1).padStart(4, "0")}-at-${formatTimestamp(frame.timestampSec).replace(/:/g, "-")}.jpg`,
    label: `Frame ${frame.index + 1} @ ${formatTimestamp(frame.timestampSec)}`,
    timestampSec: frame.timestampSec,
    index: frame.index
  }));
}

export async function extractStoryboard(options: StoryboardOptions): Promise<StoryboardResult> {
  const {
    video,
    filename = "video.mp4",
    intervalSeconds: intervalRaw,
    maxFrames: maxFramesRaw,
    maxWidth: maxWidthRaw,
    layout: layoutRaw = "contact-sheet",
    includeTimestamps: timestampsRaw = true,
    onProgress
  } = options;

  if (!video) {
    throw new ValidationError("Video file is required.");
  }

  const intervalSeconds = parsePositiveNumber(intervalRaw, DEFAULT_FRAME_INTERVAL_SEC);
  const maxFrames = Math.min(
    CONTACT_SHEET_MAX_FRAMES_PER_PAGE * 4,
    Math.round(parsePositiveNumber(maxFramesRaw, DEFAULT_MAX_FRAMES))
  );
  const maxWidth = Math.round(parsePositiveNumber(maxWidthRaw, DEFAULT_FRAME_MAX_WIDTH));
  const layout = resolveLayout(String(layoutRaw));
  const includeTimestamps = parseBool(timestampsRaw, true);
  const inputName = inputVirtualName(filename);

  try {
    const ffmpeg = await getFFmpeg(onProgress);
    onProgress?.(18, "Opening your video…");

    const inputData = await fetchFile(
      video instanceof Blob ? video : new Blob([video as BlobPart])
    );
    await deleteIfExists(ffmpeg, inputName);
    const stale = await listFrameFiles(ffmpeg, FRAME_PREFIX);
    await cleanupNamed(ffmpeg, stale);
    await writeInputFile(ffmpeg, inputName, inputData);

    onProgress?.(25, "Finding the moments…");

    let rawFrames: StoryboardFrame[] = [];
    try {
      rawFrames = await extractViaFps(
        ffmpeg,
        inputName,
        intervalSeconds,
        maxFrames,
        maxWidth
      );
    } catch {
      onProgress?.(28, "Looking closer…");
      rawFrames = await extractViaSeek(
        ffmpeg,
        inputName,
        intervalSeconds,
        maxFrames,
        maxWidth,
        onProgress
      );
    }

    await deleteIfExists(ffmpeg, inputName);

    if (rawFrames.length === 0) {
      throw new ProcessingError(
        "We couldn’t pull stills from this file. Try a different clip."
      );
    }

    const frameAssets = toFrameAssets(rawFrames);
    const sheets: StoryboardFrameAsset[] = [];

    if (layout === "contact-sheet" || layout === "both") {
      onProgress?.(85, "Laying out the story…");
      try {
        const canvasSheets = await sheetsFromCanvas(rawFrames, includeTimestamps);
        sheets.push(...canvasSheets);
      } catch {
        // Canvas unavailable — individual frames still returned below.
      }
    }

    const returnFrames =
      layout === "frames" || layout === "both" || sheets.length === 0
        ? frameAssets
        : [];

    onProgress?.(100, "Yours.");
    return {
      frames: returnFrames,
      sheets,
      intervalSeconds,
      frameCount: rawFrames.length
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ProcessingError) {
      throw error;
    }
    throw new ProcessingError("Something got in the way. Try once more.");
  }
}
