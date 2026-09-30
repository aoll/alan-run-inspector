# F01 · Demo access and app home

Ref spec : `spec.md` › Users and roles, Journeys 1.1, Pages (`/`), Languages
Patterns : `auth-forms`, `protected-page`, `i18n-zone`
Briques : auth, i18n, UI
Dépend de : nothing
Estimation : 8 minutes
Vague : 1 (independent of F02)

## Acceptation

- After signing in, the reader lands on `/runs` (`APP_HOME`); the header links to it with the label "Runs" (fr: "Exécutions"), from `common.nav.app`.
- `pnpm db:seed` creates `demo@example.com` and is idempotent: running it twice leaves one account.
- With `DEMO_PREFILL=true` the sign-in form is pre-filled with the demo credentials; without it the fields are empty (a pure helper `demoCredentials(env)` returns `null` when the flag is off; unit test).
- The site is served in English without a prefix, French under `/fr` (default locale set at export; Playwright checks `/sign-in` in both).
- An anonymous visitor asking for `/runs` is sent to the sign-in page of their locale.
- The skeleton dashboard page and its `dashboard` message zone are gone.

## Périmètre

Files this feature may create or modify:

- `lib/app-config.ts` (`APP_HOME` = `/runs`)
- `lib/env.ts` (adds `DEMO_PREFILL`: explicitly allowed here), `.env.example`
- `scripts/seed.ts`
- `app/[locale]/(auth)/_components.tsx`, `app/[locale]/(auth)/sign-in/page.tsx`
- `lib/auth-demo.ts` (the `demoCredentials` helper) and its test
- `app/[locale]/dashboard/**` (deleted), `messages/{en,fr}/dashboard.json` (deleted), `i18n/zones.ts`
- `messages/{en,fr}/common.json` (the `nav.app` label)
- `e2e/smoke.spec.ts`

## Hors périmètre

The runs pages themselves (F02), any change to `lib/dal/session.ts`, sign-up flow changes, a second demo account.
