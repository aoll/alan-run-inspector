import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { runSteps } from "@/lib/db/schema";
import { createRun, getRun } from "@/lib/dal/runs";
import { listSteps } from "@/lib/dal/run-steps";
import { decideStep, getStepNote, setVerdict } from "@/lib/dal/run-decisions";
import { createUser, signInAs } from "@/test/session";

async function runWithStep() {
  const run = await createRun({ title: "T", scenario: "fix-invoice-test", ipHash: "h" });
  await db.insert(runSteps).values({ runId: run.id, position: 1, kind: "claim", title: "a", input: "i", output: "o" });
  return run;
}

describe("run decisions DAL", () => {
  it("saves the decision and the private note, and they survive a re-read", async () => {
    signInAs(await createUser());
    const run = await runWithStep();
    expect(await decideStep({ runId: run.id, position: 1, decision: "rejected", note: "not proven" })).toBe(true);
    expect((await listSteps(run.id))[0]!.decision).toBe("rejected");
    expect(await getStepNote(run.id, 1)).toBe("not proven");
  });

  it("never exposes the note through the step or run DTOs", async () => {
    signInAs(await createUser());
    const run = await runWithStep();
    await decideStep({ runId: run.id, position: 1, decision: "rejected", note: "secret note" });
    expect(JSON.stringify(await listSteps(run.id))).not.toContain("secret note");
    expect(JSON.stringify(await getRun(run.id))).not.toContain("secret note");
  });

  it("sets the verdict of the owner's run", async () => {
    signInAs(await createUser());
    const run = await runWithStep();
    expect(await setVerdict(run.id, "needs_changes")).toBe(true);
    expect((await getRun(run.id))!.verdict).toBe("needs_changes");
  });

  it("writes nothing for another user's run and reports not found for unknown steps", async () => {
    const alice = await createUser();
    const bob = await createUser();
    signInAs(alice);
    const run = await runWithStep();
    expect(await decideStep({ runId: run.id, position: 99, decision: "approved", note: null })).toBe(false);

    signInAs(bob);
    expect(await decideStep({ runId: run.id, position: 1, decision: "rejected", note: "x" })).toBe(false);
    expect(await setVerdict(run.id, "accepted")).toBe(false);
    expect(await getStepNote(run.id, 1)).toBeNull();

    const [row] = await db.select().from(runSteps).where(eq(runSteps.runId, run.id));
    expect(row!.decision).toBe("pending");
    expect(row!.note).toBeNull();
    signInAs(alice);
    expect((await getRun(run.id))!.verdict).toBe("none");
  });
});
