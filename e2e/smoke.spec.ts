import { expect, test } from "@playwright/test";
import { localizedPath } from "../i18n/paths";
import { routing } from "../i18n/routing";

// The UI text below is English, so the journey runs on the English pages, whatever the default locale is.
const en = (path: string) => localizedPath(path, "en");
const otherLocale = routing.locales.find((locale) => locale !== routing.defaultLocale) ?? routing.defaultLocale;

test("sign up lands on the dashboard", async ({ page }) => {
  await page.goto(en("/sign-up"));
  await page.getByLabel("Name").fill("Smoke User");
  await page.getByLabel("Email").fill(`smoke-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL((url) => url.pathname === en("/dashboard"));
  await expect(page.getByRole("heading", { name: "Welcome, Smoke User" })).toBeVisible();
});

test("an anonymous visitor is sent to the sign-in page, in the visitor's locale", async ({ browser }) => {
  // Each locale is checked with a browser that asks for it (Accept-Language): an unprefixed URL is negotiated
  // by next-intl, so a visitor whose browser is set to another locale would legitimately land on that locale.
  for (const locale of [routing.defaultLocale, otherLocale]) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto(localizedPath("/dashboard", locale));
    await expect(page).toHaveURL((url) => url.pathname === localizedPath("/sign-in", locale));
    await context.close();
  }
});
