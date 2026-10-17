import { createMainSiteLinks } from "./urls";

/**
 * Parent-site links for this build, from Astro's configured `site`. Kept apart
 * from `routes` so client islands never evaluate it: `SITE` is a server-side
 * value and `new URL` would throw without it.
 */
export const mainSite = createMainSiteLinks(import.meta.env.SITE);
