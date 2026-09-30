import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const getRun = vi.fn();
const listSteps = vi.fn();
const saveDecision = vi.fn();
const setVerdict = vi.fn();
const getStepNote = vi.fn();
vi.mock("@/lib/dal/runs", () => ({ getRun: (...a: unknown[]) => getRun(...a) }));
vi.mock("@/lib/dal/run-steps", () => ({ listSteps: (...a: unknown[]) => listSteps(...a) }));
vi.mock("@/lib/dal/run-decisions", () => ({
  decideStep: (...a: unknown[]) => saveDecision(...a),
  setVerdict: (...a: unknown[]) => setVerdict(...a),
  getStepNote: (...a: unknown[]) => getStepNote(...a),
}));

const { computeVerdict, decideStep, getStepReview, RunNotDoneError } = await import("./review");
const { decideStepSchema } = await import("@/lib/schemas/review");

const steps = (...decisions: ("pending" | "approved" | "rejected")[]) => decisions.map((decision) => ({ decision }));
const RUN_ID = "00000000-0000-4000-8000-000000000000";

describe("computeVerdict", () => {
  it("every step approved gives accepted", () => {
    expect(computeVerdict(steps("approved", "approved"))).toBe("accepted");
  });
  it("one rejected step gives needs_changes, even with pending ones", () => {
    expect(computeVerdict(steps("approved", "rejected", "pending"))).toBe("needs_changes");
  });
  it("otherwise none", () => {
    expect(computeVerdict(steps("approved", "pending"))).toBe("none");
    expect(computeVerdict(steps("pending", "pending"))).toBe("none");
    expect(computeVerdict([])).toBe("none");
  });
});

describe("decideStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRun.mockResolvedValue({ id: RUN_ID, status: "done" });
    saveDecision.mockResolvedValue(true);
  });

  it("saves the decision and recomputes the verdict from all steps", async () => {
    listSteps.mockResolvedValue(steps("approved", "rejected"));
    const verdict = await decideStep({ runId: RUN_ID, position: 2, decision: "rejected", note: "no proof" });
    expect(saveDecision).toHaveBeenCalledWith({ runId: RUN_ID, position: 2, decision: "rejected", note: "no proof" });
    expect(setVerdict).toHaveBeenCalledWith(RUN_ID, "needs_changes");
    expect(verdict).toBe("needs_changes");
  });

  it("drops the note of an approval", async () => {
    listSteps.mockResolvedValue(steps("approved"));
    await decideStep({ runId: RUN_ID, position: 1, decision: "approved", note: "ignored" });
    expect(saveDecision).toHaveBeenCalledWith(expect.objectContaining({ note: null }));
    expect(setVerdict).toHaveBeenCalledWith(RUN_ID, "accepted");
  });

  for (const status of ["queued", "running", "failed"]) {
    it(`refuses a run that is ${status}, writing nothing`, async () => {
      getRun.mockResolvedValue({ id: RUN_ID, status });
      await expect(decideStep({ runId: RUN_ID, position: 1, decision: "approved" })).rejects.toBeInstanceOf(
        RunNotDoneError,
      );
      expect(saveDecision).not.toHaveBeenCalled();
      expect(setVerdict).not.toHaveBeenCalled();
    });
  }

  it("answers not found for another user's or unknown run, writing nothing", async () => {
    getRun.mockResolvedValue(null);
    await expect(decideStep({ runId: RUN_ID, position: 1, decision: "approved" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(saveDecision).not.toHaveBeenCalled();
  });

  it("answers not found for an unknown step without touching the verdict", async () => {
    saveDecision.mockResolvedValue(false);
    await expect(decideStep({ runId: RUN_ID, position: 9, decision: "approved" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(setVerdict).not.toHaveBeenCalled();
  });
});

describe("getStepReview", () => {
  it("returns the private note and whether the run can be decided", async () => {
    getRun.mockResolvedValue({ id: RUN_ID, status: "running" });
    getStepNote.mockResolvedValue("mine");
    expect(await getStepReview(RUN_ID, 1)).toEqual({ decidable: false, note: "mine" });
  });
});

describe("decideStepSchema", () => {
  const base = { runId: RUN_ID, position: "3", decision: "rejected" };
  it("accepts a note of 500 characters and refuses 501", () => {
    expect(decideStepSchema.safeParse({ ...base, note: "a".repeat(500) }).success).toBe(true);
    expect(decideStepSchema.safeParse({ ...base, note: "a".repeat(501) }).success).toBe(false);
  });
  it("treats a blank note as none and refuses an unknown decision", () => {
    expect(decideStepSchema.parse({ ...base, note: "  " }).note).toBeUndefined();
    expect(decideStepSchema.safeParse({ ...base, decision: "pending" }).success).toBe(false);
  });
});
