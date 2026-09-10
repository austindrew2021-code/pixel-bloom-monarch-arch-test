import assert from "node:assert/strict";
import test from "node:test";
import { RECIPES } from "./recipes.ts";
import type { Recipe } from "./types";

/*
 * A recipe has to be makeable from its own steps.
 *
 * Verifying the catalog against published recipes turned up a class of defect
 * no earlier invariant could see. A generic step template had been stamped over
 * dishes whose real method is something else — cheesecake browned in a skillet,
 * forty dumpling wrappers stirred into the filling, a stew "cooked through" in
 * two minutes — and separately, leftover ingredients had been appended to
 * whatever step came last as "Stir in the ...", long after the dish was in the
 * tin or on the table.
 *
 * The step/list invariant passed the whole time, because every ingredient was
 * mentioned. Mentioned is not the same as used correctly, so these rules read
 * the method for sense rather than for coverage.
 */

const method = (r: Recipe) => r.steps.join(" ");

/** A dish whose name promises a technique the method never performs. */
const PROMISES: { what: string; name: RegExp; method: RegExp }[] = [
  {
    what: "an oven",
    name: /\b(baked?|casserole|cheesecake|gratin|cobbler|crumble|muffin|scone|brownie|swirl loaf)\b/i,
    method: /\b(oven|bake|baking|roast|broil|air fryer|air-fry|slow cooker|coals)\b/i,
  },
  {
    what: "a grill",
    name: /\bgrill(ed)?\b/i,
    method: /\b(grill|barbecue|bbq|coals|broil|char)\b/i,
  },
  {
    what: "a steamer",
    name: /\b(steamed|soup dumplings?|bao)\b/i,
    method: /\b(steam|steamer|bamboo|basket)\b/i,
  },
  {
    what: "a long cook",
    name: /\b(braised?|slow)\b/i,
    method: /\b([2-9]\d\s*(?:to\s*\d+\s*)?minutes|[2-9]\s*(?:to\s*\d+½?\s*)?hours?|1½?\s*hours?|overnight|slow cooker)\b/i,
  },
];

/**
 * Dishes whose name reads like a technique they correctly do not use. Each one
 * is a real dish, not an exemption of convenience.
 */
const NOT_WHAT_IT_SOUNDS_LIKE = new Set([
  "kc-bbq-sauce", // a sauce for the grill, not a thing that is grilled
  "so-barbecue-sauce",
  "so-barbecued-lamb", // the 1935 recipe oven-roasts it with a basting sauce
  "hd-bread-sauce", // "bread sauce" is a saucepan dish; the name is not a bake
  "vh-pd-pot-pie", // Pennsylvania pot pie is boiled noodles, and says so
  "mx-tamale-pie", // a cornbread-topped bake, not a steamed tamale
  "so-hoe-cake", // a griddle cake; the griddle is the correct pan
  "ac-bunny-chow", // "bread bowls" is the vessel, not a baking instruction
  "kd-grilled-cheese", // griddled in a skillet; "grilled cheese" has never meant a grill
]);

test("no dish promises a technique its own steps never use", () => {
  const broken: string[] = [];
  for (const r of RECIPES) {
    if (NOT_WHAT_IT_SOUNDS_LIKE.has(r.id)) continue;
    for (const p of PROMISES) {
      if (p.name.test(r.name) && !p.method.test(method(r))) {
        broken.push(`${r.name} (${r.id}) never uses ${p.what}`);
        break;
      }
    }
  }
  assert.deepEqual(broken, [], broken.slice(0, 12).join("\n"));
});

test("nothing structural is stirred into a pan", () => {
  // Forty dumpling wrappers, two unsliced loaves and a whole bird were all
  // "stirred in". They are the wrapper, the bowl, and the dish itself.
  const structural =
    /\b(dumpling wrappers?|unsliced white loaves|bread bowls?|pie shell|pie crust|ladyfingers?|pound cake|ice cream|frying chicken|pork chops?|head of lettuce)\b/i;
  const broken: string[] = [];
  for (const r of RECIPES) {
    for (const step of r.steps) {
      const at = step.search(/\b(?:stir|mix|whisk|fold) in\b/i);
      if (at === -1) continue;
      const hit = step.slice(at).match(structural);
      if (hit) broken.push(`${r.id} stirs in "${hit[0]}"`);
    }
  }
  assert.deepEqual(broken, [], broken.slice(0, 12).join("\n"));
});

test("nothing is added after the dish has been served", () => {
  const broken: string[] = [];
  for (const r of RECIPES) {
    for (const step of r.steps) {
      const at = step.search(/\b(?:stir|mix|whisk|fold) in\b/i);
      if (at === -1) continue;
      if (/\b(?:serve|plate|spread on the cake|pour into a (?:baked|unbaked) pie shell|scrape into)\b/i.test(step.slice(0, at))) {
        broken.push(`${r.id}: ${step}`);
      }
    }
  }
  assert.deepEqual(broken, [], broken.slice(0, 8).join("\n"));
});

test("the Caesar cooks its chicken before it meets the leaves", () => {
  // This one shipped: raw chicken breasts were tipped into the salad bowl and
  // "cooked, stirring" among the romaine.
  const caesar = RECIPES.find((r) => r.id === "hp-chicken-caesar");
  assert.ok(caesar);
  const cooks = caesar.steps.findIndex((s) => /\b(grill|sear|roast|poach)\b/i.test(s) && /165|cooked through/i.test(s));
  const tosses = caesar.steps.findIndex((s) => /\btoss the leaves\b/i.test(s));
  assert.ok(cooks !== -1, "the chicken is never cooked");
  assert.ok(cooks < tosses, "the chicken is cooked after the salad is tossed");
});

test("gumbo builds its roux before the broth goes in", () => {
  const gumbo = RECIPES.find((r) => r.id === "gumbo");
  assert.ok(gumbo);
  const roux = gumbo.steps.findIndex((s) => /\broux\b/i.test(s) && /flour/i.test(s));
  const broth = gumbo.steps.findIndex((s) => /chicken broth/i.test(s));
  assert.ok(roux !== -1, "no roux is made");
  assert.ok(roux < broth, "the flour goes into the broth instead of the fat");
});

test("a dish that takes hours says so in its stated time", () => {
  // Braised oxtail once returned three pounds of oxtail to the pan "to heat
  // through, 2 minutes" while claiming 180.
  const hours = /(?<![\d.])([2-9])(?:\s*(?:to|–|-)\s*\d+½?)?\s*hours?\b/i;
  const short: string[] = [];
  for (const r of RECIPES) {
    for (const step of r.steps) {
      // only cooking waits, not chilling or cooling ones: an apple pie that
      // needs two hours to set before cutting is resting, not cooking, and
      // startAheadHours is what surfaces that to the cook
      if (!/\b(simmer|cook|braise|bake|roast|reduce)\b/i.test(step)) continue;
      if (/\b(chill|refrigerate|freeze|marinate|soak|rest|rise|prove|proof|cool)\b/i.test(step)) continue;
      const m = hours.exec(step);
      if (m && Number(m[1]) * 60 > r.minutes) short.push(`${r.id} cooks ${m[0]} but claims ${r.minutes} minutes`);
    }
  }
  assert.deepEqual(short, [], short.slice(0, 10).join("\n"));
});
