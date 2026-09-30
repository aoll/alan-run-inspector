import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as localeParam } from "next/root-params";
import { loadMessages } from "./load-messages";
import { routing } from "./routing";

// The single getRequestConfig of the app. Order of resolution:
// 1. an explicit `locale` (getTranslations({ locale })): Server Actions, Route Handlers and the queue
//    consumer have no route to read a locale from, so they pass it themselves;
// 2. the `[locale]` root param (Server Components): static, so pages stay prerenderable;
// 3. the default locale.
//
// Never destructure `requestLocale` from the params: it is a lazy getter backed by headers(), and merely
// reading the property makes every render dynamic.
export default getRequestConfig(async (params) => {
  const candidate = params.locale ?? (await localeParam().catch(() => undefined));
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale) };
});
