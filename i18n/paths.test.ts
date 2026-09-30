import { describe, expect, it } from "vitest";
import { localePrefix, localizedPath, parseLocalePath, signInPath } from "./paths";

// The helpers take the default locale as a parameter: both "fr by default" and "en by default" must work,
// because a demo picks its own default.
describe.each([
  { defaultLocale: "fr", other: "en" },
  { defaultLocale: "en", other: "fr" },
])("default locale $defaultLocale", ({ defaultLocale, other }) => {
  it("serves the default locale unprefixed and the others prefixed", () => {
    expect(localePrefix(defaultLocale, defaultLocale)).toBe("");
    expect(localePrefix(other, defaultLocale)).toBe(`/${other}`);
    expect(localizedPath("/notes", defaultLocale, defaultLocale)).toBe("/notes");
    expect(localizedPath("/notes", other, defaultLocale)).toBe(`/${other}/notes`);
    expect(localizedPath("/", other, defaultLocale)).toBe(`/${other}`);
    expect(localizedPath("/", defaultLocale, defaultLocale)).toBe("/");
  });

  it("sends an anonymous visitor to the sign-in page of the locale of their URL", () => {
    expect(signInPath("/notes", defaultLocale)).toBe("/sign-in");
    expect(signInPath(`/${other}/notes/abc`, defaultLocale)).toBe(`/${other}/sign-in`);
    expect(signInPath(`/${defaultLocale}/notes`, defaultLocale)).toBe("/sign-in");
  });
});

describe("parseLocalePath", () => {
  it("finds the locale of a URL and the path without it", () => {
    expect(parseLocalePath("/en")).toEqual({ locale: "en", path: "/" });
    expect(parseLocalePath("/en/notes/1")).toEqual({ locale: "en", path: "/notes/1" });
    expect(parseLocalePath("/notes")).toEqual({ locale: undefined, path: "/notes" });
    expect(parseLocalePath("/english")).toEqual({ locale: undefined, path: "/english" });
  });
});
