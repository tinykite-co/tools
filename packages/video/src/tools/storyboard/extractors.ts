import { ProcessingError } from "@tinykite/core";
import { type StoryboardFrame } from "../../lib/contact-sheet.js";
import {
  deleteIfExists,
  getFFmpeg,
  listFrameFiles,
  readOutputFile
} from "../../lib/ffmpeg-loader.js";
import {
  BULK_TIMEOUT_MS,
  FRAME_MIME,
  FRAME_PREFIX,
  SEEK_TIMEOUT_MS,
  buildSeekFrameArgs,
  buildStoryboardArgs
} from "./helpers.js";
import type { StoryboardOptions } from "./types.js";

export async function cleanupNamed(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  names: string[]
): Promise<void> {
  for (const name of names) {
    await deleteIfExists(ffmpeg, name);
  }
}

export async function readFramesFromFs(
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

export async function extractViaFps(
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

export async function extractViaSeek(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  inputName: string,
  intervalSeconds: number,
  maxFrames: number,
  maxWidth: number,
  onProgress?: StoryboardOptions["onProgress"]
): Promise<StoryboardFrame[]> {
  const rawFrames: StoryboardFrame[] = [];
  const attempts = Math.min(maxFrames, 30);

  for (let i = 0; i < attempts; i += 1) {
    const timestampSec = i * intervalSeconds;
    const outputName = `frame_${String(i + 1).padStart(4, "0")}.jpg`;
    onProgress?.(30 + Math.round((i / attempts) * 50), `Moment ${i + 1}…`);

    try {
      const code = await ffmpeg.exec(
        buildSeekFrameArgs({ inputName, timestampSec, maxWidth, outputName }),
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
