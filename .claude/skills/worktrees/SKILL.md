---
name: worktrees
description: >
  How to run several agents in parallel safely: one git worktree per feature, its own database (and test database), disjoint write
  scopes, machine-wide queues for heavy checks. Use before creating or removing a worktree, before dispatching parallel agents,
  and when a worktree's database looks wrong.
---

# Parallel work with worktrees

Several agents implement features at the same time (`orchestrator` skill). Each gets an isolated checkout so that branches and databases never collide.

## Model

| Resource   | Main checkout                                                                     | Each worktree `../<repo>-<slug>`                                                       |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Branch     | the default branch; the run's integration branch (`git config forge.integration`) | `feat/<slug>`, cut from the integration branch                                         |
| Dev server | port 3000                                                                         | none: typecheck and Vitest need no server; Playwright starts its own on `E2E_PORT`     |
| Database   | `<app>`                                                                           | `<app>_feat_<slug>` and its twin `<app>_feat_<slug>_test`, migrated and seeded         |
| Remote     | optional                                                                          | `origin` is used when it exists; a fresh demo repo has none, so everything stays local |

`<app>` is the package name with `-` turned into `_`. Tests use `<DATABASE_URL database>_test` (`test/test-database.ts`).

## Lifecycle

```bash
pnpm tsx scripts/worktree.ts integration integration/<run>   # once per run
pnpm tsx scripts/worktree.ts new <slug>                      # branch, .env.local, pnpm install, databases (migrate + seed)
cd ../<repo>-<slug>                                          # work there
pnpm tsx scripts/worktree.ts list
pnpm tsx scripts/worktree-db.ts list
pnpm tsx scripts/worktree.ts rm <slug> --squashed            # after the squash merge: drops both databases, removes the worktree and the branch
pnpm tsx scripts/worktree-db.ts prune --yes                  # drop databases whose branch no longer exists (dry run without --yes)
```

`worktree.ts new` refuses to go beyond the pool size (`WORKTREE_MAX`, or the value `scripts/monitor.ts` tuned to the machine's load).

## Rules for dispatching agents

1. **One worktree per writing agent.** Never two writers in one checkout. Read-only agents (reviewers) can share the main checkout.
2. **Disjoint write scopes.** Compare the `Périmètre` of every feature before launching a wave. A shared file is either split per feature
   (messages zones, E2E files) or additive (a line in `i18n/zones.ts`, a key in a shared service), resolved by the orchestrator after the merges.
3. **Merge order.** The feature that lays a contract (tables, DAL shapes) merges first; the others merge the integration branch into their branch
   (never rebase a pushed branch) and re-run `pnpm check`.
4. **Heavy commands are queued by their own scripts** (`package.json` wraps them in `scripts/queued.sh`): `pnpm typecheck` and `pnpm test` (4 slots each),
   `pnpm test:e2e` (1 slot, port `E2E_PORT` + slot - 1). The daemon `scripts/monitor.ts` tunes the slots to the machine's load; `pnpm tsx scripts/monitor.ts live`
   shows the queues in real time. Never wrap these scripts again: the nested call would wait for a second slot. A single test file
   (`pnpm vitest run lib/services/runs.test.ts`) runs directly.

## Troubleshooting

- **Postgres down:** the SessionStart hook starts it (native cluster first, then Docker) and raises `max_connections`; otherwise `pg_ctlcluster <version> main start`.
- **`DATABASE_URL` missing or pointing at the main database in a worktree:** `pnpm tsx scripts/worktree-db.ts ensure --seed`.
- **`git branch -d` refuses after a local squash merge:** expected (git does not see a squash as a merge); `worktree.ts rm <slug> --squashed`.
