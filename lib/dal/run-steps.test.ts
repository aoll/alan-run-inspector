import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { runSteps } from "@/lib/db/schema";
import { createRun } from "@/lib/dal/runs";
import { listSteps } from "@/lib/dal/run-steps";
import { createUser, signInAs } from "@/test/session";

describe("run steps DAL", () => {
  it("lists the owner's steps by position, with explicit columns and no private note", async () => {
    signInAs(await createUser());
    const run = await createRun({ title: "T", scenario: "fix-invoice-test", ipHash: "h" });
    await db.insert(runSteps).values([
      { runId: run.id, position: 2, kind: "claim", title: "b", input: "i", output: "o", note: "secret note" },
      { runId: run.id, position: 1, kind: "read", title: "a", input: "i", output: "o", evidence: "e" },
    ]);
    const steps = await listSteps(run.id);
    expect(steps.map((s) => s.position)).toEqual([1, 2]);
    expect(Object.keys(steps[0]!).sort()).toEqual([
      "decision",
      "evidence",
      "input",
      "kind",
      "output",
      "position",
      "title",
    ]);
    expect(JSON.stringify(steps)).not.toContain("secret note");
  });

  it("scopes steps to the run's owner (no IDOR)", async () => {
    const alice = await createUser();
    const bob = await createUser();
    signInAs(alice);
    const run = await createRun({ title: "T", scenario: "fix-invoice-test", ipHash: "h" });
    await db.insert(runSteps).values({ runId: run.id, position: 1, kind: "read", title: "a", input: "i", output: "o" });

    signInAs(bob);
    expect(await listSteps(run.id)).toEqual([]);
    signInAs(alice);
    expect(await listSteps(run.id)).toHaveLength(1);
  });
});
