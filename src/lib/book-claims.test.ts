import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RECIPES } from "./recipes.ts";
import { aboutDuration, durationsInText, polishRecipe, printedMinutes, screenRecipe } from "./cook-steps.ts";
import { fixBookStep, fixBookSteps, isCatalogFinal, withDietScreen } from "./catalog-final.ts";
import { DIET_SCREEN_CORRECTIONS } from "./catalog-final-corrections.ts";
import { decorateDietTags, dietFlags, isDairyFree, isGlutenFree, isSugarFree, isVegan } from "./diet.ts";
import { recipeAllergens, recipeSafe } from "./shield.ts";

/*
 * Printed-book recipes show their rows exactly as printed, so the row adder no
 * longer lists the butter, flour, sugar or cayenne their method names. Their
 * diet tags and allergen results must still equal main's or be stricter
 * (catalog-final.ts, dietScreen). The fixture is main's result per recipe
 * (tools/book-claims-snapshot.ts on origin/main 82af9a7). The only allowed
 * loosening is a listed correction (catalog-final-corrections.ts).
 */
const MAIN: { recipes: Record<string, string> } = JSON.parse(
  readFileSync(new URL("./book-claims-main.json", import.meta.url), "utf8"),
);
const CLAIM_TAGS = ["vegetarian", "vegan", "plant-based", "gluten-free", "dairy-free", "sugar-free", "pescatarian", "keto"];
const split = (s: string) => (s ? s.split(",") : []);
// Only ACTIVE corrections may loosen; inactive ones are held to the strict bar.
const corrected = new Set(DIET_SCREEN_CORRECTIONS.filter((c) => c.active).map((c) => c.id));
const byId = new Map(RECIPES.map((r) => [r.id, r]));

function loosened(r: (typeof RECIPES)[number], flags: string[], tags: string[], allergens: string[]): string[] {
  const nowAllergens = recipeAllergens(r);
  return [
    ...dietFlags(r).filter((f) => !flags.includes(f)).map((f) => `flag:${f}`),
    ...r.tags.filter((t) => CLAIM_TAGS.includes(t) && !tags.includes(t)).map((t) => `tag:${t}`),
    ...allergens.filter((a) => !nowAllergens.includes(a as never)).map((a) => `lost-allergen:${a}`),
  ];
}

// The book set is whatever carries source.book (1,539 on 161cd0b; 2,764 with
// How to Cook Fish wired), never a fixed number.
const BOOKS = RECIPES.filter(isCatalogFinal);

test("every book recipe in main's fixture: diet tags and allergens equal main's or stricter", () => {
  const fixtureIds = Object.keys(MAIN.recipes);
  assert.ok(BOOKS.length >= fixtureIds.length);
  const bad: string[] = [];
  for (const id of fixtureIds) {
    const r = byId.get(id);
    assert.ok(r && isCatalogFinal(r), `${id} is no longer a live book recipe`);
    const [flags, tags, allergens] = MAIN.recipes[id]!.split("|").map(split);
    const gained = loosened(r!, flags!, tags!, allergens!);
    if (gained.length && !corrected.has(id)) bad.push(`${id} ${gained.join(" ")}`);
  }
  assert.deepEqual(bad, []);
});

test("every book recipe (any book, fixture or not): equal to or stricter than the old polish", () => {
  // The old pipeline, rebuilt here: polish with the row adder, then decorateDietTags.
  const bad: string[] = [];
  for (const r of BOOKS) {
    const old = screenRecipe({ ...r, dietScreen: undefined });
    if (!old) continue;
    const o = decorateDietTags(old);
    const gained = loosened(r, dietFlags(o), o.tags.filter((t) => CLAIM_TAGS.includes(t)), recipeAllergens(o));
    if (gained.length && !corrected.has(r.id)) bad.push(`${r.id} ${gained.join(" ")}`);
  }
  assert.deepEqual(bad, []);
});

test("every listed correction names a book recipe and a reason", () => {
  for (const c of DIET_SCREEN_CORRECTIONS) {
    const r = byId.get(c.id);
    assert.ok(r && isCatalogFinal(r), c.id);
    assert.ok(c.reason.length > 20, c.id);
    assert.ok(!r!.ingredients.some((i) => i.name.toLowerCase() === c.food), `${c.id} prints ${c.food} as a row`);
  }
});

// LINE-AUDIT-OCT9: the 31 book recipes whose method really uses the food.
const get = (id: string) => {
  const r = byId.get(id);
  assert.ok(r, id);
  return r!;
};
test("Line's regressions: butter in the method -> not dairy-free, not vegan, dairy shield blocks", () => {
  for (const id of ["so-brunswick-stew", "so-salsify", "so-orange-fluff", "so-ginger-cookies", "so-raisin-ham-sauce", "hill-0002", "hill-0324", "ac-0010", "ys-029", "so-creole-peppers", "so-coconut-pralines", "kleber-0178"]) {
    const r = get(id);
    assert.equal(isDairyFree(r), false, id);
    assert.ok(!r.tags.includes("dairy-free"), id);
    assert.equal(recipeSafe(r, ["dairy"]), false, id);
  }
  for (const id of ["so-creole-peppers", "so-coconut-pralines", "kleber-0178"]) {
    assert.equal(isVegan(get(id)), false, id);
    assert.ok(!get(id).tags.includes("vegan"), id);
  }
});
test("Line's regressions: sugar in the method -> not sugar-free", () => {
  for (const id of ["so-peach-fritters", "so-apricot-fritters", "so-orange-fritters", "so-apple-dumplings", "so-brandy-sauce"]) {
    assert.equal(isSugarFree(get(id)), false, id);
    assert.ok(!get(id).tags.includes("sugar-free"), id);
  }
});
test("Line's regressions: flour in the method -> not gluten-free, gluten shield blocks", () => {
  for (const id of ["so-poultry-sauce", "so-sour-cream-dressing", "so-oysters-louisiane", "so-lobster-thermidor", "so-fish-cakes", "so-chesapeake-turtle"]) {
    const r = get(id);
    assert.equal(isGlutenFree(r), false, id);
    assert.ok(!r.tags.includes("gluten-free"), id);
    assert.equal(recipeSafe(r, ["gluten"]), false, id);
  }
});
test("Line's regressions: the 8 cayenne recipes stay spicy", () => {
  const ids = ["so-spanish-mackerel", "ar-ff-lobster-newburg", "ar-ff-welsh-rarebit", "ar-mf-jumberlie", "vh-pc-gumbo-file", "vh-pc-red-beans", "vh-pc-courtbouillon", "vh-hi-stuffed-eggs"];
  assert.equal(ids.length, 8);
  for (const id of ids) {
    assert.ok(recipeAllergens(get(id)).includes("spicy"), id);
    assert.equal(recipeSafe(get(id), ["spicy"]), false, id);
  }
});
test("book cards show the printed rows: no screened food is displayed", () => {
  for (const r of RECIPES.filter(isCatalogFinal)) {
    for (const f of r.dietScreen?.foods ?? []) {
      assert.ok(!r.ingredients.includes(f), r.id);
    }
  }
  assert.ok(!get("so-salsify").ingredients.some((i) => i.name === "butter"));
});
// Scraps the book scans left in the blurb slot: "INGREDIENTS.", "No. 1.",
// "(MRS. E.", "(_Sweet.", "(See cut facing page 58.", "following directions on page 10".
const JUNK_BLURB = /^(?:INGREDIENTS|No\. ?\d|\((?:_|See cut|[A-Z][A-Z .,-]*\.$|With apologies|for above))|\bpage \d+\b/;
// A clamp must not cut mid-phrase ("…and a blade of mace." -> "…and a.").
const BROKEN_ENDING =
  /\b(?:a|an|the|and|or|nor|but|of|with|into|onto|to|for|from|by|at|than|its|their|his|her|very|some|any|this|these|those|per|upon)[.,;:!?…]*$|\.\.$|[,;:]\.$|\s[.…]$/i;
test("book card descriptions: no junk, no broken ending, none under 20 (bar the plain 'Name — homemade.' fallback) or over 180 characters", () => {
  const bad = RECIPES.filter(isCatalogFinal).filter(
    (r) =>
      (r.description.length < 20 && r.description !== `${r.name} — homemade.`) ||
      r.description.length > 180 ||
      JUNK_BLURB.test(r.description) ||
      BROKEN_ENDING.test(r.description) ||
      !/[.!?…)"'”’]$/.test(r.description),
  );
  assert.deepEqual(bad.map((r) => `${r.id}: ${r.description}`), []);
});

// LINE-HOLD-OCT9 fixes beyond the claims.
test("app recipes: amount echoes read cleanly after the polish", () => {
  const step = (id: string, re: RegExp) => get(id).steps.find((s) => re.test(s)) ?? "";
  assert.match(step("beef-chili", /ground beef/), /the 1½ pounds of ground beef/);
  assert.match(step("th-satay", /chicken thighs/), /the 1½ pounds of chicken thighs/);
  assert.match(step("hd-hot-cocoa", /dark chocolate/), /the 4 ounces of chopped dark chocolate/);
  assert.match(step("cp-camp-coffee", /coffee grounds/), /the ½ cup of coffee grounds/);
  assert.match(step("tiramisu", /espresso/), /in the 1½ cups of cooled espresso/);
  for (const r of RECIPES.filter((x) => !isCatalogFinal(x))) {
    for (const s of r.steps) {
      assert.ok(!/\b\d[\d½¼¾⅓⅔⅛]* (?:lb|oz) of\b/.test(s), `${r.id}: ${s}`);
      assert.ok(!/\b(?:the|in|into|with) (?:chopped|cooled|warm|melted) the \d/.test(s), `${r.id}: ${s}`);
    }
  }
});

// Printed thirds. Quantities used to round to the nearest quarter, so a printed
// ⅓ cup showed as ¼ cup (22 KFYR and 8 Troop recipes, among others).
import { existsSync } from "node:fs";
import { scaleQty } from "./cuisine.ts";
import { formatQty, prettyFrac } from "./format.ts";
import { polishCatalog, scaleMethodSteps } from "./cook-steps.ts";
const isThird = (q: number) => Math.abs(q * 3 - Math.round(q * 3)) < 0.04 && Math.abs(q * 4 - Math.round(q * 4)) > 0.04;
const nearThirds = (q: number) => Math.abs(q * 3 - Math.round(q * 3)) < 0.04;
test("fractions: ⅓ and ⅔ render as printed at native scale, ⅞ and 1/16 exist", () => {
  assert.equal(formatQty(scaleQty(1 / 3, 4, 4), "cup"), "⅓ cup");
  assert.equal(formatQty(scaleQty(2 / 3, 4, 4), "cup"), "⅔ cup");
  assert.equal(formatQty(scaleQty(4 / 3, 6, 6), "cups"), "1⅓ cups");
  assert.equal(prettyFrac(0.875), "⅞");
  assert.equal(prettyFrac(0.0625), "1/16");
  assert.equal(prettyFrac(1.875), "1⅞");
});
test("fractions: ⅞ prints as ⅞ (pta-057 sugar 7/8 cup, never 0.875), ⅛ never turns into a quarter", () => {
  assert.equal(formatQty(scaleQty(0.875, 4, 4), "cups"), "⅞ cup");
  assert.equal(formatQty(scaleQty(0.875, 8, 4), "cups"), "1¾ cups");
  assert.equal(formatQty(scaleQty(0.125, 4, 4), "cup"), "⅛ cup");
  assert.equal(formatQty(scaleQty(0.125, 6, 4), "cup"), "¼ cup");
  assert.equal(formatQty(scaleQty(0.125, 5, 4), "cup"), "⅛ cup");
  assert.equal(formatQty(scaleQty(0.375, 4, 4), "cup"), "⅜ cup");
  assert.equal(formatQty(scaleQty(0.625, 4, 4), "cup"), "⅝ cup");
  assert.equal(formatQty(scaleQty(0.125, 12, 4), "tsp"), "⅜ tsp");
  assert.equal(formatQty(scaleQty(0.25, 6, 4), "cup"), "½ cup");
});
test("fractions: thirds stay thirds when scaled (⅓ x2 = ⅔, ⅔ x2 = 1⅓, ⅓ x3 = 1), quarters stay quarters", () => {
  assert.equal(formatQty(scaleQty(1 / 3, 8, 4), "cup"), "⅔ cup");
  assert.equal(formatQty(scaleQty(2 / 3, 8, 4), "cups"), "1⅓ cups");
  assert.equal(formatQty(scaleQty(1 / 3, 12, 4), "cup"), "1 cup");
  assert.equal(formatQty(scaleQty(1 / 3, 24, 4), "cups"), "2 cups");
  assert.equal(formatQty(scaleQty(0.75, 8, 4), "cups"), "1½ cups");
  assert.equal(formatQty(scaleQty(0.25, 6, 4), "cup"), "½ cup");
});
test("fractions: every printed third in every book recipe renders as a third at native scale and on x2, x3, x6", () => {
  let checked = 0;
  for (const r of RECIPES.filter(isCatalogFinal)) {
    for (const i of r.ingredients) {
      if (!isThird(i.qty)) continue;
      checked++;
      const shown = prettyFrac(scaleQty(i.qty, r.servings, r.servings));
      assert.match(shown, /[⅓⅔]/, `${r.id} ${i.name} ${i.qty}`);
      for (const k of [2, 3, 6]) {
        const s = i.qty * k;
        if (!nearThirds(s)) continue;
        const q = scaleQty(i.qty, r.servings * k, r.servings);
        assert.ok(Math.abs(q * 3 - Math.round(q * 3)) < 1e-9 && Math.abs(q - s) < 0.05, `${r.id} ${i.name} ${i.qty} x${k} -> ${q}`);
      }
    }
  }
  assert.ok(checked >= 40, `only ${checked} thirds checked`);
});
// KFYR, Troop and Plant-based skip the polisher by design (source.book): their printed
// steps, rows and names survive verbatim, natively and at other scales (numbers only).
for (const [file, exp, prefix] of [
  ["catalog-kfyr.ts", "KFYR_1969_RECIPES", "kfyr-"],
  ["catalog-troop.ts", "TROOP_2023_RECIPES", "trp-"],
  ["catalog-plant-based.ts", "PLANT_BASED_RECIPES", "plnt-"],
] as const) {
  test(`${file}: source.book skips the polisher — printed text survives verbatim; printed thirds stay thirds`, async () => {
    if (!existsSync(new URL(`./${file}`, import.meta.url))) return; // book not wired in this tree
    const raw = ((await import(`./${file}`)) as Record<string, typeof RECIPES>)[exp];
    assert.ok(raw.length > 0);
    const live = new Map(RECIPES.map((r) => [r.id, r]));
    let thirds = 0;
    for (const r of raw) {
      assert.ok(isCatalogFinal(r), r.id);
      const [p] = polishCatalog([r]);
      // verbatim bar the listed print-artifact repairs (fixBookSteps: punctuation, a capital, a chopped lead word)
      const printed = fixBookSteps(r).steps;
      assert.deepEqual([p.name, p.ingredients, p.steps], [r.name, r.ingredients, printed], r.id);
      assert.deepEqual(scaleMethodSteps(p.steps, p.ingredients, p.servings, p.servings, { catalogFinal: true }), printed, r.id);
      const l = live.get(r.id);
      if (l) {
        assert.ok(r.id.startsWith(prefix));
        assert.deepEqual([l.name, l.ingredients, l.steps], [r.name, r.ingredients, printed], r.id);
      }
      for (const i of r.ingredients) if (isThird(i.qty)) {
        thirds++;
        assert.match(prettyFrac(scaleQty(i.qty, r.servings, r.servings)), /[⅓⅔]/, `${r.id} ${i.name}`);
      }
    }
    assert.ok(thirds >= 0);
  });
}
test("book descriptions are never cut with an ellipsis: whole sentences or the plain fallback", () => {
  const cut = RECIPES.filter(isCatalogFinal).filter((r) => r.description.endsWith("…") || !/[.!?)"'”’]$/.test(r.description));
  assert.deepEqual(cut.map((r) => r.id), []);
});

test("a blurb cut at a sentence end (or replaced by the plain fallback) is still read whole by the diet and allergy checks", () => {
  const r = get("kleber-0200"); // printed blurb says "butter size of walnut"; the card shows the plain fallback
  assert.equal(r.description, "Boiled Mayonnaise Dressing — homemade."); // no printed time: the minutes part is dropped
  assert.match(withDietScreen(r).description, /walnut/, "the screen keeps the printed blurb");
  // Where the shield reads blurbs (allergens pack), the nut allergy still fires.
  const readsBlurbs = recipeAllergens({ ...r, ingredients: [], steps: [], dietScreen: undefined, description: "a walnut cake" }).includes("nuts");
  if (readsBlurbs) assert.ok(recipeAllergens(r).includes("nuts"), "walnut in the printed blurb stays a nut");
});

// ---- fallback description: "Name — homemade, about N minutes." takes N only from the recipe's own printed time
const stub = (steps: string[], description = "Ingredients."): (typeof RECIPES)[number] => ({
  ...RECIPES.find((r) => isCatalogFinal(r))!,
  id: "stub-fallback",
  name: "Stub Pudding",
  description,
  minutes: 45, // the catalog placeholder: must never reach the description
  steps,
  dietScreen: undefined,
});

// "Name — homemade." or "Name — homemade, about 45 minutes." / "about 2½ hours." -> [whole, name, minutes-as-string | undefined]
function FB(d: string): [string, string, string | undefined] | null {
  const m = /^(.*) — homemade(?:, about (\d*)([¼½¾]?) (minutes|hours))?\.$/.exec(d);
  if (!m) return null;
  if (m[4] === undefined) return [m[0], m[1]!, undefined];
  const n = Number(m[2] || 0) + ({ "": 0, "¼": 0.25, "½": 0.5, "¾": 0.75 } as Record<string, number>)[m[3]!]!;
  return [m[0], m[1]!, String(m[4] === "hours" ? Math.round(n * 60) : n)];
}

test("printedMinutes reads only a duration the recipe prints for itself", () => {
  const p = (...steps: string[]) => printedMinutes(stub(steps));
  assert.equal(p("Bake in a slow oven 25 to 30 minutes."), 30);
  assert.equal(p("Cook until thick, which will be about twenty minutes."), 20);
  assert.equal(p("Simmer 1 hour."), 60);
  assert.equal(p("Simmer 1½ hours."), 90);
  assert.equal(p("Simmer 1 1/2 hours."), 90);
  assert.equal(p("Boil for half an hour."), 30);
  assert.equal(p("Cook 5 minutes.", "Then stir.", "Cook 5 minutes more."), null, "two timed instructions: no single total");
  assert.equal(p("Mix well.", "Pour into a buttered dish."), null, "no printed time");
  assert.equal(p("Heat the oven to 400°.", "Cut into 1-inch pieces."), null, "temperatures and sizes are not times");
  assert.equal(p("Cook 5 minutes.", "Bake 40 minutes."), null, "several different times: no single printed time");
  assert.equal(p("Refrigerate no longer than 48 hours.", "Bake 30 minutes."), 30, "a storage limit is not the cooking time");
  assert.equal(p("Keeps up to 2 days.", "Mix well."), null);
  assert.equal(p("Layers, 350°F 30 minutes."), 30, "a bare baking time is the total time");
  assert.equal(p("Deep pan, slow oven 2½–3 hours."), 180);
  assert.equal(p("Let raise half an hour.", "Mix well."), null, "a rise is not the total time");
  assert.equal(p("Marinate the apples half an hour.", "Serve."), null);
  assert.equal(p("Fry 2–3 minutes a side, until gold."), null, "a per-side time is not the total");
  assert.equal(p("The bread should not be more than twelve hours old."), null);
  assert.equal(p("Let rise one hour.", "Bake 20 minutes."), null, "a rise plus a bake is not one total time");
  assert.equal(p("Chill 2 hr.", "Brown 5 min. on each side."), null, "a per-side time is not the recipe time");
  assert.equal(p("Stir until thickened (45 min.)."), null, "a step time with no cooking verb in front is not the recipe time");
  assert.equal(p("Put under a press for one hour.", "Mix well."), null, "pressing is not cooking");
  assert.equal(p("Roast one quarter of an hour to every pound."), null, "a per-pound rate is not a total time");
});

test("fallback description: N is the printed time; with none the minutes part is dropped; the 45 placeholder never shows", () => {
  const long = "x".repeat(10);
  const withTime = polishRecipe(stub(["Mix the batter.", "Bake 25 to 30 minutes until set."], long));
  assert.equal(withTime?.description, "Stub Pudding — homemade, about 30 minutes.");
  const none = polishRecipe(stub(["Mix the batter.", "Bake until set."], long));
  assert.equal(none?.description, "Stub Pudding — homemade.");
  const several = polishRecipe(stub(["Cook 5 minutes.", "Bake 40 minutes."], long));
  assert.equal(several?.description, "Stub Pudding — homemade.");
});

test("every live printed-book fallback blurb takes N from the recipe's own printed time (never the 45 placeholder)", () => {
  let fallbacks = 0;
  for (const r of BOOKS) {
    const m = FB(r.description);
    if (!m) continue;
    fallbacks++;
    const printed = printedMinutes(r);
    if (m[2]) assert.equal(Number(m[2]), printed, `${r.id} shows ${m[2]} minutes but prints ${printed}`);
    else assert.equal(printed, null, `${r.id} drops the minutes but prints ${printed}`);
  }
  assert.ok(fallbacks > 0);
});

test("HARD1: the printed-book fallback never carries the 45 catalog default", () => {
  for (const r of BOOKS) {
    const m = FB(r.description);
    if (!m || !m[2]) continue;
    assert.equal(Number(m[2]), printedMinutes(r), r.id);
  }
  // fd-jan-25-india-curried-eggs prints "ten minutes" once; fd-dec-01-english-plum-pudding "five hours" once.
  const eggs = RECIPES.find((r) => r.id === "fd-jan-25-india-curried-eggs");
  const pud = RECIPES.find((r) => r.id === "fd-dec-01-english-plum-pudding");
  if (eggs) assert.equal(printedMinutes(eggs), 10), assert.match(eggs.description, /homemade, about 10 minutes\.$/);
  if (pud) assert.equal(printedMinutes(pud), 300), assert.match(pud.description, /homemade, about 5 hours\.$/);
  // A recipe that prints no time drops the minutes.
  assert.equal(get("kleber-0200").description, "Boiled Mayonnaise Dressing — homemade.");
});

test("HARD2: hill-0075 describes what the method does (slices of cream cheese, French or mayonnaise dressing), not balls", () => {
  const d = get("hill-0075").description;
  assert.doesNotMatch(d, /\bballs?\b/i);
  assert.match(d, /slices of chilled cream cheese/);
  assert.match(d, /French or mayonnaise dressing/);
});

test("FRACTIONS: ⅙ and ⅚ exist; a printed third halves to ⅙ (never ¼), ⅔ halves to ⅓", () => {
  assert.equal(prettyFrac(1 / 6), "⅙");
  assert.equal(prettyFrac(5 / 6), "⅚");
  assert.equal(prettyFrac(1 + 1 / 6), "1⅙");
  assert.equal(formatQty(scaleQty(1 / 3, 2, 4), "cup"), "⅙ cup");
  assert.equal(formatQty(scaleQty(2 / 3, 2, 4), "cup"), "⅓ cup");
  assert.equal(formatQty(scaleQty(4 / 3, 2, 4), "cups"), "⅔ cup");
  assert.equal(formatQty(scaleQty(1 / 3, 10, 4), "cup"), "⅚ cup");
  assert.equal(formatQty(scaleQty(0.125, 2, 4), "cup"), "⅛ cup"); // eighths keep their grid
  assert.equal(formatQty(scaleQty(0.25, 6, 4), "cup"), "½ cup");
});

test("FRACTIONS: a printed third is never a quarter: native, x2, x3, x1/2 in every book recipe", () => {
  let n = 0;
  for (const r of BOOKS) {
    for (const i of r.ingredients) {
      if (!isThird(i.qty)) continue;
      n++;
      assert.doesNotMatch(prettyFrac(scaleQty(i.qty, r.servings, r.servings)), /[¼¾]/, `${r.id} ${i.name} native`);
      for (const [h, s] of [[2, 1], [1, 2], [3, 1]] as const) {
        const q = scaleQty(i.qty, r.servings * h, r.servings * s);
        const exact = (i.qty * h) / s;
        assert.ok(Math.abs(q * 6 - Math.round(q * 6)) < 1e-9 && Math.abs(q - exact) < 0.03, `${r.id} ${i.name} ${i.qty} x${h}/${s} -> ${q}`);
        assert.doesNotMatch(prettyFrac(q), /[¼¾]/, `${r.id} ${i.name} x${h}/${s}`);
      }
    }
  }
  assert.ok(n >= 40);
});

test("FRICTION: Shop sums never show a float tail (1.0833333333333333 cups)", () => {
  // a sum between glyphs is rounded to the nearest eighth or sixth and shown as a fraction
  assert.equal(formatQty(1 / 3 + 0.75, "cups"), "1⅛ cups");
  assert.equal(formatQty(0.1 + 0.2, "cup"), "⅓ cup");
  assert.equal(formatQty(1 / 3 + 2 / 3, "cups"), "1 cup");
  assert.equal(formatQty(0.875 + 0.0625 + 0.0625, "cups"), "1 cup");
  assert.equal(formatQty(0.5 + 1 / 6, "cups"), "⅔ cup");
  assert.equal(formatQty(453.59, "g"), "453.59 g", "metric amounts keep their decimals");
  assert.equal(prettyFrac(1.33), "1⅓");
  // the sum of every same-named row of a book recipe, as the Shop adds them
  for (const r of BOOKS) {
    const sums = new Map<string, number>();
    for (const i of r.ingredients) {
      const k = `${i.aisle}|${i.name.toLowerCase()}|${i.unit}`;
      sums.set(k, (sums.get(k) ?? 0) + scaleQty(i.qty, r.servings, r.servings));
    }
    for (const [k, q] of sums) assert.doesNotMatch(formatQty(q, ""), /\.\d{3}/, `${r.id} ${k} ${q}`);
  }
  // printed amounts are untouched: a single row still reads as printed
  assert.equal(formatQty(scaleQty(0.875, 4, 4), "cups"), "⅞ cup");
  assert.equal(formatQty(scaleQty(1.5, 4, 4), "cups"), "1½ cups");
});

test("FRICTION: runtime echoes ('the 2 cups of flour') and a lowercase step start are gone from app-written Southern and Table recipes", () => {
  const echo = /\bthe (?:\d+(?: \d+\/\d+)?|\d*[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\.\d+) (?:cups?|tablespoons?|teaspoons?|pounds?|ounces?|quarts?|pints?|cans?|sticks?|pinch(?:es)?|packages?|slices?|cloves?) of /;
  let n = 0;
  for (const r of BOOKS.filter((x) => /^so-/.test(x.id) || x.id === "vh-hi-cheese-dreams" || x.id === "vh-kp-camp-coffee-stew")) {
    n++;
    for (const s of r.steps) assert.doesNotMatch(s, echo, `${r.id}: ${s}`);
  }
  assert.ok(n >= 50);
  assert.match(get("so-crab-croquettes").steps[1]!, /^Mix with white sauce/);
});

test("POLISH: blurbs strip (page N), _italics_, stray spaces, unbalanced brackets; end on punctuation", () => {
  const b = (description: string) => polishRecipe({ ...RECIPES.find((r) => isCatalogFinal(r))!, id: "stub-blurb", name: "Stub", description, minutes: 45, steps: ["Mix the batter.", "Bake until set."], dietScreen: undefined })!.description;
  assert.equal(b("Filo leaves are paper-thin pastry sheets used throughout the Middle East, including Baklava (page 317)."), "Filo leaves are paper-thin pastry sheets used throughout the Middle East, including Baklava.");
  assert.equal(b("Cut the vegetables as desired, in cubes, lozenges, balls, _juliennes_, etc."), "Cut the vegetables as desired, in cubes, lozenges, balls, juliennes, etc.");
  assert.equal(b("Spread them on toasted French bread for crostini ."), "Spread them on toasted French bread for crostini.");
  assert.equal(b("(Unless you wear dark glasses you cannot make a success of Anti's Favorite Hash."), "(Unless you wear dark glasses you cannot make a success of Anti's Favorite Hash.)");
  assert.equal(b("Make flakes by pulsing the dried vegetable mix until smaller than pea-sized)."), "Make flakes by pulsing the dried vegetable mix until smaller than pea-sized.");
  assert.equal(b("Empty soup mix into a plain coffee cup(no metallic decorations)"), "Empty soup mix into a plain coffee cup (no metallic decorations).");
  assert.equal(b("(For 8-in. sq. cake) Mix in saucepan 1 cup raisins, ground. Cook and stir until thick (5 min.)."), "(For 8-in. sq. cake) Mix in saucepan 1 cup raisins, ground. Cook and stir until thick (5 min).");
  assert.equal(b("(Boil the preceding together for five minutes.)"), "Boil the preceding together for five minutes.");
  for (const id of ["hill-0006", "hill-0076", "hill-0203", "hill-0204", "hill-0248", "hill-0098", "kleber-0039", "kleber-0093"]) {
    const d = get(id).description;
    assert.ok(!/_/.test(d) && (d.match(/\(/g) ?? []).length === (d.match(/\)/g) ?? []).length && !/\(_i\.$/.test(d), `${id}: ${d}`);
    assert.ok(d.length >= 20 && d.length <= 180 && /[.!?)]$/.test(d), id);
  }
  assert.ok(!/\(page \d+\)/.test(RECIPES.filter(isCatalogFinal).map((r) => r.description).join(" ")));
});

test("POLISH: tiramisu step does not name a cream the list lacks", () => {
  const steps = get("tiramisu").steps.join(" ");
  assert.doesNotMatch(steps, /\bthe cream\b/);
  assert.match(steps, /with the mascarpone mixture/);
});

// ---- Line audit Oct 17, residual printed-text artifacts (catalog-final.ts fixBookStep / BOOK_STEP_FIXES)
test("FRICTION: no '.).' ending, no one-letter 'C. rice' split and no lowercase-starting method line in any book recipe", () => {
  for (const r of BOOKS) {
    r.steps.forEach((s, n) => {
      assert.doesNotMatch(s, /\.\)\./, `${r.id} step ${n + 1}: ${s}`);
      assert.doesNotMatch(s, /(?:^|\s)[A-Za-z]\. [a-z]/, `${r.id} step ${n + 1}: ${s}`);
      assert.doesNotMatch(s, /^[a-z]/, `${r.id} step ${n + 1}: ${s}`);
    });
  }
});

test("FRICTION: the repairs touch only punctuation, a capital or a chopped lead word; amounts and times stay", () => {
  assert.equal(fixBookStep("Boil until it threads (238 degrees F.)."), "Boil until it threads (238 degrees F).");
  assert.equal(fixBookStep("Wash and drain 1/2 C. rice. Pour over it 2 C. hot water."), "Wash and drain 1/2 C rice. Pour over it 2 C hot water.");
  assert.equal(fixBookStep("Bake at 325 degrees F. for one hour."), "Bake at 325 degrees F for one hour.");
  assert.equal(fixBookStep("Mix 2 tsp. salt with 1 lb. flour."), "Mix 2 tsp. salt with 1 lb. flour.", "a longer abbreviation is left alone");
  assert.equal(fixBookStep("spice q. f. it will require two hours."), "spice q. f. it will require two hours.", "only C, T, c, t, F units lose the stop");
  for (const s of ["Bake at 325 degrees F. for one hour.", "Stir 1 c. sugar and 2 T. butter (1/4 lb.).", "x (5 min.)."]) assert.equal(fixBookStep(fixBookStep(s)), fixBookStep(s), "idempotent");
  assert.equal(fixBookStep("mush gets thick."), "mush gets thick.", "no blanket capital: a printed line may continue the one before");
  assert.equal(fixBookSteps({ ...get("tiramisu"), id: "plnt-075", source: { book: "x" } as never, steps: ["in a large frying pan over medium-high heat, heat grapeseed oil"] }).steps[0], "In a large frying pan over medium-high heat, heat grapeseed oil");
  assert.equal(get("ys-078").steps[6], "Let rise until double (about 30 min).");
  assert.equal(get("idah-012").steps[0], "Wash and drain 1/2 C rice (1/4 C wild rice, and 1/4 C white or brown). Pour over it 2 C hot water.");
  // staged books (run when the catalog file is wired)
  if (byId.has("plnt-014")) assert.match(get("plnt-014").steps[1]!, /^In separate shallow bowls/);
  if (byId.has("trp-040")) assert.match(get("trp-040").steps[0]!, /^In a slow cooker Add all the ingredients\. Simmer, covered/);
  if (byId.has("pta-022")) assert.match(get("pta-022").steps[1]!, /\(238 degrees F\)\.$/);
});

// ---- Oct 17 re-audit: printed-minutes fallback (fractions of an hour, one-minute times, a step time is not the total)
const PM_CASES = JSON.parse(readFileSync(new URL("./printed-minutes-cases.json", import.meta.url), "utf8")) as {
  id: string;
  steps: string[];
  printedMinutes: number | null;
  durationsInclude?: number[];
}[];

test("printedMinutes: fractions of an hour parse whole (two and half hours 150, three quarters 45, quarter 15)", () => {
  assert.deepEqual(durationsInText("stew moderately two and half hours."), [150]);
  assert.deepEqual(durationsInText("stew two and a half hours"), [150]);
  assert.deepEqual(durationsInText("let it boil three quarters of an hour"), [45]);
  assert.deepEqual(durationsInText("bake three-quarters of an hour in a steady oven"), [45]);
  assert.deepEqual(durationsInText("stir almost a quarter of an hour"), [15]);
  assert.deepEqual(durationsInText("boil half an hour"), [30]);
  assert.deepEqual(durationsInText("boil an hour and a half"), [90]);
  assert.deepEqual(durationsInText("boil 1 1/2 hours"), [90]);
  for (const c of PM_CASES.filter((x) => x.durationsInclude?.length)) {
    const found = durationsInText(c.steps.join(" "));
    for (const d of c.durationsInclude!) assert.ok(found.includes(d), `${c.id}: ${d} in ${found}`);
  }
});

test("printedMinutes: a one-minute step time never counts (htcf-1210 'about 1 minutes')", () => {
  const p = (...steps: string[]) => printedMinutes(stub(steps));
  assert.equal(p("Boil for one minute, then pour over the yolks."), null);
  assert.equal(p("Cook 1 minute."), null);
  assert.equal(p("Cook 1 minutes.", "Simmer 20 minutes."), 20, "the one-minute step is ignored, not a second time");
  assert.doesNotMatch(polishRecipe(stub(["Boil for one minute."], "x"))!.description, /about 1 minutes?/);
});

test("printedMinutes: a stated total is kept; a lone cook time is kept only when nothing else cooks, bakes or chills", () => {
  const p = (...steps: string[]) => printedMinutes(stub(steps));
  assert.equal(p("Mix well.", "Bake 45 minutes.", "Cool.", "Ready in 3 hours total."), 180, "a printed total wins");
  assert.equal(p("Mix well.", "Bake 45 minutes.", "Frost.", "Slice."), null, "one bake time in a multi-step method");
  assert.equal(p("Simmer the sauce 30 minutes.", "Chill overnight."), null, "another chill step");
  assert.equal(p("Brown the beef.", "Add the beans.", "Simmer 2 hours."), 120);
  assert.equal(p("Cook 3 minutes.", "Add one.", "Add two.", "Add three."), null, "a 3-minute step in a long method");
  assert.equal(p("Stir in garlic, cook 30 seconds.", "Simmer 20 minutes."), null, "seconds are another timed step");
  assert.equal(p("Simmer 1 hour.", "Add the all-purpose flour, in all-purpose style."), 60, "'in all-purpose' is not 'in all'");
});

test("printedMinutes: every id Line listed (12 HARD + 9 multi-step) plus the two that keep a time", () => {
  assert.ok(PM_CASES.length >= 25);
  for (const c of PM_CASES) {
    const r = stub(c.steps);
    assert.equal(printedMinutes(r), c.printedMinutes, c.id);
    const shown = polishRecipe(stub(c.steps, "x"))!.description;
    if (c.printedMinutes === null) assert.equal(shown, "Stub Pudding — homemade.", c.id);
    else assert.equal(shown, `Stub Pudding — homemade, about ${aboutDuration(c.printedMinutes)}.`, c.id);
  }
  const must: Record<string, number | null> = { "fd-jan-25-india-curried-eggs": 10, "fd-dec-01-english-plum-pudding": 300, "ac-0018": 150 };
  for (const [id, n] of Object.entries(must)) assert.equal(PM_CASES.find((c) => c.id === id)?.printedMinutes, n, id);
});

test("fallback blurb shows hours from 120 minutes up", () => {
  assert.equal(aboutDuration(45), "45 minutes");
  assert.equal(aboutDuration(90), "90 minutes");
  assert.equal(aboutDuration(120), "2 hours");
  assert.equal(aboutDuration(150), "2½ hours");
  assert.equal(aboutDuration(300), "5 hours");
  assert.equal(aboutDuration(135), "2¼ hours");
  assert.equal(aboutDuration(125), "125 minutes");
});

test("app (non-book) recipes keep main's Cook wording at native servings ('remaining' stays 'remaining')", () => {
  const show = (id: string) => {
    const r = RECIPES.find((x) => x.id === id);
    return r ? scaleMethodSteps(r.steps, r.ingredients, r.servings, r.servings, { catalogFinal: isCatalogFinal(r) }).join(" ") : "";
  };
  for (const [id, re] of [["colcannon", /remaining milk/], ["pierogi", /remaining cheddar/], ["sd-chislic", /rest of the remaining garlic salt/], ["ut-funeral-potatoes", /rest of the remaining cheddar/]] as const) {
    const t = show(id);
    if (t) assert.match(t, re, id);
  }
});

test("weak printed blurbs (pta-141, kleber-0093, kleber-0039) show the plain fallback; the checks still read the printed blurb", () => {
  for (const id of ["pta-141", "kleber-0093", "kleber-0039"]) {
    const r = RECIPES.find((x) => x.id === id);
    if (r) assert.match(r.description, new RegExp(`^${r.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — homemade(?:, about [^.]+)?\\.$`), id);
  }
});

test("printedMinutes: an untimed doneness step ('until tender', 'till done', 'until browned') is another cook step with no time", () => {
  const p = (...steps: string[]) => printedMinutes(stub(steps));
  // hill-0249 / hill-0366 (Line, Oct 17): the one printed time is a single step among several
  assert.equal(p("Let boil rapidly five minutes, then keep the water just below the boiling-point until the meat is tender."), null);
  assert.equal(p("Saute the onion until well browned.", "Add the stock and cook ten minutes.", "Serve."), null);
  assert.equal(p("Cook until tender in stock.", "Boil for twenty minutes, add the lemon, and serve."), null);
  assert.equal(p("Bake until golden.", "Cook 15 minutes more."), null);
  assert.equal(p("Stew till done.", "Then simmer 30 minutes."), null);
  // the doneness belongs to the timed step itself, or to a thickening roux: the time stays
  assert.equal(p("Add 1 pint of stock and let simmer half an hour until tender."), 30);
  assert.equal(p("Cover, and simmer about 20 minutes or until done.", "Season with salt."), 20);
  assert.equal(p("Cover with buttered paper and cook slowly for an hour.", "Thicken with butter and flour cooked together until brown.", "Serve."), 60);
});

test("printedMinutes: a compound number word is one number (twenty-five 25, forty-five 45, twenty five, thirty-five)", () => {
  const p = (...steps: string[]) => printedMinutes(stub(steps));
  assert.equal(p("Bake for twenty-five minutes in a hot oven."), 25);
  assert.equal(p("Boil slowly for forty-five minutes."), 45);
  assert.equal(p("Bake twenty five minutes."), 25);
  assert.equal(p("Simmer thirty-five minutes."), 35);
  assert.equal(p("Simmer Fifty-Five minutes."), 55);
  assert.equal(p("Bake twenty to thirty minutes."), 30, "a word range still takes its upper end");
  assert.equal(p("Bake twenty-five to thirty-five minutes."), 35, "a range of compound words");
  assert.equal(p("Bake one hour and twenty minutes."), null, "unchanged: not a single parsed duration form");
  assert.deepEqual(durationsInText("Bake for twenty-five minutes."), durationsInText("Bake for 25 minutes."));
  for (const [id, mins] of [["htcf-0498", 25], ["htcf-1100", 25], ["htcf-0879", 45]] as const) {
    const r = byId.get(id);
    if (r) assert.equal(printedMinutes(r), mins, id);
  }
});
