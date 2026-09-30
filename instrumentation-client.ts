import { initBotId } from "botid/client/core";
import { localizedPath } from "@/i18n/paths";
import { routing } from "@/i18n/routing";

// Pairs with guardBot() (lib/security.ts). Every POST entry that calls guardBot must be listed here, or
// BotID cannot classify the request. Paths are the page a Server Action posts to, not the action's file;
// a page exists once per locale, so its entry is generated from the routing (no locale is hardcoded).
initBotId({
  protect: [
    // requestMagicLinkAction posts to the sign-in page of each locale.
    ...routing.locales.map((locale) => ({ path: localizedPath("/sign-in", locale), method: "POST" })),
    // startRunAction posts to the runs page of each locale.
    ...routing.locales.map((locale) => ({ path: localizedPath("/runs", locale), method: "POST" })),
  ],
});
