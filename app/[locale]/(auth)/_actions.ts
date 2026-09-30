"use server";

import { headers } from "next/headers";
import { guardBot } from "@/lib/security";
import { magicLinkSchema } from "@/lib/schemas/auth";
import { requestMagicLink } from "@/lib/services/magic-link";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; url: string | null }
  | { status: "error"; error: "invalid" | "bot" | "failed" };

export async function requestMagicLinkAction(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", error: "invalid" };

  const requestHeaders = await headers();
  const guard = await guardBot(requestHeaders);
  if (!guard.ok) return { status: "error", error: "bot" };

  try {
    const url = await requestMagicLink({ email: parsed.data.email, requestHeaders });
    return { status: "sent", url };
  } catch (error) {
    console.error("[auth] magic link failed", error);
    return { status: "error", error: "failed" };
  }
}
