import type { BinaryData } from "@tinykite/core";

import type { MaxHeightOption, VideoOutputFormat } from "../../lib/formats.js";
import type { VideoProgressFn } from "../../lib/ffmpeg-loader.js";

export interface ConvertVideoOptions {
  video: BinaryData | Blob;
  filename?: string;
  format?: VideoOutputFormat | string;
  /** 1–100, higher = better quality / larger file */
  quality?: number;
  maxHeight?: MaxHeightOption | string | number;
  onProgress?: VideoProgressFn;
}

export interface ConvertVideoResult {
  data: Uint8Array;
  mimeType: string;
  extension: string;
  format: VideoOutputFormat;
}
