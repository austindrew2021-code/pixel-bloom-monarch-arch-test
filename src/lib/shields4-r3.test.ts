import assert from "node:assert/strict";
import test from "node:test";
import { scaleMethodSteps } from "./cook-steps.ts";
import { isGlutenFree } from "./diet.ts";
import { HTCF_XREF, recipeAllergens, recipeSafe } from "./shield.ts";
import { shield4TermFail, type Shield4Id } from "./shields4.ts";
import { SHIELD4_HANDREVIEW_FAIL } from "./shields4-handreview.ts";
import { SO_XREF } from "./so-southern-doubt.ts";
import { DS365_XREF } from "./ds-365-doubt.ts";
import { RECIPES } from "./recipes.ts";
import { groceryForWeek } from "./spoonful-store.ts";
import type { PlannedMeal, Recipe } from "./types";

// Nov 7 r3: Line's fd5a4de7 HOLD (LINE-AUDIT-FD5A-NOV07.md).
const FOUR = ["egg", "soy", "sesame", "fish"] as const;
const byId = new Map(RECIPES.map((r) => [r.id, r]));
const mk = (rows: string[], steps: string[] = []): Recipe =>
  ({ id: "t-1", name: "Test dish", description: "", tags: [], servings: 4, ingredients: rows.map((n) => ({ name: n, qty: 1, unit: "" })), steps } as unknown as Recipe);

test("fish: Line's five fin fish and roe ids fail Fish-free", () => {
  for (const id of ["htcf-0107", "htcf-0458", "htcf-0525", "htcf-1086", "fd-feb-04-russian-omelet"]) {
    const r = byId.get(id);
    assert.ok(r, id);
    assert.equal(recipeSafe(r!, ["fish"]), false, id);
  }
  for (const row of ["1 butterfish", "8 small kingfish", "1 mullets", "1 whitebait", "2 tbsp caviare", "caviar", "shad roe", "red mullet", "sea bass", "smelts", "porgies", "swordfish steaks"])
    assert.ok(shield4TermFail(mk([row]), "fish"), row);
  for (const row of ["shrimp", "crawfish", "crayfish", "shellfish stock", "frog legs"]) assert.equal(shield4TermFail(mk([row]), "fish"), false, row);
});

test("hand review: every one of Line's 347 losses (207 ids) is applied", () => {
  const ids = Object.keys(SHIELD4_HANDREVIEW_FAIL);
  assert.equal(ids.length, 207);
  assert.equal(ids.reduce((n, id) => n + SHIELD4_HANDREVIEW_FAIL[id]!.length, 0), 347);
  for (const id of ids) {
    const r = byId.get(id);
    assert.ok(r, `${id} is live`);
    const has = new Set(recipeAllergens(r!));
    for (const t of SHIELD4_HANDREVIEW_FAIL[id]!) assert.ok(has.has(t), `${id} fails ${t}`);
  }
});

test("bare oil is printed as is and fails soy (never read as olive oil)", () => {
  for (const id of ["aloo-gobi", "chickpea-curry", "greek-bowls"]) {
    const r = byId.get(id)!;
    const rows = r.ingredients.map((i) => ((i as { raw?: string }).raw ?? i.name).toLowerCase());
    assert.ok(rows.some((n) => /(?:^|\s)oil$/.test(n) && !/olive/.test(n)), `${id} keeps its printed oil row`);
    assert.equal(recipeSafe(r, ["soy"]), false, id);
  }
});

test("cross-references inherit every new-shield failure of their single base (HTCF, Southern, 365 Desserts)", () => {
  for (const src of [HTCF_XREF, SO_XREF, DS365_XREF] as Record<string, readonly string[] | null>[]) {
    for (const [id, bases] of Object.entries(src)) {
      const r = byId.get(id);
      if (!r) continue;
      const mine = new Set(recipeAllergens(r));
      if (bases === null) {
        for (const t of FOUR) assert.ok(mine.has(t), `${id} unresolved fails ${t}`);
        continue;
      }
      for (const b of bases) {
        const base = byId.get(b);
        if (!base) continue;
        for (const t of recipeAllergens(base)) if ((FOUR as readonly string[]).includes(t)) assert.ok(mine.has(t as Shield4Id), `${id} inherits ${t} from ${b}`);
      }
    }
  }
});

test("bought products: kleber-0220 (cinnamon drops) and htcf-0864 (anchovy essence) fail gluten-free", () => {
  for (const id of ["kleber-0220", "htcf-0864"]) {
    const r = byId.get(id)!;
    assert.equal(isGlutenFree(r), false, id);
    assert.equal(recipeSafe(r, ["gluten"]), false, id);
  }
});

test("Mild: poblano and the other named chiles fail; mx-rajas is not Mild", () => {
  assert.ok(recipeAllergens(byId.get("mx-rajas")!).includes("spicy"));
  for (const row of ["poblano peppers", "ancho chile powder", "guajillo", "chiles de arbol", "pepperoncini"])
    assert.ok(recipeAllergens(mk([row])).includes("spicy"), row);
  for (const row of ["red bell pepper", "anchovy", "sweet paprika"]) assert.equal(recipeAllergens(mk([row])).includes("spicy"), false, row);
});

test("yield and ratio sentences print as is at every size (lfo-018, cranberry mould, ys-074)", () => {
  for (const [id, phrase] of [
    ["lfo-018", "Makes about 3 quart jars (or 6 pints or 12 half-pints)."],
    ["ds-feb-09-cranberry-shape", "1 quart of cranberries is enough for 1 pint mould."],
  ] as const) {
    const r = byId.get(id)!;
    const i = r.steps.findIndex((s) => s.includes(phrase));
    assert.ok(i >= 0, `${id} prints "${phrase}"`);
    for (const k of [0.5, 2, 3]) {
      const out = scaleMethodSteps(r.steps, r.ingredients, r.servings * k, r.servings, { catalogFinal: true });
      assert.ok(out[i]!.includes(phrase), `${id} ${k}x: ${out[i]}`);
    }
  }
  // Other yields still scale.
  const k = byId.get("kfyr-110")!;
  const i = k.steps.findIndex((s) => /Makes 3 cups soup/.test(s));
  assert.ok(i >= 0);
  assert.match(scaleMethodSteps(k.steps, k.ingredients, k.servings * 2, k.servings, { catalogFinal: true })[i]!, /Makes 6 cups soup/);
});

test("Shop: the week list scales '(N sticks)' with the line (lfo-065, bcx-004, bcx-008)", () => {
  const meal = (recipeId: string): PlannedMeal => ({ id: "m-" + recipeId, date: "2026-11-09", slot: "dinner", recipeId } as PlannedMeal);
  for (const id of ["lfo-065", "bcx-004", "bcx-008"]) {
    const r = byId.get(id)!;
    const row = r.ingredients.find((i) => /\(\d[^)]*sticks?\)/.test(i.name));
    assert.ok(row, `${id} has a stick note`);
    for (const f of [0.5, 2]) {
      const lines = groceryForWeek([meal(id)], "2026-11-09", [], [], r.servings * f);
      const line = lines.find((l) => l.name.replace(/\s*\([^)]*sticks?\)/, "") === row!.name.replace(/\s*\([^)]*sticks?\)/, "") && l.unit === row!.unit);
      assert.ok(line, `${id} ${f}x line`);
      const n = Number((line!.name.match(/\((\d+(?:\.\d+)?)/) ?? [])[1] ?? NaN);
      const want = (Number((row!.name.match(/\((\d+(?:\.\d+)?)/) ?? [])[1]) * line!.qty) / row!.qty;
      if (Number.isFinite(n)) assert.ok(Math.abs(n - want) < 0.26, `${id} ${f}x: ${line!.name} for ${line!.qty} ${line!.unit}`);
      else assert.ok(!line!.name.includes(row!.name.match(/\([^)]*sticks?\)/)![0]), `${id} ${f}x note moved: ${line!.name}`);
    }
  }
});
