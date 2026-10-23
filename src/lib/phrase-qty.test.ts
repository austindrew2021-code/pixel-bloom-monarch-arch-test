import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { scaleQty } from "./cuisine.ts";
import { formatQty } from "./format.ts";
import { PRINTED_PHRASE_ENDINGS, extendedClass, ingredientDisplay, isPhraseRow, nameCarriesAmount, shopLineText } from "./phrase-qty.ts";
import { RECIPES } from "./recipes.ts";

/*
 * Phrase rows: unit-less, base qty 1, and the printed name carries the amount.
 * At base servings no number is shown; scaled shows the printed text + " ×N".
 * Container rows ("glass of brandy") keep the number and match the noun to it.
 * Card and Cook share ingredientDisplay; Shop uses shopLineText on the scaled line.
 */
const row = (id: string, name: string) => {
  const r = RECIPES.find((x) => x.id === id);
  assert.ok(r, id);
  const ing = r.ingredients.find((i) => i.name === name);
  assert.ok(ing, `${id}: ${name}`);
  return { r, ing };
};

function render(id: string, name: string, f: number) {
  const { r, ing } = row(id, name);
  const q = scaleQty(ing.qty, r.servings * f, r.servings);
  const d = ingredientDisplay(ing, q, formatQty);
  const surface = `${d.qty} ${d.name}`.trim(); // card + Cook (qty span, name span)
  const shop = shopLineText({ name: ing.name, qty: q, unit: ing.unit, phrase: isPhraseRow(ing) }, formatQty);
  return { surface, shop };
}

const CASES: [string, string, [string, string, string], [string, string, string]][] = [
  ["hill-0135", "six or eight slices of tender bacon",
    ["six or eight slices of tender bacon ×½", "six or eight slices of tender bacon", "six or eight slices of tender bacon ×2"],
    ["- six or eight slices of tender bacon ×½", "- six or eight slices of tender bacon", "- six or eight slices of tender bacon ×2"]],
  ["hill-0184", "one or two eggs",
    ["one or two eggs ×½", "one or two eggs", "one or two eggs ×2"],
    ["- one or two eggs ×½", "- one or two eggs", "- one or two eggs ×2"]],
  ["ac-0037", "juice of half a lemon",
    ["juice of half a lemon ×½", "juice of half a lemon", "juice of half a lemon ×2"],
    ["- juice of half a lemon ×½", "- juice of half a lemon", "- juice of half a lemon ×2"]],
  ["hill-0285", "Meat of 2 lobsters",
    ["Meat of 2 lobsters ×½", "Meat of 2 lobsters", "Meat of 2 lobsters ×2"],
    ["- Meat of 2 lobsters ×½", "- Meat of 2 lobsters", "- Meat of 2 lobsters ×2"]],
  ["hill-0285", "glass of brandy",
    ["½ glass of brandy", "1 glass of brandy", "2 glasses of brandy"],
    ["- glass of brandy (½)", "- glass of brandy (1)", "- glasses of brandy (2)"]],
  ["hill-0285", "glasses of white wine (half a cup)",
    ["1 glass of white wine (half a cup)", "2 glasses of white wine (half a cup)", "4 glasses of white wine (half a cup)"],
    ["- glass of white wine (half a cup) (1)", "- glasses of white wine (half a cup) (2)", "- glasses of white wine (half a cup) (4)"]],
  ["kleber-0023", "ten or twelve pound ham",
    ["ten or twelve pound ham ×½", "ten or twelve pound ham", "ten or twelve pound ham ×2"],
    ["- ten or twelve pound ham ×½", "- ten or twelve pound ham", "- ten or twelve pound ham ×2"]],
];

for (const [id, name, surf, shop] of CASES) {
  test(`${id} ${name} at 0.5x/1x/2x on card, Cook and Shop`, () => {
    [0.5, 1, 2].forEach((f, k) => {
      const got = render(id, name, f);
      assert.equal(got.surface, surf[k], `card/Cook ${f}x`);
      assert.equal(got.shop, shop[k], `Shop ${f}x`);
    });
  });
}

test("multiplier uses the app's fraction formatting", () => {
  const ing = { name: "one or two eggs", qty: 1, unit: "" };
  assert.equal(ingredientDisplay(ing, 1.5, formatQty).name, "one or two eggs ×1½");
  assert.equal(ingredientDisplay(ing, 1.5, formatQty).qty, "");
});

test("phrase rule only at base qty 1 and no unit", () => {
  assert.equal(isPhraseRow({ name: "Meat of 2 lobsters", qty: 2, unit: "" }), false);
  assert.equal(isPhraseRow({ name: "juice of half a lemon", qty: 1, unit: "tbsp" }), false);
});

test("sizes, package counts and 'to'-led rows are not phrase rows", () => {
  for (const n of ["8-inch pie shell", "1 (16 oz) can tomatoes", "two-quart mold", "half-and-half",
    "to 2 cups water", "medium tomato, cut into 4 slices",
    "Peels cut in half", "Enough milk to make 2/3 cup with egg yolk", "eggs", "bone marrow",
    "glass of brandy", "glasses of white wine (half a cup)"]) {
    assert.equal(nameCarriesAmount(n), false, n);
  }
  for (const n of ["six or eight slices of tender bacon", "one or two eggs", "ten or twelve pound ham",
    "juice of half a lemon", "Meat of 2 lobsters", "juice of a lemon", "yolks of two eggs"]) {
    assert.equal(nameCarriesAmount(n), true, n);
  }
});

test("Shop never sums phrase rows into one number", () => {
  const src = readFileSync(new URL("./spoonful-store.ts", import.meta.url), "utf8");
  assert.match(src, /phrase \? `\$\{aisle\}::\$\{name\.toLowerCase\(\)\}::phrase#\$\{phraseSeq\+\+\}`/);
  assert.match(src, /resolved\.title, isPhraseRow\(ing, !!resolved\.recipe\)\)/);
});

const PHRASE_V2: [string, string][] = [
  ["ac-0013", "14 or 16 pound round of beef"],
  ["hill-0263", "12 cloves"],
  ["hill-0263", "20 pounded almonds"],
  ["bbbq-146", "4 large or 8 medium firm tomatoes"],
  ["bint-048", "6 or 7 slices bacon, cut into 1-inch pieces"],
  ["bbbq-121", "1 or 2 cloves garlic, crushed"],
  ["bbbq-026", "1 to 2 teaspoons curry powder"],
  ["bbbq-119", "1 tablespoon plus 1 teaspoon lemon juice"],
  ["kleber-0024", "several carrots"],
  ["pta-146", "A few celery seeds"],
  ["kfyr-122", "1 1/2-2# flank steak"],
  ["kleber-0149", "1-3 cup sliced citron"],
];
for (const [id, name] of PHRASE_V2) {
  test(`${id} ${name}: printed text at 1x, ×N scaled, on card, Cook and Shop`, () => {
    for (const [f, tail] of [[0.5, " ×½"], [1, ""], [2, " ×2"]] as const) {
      const got = render(id, name, f);
      assert.equal(got.surface, name + tail, `card/Cook ${f}x`);
      assert.equal(got.shop, `- ${name}${tail}`, `Shop ${f}x`);
    }
  });
}

test("extended classes", () => {
  assert.equal(extendedClass("12 cloves"), "lead-count");
  assert.equal(extendedClass("14 or 16 pound round of beef"), "lead-count");
  assert.equal(extendedClass("1/2 to 1 teaspoon liquid smoke"), "measure-range");
  assert.equal(extendedClass("1/4 cup plus 2 tablespoons margarine or butter"), "measure-plus");
  assert.equal(extendedClass("Few grains salt"), "few-several");
  assert.equal(extendedClass("1 1/2-2# flank steak"), "measure-range");
  assert.equal(extendedClass("1-3 cup sliced citron"), "measure-range");
  for (const n of ["2 cups flour", "1 (16 oz) can tomatoes", "8-inch pie shell", "or 4 eggs", "to 2 cups water", "glass of brandy"]) {
    assert.equal(extendedClass(n), null, n);
  }
});

test("kleber-0149 / kfyr-122 never show a doubled leading number", () => {
  for (const [id, name] of [["kleber-0149", "1-3 cup sliced citron"], ["kfyr-122", "1 1/2-2# flank steak"]]) {
    for (const f of [0.5, 1, 2]) {
      const got = render(id, name, f);
      assert.ok(got.surface.startsWith(name), `${id} ${f}x card/Cook: ${got.surface}`);
      assert.ok(got.shop.startsWith(`- ${name}`) && !got.shop.includes("("), `${id} ${f}x Shop: ${got.shop}`);
    }
  }
});

test("printed no-count endings are exactly the ones the 365 Desserts print uses", () => {
  assert.deepEqual([...PRINTED_PHRASE_ENDINGS], [
    "a little",
    "a very little",
    "a very little speck",
    "to taste",
    "to flavor",
    "to color",
    "a grating",
    "a small quantity",
    "as many as desired",
    "a teacup full",
    "rather more than a pint",
    "a little cold",
    "nearly a quart",
    "nearly 1/2 pint",
    "about 2 tablespoonfuls",
  ]);
  for (const e of PRINTED_PHRASE_ENDINGS) {
    assert.equal(ingredientDisplay({ name: `sugar (${e})`, qty: 1, unit: "" }, 1, formatQty, true).qty, "", e);
  }
  // Not a book ending: keeps its count.
  assert.equal(isPhraseRow({ name: "sugar (a pinch)", qty: 1, unit: "" }), false);
});

test("catalog rows with a printed ending show no count; oct-10 rum has no doubled number", () => {
  for (const [id, name] of [
    ["ds-oct-10-rum-omelet", "rum (about 2 tablespoonfuls)"],
    ["ds-may-05-chocolate-mance", "sugar (to taste)"],
    ["ds-jan-30-queen-pudding", "sugar (to taste)"],
    ["ds-apr-19-arrowroot-pudding", "new milk (a teacup full)"],
    ["ds-apr-19-arrowroot-pudding", "milk (nearly a quart)"],
    ["ds-feb-08-boiled-rice-pudding", "milk (rather more than a pint)"],
    ["ds-feb-08-boiled-rice-pudding", "milk (a little cold)"],
    ["ds-may-15-swiss-tart", "milk (nearly 1/2 pint)"],
  ] as const) {
    const ing = RECIPES.find((r) => r.id === id)!.ingredients.find((i) => i.name === name)!;
    assert.ok(ing, `${id} ${name}`);
    assert.ok(isPhraseRow(ing, true), `${id} ${name}`);
    assert.equal(ingredientDisplay(ing, 1, formatQty, true).qty, "");
  }
  const jan30 = RECIPES.find((r) => r.id === "ds-jan-30-queen-pudding")!.ingredients;
  assert.ok(!RECIPES.find((r) => r.id === "ds-may-01-lemon-pudding")!.ingredients.some((i) => i.name === "jelly"), "may-01 jelly cake pans is equipment");
  assert.equal(RECIPES.find((r) => r.id === "ds-feb-08-boiled-rice-pudding")!.ingredients.filter((i) => /milk/.test(i.name)).length, 2);
  assert.ok(jan30.some((i) => i.name === "sugar" && i.unit === "tablespoonful"), "meringue sugar kept separate");
});

test("a user-typed Shop item ending in '(to taste)' keeps its count", () => {
  for (const e of PRINTED_PHRASE_ENDINGS) assert.equal(nameCarriesAmount(`salt (${e})`), false, e);
  const src = readFileSync(new URL("./spoonful-store.ts", import.meta.url), "utf8");
  assert.match(src, /add\(item\.name, 1, "", item\.aisle, undefined, nameCarriesAmount\(item\.name\)\)/);
  const line = { name: "salt (to taste)", qty: 1, unit: "", phrase: nameCarriesAmount("salt (to taste)") };
  assert.equal(shopLineText(line, formatQty), "- salt (to taste) (1)");
});

test("recipes users type in themselves keep their counts on printed endings", () => {
  for (const e of PRINTED_PHRASE_ENDINGS) {
    const ing = { name: `sugar (${e})`, qty: 1, unit: "" };
    assert.equal(isPhraseRow(ing), false, e);
    assert.equal(ingredientDisplay(ing, 1, formatQty).qty, formatQty(1, ""), e);
    assert.equal(isPhraseRow(ing, true), true, e);
  }
  const store = readFileSync(new URL("./spoonful-store.ts", import.meta.url), "utf8");
  assert.match(store, /isPhraseRow\(ing, !!resolved\.recipe\)/);
  const cook = readFileSync(new URL("../components/cook-view.tsx", import.meta.url), "utf8");
  assert.match(cook, /ingredientDisplay\(ing, scaleQty\(ing\.qty, household, servings\), formatQty, !!recipe\)/);
});
