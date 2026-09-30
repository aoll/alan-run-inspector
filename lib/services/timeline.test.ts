import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const getRun = vi.fn();
const listSteps = vi.fn();
vi.mock("@/lib/dal/runs", () => ({ getRun: (...args: unknown[]) => getRun(...args) }));
vi.mock("@/lib/dal/run-steps", () => ({ listSteps: (...args: unknown[]) => listSteps(...args) }));

const { isUnverified, getRunTimeline } = await import("./timeline");

const kinds = ["read", "tool_call", "test", "source", "claim"] as const;

describe("isUnverified", () => {
  for (const kind of kinds) {
    for (const evidence of ["proof", null, "", "   "]) {
      const expected = kind === "claim" && !evidence?.trim();
      it(`${kind} with evidence ${JSON.stringify(evidence)} is ${expected ? "" : "not "}unverified`, () => {
        expect(isUnverified({ kind, evidence })).toBe(expected);
      });
    }
  }
});

describe("getRunTimeline", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the run and its steps flagged", async () => {
    getRun.mockResolvedValue({ id: "r" });
    listSteps.mockResolvedValue([
      { position: 1, kind: "read", evidence: null },
      { position: 2, kind: "claim", evidence: null },
    ]);
    const timeline = await getRunTimeline("r");
    expect(timeline.steps.map((s) => s.unverified)).toEqual([false, true]);
  });

  it("answers not found for another user's or unknown run, without reading steps", async () => {
    getRun.mockResolvedValue(null);
    await expect(getRunTimeline("x")).rejects.toBeInstanceOf(NotFoundError);
    expect(listSteps).not.toHaveBeenCalled();
  });
});
