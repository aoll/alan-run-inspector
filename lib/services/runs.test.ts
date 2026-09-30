import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitedError, UnauthorizedError } from "@/lib/errors";

const countRecentRuns = vi.fn();
const createRun = vi.fn();
const enqueue = vi.fn();
const startRunJob = vi.fn();
const writeRunStep = vi.fn();
const getRunArchive = vi.fn();
const completeRunJob = vi.fn();
const failRunJob = vi.fn();
const putFile = vi.fn();
vi.mock("@/lib/dal/runs", () => ({
  countRecentRuns: (...args: unknown[]) => countRecentRuns(...args),
  createRun: (...args: unknown[]) => createRun(...args),
  listRuns: vi.fn(),
}));
vi.mock("@/lib/dal/run-jobs", () => ({
  startRunJob: (...args: unknown[]) => startRunJob(...args),
  writeRunStep: (...args: unknown[]) => writeRunStep(...args),
  getRunArchive: (...args: unknown[]) => getRunArchive(...args),
  completeRunJob: (...args: unknown[]) => completeRunJob(...args),
  failRunJob: (...args: unknown[]) => failRunJob(...args),
}));
vi.mock("@/lib/queue", () => ({ enqueue: (...args: unknown[]) => enqueue(...args) }));
vi.mock("@/lib/storage", () => ({ putFile: (...args: unknown[]) => putFile(...args) }));

const { startRun, processRun } = await import("./runs");

const input = { scenario: "fix-invoice-test" as const, ipHash: "ip", locale: "fr" };
const noSleep = async () => undefined;

describe("startRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRun.mockResolvedValue({ id: "run-1" });
  });

  it("creates the run then enqueues it on the runs topic", async () => {
    countRecentRuns.mockResolvedValue({ byUser: 9, byIp: 9 });
    await startRun(input);
    expect(createRun).toHaveBeenCalledWith({
      title: "Corriger le test de facture en échec",
      scenario: "fix-invoice-test",
      ipHash: "ip",
    });
    expect(enqueue).toHaveBeenCalledWith("runs", { runId: "run-1", locale: "fr" });
  });

  it("refuses the (N+1)th start for the same user, creating nothing", async () => {
    countRecentRuns.mockResolvedValue({ byUser: 10, byIp: 0 });
    await expect(startRun(input)).rejects.toBeInstanceOf(RateLimitedError);
    expect(createRun).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("refuses when the same IP hash reached the limit", async () => {
    countRecentRuns.mockResolvedValue({ byUser: 0, byIp: 10 });
    await expect(startRun(input)).rejects.toBeInstanceOf(RateLimitedError);
    expect(createRun).not.toHaveBeenCalled();
  });

  it("creates nothing for an anonymous visitor", async () => {
    countRecentRuns.mockRejectedValue(new UnauthorizedError());
    await expect(startRun(input)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(createRun).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });
});

describe("processRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startRunJob.mockResolvedValue({ id: "run-1", userId: "user-1", scenario: "rename-config-option" });
    getRunArchive.mockResolvedValue({ run: { id: "run-1" }, steps: [] });
    putFile.mockResolvedValue({ url: "/api/files/x.json" });
  });

  it("writes the steps in position order, then stores the archive under runs/<user>/<run>.json", async () => {
    await processRun({ runId: "run-1", locale: "en" }, { deliveryCount: 1, sleep: noSleep });
    const positions = writeRunStep.mock.calls.map((call) => (call[1] as { position: number }).position);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(putFile).toHaveBeenCalledWith(expect.objectContaining({ key: "runs/user-1/run-1.json" }));
    expect(completeRunJob).toHaveBeenCalledWith("run-1", "/api/files/x.json");
  });

  it("does nothing for a run that is already done (redelivered message)", async () => {
    startRunJob.mockResolvedValue(null);
    await processRun({ runId: "run-1", locale: "en" }, { deliveryCount: 2, sleep: noSleep });
    expect(writeRunStep).not.toHaveBeenCalled();
    expect(completeRunJob).not.toHaveBeenCalled();
  });

  it("gives up on a poison message instead of retrying forever", async () => {
    await processRun({ runId: "run-1", locale: "en" }, { deliveryCount: 6, sleep: noSleep });
    expect(failRunJob).toHaveBeenCalledWith("run-1");
    expect(startRunJob).not.toHaveBeenCalled();
  });

  it("still plays at the fifth delivery", async () => {
    await processRun({ runId: "run-1", locale: "en" }, { deliveryCount: 5, sleep: noSleep });
    expect(completeRunJob).toHaveBeenCalled();
  });

  it("records a failure when storing the archive throws", async () => {
    putFile.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await processRun({ runId: "run-1", locale: "en" }, { deliveryCount: 1, sleep: noSleep });
    expect(failRunJob).toHaveBeenCalledWith("run-1");
  });
});

describe("bot guard", () => {
  it("lists the runs page of every locale among the BotID protected paths", () => {
    const source = readFileSync("instrumentation-client.ts", "utf8");
    expect(source).toContain('localizedPath("/runs", locale)');
    expect(source).toContain('method: "POST"');
  });
});
