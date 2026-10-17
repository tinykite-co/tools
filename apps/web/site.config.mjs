/**
 * Where the tools app is published.
 *
 * The build is copied into tinykite.co's `dist/tools/` by that site's deploy
 * workflow, so this app does not own the domain root: every URL it emits must
 * live under BASE_PATH. Shared by `astro.config.mjs` and the Node-side
 * generators in `scripts/` so the two can never disagree.
 */

/** Origin of the site the tools are served from. */
export const SITE_URL = "https://tinykite.co";

/** Path prefix the tools app is mounted under on SITE_URL. */
export const BASE_PATH = "/tools";
