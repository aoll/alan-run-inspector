import type { TimelineStep } from "@/lib/services/timeline";

// Extension slot rendered in every step card. Empty on purpose: the review (decision, note) and the explain
// button are added here by their own features, each through its own file.
export function StepActions(_props: { runId: string; step: TimelineStep }) {
  return null;
}
