import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Link, redirect } from "@/i18n/navigation";
import { NotFoundError } from "@/lib/errors";
import { runIdSchema } from "@/lib/schemas/runs";
import { getRunTimeline } from "@/lib/services/timeline";
import { getCurrentViewer } from "@/lib/services/session";
import { AutoRefresh } from "./_components/auto-refresh";
import { Timeline } from "./_components/timeline";

export default async function RunPage({ params }: PageProps<"/[locale]/runs/[id]">) {
  const { id } = await params;
  const locale = await getLocale();
  if (!(await getCurrentViewer())) return redirect({ href: "/sign-in", locale });
  if (!runIdSchema.safeParse(id).success) notFound();

  const { run, steps } = await getRunTimeline(id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [t, tRuns, format] = await Promise.all([getTranslations("timeline"), getTranslations("runs"), getFormatter()]);
  const active = run.status === "queued" || run.status === "running";

  return (
    <div className="space-y-6">
      <AutoRefresh active={active} />
      <Link href="/runs" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        {t("back")}
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{run.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant={run.status === "failed" ? "destructive" : "secondary"}>{tRuns(`status.${run.status}`)}</Badge>
          <span>
            {t("started", { date: format.dateTime(run.createdAt, { dateStyle: "medium", timeStyle: "short" }) })}
          </span>
          {run.archiveUrl ? (
            <a href={run.archiveUrl} className="text-primary underline" download>
              {t("downloadArchive")}
            </a>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{t("notice")}</p>
      </header>
      <Timeline runId={run.id} steps={steps} />
    </div>
  );
}
