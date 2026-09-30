import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentViewer } from "@/lib/services/session";

// The signed-in home (lib/app-config.ts: APP_HOME). The proxy only checks that a session cookie exists;
// the real check is here and, above all, in the DAL on every query.
export default async function DashboardPage() {
  const locale = await getLocale();
  const viewer = await getCurrentViewer();
  if (!viewer) return redirect({ href: "/sign-in", locale });

  const t = await getTranslations("dashboard");
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{t("title", { name: viewer.name })}</h1>
      <p className="text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
