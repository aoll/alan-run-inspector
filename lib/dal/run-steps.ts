import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { runSteps, runs } from "@/lib/db/schema";
import { requireViewer } from "./session";

export type StepDto = {
  position: number;
  kind: "read" | "tool_call" | "test" | "source" | "claim";
  title: string;
  input: string;
  output: string;
  evidence: string | null;
  decision: "pending" | "approved" | "rejected";
};

// Read only. Ownership goes through the run (`runs.user_id = viewer`): another user's run has no steps.
// Explicit columns: the private `note` never leaves the DAL here.
export async function listSteps(runId: string): Promise<StepDto[]> {
  const viewer = await requireViewer();
  return db
    .select({
      position: runSteps.position,
      kind: runSteps.kind,
      title: runSteps.title,
      input: runSteps.input,
      output: runSteps.output,
      evidence: runSteps.evidence,
      decision: runSteps.decision,
    })
    .from(runSteps)
    .innerJoin(runs, eq(runs.id, runSteps.runId))
    .where(and(eq(runSteps.runId, runId), eq(runs.userId, viewer.id)))
    .orderBy(asc(runSteps.position));
}
