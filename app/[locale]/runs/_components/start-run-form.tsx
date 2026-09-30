"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useRouter } from "@/i18n/navigation";
import { startRunAction, type StartRunState } from "../_actions";

const IDLE: StartRunState = { status: "idle" };

// `scenarios` are the ids the server accepts; their labels come from the messages.
export function StartRunForm({ scenarios }: { scenarios: readonly string[] }) {
  const t = useTranslations("runs");
  const tErrors = useTranslations("common.errors");
  const locale = useLocale();
  const [state, action, pending] = useActionState(startRunAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <Label htmlFor="scenario">{t("start.scenario")}</Label>
        <NativeSelect id="scenario" name="scenario" defaultValue={scenarios[0]}>
          {scenarios.map((id) => (
            <NativeSelectOption key={id} value={id}>
              {t(`scenarios.${id}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {state.error === "invalid"
              ? t("errors.invalid")
              : state.error === "bot"
                ? tErrors("bot")
                : state.error === "unauthorized"
                  ? tErrors("unauthorized")
                  : state.error === "rateLimited"
                    ? t("errors.rateLimited")
                    : t("errors.failed")}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {t("start.submit")}
      </Button>
    </form>
  );
}

// While a run is queued or running, re-render the server data every 2 s; stops once nothing is pending.
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(timer);
  }, [active, router]);
  return null;
}
