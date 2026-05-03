import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://tinykite.co",
  base: "/tools",
  output: "static",
  integrations: [react()],
  vite: {
    worker: {
      format: "es"
    }
  }
});
