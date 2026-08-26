import { describe, expect, it } from "vitest";
import { convertImagePlaceholder, convertImage } from "../src";

describe("convertImage", () => {
  it("returns a placeholder message", () => {
    expect(convertImagePlaceholder({ targetFormat: "png" })).toContain("placeholder (png)");
  });

  it("converts SVG to SVG format blob", async () => {
    const svgStr = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';
    const result = await convertImage({
      image: svgStr,
      targetFormat: "svg"
    });
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("image/svg+xml");
    const text = await result.text();
    expect(text).toContain("<svg");
  });

  it("wraps raster image in SVG container when converting to SVG format", async () => {
    const fakePng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const result = await convertImage({
      image: fakePng,
      targetFormat: "svg",
      width: 200,
      height: 100
    });
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("image/svg+xml");
    const text = await result.text();
    expect(text).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"');
    expect(text).toContain('<image href="data:');
  });
});
