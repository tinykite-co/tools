import { expect, test } from "@playwright/test";

test("tool page renders runner", async ({ page }) => {
  await page.goto("/tools/word-count");
  await expect(page.getByRole("heading", { level: 1, name: "Word Count" })).toBeVisible();
  await expect(page.getByText("Runner: countWords")).toBeVisible();
});
