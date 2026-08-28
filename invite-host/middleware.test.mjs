import assert from "node:assert/strict";
import test from "node:test";
import { scrubHtml } from "./api/index.js";

const SAMPLE = `<!DOCTYPE html><html lang="en"><head>
<meta property="og:image" content="https://pixel-bloom-monarch-arch.grok.me/og.jpg">
<title>Spoonful</title>
<link rel="manifest" href="/__grok/manifest.webmanifest">
<link rel="apple-touch-icon" href="/__grok/icon-180.png">
<meta name="grok-project-id" content="01a03b3b">
<script src="https://grok.com/grok-app-builder/extensions.js" data-project-id="01a03b3b" defer></script>
<meta property="grok:app_id" content="01a03b3b">
<meta property="x:creator" content="@crypto_fun0328">
</head><body>kitchen</body></html>`;

test("strips builder chrome and rewrites the public origin", () => {
  const out = scrubHtml(SAMPLE, "https://spoonful-kitchen.vercel.app");
  assert.doesNotMatch(out, /grok\.com/);
  assert.doesNotMatch(out, /grok\.me/);
  assert.doesNotMatch(out, /grok-project-id/);
  assert.doesNotMatch(out, /grok:app_id/);
  assert.doesNotMatch(out, /x:creator/);
  assert.doesNotMatch(out, /__grok\/manifest/);
  assert.match(out, /href="\/manifest\.webmanifest"/);
  assert.match(out, /href="\/icons\/icon-180\.png"/);
  assert.match(out, /https:\/\/spoonful-kitchen\.vercel\.app\/og\.jpg/);
  assert.match(out, /apple-mobile-web-app-capable/);
  assert.match(out, /kitchen/);
});
