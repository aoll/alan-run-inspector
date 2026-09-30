import { describe, expect, it } from "vitest";
import { explainBodySchema } from "./explain";

const ok = { runId: "00000000-0000-4000-8000-000000000000", position: 1, locale: "en" };

describe("explainBodySchema", () => {
  it("accepts a run, a position and a known locale", () => {
    expect(explainBodySchema.safeParse(ok).success).toBe(true);
  });
  it("rejects a bad id, position or locale", () => {
    for (const bad of [
      { ...ok, runId: "x" },
      { ...ok, position: 0 },
      { ...ok, position: "1" },
      { ...ok, locale: "de" },
      {},
    ]) {
      expect(explainBodySchema.safeParse(bad).success).toBe(false);
    }
  });
});
