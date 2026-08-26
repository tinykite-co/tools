export function parseSvgInfo(svgText: string): { svg: string; width: number; height: number } {
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

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] || 0);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  const globalObj = globalThis as unknown as {
    Buffer?: { from: (s: string, e: string) => { toString: (e: string) => string } };
  };
  if (globalObj.Buffer) {
    return globalObj.Buffer.from(binary, "binary").toString("base64");
  }
  return "";
}

export async function renderSvgToContext(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  svgText: string,
  targetW: number,
  targetH: number
): Promise<void> {
  // 1. Try DOM Image element if in main thread
  if (
    typeof Image !== "undefined" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function"
  ) {
    try {
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          URL.revokeObjectURL(url);
          ctx.drawImage(img, 0, 0, targetW, targetH);
          resolve();
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
      return;
    } catch {
      // Fallback
    }
  }

  // 2. Canvg JS SVG renderer (works in Web Worker)
  try {
    const { Canvg } = await import("canvg");
    const v = await Canvg.from(ctx as any, svgText);
    await v.render();
    return;
  } catch {
    // Fallback
  }

  // 3. createImageBitmap fallback
  if (typeof createImageBitmap === "function") {
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const bitmap = await createImageBitmap(svgBlob);
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    return;
  }

  throw new Error("Could not decode source SVG image");
}
