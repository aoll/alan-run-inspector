import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCredentials } from "@/lib/auth-demo";
import { env } from "@/lib/env";
import { SignInForm } from "../_components";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signIn");
  return { title: t("title") };
}

export default async function SignInPage() {
  const t = await getTranslations("auth.signIn");
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1}>
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm defaults={demoCredentials(env)} />
      </CardContent>
    </Card>
  );
}
