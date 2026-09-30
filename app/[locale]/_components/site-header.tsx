import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { APP_HOME } from "@/lib/app-config";
import { getCurrentViewer } from "@/lib/services/session";
import { LocaleSwitcher } from "./locale-switcher";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations("common");
  const viewer = await getCurrentViewer();
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
        <nav className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            {t("appName")}
          </Link>
          {viewer ? (
            <Link href={APP_HOME} className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.app")}
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          {viewer ? (
            <SignOutButton />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">{t("nav.signUp")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
