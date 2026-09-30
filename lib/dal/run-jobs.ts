import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { runSteps, runs } from "@/lib/db/schema";

// SYSTEM DAL: called only by the queue consumer (app/api/queues/runs), which has no user session.
// The consumer authenticates the message itself (Vercel's signature, or the local shared secret), so
// these functions take a run id instead of a viewer. Never call them from a user-facing entry.

export type RunJob = { id: string; userId: string; scenario: "fix-invoice-test" | "rename-config-option" };
export type RunStepInput = {
  position: number;
  kind: "read" | "tool_call" | "test" | "source" | "claim";
  title: string;
  input: string;
  output: string;
  evidence: string | null;
};
export type RunArchive = {
  run: { id: string; title: string; scenario: string; status: string; createdAt: Date };
  steps: (RunStepInput & { decision: string; note: string | null })[];
};

// Marks the run running and returns what the player needs; null when there is nothing left to do (unknown
// id, or already done or failed: a redelivered message must not replay a finished run).
export async function startRunJob(runId: string): Promise<RunJob | null> {
  const [row] = await db
    .update(runs)
    .set({ status: "running" })
    .where(and(eq(runs.id, runId), ne(runs.status, "done"), ne(runs.status, "failed")))
    .returning({ id: runs.id, userId: runs.userId, scenario: runs.scenario });
  return row ?? null;
}

// Unique on (run, position): writing the same step twice keeps the first one.
export async function writeRunStep(runId: string, step: RunStepInput): Promise<void> {
  await db
    .insert(runSteps)
    .values({ runId, ...step })
    .onConflictDoNothing({ target: [runSteps.runId, runSteps.position] });
}

export async function getRunArchive(runId: string): Promise<RunArchive | null> {
  const [run] = await db
    .select({ id: runs.id, title: runs.title, scenario: runs.scenario, status: runs.status, createdAt: runs.createdAt })
    .from(runs)
    .where(eq(runs.id, runId));
  if (!run) return null;
  const steps = await db
    .select({
      position: runSteps.position,
      kind: runSteps.kind,
      title: runSteps.title,
      input: runSteps.input,
      output: runSteps.output,
      evidence: runSteps.evidence,
      decision: runSteps.decision,
      note: runSteps.note,
    })
    .from(runSteps)
    .where(eq(runSteps.runId, runId))
    .orderBy(asc(runSteps.position));
  return { run, steps };
}

export async function completeRunJob(runId: string, archiveUrl: string): Promise<void> {
  await db.update(runs).set({ status: "done", archiveUrl, finishedAt: new Date() }).where(eq(runs.id, runId));
}

export async function failRunJob(runId: string): Promise<void> {
  await db
    .update(runs)
    .set({ status: "failed", finishedAt: new Date() })
    .where(and(eq(runs.id, runId), ne(runs.status, "done")));
}
