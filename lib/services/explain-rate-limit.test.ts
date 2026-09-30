import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";
import { RateLimitedError } from "@/lib/errors";
import { createUser, signInAs } from "@/test/session";

// Real rate-event DAL and database; only the run reads are faked.
vi.mock("@/lib/dal/runs", () => ({ getRun: async () => ({ id: "run-1" }) }));
vi.mock("@/lib/dal/run-steps", () => ({
  listSteps: async () => [
    { position: 1, kind: "read", title: "t", input: "i", output: "o", evidence: null, decision: "pending" },
  ],
}));

const { explainStep } = await import("./explain");
const call = (ipHash: string) => explainStep({ runId: "run-1", position: 1, locale: "en", ipHash });

describe("explain rate limit (real database)", () => {
  const limit = env.GENERATION_RATE_LIMIT_PER_MINUTE;
  let ip: string;
  beforeEach(async () => {
    ip = `ip-${crypto.randomUUID()}`;
    signInAs(await createUser());
  });

  it("accepts N calls in a minute and refuses the (N+1)th", async () => {
    for (let i = 0; i < limit; i++) await call(ip);
    await expect(call(ip)).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("does not affect another user on another IP", async () => {
    for (let i = 0; i <= limit; i++) await call(ip).catch(() => undefined);
    signInAs(await createUser());
    await expect(call(`other-${ip}`)).resolves.toBeDefined();
  });

  it("limits by IP hash across users", async () => {
    for (let i = 0; i < limit; i++) await call(ip);
    signInAs(await createUser());
    await expect(call(ip)).rejects.toBeInstanceOf(RateLimitedError);
  });
});
