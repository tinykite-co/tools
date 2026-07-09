import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_VIDEO = path.resolve(__dirname, "../../fixtures/sample.mp4");

async function uploadAndRun(page: import("@playwright/test").Page): Promise<void> {
  const input = page.locator('input[type="file"]');
  await expect(input).toBeAttached();
  await input.setInputFiles(SAMPLE_VIDEO);
  await page.getByRole("button", { name: "Make it" }).click();
}

test.describe("Convert Video", () => {
  test.slow();

  test("loads page and converts sample mp4", async ({ page }) => {
    test.setTimeout(240_000);

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/tools/convert-video");
    await expect(
      page.getByRole("heading", { level: 1, name: "Convert Video" })
    ).toBeVisible();

    await uploadAndRun(page);

    await expect(page.getByRole("heading", { name: "Yours." })).toBeVisible({
      timeout: 180_000
    });
    await expect(page.getByRole("link", { name: "Keep it" })).toBeVisible();

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });
});

test.describe("Video Storyboard", () => {
  test.slow();

  test("loads page and builds contact sheet from sample mp4", async ({ page }) => {
    test.setTimeout(240_000);

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/tools/video-storyboard");
    await expect(
      page.getByRole("heading", { level: 1, name: "Video Storyboard" })
    ).toBeVisible();

    await uploadAndRun(page);

    await expect(page.getByRole("heading", { name: "Yours." })).toBeVisible({
      timeout: 180_000
    });
    await expect(page.locator(".result-wrap img").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Keep it" }).first()).toBeVisible();

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });
});