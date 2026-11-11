import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isDairyFree, isGlutenFree, isKeto, isPescatarian, isSugarFree, isVegan, isVegetarian } from "./diet.ts";
import { HTCF_XREF, recipeAllergens } from "./shield.ts";
import { SO_XREF } from "./so-southern-doubt.ts";
import { DS365_XREF } from "./ds-365-doubt.ts";
import { XREF_GRAPH } from "./shields4-xref.ts";
import { XREF_EXTRA } from "./xref-extra.ts";
import { RECIPES } from "./recipes.ts";
import { groceryForWeek } from "./spoonful-store.ts";
import { shopLineDisplay } from "./phrase-qty.ts";
import { formatQty } from "./format.ts";
import type { PlannedMeal, Recipe } from "./types";

// Nov 7 r4: Line's 03b537bf HOLD (LINE-AUDIT-03B5-NOV07.md) #2, #3, #4.
const byId = new Map(RECIPES.map((r) => [r.id, r]));
const NEW4 = ["shield-egg", "shield-soy", "shield-sesame", "shield-fish"];
const TAGS = ["vegetarian", "vegan", "gluten-free", "dairy-free", "sugar-free", "keto", "pescatarian", "shield-gluten", "shield-dairy", "shield-nuts", "shield-shellfish", "shield-spicy", ...NEW4];
const passCache = new Map<string, Set<string>>();
function passes(r: Recipe): Set<string> {
  let t = passCache.get(r.id);
  if (t) return t;
  t = new Set<string>();
  if (isVegetarian(r)) t.add("vegetarian");
  if (isVegan(r)) t.add("vegan");
  if (isGlutenFree(r)) t.add("gluten-free");
  if (isDairyFree(r)) t.add("dairy-free");
  if (isSugarFree(r)) t.add("sugar-free");
  if (isKeto(r)) t.add("keto");
  if (isPescatarian(r)) t.add("pescatarian");
  const has = new Set<string>(recipeAllergens(r));
  for (const s of ["gluten", "dairy", "nuts", "shellfish", "spicy", "egg", "soy", "sesame", "fish"]) if (!has.has(s)) t.add("shield-" + s);
  passCache.set(r.id, t);
  return t;
}

test("cross-reference graph: one table holds every source, across every book", () => {
  const notes = new Set<string>();
  for (const f of ["./appwide-doubt.ts", "./shields4-doubt.ts"])
    for (const m of readFileSync(new URL(f, import.meta.url), "utf8").matchAll(/^\s*"([^"]+)",\s*\/\/ cross-ref /gm)) notes.add(m[1]!);
  for (const src of [HTCF_XREF, SO_XREF, DS365_XREF, XREF_EXTRA] as Record<string, unknown>[]) for (const id of Object.keys(src)) assert.ok(id in XREF_GRAPH, `${id} in XREF_GRAPH`);
  for (const id of notes) assert.ok(id in XREF_GRAPH, `${id} (cross-ref note) in XREF_GRAPH`);
  const books = new Set(Object.keys(XREF_GRAPH).map((id) => id.split("-")[0]));
  for (const b of ["htcf", "hill", "cris", "kleber", "so", "ds", "ys"]) assert.ok(books.has(b), `graph covers ${b}`);
});

test("cross-reference graph: every book's reference fails every tag its base fails, through any number of steps", () => {
  let edges = 0;
  for (const [id, bases] of Object.entries(XREF_GRAPH)) {
    const r = byId.get(id);
    if (!r) continue;
    const mine = passes(r);
    if (bases === null) {
      for (const t of TAGS) assert.ok(!mine.has(t), `${id} unresolved fails ${t}`);
      continue;
    }
    if (bases.length > 1) for (const t of NEW4) assert.ok(!mine.has(t), `${id} (${bases.length} bases) fails ${t}`);
    for (const b of bases) {
      edges++;
      const base = byId.get(b);
      for (const t of TAGS) if (!base || !passes(base).has(t)) assert.ok(!mine.has(t), `${id} inherits ${t} from ${b}${base ? "" : " (not in app)"}`);
    }
  }
  // Every edge holds on the final tags, so a chain of any length holds too (a -> b -> c: c's fails reach b, then a).
  assert.ok(edges > 200, `walked ${edges} edges`);
});

test("Line 03B5 #2/#3: the three leaks are closed on the new and the older tags", () => {
  const fails = (id: string, tags: string[]) => { const p = passes(byId.get(id)!); for (const t of tags) assert.ok(!p.has(t), `${id} fails ${t}`); };
  fails("htcf-1174", ["shield-soy", "shield-sesame", "gluten-free", "shield-gluten"]);
  fails("hill-0032", ["shield-soy"]);
  fails("hill-0070", ["shield-egg", "shield-soy", "shield-sesame", "shield-fish", "vegan", "dairy-free", "shield-dairy"]);
  // Found by the r4 sweep: "Cook as before" (Panned Oysters on toast), "Prepare as per Egg-nog No I or II" (milk).
  fails("hill-0276", ["gluten-free", "shield-gluten"]);
  fails("kleber-0268", ["dairy-free", "shield-dairy"]);
});

test("Shop: an ounce note scales with the line; at 0.5x bcx-008 reads '(1½ ounces) cream cheese, softened', ½ pkg", () => {
  const r = byId.get("bcx-008")!;
  const meal = { id: "m-bcx-008", date: "2026-11-09", slot: "dinner", recipeId: "bcx-008" } as PlannedMeal;
  const at = (f: number) => groceryForWeek([meal], "2026-11-09", [], [], r.servings * f).find((l) => /cream cheese/.test(l.name))!;
  assert.deepEqual(shopLineDisplay(at(0.5), formatQty), { qty: "½ pkg", name: "(1½ ounces) cream cheese, softened" });
  assert.deepEqual(shopLineDisplay(at(1), formatQty), { qty: "1 pkg", name: "(3 ounces) cream cheese, softened" });
  assert.deepEqual(shopLineDisplay(at(2), formatQty), { qty: "2 pkg", name: "(6 ounces) cream cheese, softened" });
});
