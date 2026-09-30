import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { runSteps, runs } from "@/lib/db/schema";

// The archive of a run: what the owner's private JSON file contains. Explicit columns: neither `ipHash` nor
// `userId` is ever part of it. Shared by the consumer's system DAL and the owner's DAL, which pass `ownerId`.
export type RunArchive = {
  run: {
    id: string;
    title: string;
    scenario: string;
    status: string;
    verdict: string;
    createdAt: Date;
    finishedAt: Date | null;
  };
  steps: {
    position: number;
    kind: string;
    title: string;
    input: string;
    output: string;
    evidence: string | null;
    decision: string;
    note: string | null;
  }[];
};

export async function readArchive(runId: string, ownerId?: string): Promise<RunArchive | null> {
  const [run] = await db
    .select({
      id: runs.id,
      title: runs.title,
      scenario: runs.scenario,
      status: runs.status,
      verdict: runs.verdict,
      createdAt: runs.createdAt,
      finishedAt: runs.finishedAt,
    })
    .from(runs)
    .where(ownerId ? and(eq(runs.id, runId), eq(runs.userId, ownerId)) : eq(runs.id, runId));
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
