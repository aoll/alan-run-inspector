import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOwnedRunArchive } from "@/lib/dal/run-archive";
import { createRun } from "@/lib/dal/runs";
import { UnauthorizedError } from "@/lib/errors";
import { createUser, signInAs } from "@/test/session";

const files = new Map<string, string>();
vi.mock("@/lib/storage", () => ({
  putFile: async ({ key, data }: { key: string; data: Buffer }) => {
    files.set(key, data.toString());
    return { url: `/api/files/${key}` };
  },
}));
vi.mock("@/lib/queue", () => ({ enqueue: vi.fn() }));

const { processRun } = await import("./runs");
const { decideStep } = await import("./review");
const { refreshArchive, archiveKey } = await import("./archive");

const noSleep = async () => undefined;

async function finishedRun() {
  const user = await createUser();
  signInAs(user);
  const run = await createRun({ title: "T", scenario: "fix-invoice-test", ipHash: "secret-ip-hash" });
  await processRun({ runId: run.id, locale: "en" }, { deliveryCount: 1, sleep: noSleep });
  return { user, run, key: archiveKey(user.id, run.id) };
}

describe("run archive (real database)", () => {
  beforeEach(() => files.clear());

  it("describes the finished run, before any review", async () => {
    const { key } = await finishedRun();
    const archive = JSON.parse(files.get(key)!);
    expect(archive.run.status).toBe("done");
    expect(archive.run.finishedAt).not.toBeNull();
    expect(archive.run.verdict).toBe("none");
    expect(archive.steps).toHaveLength(8);
  });

  it("is rewritten by each decision: after a rejection with a note it holds the note and needs_changes", async () => {
    const { user, run, key } = await finishedRun();
    await decideStep({ runId: run.id, position: 1, decision: "approved" });
    await decideStep({ runId: run.id, position: 2, decision: "rejected", note: "No evidence for this claim" });
    const text = files.get(key)!;
    const archive = JSON.parse(text);
    expect(archive.run.verdict).toBe("needs_changes");
    expect(archive.steps[1]).toMatchObject({ position: 2, decision: "rejected", note: "No evidence for this claim" });
    expect(archive.steps[0]).toMatchObject({ decision: "approved", note: null });
    expect(text).not.toContain("secret-ip-hash");
    expect(text).not.toContain(user.id);
    expect(text).not.toMatch(/ipHash|userId/);
  });

  it("is readable fresh by its owner only", async () => {
    const { run } = await finishedRun();
    expect((await getOwnedRunArchive(run.id))?.run.id).toBe(run.id);
    signInAs(await createUser());
    expect(await getOwnedRunArchive(run.id)).toBeNull();
    await expect(refreshArchive(run.id)).resolves.toBeUndefined();
    signInAs(null);
    await expect(getOwnedRunArchive(run.id)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
