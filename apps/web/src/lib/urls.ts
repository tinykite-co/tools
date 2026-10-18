/**
 * Pure URL builders. The app is mounted under a base path (Astro `base`), so a
 * root-absolute literal such as "/feedback" escapes the app and 404s on the
 * host site. Every link and asset URL is built here instead, from an injected
 * base, so the rule lives in one place and can be tested without Astro.
 */

const PATH_SEPARATOR = "/";

/** Paths of this app's pages, relative to the base path. */
const APP_PAGES = {
  home: "",
  flows: "flows",
  privacy: "privacy",
  feedback: "feedback"
} as const;

/** Files served from `public/`, relative to the base path. */
const APP_ASSETS = {
  manifest: "manifest.webmanifest",
  serviceWorker: "sw.js"
} as const;

/** Pages and assets owned by the parent site (tinykite.co), not this app. */
const MAIN_SITE_PATHS = {
  home: "/",
  privacy: "/privacy/",
  terms: "/terms/",
  logo: "/icon.png"
} as const;

/** URLs of this app's pages and assets, all rooted at the base path. */
export interface AppRoutes {
  home(): string;
  tool(slug: string): string;
  flow(slug: string): string;
  privacy(): string;
  feedback(): string;
  manifest(): string;
  serviceWorker(): string;
}

/** Absolute URLs of parent-site pages the tools pages link out to. */
export interface MainSiteLinks {
  home: string;
  privacy: string;
  terms: string;
  logo: string;
}

/**
 * Joins a base path and an app-relative path with exactly one separator.
 * Accepts the base with or without a trailing slash, because Astro and Vite
 * disagree on whether `import.meta.env.BASE_URL` ends in one.
 */
export function joinBasePath(basePath: string, path: string): string {
  const trimmedBase = basePath.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return `${trimmedBase}${PATH_SEPARATOR}${trimmedPath}`;
}

/**
 * Pages are emitted as `<page>/index.html`, so their canonical URL ends in a
 * slash; linking to that form avoids a redirect hop on static hosts.
 */
function toPagePath(path: string): string {
  if (path === "" || path.endsWith(PATH_SEPARATOR)) {
    return path;
  }
  return `${path}${PATH_SEPARATOR}`;
}

/** Builds this app's routes for the given base path (e.g. "/tools"). */
export function createAppRoutes(basePath: string): AppRoutes {
  const page = (path: string) => joinBasePath(basePath, toPagePath(path));
  const asset = (path: string) => joinBasePath(basePath, path);
  return {
    home: () => page(APP_PAGES.home),
    tool: (slug) => page(slug),
    flow: (slug) => page(`${APP_PAGES.flows}${PATH_SEPARATOR}${slug}`),
    privacy: () => page(APP_PAGES.privacy),
    feedback: () => page(APP_PAGES.feedback),
    manifest: () => asset(APP_ASSETS.manifest),
    serviceWorker: () => asset(APP_ASSETS.serviceWorker)
  };
}

/**
 * Builds absolute links to the parent site. They are absolute on purpose: they
 * are not part of this app, so they must not depend on where it is mounted.
 */
export function createMainSiteLinks(siteUrl: string): MainSiteLinks {
  const link = (path: string) => new URL(path, siteUrl).toString();
  return {
    home: link(MAIN_SITE_PATHS.home),
    privacy: link(MAIN_SITE_PATHS.privacy),
    terms: link(MAIN_SITE_PATHS.terms),
    logo: link(MAIN_SITE_PATHS.logo)
  };
}
