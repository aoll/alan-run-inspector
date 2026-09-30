# F04 · Review and verdict

Ref spec : `spec.md` › Journeys 1.5 and 2, Data rule "verdict", Bricks (database)
Patterns : `server-action-form`, `private-dal-ownership`, `service-business-rules`, `i18n-zone`, `e2e-journey`
Briques : database, i18n, UI
Dépend de : F03
Estimation : 15 minutes
Vague : 3 (parallel with F05: it only fills `StepActions` through its own component)

## Acceptation

- The owner can approve or reject a step of a `done` run; rejecting accepts a private note of at most 500 characters (Zod); the decision and the note are saved and survive a reload.
- Verdict rule (service): every step approved gives `accepted`, at least one rejected gives `needs_changes`, otherwise `none`; it is recomputed after each decision and shown in the run header. Unit test over the three cases.
- Decisions are refused on a run that is not `done`, and on a step of another user's run or an unknown step (nothing is written, "not found").
- The note is shown to the owner only through the DTO; no other DTO carries it.
- Playwright: on `fix-invoice-test`, reject the "Unverified" step with a note, approve the others, see "Needs changes"; reload: still there. On `rename-config-option`, approve everything and see "Accepted".
- All text exists in `en` and `fr`.

## Périmètre

Files this feature may create or modify:

- `lib/dal/run-decisions.ts` (`decideStep`, `setVerdict`), its tests
- `lib/services/review.ts` (`decideStep`, `computeVerdict`), its tests
- `lib/schemas/review.ts` (decision input)
- `app/[locale]/runs/[id]/_actions.ts`
- `app/[locale]/runs/[id]/_components/step-review.tsx` (rendered inside `StepActions`), `verdict-badge.tsx`
- `messages/{en,fr}/review.json`, `i18n/zones.ts` (one line: `review`)
- `e2e/f04-review.spec.ts`

## Hors périmètre

The explain button (F05), reopening a decision history, comments between readers, sharing.
