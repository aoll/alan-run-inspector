import * as nextEnvNs from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";
import { localizedPath } from "../i18n/paths";

const { loadEnvConfig } = (nextEnvNs as { default?: typeof nextEnvNs }).default ?? nextEnvNs;
// Playwright sets NODE_ENV=test, which makes Next skip .env.local: load it as in dev, like the server does.
loadEnvConfig(process.cwd(), true);

const en = (path: string) => localizedPath(path, "en");
const fr = (path: string) => localizedPath(path, "fr");

// Better Auth limits sign-ups per IP and the journeys run in parallel: retry when refused.
async function signUp(page: Page, name: string): Promise<string> {
  const email = `${name.replace(/\W/g, "")}-${Date.now()}@example.com`;
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(en("/sign-up"));
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();
    try {
      await expect(page).toHaveURL((url) => url.pathname === en("/runs"), { timeout: 5000 });
      return email;
    } catch {
      await page.waitForTimeout(5000);
    }
  }
  throw new Error("Sign-up kept being refused");
}

// A run the app never produces locally (`failed`): inserted directly for the given account.
async function insertRun(email: string, status: "failed" | "done"): Promise<string> {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const [user] = await sql<{ id: string }[]>`select id from users where email = ${email.toLowerCase()}`;
    const [run] = await sql<{ id: string }[]>`
      insert into runs (user_id, title, scenario, status, ip_hash)
      values (${user!.id}, 'Fix the failing invoice test', 'fix-invoice-test', ${status}, 'e2e')
      returning id`;
    return run!.id;
  } finally {
    await sql.end();
  }
}

test("another user's run shows the translated not-found page with a way back", async ({ browser }) => {
  const ownerPage = await (await browser.newContext()).newPage();
  const ownerEmail = await signUp(ownerPage, "Owner User");
  const runId = await insertRun(ownerEmail, "done");

  const otherPage = await (await browser.newContext()).newPage();
  await signUp(otherPage, "Other User");
  await otherPage.goto(fr(`/runs/${runId}`));
  await expect(otherPage.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(otherPage.getByText("Introuvable.")).toBeVisible();
  // The tab title is the not-found one, not the run page's.
  await expect(otherPage).toHaveTitle("Page introuvable · Run Inspector");
  await expect(otherPage.getByText("This page could not be found")).toHaveCount(0);
  await expect(otherPage.getByRole("link", { name: "Retour aux exécutions" })).toHaveAttribute("href", fr("/runs"));
  // The header is localized too, and the run title is not leaked.
  await expect(otherPage.getByRole("link", { name: "Run Inspector" })).toBeVisible();
  await expect(otherPage.getByText("Corriger le test de facture en échec")).toHaveCount(0);
});

test("a failed run explains the failure and what to do", async ({ page }) => {
  const email = await signUp(page, "Failed Run User");
  const runId = await insertRun(email, "failed");
  await page.goto(en(`/runs/${runId}`));
  await expect(page.getByText("This run failed")).toBeVisible();
  await expect(page.getByText(/start a new run from the list of runs/)).toBeVisible();
  await expect(page.getByText("No step yet")).toHaveCount(0);
  // No step: nothing "above" to be incomplete.
  await expect(page.getByText(/steps above/)).toHaveCount(0);
  await page.goto(fr(`/runs/${runId}`));
  await expect(page.getByText("Cette exécution a échoué")).toBeVisible();
  // The title follows the current locale (scenario), not the language of creation.
  await expect(page.getByRole("heading", { name: "Corriger le test de facture en échec" })).toBeVisible();
});

test("pages have a translated title and the app has an icon", async ({ page }) => {
  await page.goto(en("/"));
  await expect(page).toHaveTitle("Run Inspector");
  await page.goto(en("/sign-in"));
  await expect(page).toHaveTitle("Sign in · Run Inspector");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.goto(en("/sign-up"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.goto(en("/sign-in"));
  await page.goto(fr("/sign-in"));
  await expect(page).toHaveTitle("Connexion · Run Inspector");
  const icon = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(icon).toBeTruthy();
  expect((await page.request.get(icon!)).status()).toBe(200);
});

test("the sign-in form keeps the email after a failed attempt", async ({ page }) => {
  await page.goto(en("/sign-in"));
  await page.getByLabel("Email").first().fill("someone@example.com");
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Sign-in failed")).toBeVisible();
  await expect(page.getByLabel("Email").first()).toHaveValue("someone@example.com");
});

test("the landing page is a minimal entry point to the tool", async ({ page }) => {
  await page.goto(en("/"));
  await expect(page.getByRole("heading", { name: "Check what an AI agent really did" })).toBeVisible();
  await expect(page.getByText("Demo Template")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open the tool" })).toHaveAttribute("href", en("/sign-in"));
});

test("an unknown URL shows the translated not-found page, with the header, in every locale", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => message.type() === "error" && consoleErrors.push(message.text()));
  for (const [path, heading, back] of [
    [en("/nope/zzz"), "Page not found", "Back to the runs"],
    [en("/nope"), "Page not found", "Back to the runs"],
    [fr("/nope"), "Page introuvable", "Retour aux exécutions"],
    [fr("/nope/zzz/yyy"), "Page introuvable", "Retour aux exécutions"],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(`${heading} · Run Inspector`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.getByRole("link", { name: back })).toBeVisible();
    await expect(page.getByRole("link", { name: "Run Inspector" })).toBeVisible();
    await expect(page.getByText("This page could not be found")).toHaveCount(0);
  }
  // A production build: the dev-only "Could not validate `instant`" noise must not appear, and nothing else either.
  // (The browser's own "Failed to load resource: 404" for the document is not a console error of the page.)
  expect(consoleErrors.filter((text) => !text.includes("Failed to load resource"))).toEqual([]);
  // Without any locale in the URL the default locale is used (no hand-written locale here either).
  await page.goto("/nope/zzz");
  await expect(page.locator("html")).toHaveAttribute("lang", /^(en|fr)$/);
});

test("a refused sign-up says the email is taken and keeps the fields", async ({ browser }) => {
  const email = await signUp(await (await browser.newContext()).newPage(), "First Owner");
  const page = await (await browser.newContext()).newPage();
  for (const [path, taken] of [
    [en("/sign-up"), /An account already exists with this email/],
    [fr("/sign-up"), /Un compte existe déjà avec cet email/],
  ] as const) {
    await page.goto(path);
    await page.getByLabel(/^(Name|Nom)$/).fill("Demo Again");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel(/^(Password|Mot de passe)$/).fill("correct-horse-battery");
    await page.getByRole("button", { name: /^(Create account|Créer)/ }).click();
    await expect(page.getByText(taken)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Sign-in failed|Connexion impossible/)).toHaveCount(0);
    await expect(page.getByLabel(/^(Name|Nom)$/)).toHaveValue("Demo Again");
    await expect(page.getByLabel("Email")).toHaveValue(email);
  }
});
