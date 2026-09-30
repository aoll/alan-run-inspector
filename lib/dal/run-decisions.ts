import "server-only";
import { and, eq, exists } from "drizzle-orm";
import { db } from "@/lib/db";
import { runSteps, runs } from "@/lib/db/schema";
import { requireViewer } from "./session";

type Verdict = "none" | "accepted" | "needs_changes";

// Ownership goes through the run: `runs.user_id = viewer` sits in every query, so another user's step is
// "not found" (false) and nothing is written.
export async function decideStep(input: {
  runId: string;
  position: number;
  decision: "approved" | "rejected";
  note: string | null;
}): Promise<boolean> {
  const viewer = await requireViewer();
  const updated = await db
    .update(runSteps)
    .set({ decision: input.decision, note: input.note })
    .where(
      and(
        eq(runSteps.runId, input.runId),
        eq(runSteps.position, input.position),
        exists(
          db
            .select({ id: runs.id })
            .from(runs)
            .where(and(eq(runs.id, input.runId), eq(runs.userId, viewer.id))),
        ),
      ),
    )
    .returning({ id: runSteps.id });
  return updated.length > 0;
}

export async function setVerdict(runId: string, verdict: Verdict): Promise<boolean> {
  const viewer = await requireViewer();
  const updated = await db
    .update(runs)
    .set({ verdict })
    .where(and(eq(runs.id, runId), eq(runs.userId, viewer.id)))
    .returning({ id: runs.id });
  return updated.length > 0;
}

// The private note, read back for the owner only. It is returned by this function alone: no shared DTO carries it.
export async function getStepNote(runId: string, position: number): Promise<string | null> {
  const viewer = await requireViewer();
  const [row] = await db
    .select({ note: runSteps.note })
    .from(runSteps)
    .innerJoin(runs, eq(runs.id, runSteps.runId))
    .where(and(eq(runSteps.runId, runId), eq(runSteps.position, position), eq(runs.userId, viewer.id)));
  return row?.note ?? null;
}
