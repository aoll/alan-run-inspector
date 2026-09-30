import { describe, expect, it } from "vitest";
import { runTitle } from "./run-title";

const messages: Record<string, string> = { "scenarios.fix-invoice-test": "Corriger le test" };
const t = Object.assign((key: `scenarios.${string}`) => messages[key] ?? key, {
  has: (key: `scenarios.${string}`) => key in messages,
});

describe("runTitle", () => {
  it("translates the scenario in the current locale", () => {
    expect(runTitle(t, { scenario: "fix-invoice-test", title: "Fix the failing invoice test" })).toBe(
      "Corriger le test",
    );
  });

  it("falls back to the stored title when the scenario is unknown", () => {
    expect(runTitle(t, { scenario: "unknown", title: "Stored title" })).toBe("Stored title");
  });
});
