# Features — Run Inspector

Waves group the features that can be built at the same time: features of a wave depend only on earlier waves and have disjoint file scopes. Each feature owns its message zone, its E2E file, its DAL and service files. The only shared files are additive one-liners, resolved by the orchestrator at merge time: `i18n/zones.ts` (one zone per feature) and `instrumentation-client.ts` (F02 and F05 each add one path).

| Feature                   | Depends on | Estimate | Wave | Status |
| ------------------------- | ---------- | -------- | ---- | ------ |
| F01-demo-access           | —          | 8 min    | 1    | to do  |
| F02-runs-and-execution    | —          | 20 min   | 1    | to do  |
| F03-timeline-and-evidence | F02        | 15 min   | 2    | to do  |
| F04-review-and-verdict    | F03        | 15 min   | 3    | to do  |
| F05-explain-step (bonus)  | F03        | 10 min   | 3    | to do  |

Core total: 58 min (F01 to F04), within the 60-minute budget. With the bonus: 68 min; F05 is the first cut.

Sequential order: F01, F02, F03, F04, then F05.
Critical path when built in parallel: F02, F03, F04 (50 min); F01 and F05 run beside it.
