import { expect, test } from "@playwright/test";

test("respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "Powerful Local Utilities" })).toBeVisible();
});
