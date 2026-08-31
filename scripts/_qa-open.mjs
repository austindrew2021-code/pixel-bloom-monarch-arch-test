import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push("page:" + String(e.message ?? e)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console:" + msg.text()); });
await page.goto("http://127.0.0.1:8080/?key=PLATE-8F2R", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1200);
const html = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/qa-open.png", fullPage: true });
if (await page.locator("#tester-key").count()) {
  await page.locator("#tester-key").fill("PLATE-8F2R");
  await page.locator("form button[type=submit]").last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/workspace/screenshots/qa-open-unlocked.png", fullPage: true });
}
console.log(JSON.stringify({
  title: await page.title(),
  errors: errors.slice(0, 8),
  text: html.slice(0, 500),
  url: page.url(),
}, null, 2));
await browser.close();
