import { ChevronDownIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TimelineStep } from "@/lib/services/timeline";
import { StepActions } from "./step-actions";

export async function StepCard({ runId, step }: { runId: string; step: TimelineStep }) {
  const t = await getTranslations("timeline");
  const sections = [
    { key: "input", body: step.input },
    { key: "output", body: step.output },
    { key: "evidence", body: step.evidence?.trim() ? step.evidence : null },
  ] as const;
  return (
    <li data-testid="step" data-unverified={step.unverified}>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <span className="text-sm text-muted-foreground">{step.position}</span>
          <Badge variant="outline">{t(`kind.${step.kind}`)}</Badge>
          <CardTitle className="text-base">{step.title}</CardTitle>
          {step.unverified ? <Badge variant="destructive">{t("unverified")}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map(({ key, body }) => (
            <Collapsible key={key} defaultOpen>
              <CollapsibleTrigger className="group flex items-center gap-1 text-sm font-medium hover:underline">
                <ChevronDownIcon className="size-4 transition-transform group-data-[state=closed]:-rotate-90" />
                {t(key)}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{body ?? t("noEvidence")}</p>
              </CollapsibleContent>
            </Collapsible>
          ))}
          <div data-slot="step-actions">
            <StepActions runId={runId} step={step} />
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
