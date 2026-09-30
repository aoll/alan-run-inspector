"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { RateLimitedError, UnauthorizedError } from "@/lib/errors";
import { startRunSchema } from "@/lib/schemas/runs";
import { clientIp, guardBot, hashIp } from "@/lib/security";
import { startRun } from "@/lib/services/runs";

// Entries only parse, call a service and translate the outcome into a code the UI maps to a message.
const localeSchema = z.enum(routing.locales);

export type StartRunState =
  | { status: "idle" }
  | { status: "started" }
  | { status: "error"; error: "invalid" | "bot" | "unauthorized" | "rateLimited" | "failed" };

export async function startRunAction(_previous: StartRunState, formData: FormData): Promise<StartRunState> {
  const locale = localeSchema.safeParse(formData.get("locale"));
  const input = startRunSchema.safeParse({ scenario: formData.get("scenario") });
  if (!locale.success || !input.success) return { status: "error", error: "invalid" };

  const requestHeaders = await headers();
  const guard = await guardBot(requestHeaders);
  if (!guard.ok) return { status: "error", error: "bot" };

  try {
    await startRun({ ...input.data, locale: locale.data, ipHash: hashIp(clientIp(requestHeaders)) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return { status: "error", error: "unauthorized" };
    if (error instanceof RateLimitedError) return { status: "error", error: "rateLimited" };
    console.error("[runs] start failed", error);
    return { status: "error", error: "failed" };
  }
  refresh();
  return { status: "started" };
}
