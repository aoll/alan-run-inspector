# F03 · Timeline and evidence

Ref spec : `spec.md` › Journeys 1.3-1.4 and 1.7, Data rule "unverified", Pages (`/runs/[id]`, `GET /api/files/...`)
Patterns : `protected-page`, `private-dal-ownership`, `service-business-rules`, `queue-job`, `file-storage`, `i18n-zone`
Briques : database, files, i18n, UI
Dépend de : F02
Estimation : 15 minutes
Vague : 2

## Acceptation

- `/runs/[id]` shows, for the owner, the run header (title translated from `scenario` in the current locale, status) and its steps ordered by position; each step shows its kind, title and collapsible input, output and evidence.
- A step is "Unverified" exactly when it is a claim with no evidence: service test over every step kind, with and without evidence.
- While the run is `queued` or `running` the page refreshes every 2 seconds and steps appear without a manual reload; the refresh stops when the run is `done` or `failed` (Playwright).
- The owner sees a "Download archive" link when `archiveUrl` exists; the file is valid JSON (`application/json`) containing the steps as reviewed, rebuilt from the database on each download (owner only) so a failed storage write never leaves it missing or outdated, and a finished run always shows the link; another user asking for that file gets "not found".
- A `failed` run shows an explicit translated failure message (and that a new run can be started from the list) instead of the empty-timeline text.
- Another user's run and an unknown id both answer the same translated "not found" page (HTTP status limit: see the note below); an anonymous visitor is redirected to sign-in.
- Each step card renders an actions area (`StepActions`) that F04 and F05 fill; without them it is empty.
- All text exists in `en` and `fr` (parity test already in the template).
- Playwright: start the scenario `fix-invoice-test`, see the steps appear, see exactly one "Unverified" step.

## Périmètre

Files this feature may create or modify:

- `app/[locale]/runs/[id]/page.tsx`, `app/[locale]/runs/[id]/loading.tsx`
- `app/[locale]/runs/[id]/_components/` (`timeline.tsx`, `step-card.tsx`, `step-actions.tsx` as an empty slot, `auto-refresh.tsx`)
- `lib/services/timeline.ts` (`isUnverified`, `getRunTimeline`), its tests
- `lib/dal/run-steps.ts` (`listSteps`, read only; it reuses `getRun` from F02's `lib/dal/runs.ts`), its tests
- `messages/{en,fr}/timeline.json`, `i18n/zones.ts` (one line: `timeline`)
- `e2e/f03-timeline.spec.ts`

## Hors périmètre

Decisions and verdict (F04), the explain button (F05), editing steps, sharing.

Note: with Cache Components the not-found page streams after `loading.tsx`, so its HTTP status stays 200 (the page carries `noindex`); the app is behind a sign-in, so this is accepted.
