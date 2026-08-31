#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto("http://127.0.0.1:8080/?key=PLATE-8F2R", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1800);

const fuelNow = await page.getByRole("button", { name: /^Fuel$/ }).count();
const onboard = await page.getByText("How you want it").count();
const gate = await page.getByRole("button", { name: "Open kitchen" }).count();
console.log({ fuelNow, onboard, gate });

if (!fuelNow && gate) {
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
await page.screenshot({ path: "/workspace/screenshots/qa-train-ready.png" });

await page.getByRole("button", { name: "Start session" }).first().click({ force: true });
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/qa-lift-open.png" });
const logs = await page.getByRole("button", { name: /^Log$/ }).count();
if (logs) await page.getByRole("button", { name: /^Log$/ }).first().click({ force: true });
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/qa-lift-rir.png" });
console.log(JSON.stringify({
  logs,
  finish: await page.getByRole("button", { name: "Finish" }).isVisible().catch(() => false),
  plus15: await page.getByRole("button", { name: "+15" }).isVisible().catch(() => false),
  minus15: await page.getByRole("button", { name: "−15" }).isVisible().catch(() => false),
  rir: await page.getByText("RIR").first().isVisible().catch(() => false),
  drop: await page.getByRole("button", { name: "Drop" }).isVisible().catch(() => false),
  fail: await page.getByRole("button", { name: "Fail" }).isVisible().catch(() => false),
  easy: await page.getByRole("button", { name: "Easy" }).isVisible().catch(() => false),
  warmup: await page.getByRole("button", { name: "Warm-up" }).isVisible().catch(() => false),
  pair: await page.getByRole("button", { name: "Pair" }).isVisible().catch(() => false),
  note: await page.getByPlaceholder("Note for next time").count(),
  videos: await page.locator("video").count(),
}, null, 2));
await browser.close();
