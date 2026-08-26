import type { ConvertImageOptions, ImageFormat } from "./types.js";

export function convertImagePlaceholder(options: Partial<ConvertImageOptions> = {}): string {
  return `convert placeholder (${options.targetFormat ?? "png"})`;
}

function parseSvgInfo(svgText: string): { svg: string; width: number; height: number } {
  let width: number | undefined;
  let height: number | undefined;

  const wMatch = svgText.match(/<svg[^>]*\bwidth=["']?([\d.]+)(px)?["']?/i);
  const hMatch = svgText.match(/<svg[^>]*\bheight=["']?([\d.]+)(px)?["']?/i);

  if (wMatch && wMatch[1]) width = parseFloat(wMatch[1]);
  if (hMatch && hMatch[1]) height = parseFloat(hMatch[1]);

  const vbMatch = svgText.match(/viewBox=["']?([^"']+)["']?/i);
  if ((!width || !height) && vbMatch && vbMatch[1]) {
    const parts = vbMatch[1].trim().split(/[\s,]+/);
    if (parts.length >= 4 && parts[2] && parts[3]) {
      const vbW = parseFloat(parts[2]);
      const vbH = parseFloat(parts[3]);
      if (!isNaN(vbW) && !isNaN(vbH) && vbW > 0 && vbH > 0) {
        if (!width) width = vbW;
        if (!height) height = vbH;
      }
    }
  }

  const finalW = width && width > 0 ? width : 800;
  const finalH = height && height > 0 ? height : 600;

  let fixedSvg = svgText;
  if (!wMatch || !hMatch) {
    fixedSvg = svgText.replace(/<svg\b([^>]*)>/i, (match, p1) => {
      let attrs = p1;
      if (!wMatch) attrs += ` width="${finalW}"`;
      if (!hMatch) attrs += ` height="${finalH}"`;
      return `<svg${attrs}>`;
    });
  }

  return { svg: fixedSvg, width: finalW, height: finalH };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] || 0);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  const globalObj = globalThis as unknown as { Buffer?: { from: (s: string, e: string) => { toString: (e: string) => string } } };
  if (globalObj.Buffer) {
    return globalObj.Buffer.from(binary, "binary").toString("base64");
  }
  return "";
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
      // ignore non-text blob error
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

  let finalBlob = inputBlob;
  let defaultW = width;
  let defaultH = height;

  if (isSvg) {
    if (!svgText) svgText = await inputBlob.text();
    const info = parseSvgInfo(svgText);
    finalBlob = new Blob([info.svg], { type: "image/svg+xml" });
    if (!defaultW) defaultW = info.width;
    if (!defaultH) defaultH = info.height;
  }

  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas/ImageBitmap API not available in current environment");
  }

  const bitmap = await createImageBitmap(finalBlob);
  const targetW = defaultW ?? bitmap.width;
  const targetH = defaultH ?? bitmap.height;

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  const isJpeg = targetFormat === "jpeg";
  if (isJpeg || (backgroundColor && backgroundColor !== "transparent")) {
    ctx.fillStyle = backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const formatMimeMap: Record<ImageFormat, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml"
  };

  const mime = formatMimeMap[targetFormat] || "image/png";
  return await canvas.convertToBlob({ type: mime, quality });
}
