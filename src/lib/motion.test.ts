import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "styles.css"), "utf8");

/** The `@media (prefers-reduced-motion: reduce)` block that covers the art layer. */
function reducedMotionBlocks(): string {
  const out: string[] = [];
  const marker = "@media (prefers-reduced-motion: reduce)";
  let at = CSS.indexOf(marker);
  while (at !== -1) {
    // Walk braces so a nested rule cannot end the block early.
    const open = CSS.indexOf("{", at);
    let depth = 0;
    let i = open;
    for (; i < CSS.length; i++) {
      if (CSS[i] === "{") depth++;
      else if (CSS[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push(CSS.slice(open, i));
    at = CSS.indexOf(marker, i);
  }
  return out.join("\n");
}

test("every animated art layer can be switched off", () => {
  // Class names that carry an `animation:` in the theme-art layer.
  const animated = new Set<string>();
  const re = /\.(theme-art__[a-z-]+)[^{}]*\{[^}]*animation:/g;
  for (const match of CSS.matchAll(re)) animated.add(match[1]!);

  assert.ok(animated.size > 0, "no animated art classes found — did the selector shape change?");

  const reduced = reducedMotionBlocks();
  const uncovered = [...animated].filter((cls) => !reduced.includes(`.${cls}`)).sort();
  assert.deepEqual(
    uncovered,
    [],
    `these keep moving for a cook who asked for less motion:\n${uncovered.join("\n")}`,
  );
});

test("the drifting gas is composited, not re-filtered every frame", () => {
  const block = CSS.slice(CSS.indexOf(".theme-art__gas"), CSS.indexOf(".theme-art__gas") + 700);
  assert.match(block, /will-change:\s*transform/, "the gas layer needs a compositor hint");
  // Only transform and opacity may animate here. Animating the filter itself
  // re-runs fractal noise over the whole layer every frame.
  const keyframes = CSS.slice(CSS.indexOf("@keyframes theme-gas-a"));
  const firstTwo = keyframes.slice(0, keyframes.indexOf("@keyframes theme-breeze"));
  assert.equal(/filter:|baseFrequency/.test(firstTwo), false, "gas keyframes must not touch the filter");
});

test("photo skins keep a scrim under the loose text at the top", () => {
  assert.match(CSS, /html\[data-art="1"\] \.theme-art::after/);
});
