import { routing } from "./routing";

// Everything that builds or reads a locale-prefixed URL goes through here, so the default locale is a single
// setting (`routing.defaultLocale`): the default locale is served unprefixed (`localePrefix: "as-needed"`).
// Pure module (no server-only): used by the proxy, Client Components, the E2E tests and the forge.

/** "" for the default locale, "/<locale>" for the others. */
export function localePrefix(locale: string, defaultLocale: string = routing.defaultLocale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** A path ("/notes") as served in a locale: "/notes" in the default locale, "/en/notes" otherwise. */
export function localizedPath(path: string, locale: string, defaultLocale: string = routing.defaultLocale): string {
  const prefix = localePrefix(locale, defaultLocale);
  return path === "/" ? prefix || "/" : `${prefix}${path}`;
}

/** Splits a request pathname into its locale (when the URL carries one) and the path without it. */
export function parseLocalePath(
  pathname: string,
  locales: readonly string[] = routing.locales,
): { locale: string | undefined; path: string } {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
  }
  return { locale: undefined, path: pathname };
}

/** Where a visitor without a session is sent: the sign-in page, in the locale of the URL they asked for. */
export function signInPath(pathname: string, defaultLocale: string = routing.defaultLocale): string {
  const { locale } = parseLocalePath(pathname);
  return localizedPath("/sign-in", locale ?? defaultLocale, defaultLocale);
}
