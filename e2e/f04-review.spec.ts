import { expect, test, type Page } from "@playwright/test";
import { localizedPath } from "../i18n/paths";

// The UI text below is English, so the journey runs on the English pages, whatever the default locale is.
const en = (path: string) => localizedPath(path, "en");

// Better Auth limits sign-ups per IP (a few per 10 s) and the journeys run in parallel: retry when refused.
async function signUp(page: Page, name: string) {
  const email = `${name.replace(/\W/g, "")}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
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

async function startAndOpen(page: Page, scenario: string, title: RegExp) {
  await page.goto(en("/runs"));
  await page.getByLabel("Scenario").selectOption(scenario);
  await page.getByRole("button", { name: "Start run" }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("link", { name: "Download archive" })).toBeVisible({ timeout: 40_000 });
  await expect(page.getByTestId("step").first()).toBeVisible();
}

test("rejecting the unverified step gives Needs changes, and it survives a reload", async ({ page }) => {
  await signUp(page, "Review User");
  await startAndOpen(page, "fix-invoice-test", /Fix the failing invoice test/);
  const steps = page.getByTestId("step");
  const count = await steps.count();
  for (let i = 0; i < count; i++) {
    const step = steps.nth(i);
    const unverified = (await step.getAttribute("data-unverified")) === "true";
    if (unverified) await step.getByLabel("Private note").fill("No evidence for this claim");
    await step.getByRole("button", { name: unverified ? "Reject" : "Approve" }).click();
    await expect(step.getByTestId("decision")).toHaveText(unverified ? "Rejected" : "Approved");
  }
  await expect(page.getByTestId("verdict")).toHaveText("Needs changes");

  // The archive is the owner's private copy of the reviewed run.
  const href = await page.getByRole("link", { name: "Download archive" }).getAttribute("href");
  const download = await page.request.get(href!);
  expect(download.headers()["content-type"]).toContain("application/json");
  const archive = await download.json();
  expect(archive.run.status).toBe("done");
  expect(archive.run.verdict).toBe("needs_changes");
  expect(archive.steps.map((step: { note: string | null }) => step.note).filter(Boolean)).toEqual([
    "No evidence for this claim",
  ]);

  await page.reload();
  await expect(page.getByTestId("verdict")).toHaveText("Needs changes");
  const unverifiedStep = page.locator('[data-testid="step"][data-unverified="true"]');
  await expect(unverifiedStep.getByTestId("decision")).toHaveText("Rejected");
  await expect(unverifiedStep.getByLabel("Private note")).toHaveValue("No evidence for this claim");
});

test("approving every step of a clean run gives Accepted", async ({ page }) => {
  await signUp(page, "Accept User");
  await startAndOpen(page, "rename-config-option", /Rename a config option/);
  const steps = page.getByTestId("step");
  const count = await steps.count();
  for (let i = 0; i < count; i++) {
    await steps.nth(i).getByRole("button", { name: "Approve" }).click();
    await expect(steps.nth(i).getByTestId("decision")).toHaveText("Approved");
  }
  await expect(page.getByTestId("verdict")).toHaveText("Accepted");
  await page.reload();
  await expect(page.getByTestId("verdict")).toHaveText("Accepted");
});
