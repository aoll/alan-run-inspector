# alan-run-inspector

Next.js demo built from the career-hub `demo-template`: auth, database, AI (mock or live), files, queue, security,
i18n (fr, en) and the full shadcn/ui set are wired. Business pages go on top.

## Run

```bash
pnpm install
cp .env.example .env.local        # then fill DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
pnpm db:migrate && pnpm db:seed   # seed: demo@example.com / demo-password-123
pnpm dev
```

`DEMO_PREFILL=true` pre-fills the sign-in form with the seeded demo account: it is on in `.env.example`, and **the deployed
demo must define it too** (Vercel environment variables), otherwise the fields are empty.

`AI_MODE=mock` streams recorded answers and `INFRA_MODE=local` stores files under `.data/` and runs the queue
in-process, so nothing external is needed. Set `AI_MODE=live` / `INFRA_MODE=vercel` for the real services.

## Architecture: entry → service → DAL

- **Entry** (`_actions.ts`, `route.ts`, `page.tsx`): parses input with Zod, calls a service. No query, no logic.
- **Service** (`lib/services/`): business logic. No `db`, no `next/*`.
- **Private DAL** (`lib/dal/`): the only code that imports `db`. Every function starts with `requireViewer()`, filters by owner, returns DTOs, is never cached.
- **Public DAL** (`lib/dal/public/`): data any visitor may read. Never imports the session, filters on the public flag inside the query, returns public DTOs, may be cached (`use cache` + `cacheTag`, `updateTag` in the action that writes).
- **System DAL**: callers without a user session by design (queue consumer, sign-in). List them in `lib/dal/architecture.test.ts`.

Enforced by lint (`config/eslint`) and by `lib/dal/architecture.test.ts`.

## Adding a business feature

1. Tables in `lib/db/schema.ts`, then `pnpm db:generate && pnpm db:migrate`.
2. DAL module: `requireViewer()` first, owner filter in the query, DTO out.
3. Service with the business rules; throw `NotFoundError` / `UnauthorizedError` / `RateLimitedError`.
4. Zod schema in `lib/schemas/`, then the action / route / page.
5. Text: a zone in `i18n/zones.ts` plus `messages/<locale>/<zone>.json` in every locale. No hardcoded text.
6. Tests: DAL ownership, service rules, one Playwright journey (`pnpm test:e2e`).

## Commands

`pnpm check` runs typecheck, lint, tests and format check.
