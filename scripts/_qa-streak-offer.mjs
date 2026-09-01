#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/home/user/pixel-bloom-monarch-arch-test/screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const shot = (name) => page.screenshot({ path: `/home/user/pixel-bloom-monarch-arch-test/screenshots/qa-streak-${name}.png` });

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

// Compute a broken 3-night streak ending "yesterday" relative to the browser's own clock.
const dates = await page.evaluate(() => {
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const mk = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return fmt(d);
  };
  return { d4: mk(-4), d3: mk(-3), d2: mk(-2) };
});
console.log("seed dates:", dates);

async function seedBrokenStreak({ kitchenTable }) {
  await page.evaluate(
    ({ dates, kitchenTable }) => {
      const raw = localStorage.getItem("spoonful-v1");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state.cookedDates = [dates.d4, dates.d3, dates.d2];
      parsed.state.streakSavedDates = [];
      parsed.state.streakSaveOfferSeen = [];
      parsed.state.streakSaveUsed = 0;
      parsed.state.streakSaveBonus = 0;
      if (kitchenTable) {
        const u = new Set(parsed.state.unlocked ?? []);
        u.add("kitchen-table");
        parsed.state.unlocked = [...u];
      }
      localStorage.setItem("spoonful-v1", JSON.stringify(parsed));
    },
    { dates, kitchenTable },
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

// --- Scenario A: no free saves available (Kitchen Table not unlocked) -> paid path ---
await seedBrokenStreak({ kitchenTable: false });
const offer = page.locator('[data-testid="streak-offer"]');
console.log(JSON.stringify({ scenario: "paid", offerVisible: await offer.count(), text: await offer.first().textContent().catch(() => null) }, null, 2));
await shot("a-offer-paid");

await offer.getByRole("button", { name: /Save for/ }).click({ force: true });
await page.waitForTimeout(400);
await shot("a-checkout-sheet");
await page.getByRole("button", { name: /^Confirm —/ }).click({ force: true });
await page.waitForTimeout(500);
console.log("after paid save, offer still visible:", await offer.count());
await shot("a-after-save");

// --- Scenario B: Kitchen Table unlocked -> free credit path ---
await seedBrokenStreak({ kitchenTable: true });
console.log(JSON.stringify({ scenario: "free", offerVisible: await offer.count(), text: await offer.first().textContent().catch(() => null) }, null, 2));
await shot("b-offer-free");

await offer.getByRole("button", { name: /Save my streak — free/ }).click({ force: true });
await page.waitForTimeout(500);
console.log("after free save, offer still visible:", await offer.count());
await shot("b-after-save");

// --- Scenario C: dismiss ("Let it go") should hide the card without spending a save ---
await seedBrokenStreak({ kitchenTable: true });
console.log("dismiss scenario, offer visible before:", await offer.count());
await offer.getByRole("button", { name: "Let it go" }).click({ force: true });
await page.waitForTimeout(400);
console.log("after dismiss, offer visible:", await offer.count());
await shot("c-after-dismiss");

await browser.close();
