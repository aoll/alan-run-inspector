import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { APP_HOME } from "@/lib/app-config";
import { getCurrentViewer } from "@/lib/services/session";

// The button reads the session (dynamic): it streams under Suspense, the text stays static.
async function OpenTool() {
  const t = await getTranslations("landing");
  const viewer = await getCurrentViewer();
  return (
    <Button asChild>
      <Link href={viewer ? APP_HOME : "/sign-in"}>{t("cta")}</Link>
    </Button>
  );
}

// Minimal entry point: what the demo is, then the tool. Nothing usable without a session.
export default async function LandingPage() {
  const t = await getTranslations("landing");
  return (
    <section className="space-y-4 py-8">
      <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
      <div className="flex gap-3">
        <Suspense fallback={<div className="h-9 w-32" />}>
          <OpenTool />
        </Suspense>
      </div>
    </section>
  );
}
