import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { APP_HOME } from "@/lib/app-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.errors");
  return { title: t("notFoundTitle") };
}

// Rendered inside the localized layout, so the text and the header follow the visitor's locale. The same page
// answers an unknown id, an invalid id and another user's run: nothing tells them apart.
export default async function NotFound() {
  const t = await getTranslations("common.errors");
  return (
    <section className="space-y-4 py-8">
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFound")}</p>
      <Button asChild variant="outline">
        <Link href={APP_HOME}>{t("notFoundBack")}</Link>
      </Button>
    </section>
  );
}
