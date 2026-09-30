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

test("explaining a step streams a text labelled as generated, not verified", async ({ page }) => {
  await signUp(page, "Explain User");
  await page.goto(en("/runs"));
  await page.getByLabel("Scenario").selectOption("fix-invoice-test");
  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("link", { name: /Fix the failing invoice test/ }).click();
  await expect(page.getByRole("link", { name: "Download archive" })).toBeVisible({ timeout: 30_000 });

  const step = page.getByTestId("step").first();
  await step.getByRole("button", { name: "Explain this step" }).click();
  const explanation = step.getByTestId("explanation");
  await expect(explanation).toContainText("The agent opened a file", { timeout: 10_000 });
  await expect(explanation.getByText("Generated, not verified")).toBeVisible();
});

test("an anonymous call to the explain route is refused", async ({ request }) => {
  const response = await request.post("/api/explain", {
    data: { runId: "00000000-0000-4000-8000-000000000000", position: 1, locale: "en" },
  });
  expect(response.status()).toBe(401);
  expect((await request.post("/api/explain", { data: { nope: true } })).status()).toBe(400);
});
