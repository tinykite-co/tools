import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
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

function countLines(content) {
  if (content.length === 0) {
    return 0;
  }
  return content.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

async function assertPlaywrightTests() {
  const e2eDir = join(repoRoot, "apps/web/tests/e2e");
  const files = (await listFiles(e2eDir)).filter((file) => file.endsWith(".ts"));
  if (files.length === 0) {
    throw new Error("No Playwright tests found in apps/web/tests/e2e.");
  }
  const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const hasReducedMotion = contents.some((text) =>
    /prefers-reduced-motion|reduced motion|reduced-motion/.test(text)
  );
  if (!hasReducedMotion) {
    throw new Error("Missing reduced motion E2E test (search for prefers-reduced-motion).");
  }
}

async function assertFileSizeLimits() {
  const packageDir = join(repoRoot, "packages");
  const uiDir = join(repoRoot, "apps/web/src/ui");
  const files = [
    ...(await listFiles(packageDir)),
    ...(await listFiles(uiDir))
  ].filter((file) => [".ts", ".tsx"].includes(extname(file)));

  const violations = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = countLines(content);
    if (file.includes("/generated/")) {
      continue;
    }
    if (file.includes("/packages/") && lines > 200) {
      violations.push(`${file} has ${lines} lines (limit 200).`);
    }
    if (file.includes("/apps/web/src/ui/") && lines > 150) {
      violations.push(`${file} has ${lines} lines (limit 150).`);
    }
  }

  if (violations.length) {
    throw new Error(`File size limits exceeded:\n${violations.join("\n")}`);
  }
}

async function main() {
  await assertPlaywrightTests();
  await assertFileSizeLimits();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
