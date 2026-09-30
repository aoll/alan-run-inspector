# Concept — Run Inspector

## Pitch

A small internal-style platform where an agent runs a task in the background and a reader can verify every step it took before acting on the result.

All data is fictional: the agent is simulated (recorded answers, no real model or real repository), and the demo says so on screen. It illustrates what the job offer describes; it makes no claim about how Alan's Hopper actually works.

## Why this company

The Hopper team's "trust and review" scope is about exposing tests, screenshots, previews, queries, sources and tool actions so people can inspect results before acting (`offer.md`). The mindset section says it plainly: "You care about whether people can understand and verify what an AI system did". The 2026 focus is "from AI tools you monitor to AI agents you trust" (`company.md`). Hopper is an **internal** platform for sensitive workloads: so the demo is an internal tool too, with no public page and every route behind a session.

## What the recruiter sees in 2 minutes

1. Sign in with the pre-filled demo account and start a task: "fix the failing invoice test".
2. The run starts in the background; its timeline fills in live: files read, tool calls, tests executed, sources cited, claims made.
3. Open the finished run: each step shows what went in, what came out and the evidence attached to it. A claim with no evidence is flagged "Unverified".
4. Approve or reject individual steps, with a private note; the run ends with a verdict ("accepted", "needs changes") that is recorded.
5. Reload, or come back later: the run, the decisions and the verdict are still there (durable, not tied to the tab); download the run archive.

## Bricks exercised

- **Queue**: a run is a long-running job whose events are produced in the background (pattern `queue-job`).
- **AI (mock) and streaming**: a bonus "Explain this step" streams a recorded explanation, labelled as generated and not verified (pattern `streaming-ai-route`).
- **Database and private DAL**: runs, steps and decisions belong to a user (pattern `private-dal-ownership`).
- **Security**: rate limit and bot guard on starting runs (pattern `rate-limit-bot-guard`).
- **Files**: the run's archive (JSON) stored as a file, downloadable by the owner (pattern `file-storage`).
- **i18n and UI**: English by default, French available; shadcn components for the timeline and review controls.

Not exercised on purpose: the public DAL and its cache (an internal tool has no public page), and any sharing between users (not needed to make the point).

## Scope estimate

About 3 features within the 60-minute budget for the business layer, leaving slack for the inspection experience itself: run model and start, live timeline, step review and verdict. Bonus: "Explain this step". Main risk: the timeline growing into a real agent engine. Mitigation: a handful of event kinds replayed from two recorded scenarios.

## Alternatives rejected

- **Connector Gateway** (permissions, confirmations, audit log for an agent's actions): matches the "MCP Gateway" and "security and authorization" lines, but the result is mostly a rules engine, less visual in two minutes, and it exercises fewer bricks (no queue).
- **Evals Board** (test cases replayed on two versions of a simulated agent, regressions, report): matches "evaluations", but it needs believable fixtures for two agent versions; weak fixtures would make the results look fake, so the risk of overrun is highest.
- **Sharing a run** (a public receipt, then a read-only share with a colleague): dropped. A public link is the wrong signal for an internal platform, and sharing does not serve the point of the demo, which is the inspection itself.
