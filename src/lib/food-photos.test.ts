import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readPhotoFiles, renderManifest } from "../../scripts/food-photo-manifest.mjs";
import { dishesWithoutPhotos, hasOwnPhoto, photoFor, photoOrPlate } from "./food-photos.ts";
import { FOOD_PHOTO_FILES } from "./generated/food-photo-files.ts";
import { RECIPES } from "./recipes.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("the photo manifest matches what is on disk", () => {
  // A photo dropped into public/food without regenerating would otherwise be
  // invisible — which is exactly how the old hand-typed map lost 234 dishes.
  const onDisk = readPhotoFiles(join(ROOT, "public/food"));
  assert.deepEqual(
    FOOD_PHOTO_FILES,
    onDisk,
    "src/lib/generated/food-photo-files.ts is stale — run `npm run photos`",
  );
  // And the generator is deterministic, so the check above cannot pass by luck.
  assert.equal(typeof renderManifest(onDisk), "string");
});

test("every photo the app can serve is really there", () => {
  const missing: string[] = [];
  for (const recipe of RECIPES) {
    const src = photoFor(recipe);
    if (!existsSync(join(ROOT, "public", src))) missing.push(`${recipe.id} -> ${src}`);
  }
  assert.deepEqual(missing, [], missing.slice(0, 10).join("\n"));
});

test("a dish with its own photograph gets it, not a stock plate", () => {
  const pancakes = RECIPES.find((r) => r.id === "blueberry-pancakes");
  assert.ok(pancakes);
  assert.equal(hasOwnPhoto(pancakes), true);
  assert.equal(photoFor(pancakes), "/food/blueberry-pancakes.jpg");
});

test("a dish with no photograph falls back to its plate, never to nothing", () => {
  const stock = photoFor({ id: "no-such-dish", name: "Nothing", plate: "curry", tags: [] });
  assert.equal(stock, "/food/curry.jpg");
  assert.equal(existsSync(join(ROOT, "public/food/curry.jpg")), true);

  // An unknown plate still resolves rather than rendering a broken image.
  const odd = photoFor({ id: "no-such-dish", name: "Nothing", plate: "drink" as never, tags: [] });
  assert.equal(existsSync(join(ROOT, "public", odd)), true);
});

test("most of the catalog now shows a photograph of the actual dish", () => {
  const own = RECIPES.filter(hasOwnPhoto).length;
  // Held as a floor, not an exact number, so adding photos never fails the
  // suite — only losing them does.
  assert.ok(own >= 570, `only ${own} of ${RECIPES.length} dishes have their own photo`);
});

test("a dish is never illustrated with a photograph of a different dish", () => {
  // The rule the cards follow. Before this, `photoFor` handed back the stock
  // plate photo for anything without one of its own, so skillet cornbread was
  // shown as avocado toast — both plate as "toast".
  // The stock plate shots: what `photoFor` returns for a dish it has never
  // seen, one per plate kind the catalog uses.
  const stock = new Set(
    [...new Set(RECIPES.map((r) => r.plate))].map((plate) =>
      photoFor({ id: "no-such-dish", name: "Nothing", plate, tags: [] }),
    ),
  );
  assert.ok(stock.size > 0, "there should still be stock plate photos to avoid");
  for (const recipe of RECIPES) {
    const shot = photoOrPlate(recipe);
    if (shot.kind === "plate") continue;
    assert.equal(stock.has(shot.src), false, `${recipe.name} is shown as ${shot.src}`);
    // What it does show is a file named for this dish.
    assert.equal(
      shot.src === recipe.photo || shot.src === `/food/${FOOD_PHOTO_FILES[recipe.id]}`,
      true,
      `${recipe.id} -> ${shot.src}`,
    );
  }
});

test("the dishes still waiting on a photograph name the file they want", () => {
  const waiting = dishesWithoutPhotos(RECIPES);
  assert.equal(waiting.length, RECIPES.length - RECIPES.filter(hasOwnPhoto).length);
  for (const row of waiting.slice(0, 50)) {
    assert.equal(row.wants, `public/food/${row.id}.jpg`);
    assert.equal(existsSync(join(ROOT, row.wants)), false, `${row.id} already has ${row.wants}`);
  }
});
