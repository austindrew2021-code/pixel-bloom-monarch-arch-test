#!/usr/bin/env node
// Confirm the Curl pose is now equipment-aware: ez-curl/spider-curl show a
// barbell, cable-curl/preacher-machine show no held weight, curl/hammer
// still show dumbbells.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const OUT = "screenshots/curl-fix";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(`${BASE}/?key=PLATE-8F2R`, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1800);
const gate = await page.getByRole("button", { name: "Open kitchen" }).count();
if (gate) {
  await page.locator("#tester-key").fill("PLATE-8F2R", { timeout: 4000 }).catch(() => {});
  await page.getByRole("button", { name: "Open kitchen" }).click({ force: true, timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(600);
}
if (await page.getByText("How you want it").count()) {
  await page.locator("button:has-text('Next Gen')").first().click({ force: true });
  await page.getByRole("button", { name: "Cut fat" }).click({ force: true });
  const fill = page.getByRole("button", { name: "Fill a sample week" });
  await fill.scrollIntoViewIfNeeded();
  await fill.click({ force: true });
  await page.waitForTimeout(400);
}
const skip = page.getByRole("button", { name: /^Skip$/ });
if (await skip.count()) await skip.first().click({ force: true }).catch(() => {});

await page.getByRole("button", { name: /^Fuel$/ }).last().click({ force: true });
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^Train$/ }).last().click({ force: true });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Exercise library", exact: true }).first().click({ force: true });
await page.waitForTimeout(500);

const names = {
  "ez-curl": "EZ-bar curl",
  "spider-curl": "EZ-bar preacher curl",
  "cable-curl": "Cable curl",
  "preacher-machine": "Machine preacher curl",
  curl: "Dumbbell curl",
};

for (const [id, name] of Object.entries(names)) {
  await page.locator('[data-testid="exercise-library"] input').fill(name);
  await page.waitForTimeout(350);
  const card = page.locator('[data-testid="exercise-library"] ul li button').first();
  if (!(await card.count())) {
    console.log(`no card for ${id} (${name})`);
    continue;
  }
  await card.click({ force: true });
  await page.waitForTimeout(500);
  const figure = page.locator('[data-testid="exercise-sheet"] [data-testid="exercise-figure"]');
  const gotId = await figure.getAttribute("data-exercise-id");
  await figure.screenshot({ path: `${OUT}/${id}.png` }).catch(() => {});
  console.log(`${id}: opened ${gotId}`);
  await page.locator('[data-testid="exercise-sheet"]').getByRole("button", { name: "Back" }).click({ force: true });
  await page.waitForTimeout(200);
}

await browser.close();
