import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { magicLinkOutbox } from "@/lib/db/auth-schema";

// SYSTEM DAL: the sign-in flow has no session yet. Read by services/magic-link.ts, which only reveals
// the link when the simulated email is allowed to be shown (never in production).
export async function latestMagicLinkUrl(email: string): Promise<string | null> {
  const [row] = await db
    .select({ url: magicLinkOutbox.url })
    .from(magicLinkOutbox)
    .where(eq(magicLinkOutbox.email, email))
    .orderBy(desc(magicLinkOutbox.createdAt))
    .limit(1);
  return row?.url ?? null;
}
