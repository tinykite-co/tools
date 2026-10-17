import { expect, test, type Page } from "@playwright/test";
import { BASE_PATH, SITE_URL } from "../../../site.config.mjs";

// The app is served under BASE_PATH on the host site, so a URL that leaves it
// lands on a different site's 404. These tests run against the real build.
const BASE_PREFIX = `${BASE_PATH.replace(/\/+$/, "")}/`;
const URL_ATTRIBUTE_SELECTOR = "a[href], link[href], img[src], script[src]";
const HTTP_OK = 200;
const SITEMAP_LOC_PATTERN = /<loc>([^<]+)<\/loc>/g;

async function collectSameOriginUrls(page: Page): Promise<URL[]> {
  const rawUrls = await page.$$eval(URL_ATTRIBUTE_SELECTOR, (elements) =>
    elements.map((element) => element.getAttribute("href") ?? element.getAttribute("src") ?? "")
  );
  const pageUrl = new URL(page.url());
  return rawUrls
    .map((raw) => new URL(raw, pageUrl))
    .filter((url) => url.origin === pageUrl.origin);
}

function pageKey(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

test("every same-origin link and asset stays under the base path and resolves", async ({
  page,
  request,
  baseURL
}) => {
  const queue = [new URL(BASE_PREFIX, baseURL)];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift() as URL;
    if (visited.has(pageKey(current))) {
      continue;
    }
    visited.add(pageKey(current));
    await page.goto(current.toString());

    for (const url of await collectSameOriginUrls(page)) {
      const context = `${url.pathname} linked from ${current.pathname}`;
      expect.soft(url.pathname.startsWith(BASE_PREFIX), context).toBe(true);
      if (visited.has(pageKey(url)) || queue.some((queued) => pageKey(queued) === pageKey(url))) {
        continue;
      }
      const response = await request.get(url.toString());
      expect.soft(response.status(), context).toBe(HTTP_OK);
      if (response.headers()["content-type"]?.includes("text/html")) {
        queue.push(url);
      } else {
        visited.add(pageKey(url));
      }
    }
  }

  const visitedPaths = [...visited].map((key) => new URL(key).pathname);
  expect(visitedPaths).toContain(`${BASE_PREFIX}feedback/`);
  expect(visitedPaths.some((path) => path.startsWith(`${BASE_PREFIX}flows/`))).toBe(true);
});

test("a tool's Feedback link opens the feedback page with that tool prefilled", async ({ page }) => {
  await page.goto(`${BASE_PREFIX}word-count/`);
  await page.getByRole("link", { name: "Feedback", exact: true }).click();

  await expect(page).toHaveURL(/\/feedback\/\?tool=word-count&version=/);
  const emailLink = page.getByRole("link", { name: "Email feedback" });
  await expect(emailLink).toHaveAttribute("href", /^mailto:support@tinykite\.co\?/);
  await expect(emailLink).toHaveAttribute("href", /subject=TinyKite%20Tools%20feedback%3A%20word-count/);
});

test("the sitemap lists only pages under the base path that exist", async ({ request, baseURL }) => {
  const sitemap = await (await request.get(`${BASE_PREFIX}sitemap.xml`)).text();
  const locations = [...sitemap.matchAll(SITEMAP_LOC_PATTERN)].map((match) => new URL(match[1]));
  expect(locations.length).toBeGreaterThan(1);

  for (const location of locations) {
    expect.soft(location.origin, location.href).toBe(SITE_URL);
    expect.soft(location.pathname.startsWith(BASE_PREFIX), location.href).toBe(true);
    const response = await request.get(new URL(location.pathname, baseURL).toString());
    expect.soft(response.status(), location.href).toBe(HTTP_OK);
  }
});

test("the service worker registers under the base path and serves pages offline", async ({
  page,
  context,
  baseURL
}) => {
  await page.goto(BASE_PREFIX);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe(new URL(BASE_PREFIX, baseURL).toString());
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Powerful Local Utilities" })).toBeVisible();
  await context.setOffline(false);
});
