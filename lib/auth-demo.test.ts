import { describe, expect, it } from "vitest";
import { createAppEnv } from "./env";
import { DEMO_EMAIL, DEMO_PASSWORD, demoCredentials } from "./auth-demo";

const base = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("demoCredentials", () => {
  it("returns null when the flag is off or absent", () => {
    expect(demoCredentials({})).toBeNull();
    expect(demoCredentials({ DEMO_PREFILL: false })).toBeNull();
    expect(demoCredentials(createAppEnv(base))).toBeNull();
    expect(demoCredentials(createAppEnv({ ...base, DEMO_PREFILL: "false" }))).toBeNull();
  });

  it("returns the demo account when DEMO_PREFILL=true", () => {
    expect(demoCredentials(createAppEnv({ ...base, DEMO_PREFILL: "true" }))).toEqual({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  });
});
