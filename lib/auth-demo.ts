// The seeded demo account and its optional pre-fill on the sign-in form.
// Pure module (no env import): used by scripts/seed.ts, the sign-in page and unit tests.
export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo-password-123";
export const DEMO_NAME = "Demo User";

export type DemoCredentials = { email: string; password: string };

export function demoCredentials(env: { DEMO_PREFILL?: boolean }): DemoCredentials | null {
  return env.DEMO_PREFILL === true ? { email: DEMO_EMAIL, password: DEMO_PASSWORD } : null;
}
