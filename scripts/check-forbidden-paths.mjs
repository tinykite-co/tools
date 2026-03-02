import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const eventName = process.env.GITHUB_EVENT_NAME;
if (eventName !== "pull_request") {
  process.exit(0);
}

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.log("GITHUB_EVENT_PATH not set, skipping guard.");
  process.exit(0);
}

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const labels = (event.pull_request?.labels || []).map((label) => label.name);
const hasInfraLabel = labels.includes("infra-change");

const forbidden = [
  "apps/web/src/ui/islands/ToolRunner.tsx",
  "apps/web/src/ui/islands/FlowRunner.tsx",
  "apps/web/src/workers/rpc/",
  "apps/web/src/ui/motion/",
  "apps/web/src/lib/capabilities.ts",
  "apps/web/src/registry/tools/generated/",
  "apps/web/src/registry/flows/generated/",
  "apps/web/src/registry/templates/generated/",
  "packages/core/src/capability/",
  "scripts/generate-tools-registry.mjs",
  "scripts/generate-flows-registry.mjs",
  "scripts/generate-templates-registry.mjs",
  "scripts/generate-sitemap.mjs"
];

execSync("git fetch origin main --depth=1000", { stdio: "inherit" });
let output = "";
try {
  output = execSync("git diff --name-only origin/main...HEAD", { encoding: "utf8" });
} catch {
  output = execSync("git diff --name-only origin/main..HEAD", { encoding: "utf8" });
}
const changed = output.split(/\r?\n/).filter(Boolean);

const forbiddenHits = changed.filter((file) =>
  forbidden.some((path) => file === path || file.startsWith(path))
);

if (forbiddenHits.length > 0 && !hasInfraLabel) {
  console.error("Forbidden path changes detected without infra-change label:");
  for (const file of forbiddenHits) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}
