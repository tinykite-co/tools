import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests sit next to the code; tests/e2e belongs to Playwright.
    include: ["src/**/*.test.ts"]
  }
});
