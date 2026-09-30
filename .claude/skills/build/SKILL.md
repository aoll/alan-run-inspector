---
name: build
description: Implements one feature spec of the demo (docs/offer/features/F<nn>-*.md) following the entry → service → DAL architecture, with tests, then commits. Use with /build F01, one feature at a time.
---

# /build F<nn>

Implements one feature of the demo. For several features at once, use the `orchestrator` skill (it runs this skill in parallel worktrees). The specs live in `docs/offer/` (`spec.md`, `features/F<nn>-<name>.md`).

## Before writing code

1. Read `CLAUDE.md`, `README.md`, `docs/offer/spec.md` and the feature spec in full. Check the feature's `Dépend de`/dependencies are `done` in `docs/offer/features/README.md`; if not, stop.
2. Read `docs/forge.json`. Make sure the hub is readable at `hub.path` (or through the directory added with `--add-dir`). If it is not, **stop and tell the user**.
3. For each pattern id in the spec's `Patterns`, find it in `apps/demo-template/PATTERNS.md` of the hub, then read every file listed for it
   at the pinned commit: `git -C <hub.path> show <hub.commit>:apps/demo-template/<path>`. Copy the structure, never the domain words.
4. Announce a short plan: tables, DAL functions, service rules, entries, message zones, tests. Stay inside the spec's `Périmètre`.

## Implement, in this order

1. Tables in `lib/db/schema.ts`, then `pnpm db:generate && pnpm db:migrate`.
2. Private DAL (`lib/dal/`): `requireViewer()` first, owner filter in the query, DTO out. Public data goes through `lib/dal/public/` only
   (never the session, public flag in the query, cached by tag). Add a DAL test for ownership.
3. Service (`lib/services/`): the business rules; typed errors from `lib/errors.ts`. Add service tests with a mocked DAL.
4. Entries (`_actions.ts`, `route.ts`, `page.tsx`): Zod parsing in `lib/schemas/`, call a service, map the outcome. No query, no logic.
5. Text: a zone in `i18n/zones.ts` and `messages/<locale>/<zone>.json` for **every** locale. No hardcoded text in JSX.
6. Each `Acceptation` bullet becomes at least one test (DAL, service or Playwright). Add or extend a journey in `e2e/` when the feature is a user path.

## Finish

1. `pnpm check` must pass. If the feature has a Playwright journey, run it (`pnpm test:e2e`; `PW_CHROMIUM_PATH` for a preinstalled Chromium).
2. Set the feature to `done` in `docs/offer/features/README.md`, **unless the orchestrator started you** (then it owns that file and the registry: do not touch them).
3. Commit: `feat(<scope>): F<nn> <name>` (English, conventional). One feature per commit.
4. Report: what was built, which acceptance bullets are covered by which test, anything left out and why.

## Rules

- Never change the template's contracts (`lib/dal/session.ts`, `lib/errors.ts`, `lib/env.ts`, `config/`) unless the spec says so.
- Do not weaken a test to make it pass; fix the code or ask.
- If the spec is ambiguous or wrong, stop and ask instead of choosing silently.
