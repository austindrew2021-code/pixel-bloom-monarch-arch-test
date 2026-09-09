import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Guards on `public/food` itself.
 *
 * A drop of 1,578 photographs got past everything once: 645 of them were the
 * same handful of images reused across unrelated dishes, three were too small
 * to be photographs at all (a logo, a graphic reading "BIN"), and the folder
 * came to 1.05 GB with a 38 MB JPEG of a sourdough loaf in it. None of that is
 * visible in a diff of image files, so it is checked here instead.
 *
 * These catch the mechanical faults. Whether a picture is of the dish it is
 * named for still needs an eye — see photos-rejected.txt.
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), "../../public/food");
const IMAGE = /\.(jpg|jpeg|png|webp|avif)$/i;

/** Every image, with its bytes hashed. */
function photos() {
  return readdirSync(DIR)
    .filter((f) => IMAGE.test(f))
    .map((file) => {
      const bytes = readFileSync(join(DIR, file));
      return { file, size: bytes.length, hash: createHash("sha1").update(bytes).digest("hex") };
    });
}

test("no photograph is shared between dishes", () => {
  const byHash = new Map<string, string[]>();
  for (const p of photos()) {
    if (!byHash.has(p.hash)) byHash.set(p.hash, []);
    byHash.get(p.hash)!.push(p.file);
  }
  const shared = [...byHash.values()].filter((g) => g.length > 1);
  assert.deepEqual(
    shared.map((g) => g.join(" = ")),
    [],
    "one image standing in for several dishes is a picture of none of them",
  );
});

test("every file is big enough to be a photograph", () => {
  // The three that slipped through at this size were a Vegan Society logo, a
  // red graphic reading "BIN", and a 823-byte placeholder.
  const tiny = photos().filter((p) => p.size < 8_000);
  assert.deepEqual(tiny.map((p) => `${p.file} (${p.size}B)`), []);
});

test("no file is too big for a phone to load", () => {
  // Nothing is ever shown wider than a phone screen. A megabyte is already
  // generous for that; `node .tmp/resize.mjs`-style downscaling is the fix.
  const heavy = photos().filter((p) => p.size > 1_000_000);
  assert.deepEqual(heavy.map((p) => `${p.file} (${Math.round(p.size / 1024)}KB)`), []);
});

test("the folder as a whole stays deployable", () => {
  const total = photos().reduce((sum, p) => sum + p.size, 0);
  const mb = total / 2 ** 20;
  assert.ok(mb < 250, `public/food is ${mb.toFixed(0)} MB; it was 1,050 MB once and could not ship`);
});
