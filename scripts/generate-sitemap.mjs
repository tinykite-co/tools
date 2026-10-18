import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { BASE_PATH, SITE_URL } from "../apps/web/site.config.mjs";

const repoRoot = new URL("..", import.meta.url).pathname;
const toolsDir = join(repoRoot, "apps/web/src/registry/tools/defs");
const flowsDefsDir = join(repoRoot, "apps/web/src/registry/flows/defs");
const flowsInjectedDir = join(repoRoot, "apps/web/src/registry/flows/injected");
const outFile = join(repoRoot, "apps/web/public/sitemap.xml");

async function listFiles(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function extractSlugsFromDefs(dir) {
  const files = (await readdir(dir)).filter((file) => file.endsWith(".ts"));
  const slugs = [];
  for (const file of files) {
    const content = await readFile(join(dir, file), "utf8");
    const match = content.match(/slug:\s*"([^"]+)"/);
    if (match?.[1]) {
      slugs.push(match[1]);
    }
  }
  return slugs.sort();
}

async function extractSlugsFromInjected(dir) {
  const files = (await listFiles(dir)).filter((file) => file.endsWith(".json"));
  const slugs = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw);
    if (data.slug) {
      slugs.push(data.slug);
    }
  }
  return slugs.sort();
}

// The app is served under BASE_PATH on SITE_URL. Paths mirror createAppRoutes
// in apps/web/src/lib/urls.ts: pages are emitted as <page>/index.html, so
// their canonical URLs end in a slash.
const appRoot = `${SITE_URL}${BASE_PATH.replace(/\/+$/, "")}/`;
const toolSlugs = await extractSlugsFromDefs(toolsDir);
const flowSlugs = [
  ...(await extractSlugsFromDefs(flowsDefsDir)),
  ...(await extractSlugsFromInjected(flowsInjectedDir))
].sort();

const urls = [
  "",
  ...toolSlugs.map((slug) => `${slug}/`),
  ...flowSlugs.map((slug) => `flows/${slug}/`)
];

const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${urls
  .map((path) => `  <url><loc>${appRoot}${path}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, xml, "utf8");
