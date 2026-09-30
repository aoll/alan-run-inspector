import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locale as localeParam } from "next/root-params";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "./_components/site-header";
import { ThemeProvider } from "./_components/theme-provider";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// "<page> · Run Inspector": pages give their own title, the app name alone is the default (landing).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: { template: `%s · ${t("appName")}`, default: t("appName") } };
}

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await localeParam();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <NextIntlClientProvider>
          <ThemeProvider>
            {/* The header reads the session (dynamic): it streams under Suspense, the rest stays static. */}
            <Suspense fallback={<div className="h-14 border-b" />}>
              <SiteHeader />
            </Suspense>
            <main className="mx-auto w-full max-w-4xl px-4 py-10">{children}</main>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
