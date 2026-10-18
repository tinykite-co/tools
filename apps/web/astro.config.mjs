import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { BASE_PATH, SITE_URL } from "./site.config.mjs";

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: "static",
  integrations: [react()],
  vite: {
    worker: {
      format: "es"
    }
  }
});
