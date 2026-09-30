# Alan

Every claim carries its source, or "not verified". Figures differ between sources and dates: both are given.

## What it does

- Health insurance that integrates insurance, prevention and care in one user experience; markets: France, Spain, Belgium, Canada. Source: the offer itself (see `offer.md`).
- Scale according to the offer: 40K+ companies, 1M+ members, €800M+ ARR, 1000+ people. Source: `offer.md`.
- Scale according to the press (March 2026): about 740 employees, 1 million members, 2025 ARR of €785M (+53%), €5B valuation after a €100M Series G led by Index Ventures, operating profitability in France, target of about €1.16B ARR in 2026. Source: [TechCrunch, 2026-03-11](https://techcrunch.com/2026/03/11/health-insurance-startup-alan-reaches-e5b-valuation/) (opened and read).
- A larger round (€480M, valuation about €5.5B) was reported in June 2026. Source: [Tech.eu, 2026-06-25](https://tech.eu/2026/06/25/french-health-insurance-outfit-alan-agrees-eur480m-funding-round/) and Trending Topics: **not verified** (only search snippets read, the articles were not opened).

## Product and tech

- Stack, per the offer: Python/Flask, React, React Native, PostgreSQL, one monorepo, daily deploys, distributed ownership ("you build it, you own it").
- Hopper, the target team, is "Alan's internal agentic AI platform and every Alaner's AI companion": a platform with a product on top. It started as a coding agent that lets anyone at Alan ship code. Scope listed in the offer: durable AI sessions reachable from web, Slack, Linear and GitHub; agent runtime and orchestration (control plane, harness, model routing, long-running execution, recovery, isolated sandboxes); an MCP Gateway (identity, credentials, permissions, confirmations, sensitivity, audit); skills, automations and artifacts; trust and review (evaluations, tests, screenshots, previews, queries, sources, tool actions). Source: `offer.md`.
- 2026 focus, per the offer: "from AI tools you monitor to AI agents you trust": managed agent pools, sandboxed environments, autonomous testing, CI auto-fix, HDS-compatible infrastructure for sensitive workloads (HDS: the French certification for hosting health data), stronger evaluations, results people can inspect before acting. Source: `offer.md`.
- The offer links an article on how the first version of Hopper was built and articles on engineering life and career path at Alan: **not read** (links not followed). No public engineering write-up of Hopper was found by search.
- Consumer AI: "Mo", an AI health assistant added to the chat for members (reported as launched late 2024 for 680K members). **Not verified** (search snippet only).
- Mistral is reported as a partner powering part of the platform, and per-member admin costs down 28% in 2023. Source: [Pathfounders, 2026-06-25](https://pathfounders.com/p/internal-ai-usage-has-given-health-insurer-alan) (opened; the article says nothing about internal coding agents).

## Culture signals

- "Those who make product decisions are the same ones who build them"; "we move fast, with a lot of ownership". Source: `offer.md`.
- "We hire people, not roles": applying without ticking every box is encouraged; you may join a different engineering team than the one you applied to. Source: `offer.md`.
- Remote flexibility, but "we value in-person collaboration". Source: `offer.md`.

## Hooks for a demo

Ideas tied to what the offer says the team cares about; none is a claim about how Alan's systems really work.

1. **Run inspector**: after an agent run, show what it did (tool actions, sources, queries, tests) so a reader can verify before acting: the "trust and review" scope.
2. **Connector gateway**: a small gateway with per-user permissions, confirmation for sensitive actions and an audit log: the "MCP Gateway" scope.
3. **Durable sessions**: long-running agent sessions that survive a closed tab, are resumable and observable from a web view: the "durable sessions / recovery" scope.
4. **Evals board**: a set of recorded test cases run against a mock agent with pass/fail, regressions and cost: the "evaluations" scope.
5. **Non-engineer to pull request**: someone without code skills describes a change, sees a preview and the checks before it is proposed: the "non-engineers open pull requests" line.

## Caution: namesakes

Searches for "Alan" return unrelated products (for example `tryalan.ai`, `aiden-platform.com`, "the control plane for software delivery"). They are not the health-insurance company and were ignored.

## Sources

- [Job posting, Ashby](https://jobs.ashbyhq.com/alan/a5a9392e-76b4-4fad-bba5-357f57bacca5): the offer, retrieved through Ashby's public API.
- [TechCrunch, 2026-03-11](https://techcrunch.com/2026/03/11/health-insurance-startup-alan-reaches-e5b-valuation/): valuation, headcount, ARR, geography, profitability.
- [Pathfounders, 2026-06-25](https://pathfounders.com/p/internal-ai-usage-has-given-health-insurer-alan): Mistral partnership, admin-cost figure.
- [Tech.eu, 2026-06-25](https://tech.eu/2026/06/25/french-health-insurance-outfit-alan-agrees-eur480m-funding-round/): funding round, snippet only.
