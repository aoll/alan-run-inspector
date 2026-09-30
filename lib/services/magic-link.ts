import "server-only";
import { APP_HOME } from "@/lib/app-config";
import { auth } from "@/lib/auth";
import { latestMagicLinkUrl } from "@/lib/dal/magic-link";
import { env } from "@/lib/env";

// The email is simulated (lib/auth.ts stores the link instead of sending it). In development the link is
// handed back so the demo can open it; in production it is never revealed (swap in a real email provider).
const canRevealLink = () => env.NODE_ENV !== "production" && env.INFRA_MODE === "local";

export async function requestMagicLink(input: { email: string; requestHeaders: Headers }): Promise<string | null> {
  await auth.api.signInMagicLink({
    body: { email: input.email, callbackURL: APP_HOME },
    headers: input.requestHeaders,
  });
  return canRevealLink() ? latestMagicLinkUrl(input.email) : null;
}
