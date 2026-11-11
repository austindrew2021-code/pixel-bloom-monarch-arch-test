import assert from "node:assert/strict";
import test from "node:test";
import { isDairyFree, isGlutenFree, isKeto, isPescatarian, isSugarFree, isVegan, isVegetarian } from "./diet.ts";
import { recipeAllergens } from "./shield.ts";
import { XREF_GRAPH } from "./shields4-xref.ts";
import { RECIPES } from "./recipes.ts";
import { bookOf, detectXrefs, xrefCovered } from "./xref-detector.ts";
import EXCLUSIONS from "./xref-exclusions.json" with { type: "json" };
import type { Recipe } from "./types";

// Nov 10 r5 (Line FA0D #1): a reference missing from XREF_GRAPH used to go unseen (hill-0303 -> hill-0304 creamed peas).
// The detector scans every book's printed rows and steps (books come from the recipes, no list); every hit must be an
// edge of XREF_GRAPH or a listed exclusion with its reason (xref-exclusions.json).
type Excl = { id: string; base?: string; text: string; reason: string; noCost?: boolean };
const EX = EXCLUSIONS as unknown as { title: Excl[]; phrase: Excl[] };
const byId = new Map(RECIPES.map((r) => [r.id, r]));
const graph = XREF_GRAPH as Record<string, readonly string[] | null>;
const tKey = (id: string, base: string, text: string) => `${id}\u0000${base}\u0000${text}`;
const pKey = (id: string, text: string) => `${id}\u0000${text}`;

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

const hits = detectXrefs(RECIPES, graph);
const inGraph = (id: string, base: string) => graph[id] === null || (graph[id]?.includes(base) ?? false);

test("xref detector: scans every book the recipes come from", () => {
  const books = new Set(RECIPES.map(bookOf));
  assert.equal(hits.books, books.size);
  assert.ok(hits.books >= 20, `${hits.books} books`);
  assert.ok(hits.title.length > 200 && hits.phrase.length > 200, `${hits.title.length} title / ${hits.phrase.length} phrase hits`);
});

test("xref detector: every title hit is an XREF_GRAPH edge or a listed exclusion", () => {
  const ex = new Set(EX.title.map((e) => tKey(e.id, e.base!, e.text)));
  const missing = hits.title.filter((h) => !inGraph(h.id, h.base) && !ex.has(tKey(h.id, h.base, h.text)));
  assert.deepEqual(missing.map((h) => `${h.id} -> ${h.base}: ${h.text.slice(0, 80)}`), []);
});

test("xref detector: every reference phrase outside XREF_GRAPH is a listed exclusion", () => {
  const ex = new Set(EX.phrase.map((e) => pKey(e.id, e.text)));
  const missing = hits.phrase.filter((h) => !ex.has(pKey(h.id, h.text)));
  assert.deepEqual(missing.map((h) => `${h.id}: ${h.text.slice(0, 80)}`), []);
});

test("xref exclusions: each has a reason, none is stale, none is also an edge", () => {
  const tHits = new Set(hits.title.map((h) => tKey(h.id, h.base, h.text)));
  const pHits = new Set(hits.phrase.map((h) => pKey(h.id, h.text)));
  for (const e of EX.title) {
    assert.ok(e.reason.trim().length > 10, `${e.id} -> ${e.base} reason`);
    assert.ok(tHits.has(tKey(e.id, e.base!, e.text)), `stale title exclusion ${e.id} -> ${e.base}`);
    assert.ok(!inGraph(e.id, e.base!), `${e.id} -> ${e.base} is both an edge and an exclusion`);
  }
  for (const e of EX.phrase) {
    assert.ok(e.reason.trim().length > 10, `${e.id} reason`);
    assert.ok(pHits.has(pKey(e.id, e.text)), `stale phrase exclusion ${e.id}: ${e.text.slice(0, 60)}`);
  }
});

test("xref exclusions: a 'no tag at stake' exclusion still has nothing at stake", () => {
  for (const e of EX.title.filter((x) => x.noCost)) {
    const r = byId.get(e.id)!, b = byId.get(e.base!)!;
    const stake = [...passes(r)].filter((t) => !passes(b).has(t));
    assert.deepEqual(stake, [], `${e.id} -> ${e.base} now passes what its base fails: review it`);
  }
  for (const e of EX.phrase.filter((x) => x.noCost)) assert.deepEqual([...passes(byId.get(e.id)!)], [], `${e.id} now passes a tag: review "${e.text.slice(0, 60)}"`);
});

test("xref detector: it catches the reference Line found missing (hill-0303 -> hill-0304)", () => {
  assert.deepEqual(graph["hill-0303"], ["hill-0304"]);
  const { ["hill-0303"]: _gone, ...without } = graph;
  const again = detectXrefs(RECIPES, without);
  assert.ok(again.title.some((h) => h.id === "hill-0303" && h.base === "hill-0304"), "title scan finds creamed peas");
  for (const t of ["gluten-free", "shield-gluten", "sugar-free"]) assert.ok(!passes(byId.get("hill-0303")!).has(t), `hill-0303 fails ${t}`);
});

test("r6 (Line 7624 #5): names are scanned, and graph ids are re-scanned unless real edges (or null) cover them", () => {
  assert.ok(hits.title.some((h) => h.text === byId.get(h.id)!.name), "a title inside a recipe's own name is a hit");
  assert.ok(hits.phrase.some((h) => h.id === "htcf-1190"), "an empty graph entry is re-scanned");
  assert.ok(!hits.phrase.some((h) => h.id === "hill-0127"), "covered by its edge to hill-0126");
  assert.equal(xrefCovered({ a: ["b"], c: [], d: null }, "a"), true);
  assert.equal(xrefCovered({ a: ["b"], c: [], d: null }, "c"), false);
  assert.equal(xrefCovered({ a: ["b"], c: [], d: null }, "d"), true);
  assert.equal(xrefCovered({ a: ["b"], c: [], d: null }, "e"), false);
  for (const id of ["htcf-0965", "htcf-1190"]) assert.ok(EX.phrase.some((e) => e.id === id && /^not a reference/.test(e.reason)), id);
});
