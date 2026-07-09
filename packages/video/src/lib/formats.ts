/** Accepted browser file picker extensions / MIME hints for video tools. */
export const VIDEO_ACCEPT =
  "video/*,.mov,.mp4,.m4v,.webm,.mkv,.avi,.wmv,.flv,.3gp,.ts,.mts,.m2ts,.ogv,.mpeg,.mpg";

export const FFMPEG_CORE_VERSION = "0.12.10";

/** jsDelivr ESM core (single-thread — no SharedArrayBuffer / COOP+COEP required). */
export const FFMPEG_CORE_BASE_URL =
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

export type VideoOutputFormat = "mp4" | "webm";

/** Convert path: remux is orders of magnitude faster in browser WASM. */
export type ConvertMode = "fast" | "encode";

export const OUTPUT_MIME: Record<VideoOutputFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm"
};

export const OUTPUT_EXTENSION: Record<VideoOutputFormat, string> = {
  mp4: "mp4",
  webm: "webm"
};

export type MaxHeightOption = "original" | "1080" | "720" | "480";

/** Prefer speed over quality for browser-side encode. */
export const DEFAULT_CONVERT_QUALITY = 55;
export const DEFAULT_CONVERT_MODE: ConvertMode = "fast";
export const DEFAULT_MAX_HEIGHT: MaxHeightOption = "720";

/** Storyboard defaults tuned for speed + useful overview. */
export const DEFAULT_FRAME_INTERVAL_SEC = 2;
export const DEFAULT_MAX_FRAMES = 30;
export const DEFAULT_FRAME_MAX_WIDTH = 640;
export const CONTACT_SHEET_COLUMNS = 4;
export const CONTACT_SHEET_CELL_WIDTH = 320;
export const CONTACT_SHEET_GAP = 8;
export const CONTACT_SHEET_LABEL_HEIGHT = 28;
export const CONTACT_SHEET_MAX_FRAMES_PER_PAGE = 24;
export const MIN_QUALITY = 1;
export const MAX_QUALITY = 100;
export const MIN_CRF = 18;
export const MAX_CRF = 36;

/**
 * Map UI quality (1–100, higher = better) to x264/libvpx CRF (lower = better).
 */
export function qualityToCrf(quality: number): number {
  const clamped = Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, Math.round(quality)));
  const t = (clamped - MIN_QUALITY) / (MAX_QUALITY - MIN_QUALITY);
  return Math.round(MAX_CRF - t * (MAX_CRF - MIN_CRF));
}

export function extensionFromFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) {
    return "mp4";
  }
  return filename.slice(dot + 1).toLowerCase();
}

export function inputVirtualName(filename: string): string {
  const ext = extensionFromFilename(filename);
  return `input.${ext || "mp4"}`;
}

export function parseMaxHeight(value: MaxHeightOption | string | number | undefined): number | null {
  if (value === undefined || value === "original" || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.round(n);
}

export function fpsFilter(intervalSeconds: number): string {
  const interval = Math.max(0.1, intervalSeconds);
  // 1 frame every N seconds → fps = 1/N
  return `fps=1/${interval}`;
}

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
