import type { BinaryData } from "@tinykite/core";

import type { VideoProgressFn } from "../../lib/ffmpeg-loader.js";

export type StoryboardLayout = "contact-sheet" | "frames" | "both";

export interface StoryboardOptions {
  video: BinaryData | Blob;
  filename?: string;
  /** Seconds between frames (e.g. 1 = one frame per second). */
  intervalSeconds?: number | string;
  maxFrames?: number | string;
  /** Max width of each extracted frame before layout. */
  maxWidth?: number | string;
  layout?: StoryboardLayout | string;
  includeTimestamps?: boolean | string;
  onProgress?: VideoProgressFn;
}

export interface StoryboardFrameAsset {
  data: Uint8Array;
  mimeType: string;
  fileName: string;
  label: string;
  timestampSec: number;
  index: number;
}

export interface StoryboardResult {
  frames: StoryboardFrameAsset[];
  sheets: StoryboardFrameAsset[];
  intervalSeconds: number;
  frameCount: number;
}
