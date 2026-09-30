---
name: orchestrator
description: >
  Builds every feature of the demo (docs/offer/features/) in parallel git worktrees: keeps a dependency registry,
  starts a feature as soon as ITS dependencies are merged and a worktree is free, drives each one through the
  per-feature flow (build, check, merge into the run's integration branch), takes over stuck features and hands the
  integration branch to the human. Use when asked to implement several features, "all the features" or to run the orchestrator.
---

# Orchestrator

You are the orchestrator: the main session. You dispatch agents, track state, merge into the integration branch and talk to the human.
You do not implement a feature yourself, except to take over one that is stuck (below). One feature alone can be built with `/build F<nn>`;
this skill is for two or more.

Adapted from the orchestrator of micro-saas-studio-builder: same registry, same continuous dispatch, same machine limits; the per-feature
flow is lighter (a demo must be built in under two hours) and merges are local unless a remote exists.

## Run setup

1. Read `docs/forge.json` (`flow`: `light` or `review`, `hub`), `docs/offer/spec.md` and `docs/offer/features/README.md`.
2. **Integration branch:** `pnpm tsx scripts/worktree.ts integration integration/<run>` (`<run>` = the offer slug). It is created from the default branch
   (locally when there is no `origin`) and recorded in `git config forge.integration`. The main checkout sits on it (`git switch <integration>`):
   that is where you merge and write the registry. Every worktree starts from it.
3. **Registry:** write it (next section), commit it on the integration branch.
4. **Monitoring:** start the three layers of the Monitoring section.
5. **First dispatch:** run the dispatch loop once.

## Registry: continuous dispatch, no waves

The `Vague` column of the features index is a reading aid, never a barrier: a feature starts as soon as **its own** dependencies are merged into
the integration branch and a worktree is free, whatever the rest of its wave is doing.

The registry is `.claude/runs/<run>.json` on the integration branch (versioned, so it survives a container reset: git is the memory, never the
conversation). You are its only writer; agents never touch it, and never edit the `Status` column of the features index either (you do, after a merge).

```json
{
  "integration": "integration/<run>",
  "flow": "light",
  "features": {
    "F01-demo-access": { "dependsOn": [], "status": "ready", "worktree": null },
    "F03-timeline-and-evidence": { "dependsOn": ["F02-runs-and-execution"], "status": "pending", "worktree": null }
  }
}
```

Build `dependsOn` from each feature file's `Dépend de` / `Depends on` line, expanded to exact feature names (`F02` is `F02-runs-and-execution`).
Statuses, never another:

- `pending`: at least one `dependsOn` entry is not `merged`;
- `ready`: every `dependsOn` entry is `merged` (or none); waiting for a worktree;
- `dispatched`: worktree created, going through the flow;
- `merged`: squash-merged into the integration branch;
- `blocked`: waiting for the human (see "A stuck feature");
- `deferred`: the bonus feature the human chose not to build.

**Dispatch loop**, run at the start and after **every** event (a merge, a feature blocked or unblocked, a pool size change), never computed once:

1. Every `pending` feature whose `dependsOn` are now all `merged` becomes `ready`.
2. While fewer features are `dispatched` than the pool allows (`pnpm tsx scripts/monitor.ts status`) and one is `ready`: dispatch it (step 0),
   preferring the critical path (the longest chain of dependants), then the feature that unblocks the most others. Launch the dispatches of one
   round in the same message. The worktree is created at dispatch, never earlier.
3. Commit the registry (`chore(run): <what changed>`) when a status changed.

## Per-feature flow

Each step is one background agent working in the feature's worktree. Give it the absolute worktree path and tell it to run every command there.
Every brief starts with: "Read CLAUDE.md, README.md, docs/offer/spec.md and docs/offer/features/<feature>.md in full, then run `/build <F..>`.
Do not edit docs/offer/features/README.md." When its notification arrives, launch the next step.

| #   | Step                         | Who                                                                                                                         | Done when                                                       |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 0   | Worktree                     | you: `pnpm tsx scripts/worktree.ts new <slug>` (slug = the feature name in lower case, e.g. `f02-runs-and-execution`)       | branch created, database migrated and seeded                    |
| 1   | Build                        | one agent: `/build <F..>` (tests first, `pnpm check` green, committed)                                                      | committed, nothing left uncommitted                             |
| 2   | Review (`flow: review` only) | one read-only agent reviews `git diff <integration>...HEAD` against the feature spec, `CLAUDE.md` rules and the `Périmètre` | no blocking finding; otherwise back to step 1 with the findings |
| 3   | Verify                       | the build agent (or you): merge the integration branch into the feature branch, then `pnpm check`                           | READY                                                           |
| 4   | Merge                        | you, in the main checkout on the integration branch (merge gate below)                                                      | merged; worktree removed, dependants start                      |

**Merge gate (step 4).** Merge a feature yourself, without waiting for the human, as soon as all of these hold on its current head:

- `pnpm check` READY after merging the latest integration branch into it, and nothing committed since;
- its diff stays inside the feature's `Périmètre` (`git diff --name-only <integration>...feat/<slug>`), and touches a template contract
  (`lib/dal/session.ts`, `lib/errors.ts`, `lib/env.ts`, `config/`) only when the `Périmètre` lists it;
- for `flow: review`, the last review has no blocking finding.

Merge **one at a time** (two features that pass together: merge one, then the other merges the integration branch again and re-verifies):
`git switch <integration>`, `git merge --squash feat/<slug>`, commit `feat(<scope>): <F..> <summary>` (one commit per feature, English, conventional).
Then in this order: `pnpm tsx scripts/worktree.ts rm <slug> --squashed`, mark the feature `merged` in the registry and `done` in the features index,
run the dispatch loop, and tell the features still running to merge the integration branch before their next `pnpm check`.
With an `origin` and a wish for pull requests, open one per feature instead and merge it (squash) when the gate holds. Never merge into
`main`, never force-push.

A conflict on a file every feature touches mechanically (the lockfile, a Drizzle migration snapshot, `drizzle/meta`) is resolved by regenerating it
(`pnpm install`, `pnpm db:generate` after dropping the conflicting migration), never by hand. A conflict on `i18n/zones.ts`, `vercel.json`,
`instrumentation-client.ts` or a shared test file is additive: keep both sides. A conflict anywhere else means the dependency graph or the scopes
were wrong: treat it as a stuck feature and fix the registry for the features still to come.

## Monitoring (continuous, three layers)

1. **Daemon:** `pnpm tsx scripts/monitor.ts start`: samples CPU and memory every 5 s, checks disk and Postgres, tunes the `test` and `typecheck`
   slots and the worktree pool on its own, and writes one line per event to `/tmp/forge-queue/monitor.log`. `start` is a no-op when it already runs.
2. **Event stream:** follow that log with the Monitor tool (`tail -n 0 -F /tmp/forge-queue/monitor.log`, re-armed at each 30-minute expiry).
3. **Heartbeat** (cloud session: the tool `mcp__Claude_Code_Remote__send_later`; in a local session there is none, rely on layers 1 and 2): after starting the
   run, schedule `mcp__Claude_Code_Remote__send_later({ delay_minutes: 5, name: "Orchestrator heartbeat", message: "Orchestrator heartbeat: run pnpm tsx scripts/monitor.ts
start (restarts a dead daemon) and pnpm tsx scripts/monitor.ts status; re-arm the Monitor on /tmp/forge-queue/monitor.log if it expired; read the registry and
pnpm tsx scripts/worktree.ts list, run the dispatch loop; then schedule the next heartbeat" })`. Re-arm it at each firing until the run is over; when it fires with
   nothing to do, say nothing. It is the only layer that survives a container reset: after one, rebuild from git (see "Status"), never from memory.

| Event                               | What to do                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ADJUST`                            | Nothing: a limit changed. Note the new pool size before dispatching                             |
| `SATURATION-MEM` / `SATURATION-CPU` | Start no new feature until it clears; if it lasts, find the heaviest job with `monitor.ts live` |
| `SATURATION-DISK`                   | Start no new feature; remove worktrees of merged features                                       |
| `SATURATION-PG-CONNS`               | Look for `idle in transaction` sessions in `pg_stat_activity`                                   |
| `CRASH-POSTGRES`                    | `node .claude/hooks/session-start.mjs` restarts it; agents with DB tests re-run them            |
| `MONITOR-STOPPED`, `MONITOR-CRASH`  | `monitor.ts start`, then read `/tmp/forge-queue/monitor.err`                                    |

## Machine limits

- `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` are queued machine-wide (`scripts/queued.sh`): they wait for a slot (4 at the start; 1 for E2E) whatever the
  number of worktrees, and are shared by every demo repo on the machine. Agents run a single test file directly while iterating and the full commands at
  the end of a phase. Never wrap these scripts again in `queued.sh`.
- Every worktree has its own database and its own `_test` twin, so tests never collide.
- E2E does not run per feature: it runs once on the integration branch at the end (`pnpm test:e2e`), on a fixed port, one slot.
- Never edit the limit files by hand; `monitor.ts reset` restores the defaults.

## A stuck feature: you take over

When a feature does not get through its flow (an agent reports a check it cannot make pass, the same finding comes back after a fix round, a conflict it
cannot resolve, an agent that fails or loops), you take it over: read the worktree, the failing output and the agent's report, find the root cause and fix
it yourself in the worktree, test first. Then verify again and apply the merge gate. Other features keep running. Never weaken a test, skip one or edit a
check's configuration to get through.

Only two things go to the human, because they change what was approved: a template contract to change outside a feature's `Périmètre`, and a feature that
cannot be met as written (contradictory acceptance bullets, a file needed outside its `Périmètre`). For those, set the feature `blocked` (keep its
worktree), say exactly what blocks and what you propose, and keep the others running.

## End of the run

The run is over when every feature is `merged` (or `deferred`). Then: `pnpm check` on the integration branch, then `pnpm test:e2e` once (fix failures
yourself, test first), stop the monitoring (`monitor.ts stop`, stop the Monitor task, let the heartbeat lapse), and hand over: the integration branch, the
registry and a short report (features merged, features you took over and why, anything left). The human reviews the integration branch and merges it into
`main`; you never do.

## Status

The registry is the source of truth. On every change, show a table derived from it, with the flow step of each dispatched feature:

| Feature | Status                                                     | Step                            | Worktree |
| ------- | ---------------------------------------------------------- | ------------------------------- | -------- |
| `<F..>` | pending · ready · dispatched · merged · blocked · deferred | build · review · verify · merge | `<slug>` |

Under it, one line from `monitor.ts status`: CPU, memory, slots and pool size. After a container reset, rebuild everything from git, never from memory:
the registry on the integration branch, `pnpm tsx scripts/worktree.ts list`; then restart the monitoring and run the dispatch loop.
