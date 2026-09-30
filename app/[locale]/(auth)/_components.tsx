"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { APP_HOME } from "@/lib/app-config";
import { authClient } from "@/lib/auth-client";
import type { DemoCredentials } from "@/lib/auth-demo";
import { signInSchema, signUpSchema } from "@/lib/schemas/auth";
import { requestMagicLinkAction, type MagicLinkState } from "./_actions";

const IDLE: MagicLinkState = { status: "idle" };

function useCredentialsForm(mode: "signIn" | "signUp") {
  const router = useRouter();
  const [error, setError] = useState<"invalid" | "failed" | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    const values = Object.fromEntries(formData) as Record<string, string>;
    const parsed = (mode === "signIn" ? signInSchema : signUpSchema).safeParse(values);
    if (!parsed.success) return setError("invalid");
    setPending(true);
    const result =
      mode === "signIn"
        ? await authClient.signIn.email({ email: parsed.data.email, password: parsed.data.password })
        : await authClient.signUp.email(signUpSchema.parse(values));
    setPending(false);
    if (result.error) return setError("failed");
    router.push(APP_HOME);
    router.refresh();
  }
  return { submit, error, pending };
}

export function SignInForm({ defaults }: { defaults: DemoCredentials | null }) {
  const t = useTranslations("auth");
  // React resets an uncontrolled form once its action ends: the email is kept in state so a failed attempt
  // does not empty it (the demo pre-fill seeds it; the password is deliberately left to be retyped).
  const [email, setEmail] = useState(defaults?.email ?? "");
  const { submit, error, pending } = useCredentialsForm("signIn");
  const [magic, magicAction, magicPending] = useActionState(requestMagicLinkAction, IDLE);

  return (
    <div className="space-y-6">
      <form action={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("fields.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("fields.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue={defaults?.password}
            required
          />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {t("signIn.submit")}
        </Button>
      </form>
      <form action={magicAction} className="space-y-3 border-t pt-6">
        <Input name="email" type="email" aria-label={t("fields.email")} required />
        <Button type="submit" variant="outline" className="w-full" disabled={magicPending}>
          {t("magicLink.button")}
        </Button>
        {magic.status === "sent" ? (
          <Alert>
            <AlertDescription className="space-y-2">
              <p>{t("magicLink.sent")}</p>
              {magic.url ? (
                <a className="text-primary underline" href={magic.url}>
                  {t("magicLink.open")}
                </a>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        {magic.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription>{t("errors.failed")}</AlertDescription>
          </Alert>
        ) : null}
      </form>
      <p className="text-sm text-muted-foreground">
        {t("signIn.noAccount")}{" "}
        <Link href="/sign-up" className="text-primary underline">
          {t("signIn.toSignUp")}
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const t = useTranslations("auth");
  const { submit, error, pending } = useCredentialsForm("signUp");
  return (
    <div className="space-y-6">
      <form action={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("fields.name")}</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("fields.email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("fields.password")}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {t("signUp.submit")}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        {t("signUp.haveAccount")}{" "}
        <Link href="/sign-in" className="text-primary underline">
          {t("signUp.toSignIn")}
        </Link>
      </p>
    </div>
  );
}
