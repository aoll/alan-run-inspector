import { beforeEach, describe, expect, it, vi } from "vitest";
import fixtures from "@/fixtures/explanations.json";
import { routing } from "@/i18n/routing";
import { NotFoundError, RateLimitedError, UnauthorizedError } from "@/lib/errors";

const getRun = vi.fn();
const listSteps = vi.fn();
const recordAndCount = vi.fn();
vi.mock("@/lib/dal/runs", () => ({
  getRun: (...args: unknown[]) => getRun(...args),
}));
vi.mock("@/lib/dal/rate-events", () => ({
  recordAndCountRateEvents: (...args: unknown[]) => recordAndCount(...args),
}));
vi.mock("@/lib/dal/run-steps", () => ({ listSteps: (...args: unknown[]) => listSteps(...args) }));

const { explainStep } = await import("./explain");

const step = { position: 2, kind: "claim", title: "t", input: "i", output: "o", evidence: null, decision: "pending" };
const input = { runId: "run-1", position: 2, locale: "fr", ipHash: "ip" };
const kinds = ["read", "tool_call", "test", "source", "claim"] as const;

describe("explainStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRun.mockResolvedValue({ id: "run-1" });
    listSteps.mockResolvedValue([step]);
    recordAndCount.mockResolvedValue({ byUser: 1, byIp: 1 });
  });

  it("streams the recorded explanation of the step kind in the requested locale, storing nothing", async () => {
    const result = await explainStep(input);
    expect(await result.text).toBe(fixtures.fr.claim.text);
    const en = await explainStep({ ...input, locale: "en" });
    expect(await en.text).toBe(fixtures.en.claim.text);
  });

  it("answers not found for an unknown or foreign run (the DAL returns null) and for an unknown position", async () => {
    getRun.mockResolvedValue(null);
    await expect(explainStep(input)).rejects.toBeInstanceOf(NotFoundError);
    getRun.mockResolvedValue({ id: "run-1" });
    await expect(explainStep({ ...input, position: 9 })).rejects.toBeInstanceOf(NotFoundError);
    expect(recordAndCount).not.toHaveBeenCalled();
  });

  it("lets the anonymous refusal of the DAL through", async () => {
    getRun.mockRejectedValue(new UnauthorizedError());
    await expect(explainStep(input)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("records the call under its own kind, then accepts N calls in a minute", async () => {
    recordAndCount.mockResolvedValue({ byUser: 10, byIp: 10 });
    await expect(explainStep(input)).resolves.toBeDefined();
    expect(recordAndCount).toHaveBeenCalledWith({ kind: "explain", ipHash: "ip", windowSeconds: 60 });
  });

  it("refuses the (N+1)th call within a minute, by user or by IP hash", async () => {
    recordAndCount.mockResolvedValue({ byUser: 11, byIp: 1 });
    await expect(explainStep(input)).rejects.toBeInstanceOf(RateLimitedError);
    recordAndCount.mockResolvedValue({ byUser: 1, byIp: 11 });
    await expect(explainStep(input)).rejects.toBeInstanceOf(RateLimitedError);
  });
});

describe("recorded explanations", () => {
  it("cover every step kind in every locale", () => {
    for (const locale of routing.locales) {
      const byKind = fixtures[locale as keyof typeof fixtures];
      expect(Object.keys(byKind).sort(), locale).toEqual([...kinds].sort());
      for (const kind of kinds) expect(byKind[kind].text, `${locale}/${kind}`).not.toBe("");
    }
  });
});
