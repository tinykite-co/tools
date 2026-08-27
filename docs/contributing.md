# Contributing

## Principles
- Keep packages DOM-free.
- Favor SOLID/DRY, readable modules.
- Each tool ships with lib + page + unit + E2E.
- Tool changes should be confined to tool-specific folders.

## Local Development
1. `pnpm install`
2. `pnpm dev`

## Generators
- `pnpm generate` to refresh registries and sitemap.

## Testing
- Unit: `pnpm test`
- E2E (after build): `pnpm build` then `pnpm test:e2e`

## API Surface Lock
Every package's public `.d.ts` declarations are captured in `etc/<package>.api.md` report files. CI runs `pnpm api:check` to verify these reports match the current source. If a change modifies any public type, interface, or function signature the check will fail.

**Workflow when you change a package's public API:**
1. Make your code changes.
2. Run `pnpm api:update` to regenerate the report files.
3. Review the diff in the `etc/*.api.md` files to confirm the change is intentional.
4. Commit the updated reports alongside your code changes.
