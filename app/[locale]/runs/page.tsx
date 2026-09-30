import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SCENARIO_IDS } from "@/fixtures/runs";
import { Link, redirect } from "@/i18n/navigation";
import { listRuns } from "@/lib/services/runs";
import { getCurrentViewer } from "@/lib/services/session";
import { AutoRefresh, StartRunForm } from "./_components/start-run-form";
import { runTitle } from "./run-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("runs");
  return { title: t("pageTitle") };
}

export default async function RunsPage() {
  const locale = await getLocale();
  if (!(await getCurrentViewer())) return redirect({ href: "/sign-in", locale });

  const [t, format, runs] = await Promise.all([getTranslations("runs"), getFormatter(), listRuns()]);
  const active = runs.some((run) => run.status === "queued" || run.status === "running");
  return (
    <div className="space-y-8">
      <AutoRefresh active={active} />
      <Card>
        <CardHeader>
          <CardTitle>{t("start.title")}</CardTitle>
          <CardDescription>{t("start.notice")}</CardDescription>
        </CardHeader>
        <CardContent>
          <StartRunForm scenarios={SCENARIO_IDS} />
        </CardContent>
      </Card>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("list.title")}</h1>
        {runs.length === 0 ? <p className="text-muted-foreground">{t("list.empty")}</p> : null}
        {runs.map((run) => (
          <Link key={run.id} href={`/runs/${run.id}`} className="block">
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>{runTitle(t, run)}</CardTitle>
                <CardDescription>
                  {format.dateTime(run.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                </CardDescription>
                <div>
                  <Badge variant={run.status === "failed" ? "destructive" : "secondary"}>
                    {t(`status.${run.status}`)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
