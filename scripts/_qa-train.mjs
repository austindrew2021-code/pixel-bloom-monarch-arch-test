#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message ?? e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto("http://127.0.0.1:8080/?key=PLATE-8F2R", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(800);

if (await page.locator("#tester-key").count()) {
  await page.locator("#tester-key").fill("PLATE-8F2R");
  await page.locator("form button[type=submit], form button").last().click();
  await page.waitForTimeout(600);
}

await page.waitForSelector("text=How you want it", { timeout: 15000 });
await page.locator("button:has-text('Next Gen')").first().click();
await page.getByRole("button", { name: "Cut fat" }).click();
const fill = page.getByRole("button", { name: "Fill a sample week" });
await fill.scrollIntoViewIfNeeded();
await fill.click({ force: true });
await page.waitForTimeout(800);

const skip = page.getByRole("button", { name: "Skip" });
if (await skip.count()) {
  await skip.click();
  await page.waitForTimeout(600);
}

await page.waitForSelector("text=This week", { timeout: 15000 });
const fuelBtn = page.locator("button").filter({ hasText: /^Fuel$/ });
if (await fuelBtn.count()) await fuelBtn.first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/qa-train.png", fullPage: true });

const trainBtn = page.getByRole("button", { name: "Train" });
if (await trainBtn.count()) {
  await trainBtn.click();
  await page.waitForTimeout(400);
}
const weekDay = page.locator("ol.mt-4 button").first();
if (await weekDay.count()) await weekDay.click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/qa-train-pane.png", fullPage: true });

const skipSession = page.locator("button:has-text('Skip')").first();
if (await skipSession.count()) {
  await skipSession.click({ force: true });
  await page.waitForTimeout(800);
}
await page.screenshot({ path: "/workspace/screenshots/qa-train-skip.png", fullPage: true });

const lib = page.locator("button:has-text('Exercise library')").first();
if (await lib.count()) await lib.click({ force: true });
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/qa-train-library.png", fullPage: true });

const card = page.locator(".grid button").filter({ hasText: "Back squat" }).first();
if (await card.count()) await card.click({ force: true });
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/qa-train-exercise.png", fullPage: true });

const body = (await page.locator("body").innerText()).slice(0, 1800);
console.log(JSON.stringify({ errors: errors.slice(0, 3), bodyPreview: body, url: page.url() }, null, 2));
await browser.close();
