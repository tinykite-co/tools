# CLAUDE.md

## How I expect you to write code

**No shortcuts. "Simple" never means "sloppy."** A small diff that hardcodes,
duplicates, or skips a test isn't simpler — it's deferred cost.

1. **Fix causes, not symptoms.** Find the root cause before fixing. If you're
   applying a workaround, say so explicitly and explain why. Never swallow an
   exception or silence an error to make a problem disappear.

2. **Think about consequences.** Before changing shared or widely-used code,
   trace its callers and the invariants they rely on. A fix that's locally
   correct but breaks something elsewhere — now or later — is not a fix.

3. **SOLID, sensibly.** One responsibility per class/widget/function. Separate
   pure logic from I/O so it can be tested. Inject dependencies that cross a
   boundary so they're mockable. Don't add abstractions for things that don't
   cross a boundary.

4. **DRY about knowledge, not appearance.** Don't duplicate a rule or decision.
   Code that merely looks similar but changes for different reasons stays
   separate. When unsure, prefer duplication over a premature/wrong abstraction.

5. **No hardcoded values.** No magic numbers or strings inline — give them
   names. Environment/tenant/feature-specific values go in typed config in
   application code, never scattered literals, never the database.

6. **Readable & maintainable.** Clear names, short flat functions, early
   returns over deep nesting. Comments explain *why*, not *what*. Match the
   existing style of the file you're editing.

7. **Testable, and prove it.** Ship a test for behavior you add or change. If
   something is hard to test, that's a design smell — restructure until it
   isn't. "Works but can't be tested" means it isn't done.

A change is done only when: the cause (not a symptom) is fixed, no new hardcoded
values, a test covers it, and the analyzer/formatter are clean.

## Project facts

> Keep these current as the repo evolves; only write what you've confirmed.

- **Setup command:** `pnpm install` (pnpm@9.15.2, Node 20)
- **Analyze/lint command:** `pnpm lint` (ESLint flat config; type-aware via `projectService`)
- **Test command (all):** `pnpm test` (runs `vitest run` across `@tinykite/*` packages; e2e: `pnpm test:e2e`)
- **Test command (single file/test):** `pnpm --filter @tinykite/<pkg> exec vitest run <file>` (e.g. `pnpm --filter @tinykite/core exec vitest run src/foo.test.ts`)
- **Format command:** _TBD_ (no Prettier/format script defined; style enforced via ESLint only)
- **Run an app:** `pnpm dev` (runs `pnpm generate` then `astro dev` for `apps/web`)
- **Repo layout:** pnpm workspace — `apps/web` (Astro + React static tools site, deploys to GitHub Pages at `tools.tinykite.co`), `packages/*` (`core`, `image`, `pdf`, `text`, `zip`, `ui`, `ui-schema`, `templates-base`), `scripts/` (registry/sitemap generators + CI guards), `docs/`
- **State management / data layer conventions:** Tool/flow/template registries are generated from per-item def files (`apps/web/src/registry/{tools,flows,templates}`) via `pnpm generate`; tool execution runs through workers/RPC (`apps/web/src/workers`); DOM globals (`window`, `document`, `localStorage`, etc.) are banned in `packages/**` by ESLint `no-restricted-globals`
- **Generated files NOT to hand-edit:** `apps/web/src/registry/{tools,flows,templates}/generated/*` (regenerate with `pnpm generate`; not committed — CI/build regenerates them); these paths are also in the CI forbidden-paths guard
- **Other gotchas worth recording:** ESM throughout (`"type": "module"`); `max-lines` capped at 400 per file (ESLint error); `scripts/check-forbidden-paths.mjs` blocks PR edits to capability/runner/registry-generator paths unless the PR has the `infra-change` label; `scripts/ci-checks.mjs` requires a `prefers-reduced-motion` Playwright e2e test and enforces file-size limits; releases use Changesets (`pnpm changeset` / `version-packages` / `release`); commits must follow conventional-commit (commitlint); deploy injects pro content from `tinykite-tools-pro` at deploy time
