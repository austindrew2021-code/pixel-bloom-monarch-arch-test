#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const shot = (name) => page.screenshot({ path: `screenshots/qa-devicesync-${name}.png` });

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

// Body pane: connect card should now appear directly.
await page.getByRole("button", { name: /^Fuel$/ }).last().click({ force: true });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Body" }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
const bodyHeading = page.getByRole("heading", { name: "Watch & Health Connect" });
console.log("Watch & Health Connect visible in Body pane:", await bodyHeading.count());
await bodyHeading.scrollIntoViewIfNeeded().catch(() => {});
await shot("body-pane");

// Extras: same card should still be there.
await page.getByRole("button", { name: /^Extras$/ }).last().click({ force: true }).catch(async () => {
  await page.getByRole("button", { name: /store/i }).first().click({ force: true }).catch(() => {});
});
await page.waitForTimeout(500);
const extrasHeading = page.getByRole("heading", { name: "Watch & Health Connect" });
console.log("Watch & Health Connect visible in Extras:", await extrasHeading.count());
await extrasHeading.scrollIntoViewIfNeeded().catch(() => {});
await shot("extras");

await browser.close();
