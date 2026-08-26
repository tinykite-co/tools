import { ProcessingError, ValidationError } from "@tinykite/core";
import { fetchFile } from "@ffmpeg/util";

import {
  DEFAULT_CONVERT_MODE,
  DEFAULT_CONVERT_QUALITY,
  DEFAULT_MAX_HEIGHT,
  OUTPUT_EXTENSION,
  OUTPUT_MIME,
  inputVirtualName,
  parseMaxHeight
} from "../../lib/formats.js";
import {
  attachProgress,
  deleteIfExists,
  getFFmpeg,
  readOutputFile,
  writeInputFile
} from "../../lib/ffmpeg-loader.js";
import {
  buildConvertArgs,
  buildRemuxArgs,
  resolveFormat,
  resolveMode
} from "./args.js";
import type { ConvertVideoOptions, ConvertVideoResult } from "./types.js";

export { buildConvertArgs, buildRemuxArgs, resolveFormat, resolveMode };

const REMUX_TIMEOUT_MS = 120_000;
const ENCODE_TIMEOUT_MS = 600_000;

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
  onProgress?.(18, "Opening your video…");

  const inputData = await fetchFile(video instanceof Blob ? video : new Blob([video as BlobPart]));
  await deleteIfExists(ffmpeg, inputName);
  await deleteIfExists(ffmpeg, outputName);
  await writeInputFile(ffmpeg, inputName, inputData);

  let usedRemux = false;

  if (mode === "fast" && format === "mp4") {
    onProgress?.(22, "Shaping it…");
    const detach = attachProgress(ffmpeg, onProgress, 22, 90, "Shaping it…");
    try {
      const code = await ffmpeg.exec(buildRemuxArgs(inputName, outputName), REMUX_TIMEOUT_MS);
      if (code === 0) {
        const data = await readOutputFile(ffmpeg, outputName);
        if (data.byteLength > 0) {
          usedRemux = true;
          await deleteIfExists(ffmpeg, inputName);
          await deleteIfExists(ffmpeg, outputName);
          onProgress?.(100, "Yours.");
          return { data, mimeType, extension, format, usedRemux };
        }
      }
    } catch {
      // Fall through to re-encode
    } finally {
      detach();
      await deleteIfExists(ffmpeg, outputName);
    }
    onProgress?.(28, "Taking the scenic route…");
  }

  onProgress?.(30, "Shaping it…");
  const detach = attachProgress(ffmpeg, onProgress, 30, 90, "Shaping it…");

  try {
    const args = buildConvertArgs({
      inputName,
      outputName,
      format,
      quality: encodeQuality,
      maxHeight
    });
    const code = await ffmpeg.exec(args, ENCODE_TIMEOUT_MS);
    if (code !== 0) {
      throw new ProcessingError(
        "This one didn’t work out. Try another file, or choose “I want control”."
      );
    }
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }
    throw new ProcessingError("Something went sideways. Give it another try.");
  } finally {
    detach();
  }

  onProgress?.(92, "Almost…");
  const data = await readOutputFile(ffmpeg, outputName);
  await deleteIfExists(ffmpeg, inputName);
  await deleteIfExists(ffmpeg, outputName);
  onProgress?.(100, "Yours.");

  if (data.byteLength === 0) {
    throw new ProcessingError("That finished empty. Try once more.");
  }

  return { data, mimeType, extension, format, usedRemux };
}
