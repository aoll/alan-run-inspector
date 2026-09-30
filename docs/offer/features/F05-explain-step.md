# F05 · Explain this step (bonus)

Ref spec : `spec.md` › Journeys 1.6, Pages (`POST /api/explain`), Bricks (AI, security)
Patterns : `streaming-ai-route`, `rate-limit-bot-guard`, `i18n-zone`
Briques : AI (mock), security, i18n, UI
Dépend de : F03
Estimation : 10 minutes (the first cut if time runs short)
Vague : 3 (parallel with F04: it only fills `StepActions` through its own component)

## Acceptation

- "Explain this step" streams a recorded explanation in the current locale (mock mode), labelled "Generated, not verified"; nothing is stored.
- `POST /api/explain` takes `{ runId, position, locale }` (Zod; a step is addressed by its run and position); an anonymous caller gets 401, another user's step or an unknown step gets 404, an invalid body gets 400.
- The route goes through the bot guard and its own Postgres rate limit, per call (each call is recorded as an event in `rate_events`, purged after an hour; no content is stored), by user and by IP hash like starting a run: the (N+1)th call within a minute gets 429 and the UI shows a translated message; BotID's path list includes `/api/explain`.
- One recorded explanation per step kind exists in `en` and `fr`; a parity test checks that both locales cover every kind.
- Playwright: click "Explain this step" on a step and see the explanation and its "Generated, not verified" label.

## Périmètre

Files this feature may create or modify:

- `app/api/explain/route.ts`
- `lib/services/explain.ts`, its tests, `lib/dal/rate-events.ts` and its test, `lib/db/schema.ts` (table `rate_events`), `drizzle/**`
- `fixtures/explanations.json`
- `app/[locale]/runs/[id]/_components/explain-step.tsx` (rendered inside `StepActions`)
- `instrumentation-client.ts` (the `/api/explain` path)
- `messages/{en,fr}/explain.json`, `i18n/zones.ts` (one line: `explain`)
- `e2e/f05-explain.spec.ts`

## Hors périmètre

Storing explanations, a live model in tests, chat or follow-up questions, explaining a whole run.
