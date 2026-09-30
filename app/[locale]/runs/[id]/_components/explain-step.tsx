"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Streams the explanation from /api/explain as plain text and shows it while it arrives. Nothing is stored.
export function ExplainStep({ runId, position }: { runId: string; position: number }) {
  const t = useTranslations("explain");
  const tErrors = useTranslations("common.errors");
  const locale = useLocale();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function explain() {
    setPending(true);
    setText("");
    setError(null);
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId, position, locale }),
      });
      if (response.status === 429) return void setError(t("rateLimited"));
      if (response.status === 403) return void setError(tErrors("bot"));
      if (!response.ok || !response.body) return void setError(t("failed"));
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((current) => current + value);
      }
    } catch {
      setError(t("failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={explain} disabled={pending}>
        {pending ? t("generating") : t("button")}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {text ? (
        <div className="space-y-1" data-testid="explanation">
          <Badge variant="secondary">{t("label")}</Badge>
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        </div>
      ) : null}
    </div>
  );
}
