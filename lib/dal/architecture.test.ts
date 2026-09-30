import { beforeEach, describe, expect, it } from "vitest";
import { signInAs } from "@/test/session";
import { UnauthorizedError } from "@/lib/errors";

// The rule of the architecture, enforced for every DAL module present and future: authorization lives in
// the DAL, so every exported function must refuse to run without a session.
//
// Three kinds of DAL module:
// - private (lib/dal/*.ts): every function refuses an anonymous caller (this test);
// - public (lib/dal/public/*.ts): data any visitor may read, so no session by design. The lint forbids
//   importing the session there; this test checks the same on the source and that the file is server-only;
// - system (SYSTEM_DAL below): callers without a user session (queue consumer, sign-in flow).
//
// SYSTEM_DAL lists the modules whose callers have no user session by design (the queue consumer, the
// sign-in flow). Adding a module here is an explicit, reviewed decision.
const SYSTEM_DAL = new Set(["export-jobs", "magic-link", "session"]);

const modules = import.meta.glob("./*.ts", { eager: true }) as Record<string, Record<string, unknown>>;

describe("DAL: no session, no data", () => {
  beforeEach(() => signInAs(null));

  const files = Object.entries(modules).filter(([path]) => !path.endsWith(".test.ts"));

  it("finds the DAL modules (the glob works: session.ts is always there)", () => {
    expect(files.map(([path]) => path)).toContain("./session.ts");
  });

  for (const [path, module] of files) {
    const name = path.replace("./", "").replace(".ts", "");
    if (SYSTEM_DAL.has(name)) continue;
    for (const [exportName, value] of Object.entries(module)) {
      if (typeof value !== "function") continue;
      it(`${name}.${exportName} rejects an anonymous caller`, async () => {
        await expect((value as (...args: unknown[]) => Promise<unknown>)()).rejects.toBeInstanceOf(UnauthorizedError);
      });
    }
  }
});

const publicSources = import.meta.glob("./public/*.ts", { eager: true, query: "?raw", import: "default" }) as Record<
  string,
  string
>;

describe("public DAL: no session, by design", () => {
  it("every public module is server-only and never touches the session", () => {
    for (const [path, source] of Object.entries(publicSources)) {
      if (path.endsWith(".test.ts")) continue;
      expect(source.trimStart().startsWith('import "server-only"'), `${path} starts with server-only`).toBe(true);
      expect(source, `${path} must not use the session`).not.toMatch(/\b(requireViewer|getViewer)\b|\/session["']/);
    }
  });
});
