# F02 · Runs and background execution

Ref spec : `spec.md` › Data (Run, RunStep), Journeys 1.2-1.3 and 2 and 3, Pages (`/runs`, `POST /api/queues/runs`), Bricks (database, queue, files, security)
Patterns : `private-dal-ownership`, `queue-job`, `file-storage`, `server-action-form`, `rate-limit-bot-guard`, `service-business-rules`, `protected-page`, `i18n-zone`
Briques : database, queue, files, security, i18n, UI
Dépend de : nothing (F01 can run in parallel)
Estimation : 20 minutes
Vague : 1

## Acceptation

- Starting a run from `/runs` (choose a scenario, submit) creates a `queued` run owned by the reader, enqueues a message on the `runs` topic and shows the run in the list with its status.
- The queue consumer plays the scenario: it writes the steps in position order with short delays (at most 6 s in total), sets the run `running` then `done`.
- Redelivery is harmless: delivering the same message twice leaves exactly the same steps (unique on run and position) and the run `done`.
- A message delivered more than 5 times marks the run `failed` instead of retrying forever.
- Once the run is `done`, the consumer stores a JSON archive of the finished run and its steps under `runs/<userId>/<runId>.json` and records `archiveUrl`; each review decision (F04) rewrites it (verdict, decisions, private notes); it never contains `ipHash` or `userId`.
- Two scenarios exist, `fix-invoice-test` (contains one claim without evidence) and `rename-config-option` (every step has evidence), with titles and texts in `en` and `fr`; an unknown scenario in the form is rejected by Zod.
- Rate limit: the (N+1)th start within one minute, for the same user or the same IP hash, is refused with a translated message and nothing is created; the bot guard protects the start action (the BotID path list includes the page it posts to).
- DAL: another user cannot see a run (`getRun` returns null, the list excludes it); the run DTO has no `ipHash`; `run-jobs` is registered as a system DAL in `lib/dal/architecture.test.ts`.
- An anonymous visitor cannot start a run.

## Périmètre

Files this feature may create or modify:

- `lib/db/schema.ts` (tables `runs`, `run_steps`), `drizzle/**` (new migration)
- `lib/dal/runs.ts`, `lib/dal/run-jobs.ts` (system DAL for the consumer), their tests, `lib/dal/architecture.test.ts` (system list only)
- `lib/schemas/runs.ts`, `lib/services/runs.ts`, `lib/services/archive.ts`, `lib/dal/run-archive.ts`, `lib/dal/internal/archive-query.ts`, their tests
- `fixtures/runs/**` (the two scenarios, both languages)
- `app/[locale]/runs/page.tsx`, `app/[locale]/runs/loading.tsx`, `app/[locale]/runs/_actions.ts`, `app/[locale]/runs/_components/start-run-form.tsx`
- `app/api/queues/runs/route.ts`, `vercel.json` (the `runs` trigger)
- `instrumentation-client.ts` (the start action's path)
- `messages/{en,fr}/runs.json`, `i18n/zones.ts` (one line: `runs`)

## Hors périmètre

The run page and its timeline (F03), decisions and verdict (F04), explanations (F05), the archive download link (F03), any real agent.
