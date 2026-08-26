import {
  fpsFilter
} from "../../lib/formats.js";
import type { StoryboardLayout } from "./types.js";

export const FRAME_PREFIX = "frame_";
export const FRAME_MIME = "image/jpeg";
export const SEEK_TIMEOUT_MS = 20_000;
export const BULK_TIMEOUT_MS = 120_000;

export function parsePositiveNumber(value: number | string | undefined, fallback: number): number {
  if (value === undefined || value === "") {
    return fallback;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

export function resolveLayout(value: string | undefined): StoryboardLayout {
  if (value === "frames" || value === "both") {
    return value;
  }
  return "contact-sheet";
}

export function parseBool(value: boolean | string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return value === "true" || value === "1" || value === "yes";
}

export function errorMessage(error: unknown): string {
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

export function buildFrameExtractFilter(intervalSeconds: number, maxWidth: number): string {
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
    `${FRAME_PREFIX}%04d.jpg`
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
