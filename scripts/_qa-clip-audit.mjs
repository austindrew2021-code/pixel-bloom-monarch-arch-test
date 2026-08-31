#!/usr/bin/env node
// One-off QA tool: screenshot every exercise's detail-sheet figure (video clip or SVG
// fallback) so a reviewer can visually check the clip content actually matches the
// exercise name. Not part of the app or CI — disposable, like the other _qa-*.mjs scripts.
//
// Usage: start the dev server first (`npm run dev`, port 8080), then:
//   node scripts/_qa-clip-audit.mjs
//
// Output:
//   screenshots/clips/<id>.png       — one crop per exercise's figure
//   screenshots/clips/orphan-<id>.png — the 3 unregistered clip files, previewed directly
//   screenshots/clips/sheet-*.png    — labeled contact sheets, 16 per page, for fast review

import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const OUT = "screenshots/clips";
const PER_SHEET = 16;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(`${BASE}/?key=PLATE-8F2R`, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1800);

const fuelNow = await page.getByRole("button", { name: /^Fuel$/ }).count();
const gate = await page.getByRole("button", { name: "Open kitchen" }).count();
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
await page.getByRole("button", { name: "Exercise library", exact: true }).first().click({ force: true });
await page.waitForTimeout(500);

const listScope = '[data-testid="exercise-library"] ul li button';
const total = await page.locator(listScope).count();
console.log(`library has ${total} cards`);

const captured = [];
for (let i = 0; i < total; i += 1) {
  const card = page.locator(listScope).nth(i);
  await card.scrollIntoViewIfNeeded();
  await card.click({ force: true });
  await page.waitForTimeout(700);

  const figure = page.locator('[data-testid="exercise-sheet"] [data-testid="exercise-figure"]');
  const id = await figure.getAttribute("data-exercise-id");
  const name = await page.locator('[data-testid="exercise-sheet"] header p.font-display').innerText();
  const file = `${OUT}/${id}.png`;
  await figure.screenshot({ path: file });
  captured.push({ id, name, file });
  console.log(`${i + 1}/${total} ${id} — ${name}`);

  await page.locator('[data-testid="exercise-sheet"]').getByRole("button", { name: "Back" }).click({ force: true });
  await page.waitForTimeout(250);
}

// Preview the 3 orphaned clip files directly (not reachable via the app UI today).
for (const id of ["goblet", "sissy-squat", "sumo-squat"]) {
  const orphanPage = await browser.newPage({ viewport: { width: 320, height: 320 } });
  await orphanPage.setContent(
    `<video src="${BASE}/exercises/${id}.mp4" autoplay muted loop style="width:300px;height:300px;object-fit:contain;background:#eee"></video>`,
  );
  await orphanPage.waitForTimeout(900);
  const file = `${OUT}/orphan-${id}.png`;
  await orphanPage.locator("video").screenshot({ path: file });
  captured.push({ id: `orphan-${id}`, name: `(orphaned file) ${id}`, file });
  console.log(`orphan ${id} captured`);
  await orphanPage.close();
}

await browser.close();

// Build labeled contact sheets so review takes a handful of image reads, not ~104.
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
    .map((c) => `<figure><img src="file://${process.cwd()}/${c.file}"><figcaption>${c.id}<br>${c.name}</figcaption></figure>`)
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

console.log(`done: ${captured.length} exercises, ${Math.ceil(captured.length / PER_SHEET)} contact sheets in ${OUT}/`);
console.log(readdirSync(OUT).filter((f) => f.startsWith("sheet-") && f.endsWith(".png")).join("\n"));
