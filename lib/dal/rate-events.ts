import "server-only";
import { and, count, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateEvents } from "@/lib/db/schema";
import { requireViewer } from "./session";

const RETENTION_SECONDS = 3600;

// Records one call of `kind` by the viewer, then counts the calls of the last `windowSeconds` (this one included)
// by the viewer and by the same IP hash (database clock). Events older than an hour are purged here, which bounds
// the table. Only the event is stored, never what the call was about.
export async function recordAndCountRateEvents(input: {
  kind: string;
  ipHash: string;
  windowSeconds: number;
}): Promise<{ byUser: number; byIp: number }> {
  const viewer = await requireViewer();
  await db.delete(rateEvents).where(lt(rateEvents.createdAt, sql`now() - make_interval(secs => ${RETENTION_SECONDS})`));
  await db.insert(rateEvents).values({ kind: input.kind, userId: viewer.id, ipHash: input.ipHash });
  const recent = and(
    eq(rateEvents.kind, input.kind),
    gt(rateEvents.createdAt, sql`now() - make_interval(secs => ${input.windowSeconds})`),
  );
  const [byUser] = await db
    .select({ n: count() })
    .from(rateEvents)
    .where(and(recent, eq(rateEvents.userId, viewer.id)));
  const [byIp] = await db
    .select({ n: count() })
    .from(rateEvents)
    .where(and(recent, eq(rateEvents.ipHash, input.ipHash)));
  return { byUser: byUser?.n ?? 0, byIp: byIp?.n ?? 0 };
}
