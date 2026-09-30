import "server-only";
import { decideStep as saveDecision, getStepNote, setVerdict } from "@/lib/dal/run-decisions";
import { listSteps } from "@/lib/dal/run-steps";
import { getRun } from "@/lib/dal/runs";
import { refreshArchive } from "@/lib/services/archive";
import { NotFoundError } from "@/lib/errors";
import type { DecideStepInput } from "@/lib/schemas/review";

export type Verdict = "none" | "accepted" | "needs_changes";

export class RunNotDoneError extends Error {
  constructor() {
    super("Run is not done");
    this.name = "RunNotDoneError";
  }
}

// Rule: one rejected step gives needs_changes; every step approved gives accepted; anything else (including no step) none.
export function computeVerdict(steps: readonly { decision: "pending" | "approved" | "rejected" }[]): Verdict {
  if (steps.some((step) => step.decision === "rejected")) return "needs_changes";
  if (steps.length > 0 && steps.every((step) => step.decision === "approved")) return "accepted";
  return "none";
}

// Decisions are only taken on a finished run. Another user's run, an unknown run or an unknown step: not found.
export async function decideStep(input: Omit<DecideStepInput, "note"> & { note?: string }): Promise<Verdict> {
  const run = await getRun(input.runId);
  if (!run) throw new NotFoundError("Run");
  if (run.status !== "done") throw new RunNotDoneError();
  const note = input.decision === "rejected" ? (input.note ?? null) : null;
  const saved = await saveDecision({ runId: input.runId, position: input.position, decision: input.decision, note });
  if (!saved) throw new NotFoundError("Step");
  const verdict = computeVerdict(await listSteps(input.runId));
  await setVerdict(input.runId, verdict);
  // The decision is saved: a failed archive rewrite must not turn it into an error for the reader.
  await refreshArchive(input.runId).catch((error: unknown) => console.error("[review] archive refresh failed", error));
  return verdict;
}

// What the review component shows for one step: whether it can be decided, and the owner's private note.
export async function getStepReview(
  runId: string,
  position: number,
): Promise<{ decidable: boolean; note: string | null }> {
  const run = await getRun(runId);
  if (!run) throw new NotFoundError("Run");
  return { decidable: run.status === "done", note: await getStepNote(runId, position) };
}
