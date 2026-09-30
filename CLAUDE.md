# alan-run-inspector

Next.js demo forged from the career-hub `demo-template`. Brief and specs: `docs/offer/` when present.

## Commands

`pnpm check` (typecheck + lint + tests + format), `pnpm dev`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`,
`pnpm test:e2e`. TypeScript 7 typechecks (`tsc`); TypeScript 6 (`tsc6`) stays for typescript-eslint.

## Examples live in the hub

The example files (patterns) were removed from this repo but stay readable in the career-hub repo, pinned to the commit in
`docs/forge.json`. Specs cite a pattern by id (`Patterns: public-dal-cache`); the ids and their files are listed in
`apps/demo-template/PATTERNS.md` of the hub. To read one file at the pinned commit:

```bash
git -C <hub.path> show <hub.commit>:apps/demo-template/<path>
```

The hub must be visible to the session (`claude --add-dir <hub>`, or both repos attached in a cloud session). If it is not,
stop and say so: do not guess the patterns. Copy the structure of an example, never its domain words.

## Rules

- **entry → service → DAL** (see README). `db` is imported only by `lib/dal/**`; `server-only` first in the DAL and services;
  services have no `next/*`; `process.env` only in `lib/env.ts`.
- **i18n**: no hardcoded text in JSX; every message in `messages/<locale>/<zone>.json`, all locales.
- Public pages read through `lib/dal/public/` only; user data never goes through a cache.
- Use the installed shadcn components (`components/ui`). At the end of the demo, unused ones are removed with the hub's `forge prune-ui`.
- Commits in English, conventional (`feat(scope): …`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
