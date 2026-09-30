import { expect, test } from "@playwright/test";
import { localizedPath } from "../i18n/paths";

// The UI text below is English, so the journey runs on the English pages, whatever the default locale is.
const en = (path: string) => localizedPath(path, "en");

test("starting a run shows it in the list and it ends up done", async ({ page }) => {
  await page.goto(en("/sign-up"));
  await page.getByLabel("Name").fill("Runs User");
  await page.getByLabel("Email").fill(`runs-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/(dashboard|runs)$/);

  await page.goto(en("/runs"));
  await page.getByLabel("Scenario").selectOption("rename-config-option");
  await page.getByRole("button", { name: "Start run" }).click();
  const card = page.getByRole("link", { name: /Rename a config option/ });
  await expect(card).toBeVisible();
  await expect(card.getByText("Done")).toBeVisible({ timeout: 30_000 });
});

test("an anonymous visitor cannot start a run", async ({ page }) => {
  await page.goto(en("/runs"));
  await expect(page).toHaveURL((url) => url.pathname === en("/sign-in"));
});
