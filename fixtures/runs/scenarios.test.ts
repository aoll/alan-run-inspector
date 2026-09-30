import { describe, expect, it } from "vitest";
import { startRunSchema } from "@/lib/schemas/runs";
import { MAX_SIMULATED_MS, SCENARIO_IDS, getScenario, scenarioSteps, scenarioTitle } from "./index";

describe("run scenarios", () => {
  it("has the two scenarios, in both languages", () => {
    expect([...SCENARIO_IDS].sort()).toEqual(["fix-invoice-test", "rename-config-option"]);
    for (const id of SCENARIO_IDS) {
      for (const locale of ["en", "fr"]) {
        expect(scenarioTitle(id, locale)).not.toBe("");
        for (const step of scenarioSteps(id, locale)) {
          expect(step.title).not.toBe("");
          expect(step.input).not.toBe("");
          expect(step.output).not.toBe("");
        }
      }
      expect(scenarioTitle(id, "fr")).not.toBe(scenarioTitle(id, "en"));
    }
  });

  it("plays in position order and stays under 6 s of simulated delay", () => {
    for (const id of SCENARIO_IDS) {
      const steps = scenarioSteps(id, "en");
      expect(steps.map((s) => s.position)).toEqual(steps.map((_, i) => i + 1));
      expect(steps.reduce((sum, s) => sum + s.delayMs, 0)).toBeLessThanOrEqual(MAX_SIMULATED_MS);
    }
  });

  it("fix-invoice-test has exactly one claim without evidence", () => {
    const steps = getScenario("fix-invoice-test").steps;
    const unbacked = steps.filter((s) => s.kind === "claim" && !s.evidence);
    expect(unbacked).toHaveLength(1);
    expect(steps.filter((s) => s.kind !== "claim").every((s) => s.evidence)).toBe(true);
  });

  it("rename-config-option has evidence on every step", () => {
    expect(getScenario("rename-config-option").steps.every((s) => s.evidence !== null)).toBe(true);
  });

  it("rejects an unknown scenario at the Zod boundary", () => {
    expect(startRunSchema.safeParse({ scenario: "delete-everything" }).success).toBe(false);
    expect(startRunSchema.safeParse({ scenario: "fix-invoice-test" }).success).toBe(true);
  });
});
