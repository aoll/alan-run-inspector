// Application tables. Add the demo's tables here, then `pnpm db:generate && pnpm db:migrate`.
// Timestamps are `timestamptz`. The Better Auth tables live in auth-schema.ts.
// No `import "server-only"`: drizzle-kit and tsx import this module outside a request.
import { index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const runScenario = pgEnum("run_scenario", ["fix-invoice-test", "rename-config-option"]);
export const runStatus = pgEnum("run_status", ["queued", "running", "done", "failed"]);
export const runVerdict = pgEnum("run_verdict", ["none", "accepted", "needs_changes"]);
export const runStepKind = pgEnum("run_step_kind", ["read", "tool_call", "test", "source", "claim"]);
export const runStepDecision = pgEnum("run_step_decision", ["pending", "approved", "rejected"]);

// One simulated agent run, played by the queue consumer. `ipHash` feeds the rate limit and never leaves the DAL.
export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    scenario: runScenario("scenario").notNull(),
    status: runStatus("status").notNull().default("queued"),
    verdict: runVerdict("verdict").notNull().default("none"),
    ipHash: text("ip_hash").notNull(),
    archiveUrl: text("archive_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("runs_user_created_idx").on(table.userId, table.createdAt),
    index("runs_ip_created_idx").on(table.ipHash, table.createdAt),
  ],
);

// One event of a run. Unique on (run, position): a redelivered queue message never duplicates a step.
export const runSteps = pgTable(
  "run_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    kind: runStepKind("kind").notNull(),
    title: text("title").notNull(),
    input: text("input").notNull(),
    output: text("output").notNull(),
    evidence: text("evidence"),
    decision: runStepDecision("decision").notNull().default("pending"),
    note: text("note"),
  },
  (table) => [unique("run_steps_run_position_unique").on(table.runId, table.position)],
);

// One event per rate-limited call that has no row of its own (e.g. "explain"), counted by user and by IP hash.
// Only the event is stored, never its content; the DAL purges events older than an hour on every write.
export const rateEvents = pgTable(
  "rate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_events_kind_created_idx").on(table.kind, table.createdAt)],
);
