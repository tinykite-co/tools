import {
  qualityToCrf,
  type ConvertMode,
  type VideoOutputFormat
} from "../../lib/formats.js";

export function resolveFormat(value: string | undefined): VideoOutputFormat {
  if (value === "webm") {
    return "webm";
  }
  return "mp4";
}

export function resolveMode(value: string | undefined): ConvertMode {
  if (value === "encode") {
    return "encode";
  }
  return "fast";
}

export function scaleFilter(maxHeight: number | null): string | null {
  if (maxHeight == null) {
    return null;
  }
  return `scale=-2:min(${maxHeight}\\,ih)`;
}

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
