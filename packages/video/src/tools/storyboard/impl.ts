import { ProcessingError, ValidationError } from "@tinykite/core";
import { fetchFile } from "@ffmpeg/util";

import { buildContactSheets, type StoryboardFrame } from "../../lib/contact-sheet.js";
import {
  CONTACT_SHEET_MAX_FRAMES_PER_PAGE,
  DEFAULT_FRAME_INTERVAL_SEC,
  DEFAULT_FRAME_MAX_WIDTH,
  DEFAULT_MAX_FRAMES,
  formatTimestamp,
  inputVirtualName
} from "../../lib/formats.js";
import {
  deleteIfExists,
  getFFmpeg,
  listFrameFiles,
  writeInputFile
} from "../../lib/ffmpeg-loader.js";
import {
  cleanupNamed,
  extractViaFps,
  extractViaSeek
} from "./extractors.js";
export { buildStoryboardArgs } from "./helpers.js";
import {
  FRAME_PREFIX,
  parseBool,
  parsePositiveNumber,
  resolveLayout
} from "./helpers.js";
import type {
  StoryboardFrameAsset,
  StoryboardOptions,
  StoryboardResult
} from "./types.js";

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
      fileName: pages.length > 1 ? `storyboard-${page.pageIndex + 1}.jpg` : "storyboard.jpg",
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
      rawFrames = await extractViaFps(ffmpeg, inputName, intervalSeconds, maxFrames, maxWidth);
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
      throw new ProcessingError("We couldn’t pull stills from this file. Try a different clip.");
    }

    const frameAssets = toFrameAssets(rawFrames);
    const sheets: StoryboardFrameAsset[] = [];

    if (layout === "contact-sheet" || layout === "both") {
      onProgress?.(85, "Laying out the story…");
      try {
        const canvasSheets = await sheetsFromCanvas(rawFrames, includeTimestamps);
        sheets.push(...canvasSheets);
      } catch {
        // Canvas unavailable
      }
    }

    const returnFrames =
      layout === "frames" || layout === "both" || sheets.length === 0 ? frameAssets : [];

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
