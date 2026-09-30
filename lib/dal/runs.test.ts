import { describe, expect, it } from "vitest";
import { countRecentRuns, createRun, getRun, listRuns } from "@/lib/dal/runs";
import { UnauthorizedError } from "@/lib/errors";
import { createUser, signInAs } from "@/test/session";

describe("runs DAL", () => {
  it("returns a DTO with explicit columns: no ipHash, no owner", async () => {
    signInAs(await createUser());
    const run = await createRun({ title: "T", scenario: "fix-invoice-test", ipHash: "secret-hash" });
    expect(Object.keys(run).sort()).toEqual([
      "archiveUrl",
      "createdAt",
      "finishedAt",
      "id",
      "scenario",
      "status",
      "title",
      "verdict",
    ]);
    expect(run.status).toBe("queued");
    expect(JSON.stringify(await listRuns())).not.toContain("secret-hash");
  });

  it("scopes every query to the owner (no IDOR)", async () => {
    const alice = await createUser();
    const bob = await createUser();

    signInAs(alice);
    const run = await createRun({ title: "Private", scenario: "rename-config-option", ipHash: "a" });

    signInAs(bob);
    expect(await getRun(run.id)).toBeNull();
    expect(await listRuns()).toEqual([]);

    signInAs(alice);
    expect(await getRun(run.id)).not.toBeNull();
    expect(await listRuns()).toHaveLength(1);
  });

  it("returns null for an unknown id", async () => {
    signInAs(await createUser());
    expect(await getRun("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("an anonymous visitor cannot start a run", async () => {
    signInAs(null);
    await expect(createRun({ title: "T", scenario: "fix-invoice-test", ipHash: "x" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("counts recent runs by user and by IP hash", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const ip = `ip-${alice.id}`;
    signInAs(alice);
    await createRun({ title: "1", scenario: "fix-invoice-test", ipHash: ip });
    await createRun({ title: "2", scenario: "fix-invoice-test", ipHash: ip });
    signInAs(bob);
    await createRun({ title: "3", scenario: "fix-invoice-test", ipHash: ip });
    expect(await countRecentRuns({ ipHash: ip, windowSeconds: 60 })).toEqual({ byUser: 1, byIp: 3 });
    signInAs(alice);
    expect(await countRecentRuns({ ipHash: "other", windowSeconds: 60 })).toEqual({ byUser: 2, byIp: 0 });
  });
});
