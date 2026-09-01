#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/home/user/pixel-bloom-monarch-arch-test/screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const shot = (name) => page.screenshot({ path: `/home/user/pixel-bloom-monarch-arch-test/screenshots/qa-train-${name}.png` });

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

// --- 1. Animated SVG pose figure: confirm the transform actually changes over time ---
await page.getByRole("button", { name: /^Fuel$/ }).last().click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^Train$/ }).last().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await shot("train-landing");

// Today's plan may be a cardio day, not a lift day — use the freeform "Start lifting"
// entry point (fit-view.tsx, under the "Body" pane) instead of the day's session card.
await page.getByRole("button", { name: "Body" }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
const startLiftingBtn = page.getByRole("button", { name: "Start lifting" }).first();
console.log("Start lifting button found:", await startLiftingBtn.count());
if (await startLiftingBtn.count()) {
  await startLiftingBtn.scrollIntoViewIfNeeded();
  await startLiftingBtn.click({ force: true });
  await page.waitForTimeout(700);
}

// Open the exercise picker to check filter parity (equipment chips, Saved chip, favorite toggle).
const addExerciseBtn = page.getByRole("button", { name: "Add exercise" });
console.log("session sheet open, Add exercise visible:", await addExerciseBtn.count());
await addExerciseBtn.click({ force: true, timeout: 8000 });
await page.waitForTimeout(400);
await shot("picker-open");
const anyKit = page.getByRole("button", { name: "Any kit" });
console.log(JSON.stringify({
  equipmentChipVisible: await anyKit.count(),
  savedChipVisible: await page.getByRole("button", { name: /^Saved$/ }).count(),
}, null, 2));

// Filter to barbell and add "Back squat". (name must be exact — "Barbell row" etc.
// otherwise substring-match the equipment chip too.)
await page.getByRole("button", { name: "Barbell", exact: true }).click({ force: true });
await page.waitForTimeout(300);
await shot("picker-barbell-filter");
const squatRow = page.locator("li", { hasText: "Back squat" }).first();
console.log("squat row visible after barbell filter:", await squatRow.count());
await squatRow.getByText("Back squat").click({ force: true });
await page.waitForTimeout(500);
await shot("session-with-squat");

// Animation check: sample the pose figure's computed transform twice, ~700ms apart.
const figure = page.locator('[data-testid="exercise-figure"] g').first();
const t1 = await figure.evaluate((el) => getComputedStyle(el).transform).catch(() => null);
await page.waitForTimeout(700);
const t2 = await figure.evaluate((el) => getComputedStyle(el).transform).catch(() => null);
console.log(JSON.stringify({ transformSample1: t1, transformSample2: t2, animated: t1 !== t2 }, null, 2));

// Warm-up ladder: tapered reps across the three rungs.
const warmupBtn = page.getByRole("button", { name: /^Warm-up$/ }).first();
if (await warmupBtn.count()) {
  await warmupBtn.click({ force: true });
  await page.waitForTimeout(400);
  await shot("warmup-ladder");
}

// Rest timer notification toggle in Store settings.
await page.getByRole("button", { name: "Close" }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Close lift" }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^Extras$/ }).last().click({ force: true }).catch(async () => {
  await page.getByRole("button", { name: /store/i }).first().click({ force: true }).catch(() => {});
});
await page.waitForTimeout(500);
const restToggle = page.getByRole("button", { name: /Rest timer done/ });
console.log("Rest timer done toggle visible:", await restToggle.count());
await restToggle.scrollIntoViewIfNeeded().catch(() => {});
await shot("store-rest-toggle");

await browser.close();
