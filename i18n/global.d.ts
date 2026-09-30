import type { AppLocale } from "./routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
  }
}
