import "server-only";
import { listSteps, type StepDto } from "@/lib/dal/run-steps";
import { getRun, type RunDto } from "@/lib/dal/runs";
import { NotFoundError } from "@/lib/errors";

export type TimelineStep = StepDto & { unverified: boolean };
export type RunTimeline = { run: RunDto; steps: TimelineStep[] };

// Rule: a step is unverified when it is a claim and its evidence is empty (null or blank). Derived, never stored.
export function isUnverified(step: Pick<StepDto, "kind" | "evidence">): boolean {
  return step.kind === "claim" && (step.evidence ?? "").trim() === "";
}

// Another user's run and an unknown id are the same "not found" (the DAL scopes both queries to the viewer).
export async function getRunTimeline(runId: string): Promise<RunTimeline> {
  const run = await getRun(runId);
  if (!run) throw new NotFoundError("Run");
  const steps = await listSteps(runId);
  return { run, steps: steps.map((step) => ({ ...step, unverified: isUnverified(step) })) };
}
