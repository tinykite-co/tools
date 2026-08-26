import type { ConvertImageOptions, ImageFormat } from "./types.js";
import { arrayBufferToBase64, parseSvgInfo, renderSvgToContext } from "./helpers.js";

export function convertImagePlaceholder(options: Partial<ConvertImageOptions> = {}): string {
  return `convert placeholder (${options.targetFormat ?? "png"})`;
}

export async function convertImage(options: ConvertImageOptions): Promise<Blob> {
  const { image, targetFormat, quality = 0.9, width, height, backgroundColor } = options;

  let inputBlob: Blob;
  let isSvg = false;
  let svgText = "";

  if (typeof image === "string") {
    svgText = image;
    isSvg = true;
    inputBlob = new Blob([image], { type: "image/svg+xml" });
  } else if (image instanceof Blob) {
    inputBlob = image;
    isSvg = image.type.includes("svg");
  } else {
    inputBlob = new Blob([image as any]);
  }

  if (!isSvg && inputBlob.size < 100000) {
    try {
      const textSample = await inputBlob.text();
      if (textSample.trim().startsWith("<svg") || textSample.includes("<svg")) {
        isSvg = true;
        svgText = textSample;
      }
    } catch {
      // ignore
    }
  }

  if (targetFormat === "svg") {
    if (isSvg) {
      return new Blob([svgText || (await inputBlob.text())], { type: "image/svg+xml" });
    }
    const buf = await inputBlob.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    const mime = inputBlob.type || "image/png";
    const rasterW = width ?? 800;
    const rasterH = height ?? 600;
    const svgWrap = `<svg xmlns="http://www.w3.org/2000/svg" width="${rasterW}" height="${rasterH}" viewBox="0 0 ${rasterW} ${rasterH}"><image href="data:${mime};base64,${b64}" width="${rasterW}" height="${rasterH}"/></svg>`;
    return new Blob([svgWrap], { type: "image/svg+xml" });
  }

  let defaultW = width;
  let defaultH = height;

  if (isSvg) {
    if (!svgText) svgText = await inputBlob.text();
    const info = parseSvgInfo(svgText);
    svgText = info.svg;
    if (!defaultW) defaultW = info.width;
    if (!defaultH) defaultH = info.height;
  }

  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas API not available in current environment");
  }

  const targetW = defaultW ?? 800;
  const targetH = defaultH ?? 600;

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  const isJpeg = targetFormat === "jpeg";
  if (isJpeg || (backgroundColor && backgroundColor !== "transparent")) {
    ctx.fillStyle = backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  if (isSvg) {
    await renderSvgToContext(ctx, svgText, targetW, targetH);
  } else {
    if (typeof createImageBitmap !== "function") {
      throw new Error("ImageBitmap API not available");
    }
    const bitmap = await createImageBitmap(inputBlob);
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  }

  const formatMimeMap: Record<ImageFormat, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml"
  };

  const mime = formatMimeMap[targetFormat] || "image/png";
  return await canvas.convertToBlob({ type: mime, quality });
}
