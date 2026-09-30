import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { APP_HOME } from "@/lib/app-config";

// Placeholder landing: replace it with the demo's own page (or the landing template).
export default async function LandingPage() {
  const t = await getTranslations("landing");
  return (
    <section className="space-y-4 py-8">
      <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href={APP_HOME}>{t("cta")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-up">{t("ctaSignUp")}</Link>
        </Button>
      </div>
    </section>
  );
}
