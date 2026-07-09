import {
  CONTACT_SHEET_CELL_WIDTH,
  CONTACT_SHEET_COLUMNS,
  CONTACT_SHEET_GAP,
  CONTACT_SHEET_LABEL_HEIGHT,
  CONTACT_SHEET_MAX_FRAMES_PER_PAGE,
  formatTimestamp
} from "./formats.js";

export interface StoryboardFrame {
  data: Uint8Array;
  mimeType: string;
  timestampSec: number;
  index: number;
}

export interface ContactSheetPage {
  blob: Blob;
  mimeType: string;
  pageIndex: number;
  frameCount: number;
}

export interface ContactSheetOptions {
  columns?: number;
  cellWidth?: number;
  gap?: number;
  labelHeight?: number;
  maxFramesPerPage?: number;
  includeTimestamps?: boolean;
}

const JPEG_MIME = "image/jpeg";
const JPEG_QUALITY = 0.85;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

/**
 * Layout metrics for a contact sheet page (pure — unit-testable).
 */
export function computeSheetLayout(
  frameCount: number,
  options: ContactSheetOptions = {}
): {
  columns: number;
  rows: number;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  labelHeight: number;
} {
  const columns = options.columns ?? CONTACT_SHEET_COLUMNS;
  const cellWidth = options.cellWidth ?? CONTACT_SHEET_CELL_WIDTH;
  const gap = options.gap ?? CONTACT_SHEET_GAP;
  const labelHeight = options.includeTimestamps === false
    ? 0
    : (options.labelHeight ?? CONTACT_SHEET_LABEL_HEIGHT);
  const cellHeight = Math.round(cellWidth * (9 / 16)) + labelHeight;
  const rows = Math.max(1, Math.ceil(frameCount / columns));
  const width = columns * cellWidth + (columns + 1) * gap;
  const height = rows * cellHeight + (rows + 1) * gap;
  return { columns, rows, width, height, cellWidth, cellHeight, gap, labelHeight };
}

async function decodeFrame(data: Uint8Array, mimeType: string): Promise<ImageBitmap> {
  const blob = new Blob([data as BlobPart], { type: mimeType });
  return createImageBitmap(blob);
}

async function renderPage(
  frames: StoryboardFrame[],
  pageIndex: number,
  options: ContactSheetOptions
): Promise<ContactSheetPage> {
  const includeTimestamps = options.includeTimestamps !== false;
  const layout = computeSheetLayout(frames.length, {
    ...options,
    includeTimestamps
  });

  const canvas = new OffscreenCanvas(layout.width, layout.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas for contact sheet");
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, layout.width, layout.height);

  const imageHeight = layout.cellHeight - layout.labelHeight;

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    if (!frame) continue;

    const col = i % layout.columns;
    const row = Math.floor(i / layout.columns);
    const x = layout.gap + col * (layout.cellWidth + layout.gap);
    const y = layout.gap + row * (layout.cellHeight + layout.gap);

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, layout.cellWidth, layout.cellHeight);

    const bitmap = await decodeFrame(frame.data, frame.mimeType);
    try {
      const scale = Math.min(layout.cellWidth / bitmap.width, imageHeight / bitmap.height);
      const drawW = Math.max(1, Math.round(bitmap.width * scale));
      const drawH = Math.max(1, Math.round(bitmap.height * scale));
      const dx = x + Math.floor((layout.cellWidth - drawW) / 2);
      const dy = y + Math.floor((imageHeight - drawH) / 2);
      ctx.drawImage(bitmap, dx, dy, drawW, drawH);
    } finally {
      bitmap.close();
    }

    if (includeTimestamps) {
      ctx.fillStyle = "#020617";
      ctx.fillRect(x, y + imageHeight, layout.cellWidth, layout.labelHeight);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "14px ui-sans-serif, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(
        formatTimestamp(frame.timestampSec),
        x + 8,
        y + imageHeight + layout.labelHeight / 2
      );
    }
  }

  const blob = await canvas.convertToBlob({ type: JPEG_MIME, quality: JPEG_QUALITY });
  return {
    blob,
    mimeType: JPEG_MIME,
    pageIndex,
    frameCount: frames.length
  };
}

/**
 * Build one or more contact-sheet JPEGs from extracted frames.
 */
export async function buildContactSheets(
  frames: StoryboardFrame[],
  options: ContactSheetOptions = {}
): Promise<ContactSheetPage[]> {
  if (frames.length === 0) {
    return [];
  }

  const perPage = options.maxFramesPerPage ?? CONTACT_SHEET_MAX_FRAMES_PER_PAGE;
  const pages = chunk(frames, perPage);
  const sheets: ContactSheetPage[] = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageFrames = pages[pageIndex] ?? [];
    sheets.push(await renderPage(pageFrames, pageIndex, options));
  }

  return sheets;
}
