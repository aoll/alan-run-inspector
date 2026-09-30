import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Link, redirect } from "@/i18n/navigation";
import { NotFoundError } from "@/lib/errors";
import { runIdSchema } from "@/lib/schemas/runs";
import { archiveKey } from "@/lib/services/archive";
import { getRunTimeline } from "@/lib/services/timeline";
import { getCurrentViewer } from "@/lib/services/session";
import { runTitle } from "../run-title";
import { AutoRefresh } from "./_components/auto-refresh";
import { Timeline } from "./_components/timeline";
import { VerdictBadge } from "./_components/verdict-badge";

// The title is the run page's only once the run is known to be readable: an unknown id, an invalid id and another
// user's run (and the anonymous redirect) all get the not-found title, identical for the three.
export async function generateMetadata({ params }: PageProps<"/[locale]/runs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [t, tCommon] = await Promise.all([getTranslations("timeline"), getTranslations("common.errors")]);
  const readable =
    runIdSchema.safeParse(id).success &&
    (await getRunTimeline(id).then(
      () => true,
      () => false,
    ));
  return { title: readable ? t("pageTitle") : tCommon("notFoundTitle") };
}

export default async function RunPage({ params }: PageProps<"/[locale]/runs/[id]">) {
  const { id } = await params;
  const locale = await getLocale();
  const viewer = await getCurrentViewer();
  if (!viewer) return redirect({ href: "/sign-in", locale });
  if (!runIdSchema.safeParse(id).success) notFound();

  const { run, steps } = await getRunTimeline(id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [t, tRuns, format] = await Promise.all([getTranslations("timeline"), getTranslations("runs"), getFormatter()]);
  // The download is rebuilt from the database by the files route, so a finished run always has its link.
  const archiveHref = run.status === "done" ? `/api/files/${archiveKey(viewer.id, run.id)}` : null;
  const active = run.status === "queued" || run.status === "running";

  return (
    <div className="space-y-6">
      <AutoRefresh active={active} />
      <Link href="/runs" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        {t("back")}
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{runTitle(tRuns, run)}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant={run.status === "failed" ? "destructive" : "secondary"}>{tRuns(`status.${run.status}`)}</Badge>
          <VerdictBadge verdict={run.verdict} />
          <span>
            {t("started", { date: format.dateTime(run.createdAt, { dateStyle: "medium", timeStyle: "short" }) })}
          </span>
          {archiveHref ? (
            <a href={archiveHref} className="text-primary underline" download>
              {t("downloadArchive")}
            </a>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{t("notice")}</p>
      </header>
      <Timeline runId={run.id} steps={steps} status={run.status} />
    </div>
  );
}
