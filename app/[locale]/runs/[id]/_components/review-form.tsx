"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NOTE_MAX_LENGTH } from "@/lib/schemas/review";
import { decideStepAction, type DecideStepState } from "../_actions";

const IDLE: DecideStepState = { status: "idle" };

export function ReviewForm(props: {
  runId: string;
  position: number;
  decision: "pending" | "approved" | "rejected";
  note: string;
}) {
  const t = useTranslations("review");
  const [state, action, pending] = useActionState(decideStepAction, IDLE);
  const noteId = `note-${props.position}`;
  return (
    <form action={action} className="mt-3 space-y-2 border-t pt-3" data-testid="review">
      <input type="hidden" name="runId" value={props.runId} />
      <input type="hidden" name="position" value={props.position} />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t("decision")}</span>
        <Badge variant={props.decision === "rejected" ? "destructive" : "outline"} data-testid="decision">
          {t(`decisions.${props.decision}`)}
        </Badge>
      </div>
      <div className="space-y-1">
        <Label htmlFor={noteId}>{t("note")}</Label>
        <Textarea
          id={noteId}
          name="note"
          defaultValue={props.note}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={t("notePlaceholder")}
        />
        <p className="text-xs text-muted-foreground">{t("noteHint", { max: NOTE_MAX_LENGTH })}</p>
      </div>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{t(`errors.${state.error}`)}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" name="decision" value="approved" size="sm" variant="outline" disabled={pending}>
          {t("approve")}
        </Button>
        <Button type="submit" name="decision" value="rejected" size="sm" variant="destructive" disabled={pending}>
          {t("reject")}
        </Button>
      </div>
    </form>
  );
}
