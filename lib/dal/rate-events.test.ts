import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { rateEvents } from "@/lib/db/schema";
import { recordAndCountRateEvents } from "@/lib/dal/rate-events";
import { UnauthorizedError } from "@/lib/errors";
import { createUser, signInAs } from "@/test/session";

describe("rate events DAL", () => {
  it("records each call and counts it by user and by IP hash, per kind", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const ip = `ip-${alice.id}`;
    signInAs(alice);
    await recordAndCountRateEvents({ kind: "explain", ipHash: ip, windowSeconds: 60 });
    expect(await recordAndCountRateEvents({ kind: "explain", ipHash: ip, windowSeconds: 60 })).toEqual({
      byUser: 2,
      byIp: 2,
    });
    signInAs(bob);
    expect(await recordAndCountRateEvents({ kind: "explain", ipHash: ip, windowSeconds: 60 })).toEqual({
      byUser: 1,
      byIp: 3,
    });
    expect(await recordAndCountRateEvents({ kind: "other", ipHash: ip, windowSeconds: 60 })).toEqual({
      byUser: 1,
      byIp: 1,
    });
  });

  it("ignores events outside the window and purges those older than an hour", async () => {
    const user = await createUser();
    signInAs(user);
    const ip = `ip-${user.id}`;
    await db.insert(rateEvents).values([
      { kind: "explain", userId: user.id, ipHash: ip, createdAt: sql`now() - interval '5 minutes'` },
      { kind: "explain", userId: user.id, ipHash: ip, createdAt: sql`now() - interval '2 hours'` },
    ]);
    expect(await recordAndCountRateEvents({ kind: "explain", ipHash: ip, windowSeconds: 60 })).toEqual({
      byUser: 1,
      byIp: 1,
    });
    const rows = await db.select().from(rateEvents).where(eq(rateEvents.userId, user.id));
    expect(rows).toHaveLength(2);
  });

  it("refuses an anonymous caller and stores nothing", async () => {
    signInAs(null);
    await expect(
      recordAndCountRateEvents({ kind: "explain", ipHash: "anon-ip", windowSeconds: 60 }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(await db.select().from(rateEvents).where(eq(rateEvents.ipHash, "anon-ip"))).toHaveLength(0);
  });
});
