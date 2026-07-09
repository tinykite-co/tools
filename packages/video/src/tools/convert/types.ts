import type { BinaryData } from "@tinykite/core";

import type { ConvertMode, MaxHeightOption, VideoOutputFormat } from "../../lib/formats.js";
import type { VideoProgressFn } from "../../lib/ffmpeg-loader.js";

export interface ConvertVideoOptions {
  video: BinaryData | Blob;
  filename?: string;
  format?: VideoOutputFormat | string;
  /**
   * `fast` — remux (stream copy) when possible, else light re-encode.
   * `encode` — always re-encode with quality / max height.
   */
  mode?: ConvertMode | string;
  /** 1–100, higher = better quality / larger file (encode mode only) */
  quality?: number;
  maxHeight?: MaxHeightOption | string | number;
  onProgress?: VideoProgressFn;
}

export interface ConvertVideoResult {
  data: Uint8Array;
  mimeType: string;
  extension: string;
  format: VideoOutputFormat;
  /** Whether output used stream copy (remux) vs full re-encode. */
  usedRemux: boolean;
}
