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

async function unlock() {
  await page.goto("http://127.0.0.1:8080/?key=PLATE-8F2R", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  const gate = page.locator("#tester-key");
  if (await gate.count()) {
    try {
      await gate.fill("PLATE-8F2R", { timeout: 2000 });
      const submit = page.locator("form button[type=submit]");
      if (await submit.count()) await submit.last().click({ timeout: 2000 });
    } catch {
      /* hydrated unlock already tore the gate down */
    }
    await page.waitForTimeout(600);
  }
}

async function onboardIfNeeded() {
  const how = page.getByText("How you want it");
  if (await how.count()) {
    await page.locator("button:has-text('Next Gen')").first().click();
    const cut = page.getByRole("button", { name: "Cut fat" });
    if (await cut.count()) await cut.click();
    const fill = page.getByRole("button", { name: "Fill a sample week" });
    if (await fill.count()) {
      await fill.scrollIntoViewIfNeeded();
      await fill.click({ force: true });
    }
    await page.waitForTimeout(600);
  }
}

await unlock();
await onboardIfNeeded();

await page.evaluate(() => {
  const raw = localStorage.getItem("spoonful-v1");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.state) parsed.state.walkthroughDone = false;
    localStorage.setItem("spoonful-v1", JSON.stringify(parsed));
  } catch {}
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
if (await page.locator("#tester-key").count()) {
  try {
    await page.locator("#tester-key").fill("PLATE-8F2R", { timeout: 2000 });
    const submit = page.locator("form button[type=submit]");
    if (await submit.count()) await submit.last().click({ timeout: 2000 });
  } catch {
    /* gate already gone */
  }
  await page.waitForTimeout(600);
}

const tourTitle = page.locator("#tour-title");
try {
  await tourTitle.waitFor({ timeout: 8000 });
} catch {
  const extras = page.getByRole("button", { name: /Extras/i }).first();
  if (await extras.count()) {
    await extras.click();
    await page.waitForTimeout(500);
    const replay = page.getByRole("button", { name: "Replay the walkthrough" });
    if (await replay.count()) await replay.click();
    await page.waitForTimeout(800);
  }
}
await tourTitle.waitFor({ timeout: 10000 });
await page.screenshot({ path: "/workspace/screenshots/qa-tour-1.png" });
const skip = page.getByRole("button", { name: "Skip", exact: true });
const next = page.getByRole("button", { name: "Next", exact: true });
const titles = [await tourTitle.innerText()];
for (let i = 0; i < 6; i++) {
  if (await next.count()) await next.click();
  await page.waitForTimeout(450);
  if (await tourTitle.count()) titles.push(await tourTitle.innerText());
}
await page.screenshot({ path: "/workspace/screenshots/qa-tour-mid.png" });
if (await skip.count()) await skip.click();
await page.waitForTimeout(500);
const tourGone = (await page.locator("#tour-title").count()) === 0;
await page.screenshot({ path: "/workspace/screenshots/qa-tour-skip.png" });

// Fuel -> library + lift
const fuel = page.getByRole("button", { name: /^Fuel$/ });
if (await fuel.count()) await fuel.first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/qa-fuel-after-tour.png" });

const train = page.getByRole("button", { name: "Train", exact: true });
if (await train.count()) await train.first().click();
await page.waitForTimeout(400);
const lib = page.getByRole("button", { name: "Exercise library", exact: true });
if (await lib.count()) await lib.first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/qa-lib-renamed.png" });

const smith = page.getByText("Smith shrug");
const gobletPose = page.getByText("Goblet squat");
const kick = page.getByText("Quadruped glute kickback");
const preacher = page.getByText("EZ-bar preacher curl");
const libHits = {
  smithShrug: await smith.count(),
  goblet: await gobletPose.count(),
  kickback: await kick.count(),
  preacher: await preacher.count(),
};
if (await smith.count()) {
  await smith.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/workspace/screenshots/qa-clip-smith-shrug.png" });
  const back = page.getByRole("button", { name: "Back", exact: true });
  if (await back.count()) await back.first().click({ force: true });
  await page.waitForTimeout(400);
}
const closeLib = page.getByRole("button", { name: "Close library" });
if (await closeLib.count()) await closeLib.click({ force: true });
await page.waitForTimeout(400);

const start = page.getByRole("button", { name: /Start session|Log it|Open again|Makeup/ }).first();
if (await start.count()) await start.click({ force: true });
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/qa-lift-floor.png" });
const fillRest = page.getByRole("button", { name: "Fill rest" });
const swap = page.getByRole("button", { name: "Swap" });
const left = page.getByRole("button", { name: "L" });
const liftHits = {
  fillRest: await fillRest.count(),
  swap: await swap.count(),
  left: await left.count(),
  pause: await page.getByRole("button", { name: /Pause rest|Resume rest/ }).count(),
};

const body = (await page.locator("body").innerText()).slice(0, 2200);
console.log(JSON.stringify({
  errors: errors.slice(0, 8),
  titles,
  tourGone,
  libHits,
  liftHits,
  bodyPreview: body,
}, null, 2));
await browser.close();
