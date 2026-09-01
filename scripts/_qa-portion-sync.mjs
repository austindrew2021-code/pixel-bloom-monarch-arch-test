#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/home/user/pixel-bloom-monarch-arch-test/screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const shot = (name) => page.screenshot({ path: `/home/user/pixel-bloom-monarch-arch-test/screenshots/qa-portion-${name}.png` });

await page.goto("http://127.0.0.1:8080/?key=PLATE-8F2R", { waitUntil: "networkidle", timeout: 45000 });
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
await page.waitForTimeout(400);

// Turn on Portion Sync from Extras/Store.
await page.getByRole("button", { name: /^Extras$/ }).last().click({ force: true }).catch(async () => {
  await page.getByRole("button", { name: /store/i }).first().click({ force: true }).catch(() => {});
});
await page.waitForTimeout(500);
const portionHeading = page.getByText("Portion Sync", { exact: true });
console.log("portionSyncSectionVisible:", await portionHeading.count());
await portionHeading.scrollIntoViewIfNeeded().catch(() => {});
await shot("store-before-toggle");
// The switch button sits in the same section as the heading; click the nearest role=switch after it.
const section = page.locator("section", { has: portionHeading });
await section.getByRole("switch").click({ force: true });
await page.waitForTimeout(300);
await shot("store-after-toggle");

// Go log a big lift session so today's burn is well above the plan.
await page.getByRole("button", { name: /^Fuel$/ }).last().click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^Train$/ }).last().click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
const startBtn = page.getByRole("button", { name: "Start session" }).first();
if (await startBtn.count()) {
  await startBtn.click({ force: true });
  await page.waitForTimeout(700);
  // Log every set visible, a few times, to push volume/kcal up meaningfully.
  for (let i = 0; i < 6; i++) {
    const logBtn = page.getByRole("button", { name: /^Log$/ }).first();
    if (!(await logBtn.count())) break;
    await logBtn.click({ force: true });
    await page.waitForTimeout(250);
  }
  const finish = page.getByRole("button", { name: "Finish" });
  if (await finish.count()) {
    await finish.click({ force: true });
    await page.waitForTimeout(500);
  }
}
await shot("after-lift");

// Back to Plan, check the Tonight card for the Portion Sync note.
await page.getByRole("button", { name: "Close extras" }).click({ force: true }).catch(() => {});
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^Plan$/ }).last().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
const note = page.locator('[data-testid="portion-sync-note"]');
console.log(JSON.stringify({
  noteVisible: await note.count(),
  noteText: await note.first().textContent().catch(() => null),
}, null, 2));
await shot("plan-tonight");

await browser.close();
