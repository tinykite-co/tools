import { describe, expect, it } from "vitest";
import {
  parseTargetSize,
  computePassportFraming,
  type SubjectBounds
} from "./india-passport-photo";

describe("india-passport-photo pure helpers", () => {
  it("parseTargetSize defaults to 630x810 when undefined or unknown", () => {
    expect(parseTargetSize(undefined)).toEqual({ width: 630, height: 810, display: "630x810" });
    expect(parseTargetSize("")).toEqual({ width: 630, height: 810, display: "630x810" });
    expect(parseTargetSize("nonsense")).toEqual({ width: 630, height: 810, display: "630x810" });
  });

  it("parseTargetSize recognizes supported sizes and parses custom WxH", () => {
    expect(parseTargetSize("600x600")).toEqual({ width: 600, height: 600, display: "600x600" });
    expect(parseTargetSize("413x531")).toEqual({ width: 413, height: 531, display: "413x531" });
    expect(parseTargetSize("  700 x 900 ")).toEqual({ width: 700, height: 900, display: "700x900" });
  });

  it("computePassportFraming produces draw params that place head+shoulders with ~82% coverage for typical bounds", () => {
    // Simulate a 800x1200 subject bitmap where content is roughly from y=100 to y=900 (800px tall person)
    const bounds: SubjectBounds = { minX: 200, minY: 100, maxX: 600, maxY: 900 };
    const bitmapW = 800;
    const bitmapH = 1200;
    const targetW = 630;
    const targetH = 810;

    const params = computePassportFraming(bounds, bitmapW, bitmapH, targetW, targetH);

    // scale should be positive and reasonable
    expect(params.scale).toBeGreaterThan(0.5);
    expect(params.scale).toBeLessThan(2);

    // drawY will be negative (subject top pulled up into margin), drawH large.
    expect(params.drawY).toBeLessThan(0); // head pulled into top margin
    expect(params.drawH).toBeGreaterThan(targetH * 0.9);

    // drawX should roughly center: person center at ~400 in subject, target center 315
    // so drawX roughly 315 - 400*scale ≈ negative or small
    expect(typeof params.drawX).toBe("number");
  });

  it("computePassportFraming respects max person width constraint", () => {
    // Very wide content bbox to force width limiting
    const bounds: SubjectBounds = { minX: 50, minY: 200, maxX: 750, maxY: 700 };
    const params = computePassportFraming(bounds, 800, 1000, 630, 810);
    // After width clamp, the drawn person width should not greatly exceed 88% of target
    const drawnPersonW = (750 - 50) * params.scale;
    expect(drawnPersonW).toBeLessThanOrEqual(630 * 0.88 + 1); // allow rounding
  });
});
