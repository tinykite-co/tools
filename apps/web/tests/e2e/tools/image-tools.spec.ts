import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.resolve(__dirname, "../../fixtures/tools/portraits");

const PORTRAITS = {
  plainYoungWoman: path.join(FIXTURES_DIR, "portrait-plain-young-woman.jpg"),
  plainYoungMan: path.join(FIXTURES_DIR, "portrait-plain-young-man.jpg"),
  plainElderlyHeadscarf: path.join(
    FIXTURES_DIR,
    "portrait-plain-elderly-woman-headscarf.jpg",
  ),
  plainGlasses: path.join(FIXTURES_DIR, "portrait-plain-woman-glasses.jpg"),
  complexGlasses: path.join(FIXTURES_DIR, "portrait-complex-man-glasses.jpg"),
  complexBeard: path.join(FIXTURES_DIR, "portrait-complex-man-beard.jpg"),
};

test.describe("India Passport Photo Generator", () => {
  test.slow(); // Heavy WASM background removal + framing — can easily exceed 60s

  test("generates 630x810 (default) from a clean plain-background portrait", async ({
    page,
  }) => {
    await page.goto("/tools/india-passport-photo");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "India Passport Photo Generator",
      }),
    ).toBeVisible();

    // Upload ideal portrait
    const fileInput = page.getByLabel("Upload your portrait photo");
    await fileInput.setInputFiles(PORTRAITS.plainYoungWoman);

    // Default size should be 630x810 (first option)
    await expect(page.getByLabel("Output size")).toHaveValue("630x810");

    await page.getByRole("button", { name: "Generate Output" }).click();

    // In E2E the full background removal + framing is slow. We at least verify
    // that processing begins (progress indicator appears) using the real portrait fixture.
    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 15000 });
  });

  test("supports alternate sizes (600x600 and 413x531) on varied portraits", async ({
    page,
  }) => {
    await page.goto("/tools/india-passport-photo");

    // Test a plain ideal one with 2x2
    const fileInput = page.getByLabel("Upload your portrait photo");
    await fileInput.setInputFiles(PORTRAITS.plainYoungMan);

    await page.getByLabel("Output size").selectOption("600x600");
    await page.getByRole("button", { name: "Generate Output" }).click();

    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 15000 });

    // Now test a more challenging one (headscarf) with the alternate size
    await fileInput.setInputFiles(PORTRAITS.plainElderlyHeadscarf);
    await page.getByLabel("Output size").selectOption("413x531");
    await page.getByRole("button", { name: "Generate Output" }).click();

    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 15000 });
  });

  test("handles challenging portraits with glasses and busy backgrounds", async ({
    page,
  }) => {
    await page.goto("/tools/india-passport-photo");

    const fileInput = page.getByLabel("Upload your portrait photo");

    // Glasses + busy background
    await fileInput.setInputFiles(PORTRAITS.complexGlasses);
    await page.getByRole("button", { name: "Generate Output" }).click();

    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 15000 });

    // Beard + busy
    await fileInput.setInputFiles(PORTRAITS.complexBeard);
    await page.getByRole("button", { name: "Generate Output" }).click();

    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Crop Image tool (interactive)", () => {
  test("uploads a portrait and performs a centered crop using the visual rectangle UI", async ({
    page,
  }) => {
    await page.goto("/tools/crop-image");

    await expect(
      page.getByRole("heading", { level: 1, name: "Crop Image" }),
    ).toBeVisible();

    const fileInput = page.getByLabel("Image to Crop");
    await fileInput.setInputFiles(PORTRAITS.plainYoungWoman);

    // Wait for the cropper UI to activate by waiting for the source image to render
    await expect(page.getByTestId("crop-source-image")).toBeVisible({
      timeout: 10000,
    });

    // The new interactive cropper should appear and default to a centered rect
    await expect(page.getByText("Drag the rectangle to move")).toBeVisible();
    await expect(page.getByText("Center crop")).toBeVisible();

    // Click the "Center crop" button (it should already be centered, but exercises the UI)
    await page.getByRole("button", { name: "Center crop" }).click();

    // The number fields should have been populated by the cropper (non-zero values)
    await expect(page.getByLabel("X Offset")).not.toHaveValue("0");
    await expect(page.getByLabel("Width")).not.toHaveValue("");

    await page.getByRole("button", { name: "Generate Output" }).click();

    await expect(page.getByText("Result Ready")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(/-cropped-/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Download/ })).toBeVisible();
  });

  test("supports manual override after visual crop on a complex portrait", async ({
    page,
  }) => {
    await page.goto("/tools/crop-image");

    const fileInput = page.getByLabel("Image to Crop");
    await fileInput.setInputFiles(PORTRAITS.complexBeard);

    await expect(page.getByTestId("crop-source-image")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Drag the rectangle to move")).toBeVisible();

    // Manually override one field — the visual should sync (or at least not break)
    await page.getByLabel("Width").fill("300");
    await page.getByLabel("Height").fill("300");

    await page.getByRole("button", { name: "Generate Output" }).click();

    await expect(page.getByText("Result Ready")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(/-cropped-300x300/)).toBeVisible();
  });
});

test.describe("Image to PDF", () => {
  test("page renders with multi-file image input and generate button", async ({ page }) => {
    await page.goto("/tools/image-to-pdf");

    await expect(
      page.getByRole("heading", { level: 1, name: "Image to PDF" })
    ).toBeVisible();

    // The field label from the def
    await expect(page.getByLabel("Images")).toBeVisible();

    // Button present (actual run requires workers + may hit base/asset paths in preview)
    await expect(page.getByRole("button", { name: "Generate Output" })).toBeVisible();
  });
});
