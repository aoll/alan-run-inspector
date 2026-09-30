import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { runSteps } from "@/lib/db/schema";
import { getRun, createRun } from "@/lib/dal/runs";
import { createUser, signInAs } from "@/test/session";

const putFile = vi.fn();
vi.mock("@/lib/storage", () => ({ putFile: (...args: unknown[]) => putFile(...args) }));
vi.mock("@/lib/queue", () => ({ enqueue: vi.fn() }));

const { processRun } = await import("@/lib/services/runs");
const noSleep = async () => undefined;

async function newRun(scenario: "fix-invoice-test" | "rename-config-option" = "fix-invoice-test") {
  const user = await createUser();
  signInAs(user);
  const run = await createRun({ title: "T", scenario, ipHash: "h" });
  return { user, run };
}

describe("run consumer (real database)", () => {
  beforeEach(() => {
    putFile.mockReset();
    putFile.mockImplementation(async ({ key }: { key: string }) => ({ url: `/api/files/${key}` }));
  });

  it("plays the scenario in position order, then marks the run done with its archive", async () => {
    const { user, run } = await newRun();
    await processRun({ runId: run.id, locale: "en" }, { deliveryCount: 1, sleep: noSleep });

    const steps = await db.select().from(runSteps).where(eq(runSteps.runId, run.id)).orderBy(runSteps.position);
    expect(steps.map((s) => s.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(steps.filter((s) => s.kind === "claim" && s.evidence === null)).toHaveLength(1);

    const done = await getRun(run.id);
    expect(done?.status).toBe("done");
    expect(done?.finishedAt).not.toBeNull();
    expect(done?.archiveUrl).toBe(`/api/files/runs/${user.id}/${run.id}.json`);

    const stored = putFile.mock.calls[0]?.[0] as { key: string; data: Buffer; contentType: string };
    expect(stored.key).toBe(`runs/${user.id}/${run.id}.json`);
    expect(stored.contentType).toBe("application/json");
    const archive = JSON.parse(stored.data.toString()) as { run: { id: string }; steps: unknown[] };
    expect(archive.run.id).toBe(run.id);
    expect(archive.steps).toHaveLength(8);
  });

  it("goes through running while playing, and waits the scenario delays", async () => {
    const { run } = await newRun("rename-config-option");
    const delays: number[] = [];
    let statusDuring: string | undefined;
    await processRun(
      { runId: run.id, locale: "fr" },
      {
        deliveryCount: 1,
        sleep: async (ms) => {
          delays.push(ms);
          statusDuring ??= (await getRun(run.id))?.status;
        },
      },
    );
    expect(statusDuring).toBe("running");
    expect(delays.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(6000);
  });

  it("is harmless on redelivery: same steps, run done", async () => {
    const { run } = await newRun();
    const message = { runId: run.id, locale: "en" };
    await processRun(message, { deliveryCount: 1, sleep: noSleep });
    const before = await db.select().from(runSteps).where(eq(runSteps.runId, run.id));
    await processRun(message, { deliveryCount: 2, sleep: noSleep });
    const after = await db.select().from(runSteps).where(eq(runSteps.runId, run.id));
    expect(after.map((s) => s.id).sort()).toEqual(before.map((s) => s.id).sort());
    expect(after).toHaveLength(8);
    expect((await getRun(run.id))?.status).toBe("done");
  });

  it("completes a run interrupted midway without duplicating steps", async () => {
    const { run } = await newRun();
    const message = { runId: run.id, locale: "en" };
    let calls = 0;
    await processRun(message, {
      deliveryCount: 1,
      sleep: async () => {
        if (++calls === 4) throw new Error("function cut");
      },
    });
    expect((await getRun(run.id))?.status).toBe("failed");
    // A crash before the failure was recorded leaves the run `running`; rewind to simulate it.
    const { db: database } = await import("@/lib/db");
    const { runs } = await import("@/lib/db/schema");
    await database.update(runs).set({ status: "running", finishedAt: null }).where(eq(runs.id, run.id));
    await processRun(message, { deliveryCount: 2, sleep: noSleep });
    expect(await db.select().from(runSteps).where(eq(runSteps.runId, run.id))).toHaveLength(8);
    expect((await getRun(run.id))?.status).toBe("done");
  });

  it("marks the run failed after more than 5 deliveries, without playing it", async () => {
    const { run } = await newRun();
    await processRun({ runId: run.id, locale: "en" }, { deliveryCount: 6, sleep: noSleep });
    expect((await getRun(run.id))?.status).toBe("failed");
    expect(await db.select().from(runSteps).where(eq(runSteps.runId, run.id))).toHaveLength(0);
  });
});
