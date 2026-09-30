import { getTranslations } from "next-intl/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { TimelineStep } from "@/lib/services/timeline";
import { StepCard } from "./step-card";

export async function Timeline({
  runId,
  steps,
  status,
}: {
  runId: string;
  steps: TimelineStep[];
  status: "queued" | "running" | "done" | "failed";
}) {
  const t = await getTranslations("timeline");
  const failed =
    status === "failed" ? (
      <Alert variant="destructive">
        <AlertTitle>{t("failed.title")}</AlertTitle>
        <AlertDescription>
          {t(steps.length === 0 ? "failed.descriptionNoSteps" : "failed.description")}
        </AlertDescription>
      </Alert>
    ) : null;
  if (steps.length === 0) return failed ?? <p className="text-muted-foreground">{t("empty")}</p>;
  return (
    <div className="space-y-3">
      <ol className="space-y-3" aria-label={t("steps")}>
        {steps.map((step) => (
          <StepCard key={step.position} runId={runId} step={step} />
        ))}
      </ol>
      {failed}
    </div>
  );
}
