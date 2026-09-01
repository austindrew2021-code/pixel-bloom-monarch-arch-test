#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/home/user/pixel-bloom-monarch-arch-test/screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const shot = (name) => page.screenshot({ path: `/home/user/pixel-bloom-monarch-arch-test/screenshots/qa-photos-${name}.png` });

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

await page.getByRole("button", { name: /^Fuel$/ }).last().click({ force: true });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Body", exact: true }).click({ force: true });
await page.waitForTimeout(400);
await page.mouse.wheel(0, 500);
await page.waitForTimeout(300);
await shot("empty-state");

const emptyBtn = page.getByRole("button", { name: /Add first photo/ });
console.log("empty-state add button visible:", await emptyBtn.count());

// Native camera capture input — feed it a sample file directly.
const fileInput = page.locator('input[type="file"][capture="environment"]').first();
await fileInput.setInputFiles("public/food/noodles.jpg");
await page.waitForTimeout(800);
await shot("after-first-photo");

const thumb = page.locator('section:has-text("Progress photos") button img');
console.log("thumbnails after 1st photo:", await thumb.count());

// Add a second photo so Compare becomes relevant.
const addIconBtn = page.getByRole("button", { name: "Add photo" });
console.log("icon add button visible:", await addIconBtn.count());
await fileInput.setInputFiles("public/food/quiche-lorraine.jpg");
await page.waitForTimeout(800);
await shot("after-second-photo");
console.log("thumbnails after 2nd photo:", await thumb.count());

// Free tier: Compare should be locked (routes to store), not the real compare button.
const lockedCompare = page.getByText("Kitchen Table unlocks a side-by-side");
const unlockedCompare = page.getByRole("button", { name: /Compare first vs\. latest/ });
console.log(JSON.stringify({
  lockedCompareVisible: await lockedCompare.count(),
  unlockedCompareVisible: await unlockedCompare.count(),
}, null, 2));

// Open one photo's detail view.
await thumb.first().click({ force: true });
await page.waitForTimeout(500);
await shot("detail-view");
const deleteBtn = page.getByRole("button", { name: /Delete photo/ });
console.log("delete button in detail view:", await deleteBtn.count());
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(300);

// Unlock Kitchen Table (simulated purchase flow) and confirm Compare unlocks.
await page.getByRole("button", { name: /^Extras$/ }).last().click({ force: true }).catch(async () => {
  await page.getByRole("button", { name: /store/i }).first().click({ force: true }).catch(() => {});
});
await page.waitForTimeout(500);
const kitchenTableCard = page.locator("li", { has: page.getByRole("heading", { name: "Kitchen Table" }) }).first();
await kitchenTableCard.scrollIntoViewIfNeeded().catch(() => {});
console.log("Kitchen Table card found:", await kitchenTableCard.count());
await kitchenTableCard.getByRole("button", { name: /^Start/ }).click({ force: true });
await page.waitForTimeout(400);
await shot("checkout-sheet");
const confirmBtn = page.getByRole("button", { name: "Start", exact: true });
console.log("confirm button visible:", await confirmBtn.count());
if (await confirmBtn.count()) {
  await confirmBtn.click({ force: true });
  await page.waitForTimeout(400);
}
// Reload fresh rather than fighting the extras-overlay z-index in this
// script — Kitchen Table + the two photos are all persisted (localStorage
// + IndexedDB), so a clean reload lands on a normal, unobstructed page.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /^Fuel$/ }).last().click({ force: true });
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Body", exact: true }).click({ force: true });
await page.waitForTimeout(400);
await page.mouse.wheel(0, 500);
await page.waitForTimeout(300);
await shot("kitchen-table-unlocked");
console.log("Compare button visible after unlock:", await unlockedCompare.count());
if (await unlockedCompare.count()) {
  await unlockedCompare.scrollIntoViewIfNeeded();
  await unlockedCompare.click({ force: true });
  await page.waitForTimeout(500);
  await shot("compare-view");
}

await browser.close();
