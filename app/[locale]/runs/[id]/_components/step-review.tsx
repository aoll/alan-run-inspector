import { getStepReview } from "@/lib/services/review";
import type { TimelineStep } from "@/lib/services/timeline";
import { ReviewForm } from "./review-form";

// Rendered inside StepActions. Reads the private note through the review service only, never through the step DTO.
export async function StepReview({ runId, step }: { runId: string; step: TimelineStep }) {
  const { decidable, note } = await getStepReview(runId, step.position);
  if (!decidable) return null;
  return <ReviewForm runId={runId} position={step.position} decision={step.decision} note={note ?? ""} />;
}
