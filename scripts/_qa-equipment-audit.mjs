#!/usr/bin/env node
// One-off QA tool: re-check every REGISTERED clip's actual footage against its
// exercise's declared equipment (barbell vs dumbbell vs machine/cable), plus a
// spot-check of SVG-fallback exercises across the poses that just gained
// equipment-aware rendering (Squat/Hinge/Bench/Press/Row). Builds labeled
// contact sheets for fast review.
//
// Usage: start the dev server first (`npm run dev`, port 8080), then:
//   node scripts/_qa-equipment-audit.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { EXERCISES } from "../src/lib/exercises.ts";
import { EXERCISE_CLIPS } from "../src/lib/exercise-clips.ts";

const BASE = "http://127.0.0.1:8080";
const OUT = "screenshots/equipment-audit";
const PER_SHEET = 16;

mkdirSync(OUT, { recursive: true });

const registeredIds = new Set(EXERCISE_CLIPS);
const byId = new Map(EXERCISES.map((e) => [e.id, e]));

// SVG spot-check: a few unregistered exercises per equipment-aware pose so we
// can confirm the Implement fix renders the right icon (or none, for cable/
// machine/bodyweight) instead of an unconditional barbell.
const SVG_SPOT_CHECK = [
  "cossack", // squat, bodyweight -> should show no bar
  "sissy-squat", // squat, bodyweight -> no bar
  "seated-db-press", // press, dumbbell -> dumbbells not barbell
  "arnold", // press, dumbbell -> dumbbells
  "incline-db", // bench, dumbbell -> dumbbells
  "decline-db", // bench, dumbbell -> dumbbells
  "t-bar-row", // row, barbell -> keep barbell
  "good-morning", // hinge, barbell -> keep barbell
  "one-arm-row", // row, dumbbell -> dumbbells
  "cable-row", // row, cable -> no bar
  "seated-db-press", // press, dumbbell
  "front-squat", // squat, barbell -> keep barbell
];

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

const targetIds = [...registeredIds, ...new Set(SVG_SPOT_CHECK)];
const captured = [];

for (const id of targetIds) {
  const ex = byId.get(id);
  if (!ex) {
    console.log(`skip ${id}: not in EXERCISES`);
    continue;
  }
  await page.locator('[data-testid="exercise-library"] input').fill(ex.name);
  await page.waitForTimeout(350);
  const card = page.locator('[data-testid="exercise-library"] ul li button').first();
  if (!(await card.count())) {
    console.log(`no card found for ${id} (${ex.name})`);
    continue;
  }
  await card.click({ force: true });
  await page.waitForTimeout(600);

  const figure = page.locator('[data-testid="exercise-sheet"] [data-testid="exercise-figure"]');
  const gotId = await figure.getAttribute("data-exercise-id");
  const kind = registeredIds.has(id) ? "clip" : "svg";
  const label = `${id} [${kind}/${ex.equipment}]`;
  const file = `${OUT}/${kind}-${id}.png`;
  await figure.screenshot({ path: file }).catch(() => {});
  captured.push({ id, name: ex.name, equipment: ex.equipment, kind, file, matchedId: gotId });
  console.log(`${captured.length}/${targetIds.length} ${label} — ${ex.name} (opened: ${gotId})`);

  await page.locator('[data-testid="exercise-sheet"]').getByRole("button", { name: "Back" }).click({ force: true });
  await page.waitForTimeout(200);
}

await browser.close();

const sheetPage = await (
  await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] })
).newPage();
for (let s = 0; s < captured.length; s += PER_SHEET) {
  const chunk = captured.slice(s, s + PER_SHEET);
  const html = `<!doctype html><html><head><style>
    body{margin:0;font:12px/1.3 system-ui;background:#fff}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px}
    figure{margin:0;border:1px solid #ccc;padding:4px;text-align:center}
    img{width:100%;height:160px;object-fit:contain;background:#f2f2f2}
    figcaption{font-weight:600;word-break:break-word}
  </style></head><body><div class="grid">${chunk
    .map((c) => `<figure><img src="file://${process.cwd()}/${c.file}"><figcaption>${c.id} [${c.kind}/${c.equipment}]<br>${c.name}</figcaption></figure>`)
    .join("")}</div></body></html>`;
  const sheetIndex = Math.floor(s / PER_SHEET);
  const htmlFile = `${OUT}/sheet-${sheetIndex}.html`;
  writeFileSync(htmlFile, html);
  await sheetPage.goto(`file://${process.cwd()}/${htmlFile}`);
  await sheetPage.waitForTimeout(300);
  await sheetPage.screenshot({ path: `${OUT}/sheet-${sheetIndex}.png`, fullPage: true });
  console.log(`wrote ${OUT}/sheet-${sheetIndex}.png`);
}
await sheetPage.close();

console.log(`done: ${captured.length} exercises captured`);
