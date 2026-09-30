# Global spec — Run Inspector

Ref: `concept.md`

## Goal

Show, in two minutes, one idea from the offer: a reader can **verify what an AI agent did** before acting on it. A simulated agent runs a task in the background; its timeline is inspectable step by step, unsupported claims are flagged, and the reader records a verdict.

Everything is fictional and says so on screen: the agent replays recorded scenarios, there is no real model or repository behind it, and no data comes from Alan.

## Principle: an internal tool has no public page

Every route of the tool requires a session, except sign-in and sign-up. There is no link that works without an account, no anonymous read, and therefore no public DAL and no cache of user data. (The recruiter-facing presentation pages — landing, making-of, source explorer — are the application package, outside the tool; they are separate from this spec.)

## Users and roles

- **Reader (signed in)**: starts runs, reviews steps, records a verdict. A single role: `user`. A reader only ever sees their own runs.
- **Demo account**: one seeded account, `demo@example.com`, pre-filled on the sign-in page so a recruiter never has to sign up.

## Journeys

1. **Demo script (2 minutes, the success criterion):**
   1. Sign in with the pre-filled demo account.
   2. Start a run from the scenario "Fix the failing invoice test".
   3. The run starts in the background; the timeline fills in step by step (files read, tool calls, tests, sources, claims).
   4. When it is done, open the steps: each shows what went in, what came out and its evidence. One claim ("no other caller is affected") has **no evidence** and is flagged "Unverified".
   5. Reject the unverified step with a private note, approve the others: the run's verdict becomes "Needs changes".
   6. Bonus: "Explain this step" streams a short explanation labelled "Generated, not verified".
   7. Reload, or come back later: the run, the decisions and the verdict are still there; download the run archive (JSON).
2. **Second scenario:** start "Rename a config option" (a clean run, every step has evidence): nothing is flagged, all steps can be approved, verdict "Accepted".
3. **Abuse:** starting runs too fast is refused with a clear message (rate limit).

## Data

| Entity  | Key fields                                                                                                                                                                                                 | Owner                        | Readable by    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------- |
| Run     | title, scenario (`fix-invoice-test`, `rename-config-option`), status (`queued`, `running`, `done`, `failed`), verdict (`none`, `accepted`, `needs_changes`), `ipHash`, `archiveUrl`, createdAt, finishedAt | the reader                   | its owner only |
| RunStep | run, position (unique per run), kind (`read`, `tool_call`, `test`, `source`, `claim`), title, input, output, `evidence` (nullable), decision (`pending`, `approved`, `rejected`), `note` (private)         | the reader (through the run) | its owner only |

Rule (service): a step is **unverified** when its kind is `claim` and its evidence is empty. It is derived, not stored.
Rule (service): the verdict is `needs_changes` as soon as one step is rejected, `accepted` when every step is approved, `none` otherwise.
Rule (DAL): every query is scoped to the owner; another user's run, or an unknown id, answers "not found". The DTOs never expose `ipHash`.

## Pages

| Route                       | Access                            | DAL                | Rendering                                                           |
| --------------------------- | --------------------------------- | ------------------ | ------------------------------------------------------------------- |
| `/sign-in`, `/sign-up`      | no session needed (the only ones) | none (Better Auth) | static shell                                                        |
| `/runs`                     | signed in                         | private            | dynamic under Suspense (`loading.tsx`)                              |
| `/runs/[id]`                | signed in, owner                  | private            | dynamic; refreshes every 2 s while the run is `queued` or `running` |
| `POST /api/queues/runs`     | queue only                        | system             | consumer of the `runs` topic                                        |
| `POST /api/explain` (bonus) | signed in                         | private            | streaming text                                                      |
| `GET /api/files/...`        | owner only                        | none (service)     | the run archive                                                     |

`/` redirects a signed-in reader to `/runs` and shows a minimal entry to the tool otherwise; the presentation landing is a separate concern.

## Bricks used

- **Auth**: email + password, one seeded demo account pre-filled on the sign-in page; the simulated magic link stays available. One role.
- **Database**: runs and steps; migrations regenerated for the demo. Steps are unique on (run, position) so a redelivered queue message never duplicates a step.
- **AI (mock)**: only the bonus "Explain this step" (recorded text per step kind, streamed). `AI_MODE=live` would call a model with the step's input and output.
- **Files**: at the end of a run, the consumer stores the archive (JSON of the run and its steps); only the owner can download it.
- **Queue**: a run is a job; the consumer plays the scenario's events with short delays and writes them progressively; idempotent on redelivery.
- **Security**: BotID and the Postgres rate limit on starting a run and on "Explain this step".
- **i18n**: English by default, French available. No hardcoded text.
- **UI**: shadcn components for the timeline (Card, Badge, Alert, Collapsible, Tabs, Tooltip, Skeleton, Button), no custom design system.
- **Public DAL and cache**: not used (see the principle above).

## Languages

`en` (default, unprefixed) and `fr`. Zones: `runs` (plus the template's `common` and `auth`). Scenario titles and step texts exist in both languages. The default locale is set at export time: `pnpm forge export --default-locale en`.

## Out of scope

- Any page or link usable without a session, and any cache of user data.
- Any sharing of a run between users.
- A real agent, a real model call in the default mode, real repositories or any data from Alan.
- Teams, roles beyond one, comments, editing or reordering steps.
- WebSockets or server-sent events for the timeline (polling is enough).
- PDF export, email delivery, notifications, billing, other sign-in providers.
- Mobile layout polish beyond what shadcn gives by default.

## Success criterion

The 2-minute demo script above passes end to end in a Playwright journey (steps 1 to 5 and 7; step 6 when the bonus is delivered), plus these checks:

- private DAL: another user cannot read or decide on a run; the DTOs have no `ipHash`;
- service: unverified rule and verdict rule;
- queue consumer: a redelivered message leaves the same steps;
- rate limit: the (N+1)th start in a minute is refused;
- every route of the tool answers a visitor without a session with a redirect to sign-in.

## Risks

- **The timeline turning into an agent engine.** Mitigation: five event kinds and two recorded scenarios, nothing else.
- **Consumer duration.** A run of about 8 events with delays must stay well under a function time limit on Vercel; writing events progressively keeps the UI alive even if it is cut. Budget at most ~6 s of simulated delay per run.
- **Budget.** Core of about 45 minutes (runs and queue, timeline, review and verdict), which leaves about 15 minutes of slack to polish the inspection experience itself; the bonus "Explain this step" is about 10 minutes and can be cut without touching the rest.
