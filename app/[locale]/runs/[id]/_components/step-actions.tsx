import type { TimelineStep } from "@/lib/services/timeline";
import { ExplainStep } from "./explain-step";
import { StepReview } from "./step-review";

// Extension slot rendered in every step card: each feature adds its own component here (review, explain).
export function StepActions({ runId, step }: { runId: string; step: TimelineStep }) {
  return (
    <>
      <StepReview runId={runId} step={step} />
      <ExplainStep runId={runId} position={step.position} />
    </>
  );
}
