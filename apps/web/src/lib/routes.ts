import { createAppRoutes } from "./urls";

/**
 * Routes for this build, rooted at Astro's configured `base`. Safe to import
 * from client islands: Vite inlines `BASE_URL` into every bundle.
 */
export const routes = createAppRoutes(import.meta.env.BASE_URL);
