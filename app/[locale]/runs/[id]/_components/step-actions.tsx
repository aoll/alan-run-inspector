import type { TimelineStep } from "@/lib/services/timeline";
import { ExplainStep } from "./explain-step";

// Extension slot rendered in every step card. The review (decision, note) and the explain
// button are added here by their own features, each through its own file.
export function StepActions({ runId, step }: { runId: string; step: TimelineStep }) {
  return <ExplainStep runId={runId} position={step.position} />;
}
