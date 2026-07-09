import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

import { FFMPEG_CORE_BASE_URL } from "./formats.js";

export type VideoProgressFn = (percent: number, message?: string) => void;

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Lazily load a shared single-thread ffmpeg.wasm instance.
 * First call downloads ~31MB core from the CDN (cached by the browser).
 */
export async function getFFmpeg(onProgress?: VideoProgressFn): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      onProgress?.(5, "Preparing… (first run may take a moment)");

      const baseURL = FFMPEG_CORE_BASE_URL;
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm");

      await ffmpeg.load({ coreURL, wasmURL });
      ffmpegInstance = ffmpeg;
      onProgress?.(15, "Ready");
      return ffmpeg;
    })().catch(() => {
      loadPromise = null;
      ffmpegInstance = null;
      throw new Error(
        "Could not prepare video processing. Check your connection and try again."
      );
    });
  }

  return loadPromise;
}

export async function writeInputFile(
  ffmpeg: FFmpeg,
  virtualName: string,
  data: Uint8Array
): Promise<void> {
  await ffmpeg.writeFile(virtualName, data);
}

export async function readOutputFile(ffmpeg: FFmpeg, virtualName: string): Promise<Uint8Array> {
  const data = await ffmpeg.readFile(virtualName);
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data as Uint8Array;
}

export async function deleteIfExists(ffmpeg: FFmpeg, virtualName: string): Promise<void> {
  try {
    await ffmpeg.deleteFile(virtualName);
  } catch {
    // ignore missing files
  }
}

export async function listFrameFiles(ffmpeg: FFmpeg, prefix: string): Promise<string[]> {
  const entries = await ffmpeg.listDir("/");
  return entries
    .filter((entry) => !entry.isDir && entry.name.startsWith(prefix))
    .map((entry) => entry.name)
    .sort();
}

export function attachProgress(
  ffmpeg: FFmpeg,
  onProgress: VideoProgressFn | undefined,
  startPercent: number,
  endPercent: number,
  message: string
): () => void {
  if (!onProgress) {
    return () => undefined;
  }

  const handler = ({ progress }: { progress: number }) => {
    const clamped = Math.min(1, Math.max(0, progress));
    const percent = Math.round(startPercent + clamped * (endPercent - startPercent));
    onProgress(percent, message);
  };

  ffmpeg.on("progress", handler);
  return () => {
    ffmpeg.off("progress", handler);
  };
}
