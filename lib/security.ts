import "server-only";
import { createHash } from "node:crypto";
import { checkBotId } from "botid/server";
import { env } from "@/lib/env";

export type BotGuardResult = { ok: true } | { ok: false; reason: "bot" };

// BotID is enforced only on Vercel (env.VERCEL === "1"). Off Vercel its real path cannot work (it needs a
// VERCEL_OIDC_TOKEN), so its own dev bypass is forced: it always answers "human" without any network call.
// The Postgres rate limit (services/generation.ts) still applies everywhere.
export async function guardBot(requestHeaders: Headers): Promise<BotGuardResult> {
  const secret = env.QA_BYPASS_SECRET;
  if (secret !== undefined && requestHeaders.get("x-qa-bypass-secret") === secret) return { ok: true };
  const bot = await checkBotId({ developmentOptions: { isDevelopment: env.VERCEL !== "1" } });
  return bot.isBot ? { ok: false, reason: "bot" } : { ok: true };
}

// `X-Forwarded-For` is only trustworthy behind a proxy that overwrites it (Vercel does). Self-hosting: strip it upstream.
export function clientIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || requestHeaders.get("x-real-ip") || "unknown";
}

// Only the hash is stored: the raw IP never reaches the database.
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${env.BETTER_AUTH_SECRET}:${ip}`).digest("hex");
}
