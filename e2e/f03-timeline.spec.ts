import { expect, test, type Page } from "@playwright/test";
import { localizedPath } from "../i18n/paths";

// The UI text below is English, so the journey runs on the English pages, whatever the default locale is.
const en = (path: string) => localizedPath(path, "en");

// Better Auth limits sign-ups per IP (a few per 10 s) and the journeys run in parallel: retry when refused.
async function signUp(page: Page, name: string) {
  const email = `${name.replace(/\W/g, "")}-${Date.now()}@example.com`;
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(en("/sign-up"));
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();
    try {
      await expect(page).toHaveURL(/\/(dashboard|runs)$/, { timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(5000);
    }
  }
  throw new Error("Sign-up kept being refused");
}

test("the timeline fills in by itself and flags exactly one unverified step", async ({ page }) => {
  await signUp(page, "Timeline User");
  await page.goto(en("/runs"));
  await page.getByLabel("Scenario").selectOption("fix-invoice-test");
  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("link", { name: /Fix the failing invoice test/ }).click();
  await expect(page).toHaveURL(/\/runs\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Fix the failing invoice test" })).toBeVisible();

  // Steps appear without a manual reload, then the run ends and the archive is offered.
  await expect(page.getByTestId("step").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Download archive" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("step")).toHaveCount(8);
  await expect(page.getByText("Unverified", { exact: true })).toHaveCount(1);

  const href = await page.getByRole("link", { name: "Download archive" }).getAttribute("href");
  const archive = await page.request.get(href!);
  expect(archive.ok()).toBe(true);
  expect((await archive.json()).steps).toHaveLength(8);

  // A step's input, output and evidence are open by default and collapsible.
  const first = page.getByTestId("step").first();
  const firstContent = first.locator("[data-slot=collapsible-content]").first();
  await expect(firstContent).toBeVisible();
  await expect(firstContent).not.toBeEmpty();
  await first.getByRole("button", { name: "Input" }).click();
  await expect(firstContent).toBeHidden();

  // An unknown id answers "not found" too.
  const runUrl = page.url();
  await page.goto(en("/runs/00000000-0000-4000-8000-000000000000"));
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  // Another user gets "not found" for the run and its archive.
  const other = await page.context().browser()!.newContext();
  const otherPage = await other.newPage();
  await signUp(otherPage, "Other User");
  await otherPage.goto(runUrl);
  await expect(otherPage.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect((await otherPage.request.get(href!)).status()).toBe(404);
  await other.close();
});

test("an anonymous visitor is sent to sign-in", async ({ page }) => {
  await page.goto(en("/runs/00000000-0000-4000-8000-000000000000"));
  await expect(page).toHaveURL((url) => url.pathname === en("/sign-in"));
});
