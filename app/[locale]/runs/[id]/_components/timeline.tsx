import { getTranslations } from "next-intl/server";
import type { TimelineStep } from "@/lib/services/timeline";
import { StepCard } from "./step-card";

export async function Timeline({ runId, steps }: { runId: string; steps: TimelineStep[] }) {
  const t = await getTranslations("timeline");
  if (steps.length === 0) return <p className="text-muted-foreground">{t("empty")}</p>;
  return (
    <ol className="space-y-3" aria-label={t("steps")}>
      {steps.map((step) => (
        <StepCard key={step.position} runId={runId} step={step} />
      ))}
    </ol>
  );
}
