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

await page.goto("http://127.0.0.1:8080/?key=PLATE-8F2R", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(800);
if (await page.locator("#tester-key").count()) {
  try {
    await page.locator("#tester-key").fill("PLATE-8F2R", { timeout: 1500 });
  } catch {
    /* hydrated unlock */
  }
}

await page.evaluate(() => {
  const raw = localStorage.getItem("spoonful-v1");
  let parsed = raw ? JSON.parse(raw) : { state: {} };
  parsed.state = {
    ...(parsed.state ?? {}),
    walkthroughDone: true,
    onboarded: true,
    nextGen: true,
  };
  localStorage.setItem("spoonful-v1", JSON.stringify(parsed));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);
if (await page.locator("#tester-key").count()) {
  try {
    await page.locator("#tester-key").fill("PLATE-8F2R", { timeout: 1200 });
  } catch {
    /* unlocked */
  }
}

const skip = page.getByRole("button", { name: "Skip", exact: true });
if (await skip.count()) await skip.click();

const fuel = page.getByRole("button", { name: /^Fuel$/ });
if (await fuel.count()) await fuel.first().click();
await page.waitForTimeout(500);
const train = page.getByRole("button", { name: "Train", exact: true });
if (await train.count()) await train.first().click();
await page.waitForTimeout(400);

const lib = page.getByRole("button", { name: "Exercise library", exact: true });
if (await lib.count()) await lib.click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/qa-lib-bench.png" });

const libRoot = page.locator("div.fixed").filter({ hasText: "Exercises" }).first();
const bench = libRoot.getByText("Bench press", { exact: true });
const ohp = libRoot.getByText("Overhead press", { exact: true });
const row = libRoot.getByText("Barbell row", { exact: true });
const wheel = libRoot.getByText("Ab wheel rollout");
const hits = {
  bench: await bench.count(),
  ohp: await ohp.count(),
  row: await row.count(),
  wheel: await wheel.count(),
  seatedFly: await libRoot.getByText("Seated machine fly").count(),
};
if (await bench.count()) {
  await bench.first().click({ force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/workspace/screenshots/qa-clip-bench.png" });
  const back = page.getByRole("button", { name: "Back" });
  if (await back.count()) await back.first().click({ force: true });
  await page.waitForTimeout(400);
}
await page.getByRole("button", { name: "Close library" }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);

await page.getByRole("button", { name: /Start session|Open again|Makeup|Log it/ }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(900);
await page.screenshot({ path: "/workspace/screenshots/qa-lift-features.png" });
const liftHits = {
  drop20: await page.getByRole("button", { name: "Drop 20%" }).count(),
  restPause: await page.getByRole("button", { name: "Rest-pause" }).count(),
  fillRest: await page.getByRole("button", { name: "Fill rest" }).count(),
  eta: (await page.locator("body").innerText()).includes("min"),
  recap: await page.getByRole("button", { name: "Copy recap" }).count(),
  benchName: (await page.locator("body").innerText()).includes("Bench press"),
};

const body = (await page.locator("body").innerText()).slice(0, 1800);
console.log(JSON.stringify({ errors: errors.slice(0, 6), hits, liftHits, bodyPreview: body }, null, 2));
await browser.close();
