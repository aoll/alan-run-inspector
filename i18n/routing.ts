import { defineRouting } from "next-intl/routing";

// The demo's locales: edit `locales` (and add the messages/<locale>/ files). The default locale is unprefixed.
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type AppLocale = (typeof routing.locales)[number];
