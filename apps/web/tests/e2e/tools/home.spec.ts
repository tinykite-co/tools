import { expect, test } from "@playwright/test";

test("home lists tools", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "Powerful Local Utilities" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Word Count/ })).toBeVisible();
});
