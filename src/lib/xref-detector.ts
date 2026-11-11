/**
 * Nov 7 r5 (Line FA0D #1): the cross-reference detector, shared by xref-detector.test.ts and fixpack's exclusion builder.
 * Two scans over every book, with no book list (books are whatever the recipes' sources say):
 *  - title: the name, a step or an ingredient row of one recipe names another recipe of the same book by its title
 *    (2+ words);
 *  - phrase: the name, a step or a row of any recipe has a reference phrase ("prepare as", "serve as", "cook as",
 *    "see", "same as", "as for", "as above", "as before", "the preceding recipe", "No. I / II", "use the recipe", ...).
 *  "creamed <recipe>" and every other "<title> of another recipe" use is the title scan.
 * Every hit must be an edge in XREF_GRAPH or a listed exclusion (xref-exclusions.json) with its reason.
 * Nov 11 r6 (Line 7624 #5): names are scanned too ("Mousse-de-Poulet, No. 2" names its base), and recipes already in
 * XREF_GRAPH are re-scanned: a phrase hit is covered only by real edges (or null = unresolved), never by an empty list.
 */
import type { Recipe } from "./types";

export type TitleHit = { kind: "title"; id: string; base: string; book: string; text: string };
export type PhraseHit = { kind: "phrase"; id: string; book: string; text: string };

export const XREF_PHRASE =
  /\b(prepare[sd]? as|made as|make as|serve[sd]? as(?! soon)|cook(?:ed)? as|as per|as for|same as|as in|according to|recipe (on )?page|see|given (for|above|in)|as directed|as above|no\.? ?(\d+|[ivx]+)\b|in the same (way|manner)|in the usual way|as before|preceding recipe|use the recipe|any of the)\b|\((?:right|left|below|above|opposite)\)/i;

export function bookOf(r: Recipe): string {
  const s = (r as { source?: { archiveId?: string; book?: string } }).source;
  return s?.archiveId || s?.book || "app:" + ((r as { pack?: string }).pack ?? r.id.split("-")[0]);
}

/** A recipe's references are settled when XREF_GRAPH lists real bases for it, or null (unresolved: fails every tag). */
export function xrefCovered(graph: Readonly<Record<string, unknown>>, id: string): boolean {
  if (!(id in graph)) return false;
  const b = graph[id];
  return b === null || (Array.isArray(b) && b.length > 0);
}

const norm = (s: string) => " " + s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim() + " ";

/** A recipe's texts (steps, rows, then the name: older hits keep their text), normalized once per recipe object. */
const normCache = new WeakMap<Recipe, { texts: string[]; nt: string[]; all: string; words: Set<string> }>();
function normTexts(r: Recipe): { texts: string[]; nt: string[]; all: string; words: Set<string> } {
  let c = normCache.get(r);
  if (!c) {
    const texts = [...(r.steps ?? []), ...r.ingredients.map((i) => i.name), r.name];
    const nt = texts.map(norm);
    const all = nt.join("|"); // one search first; the per-text pass only runs on a hit
    c = { texts, nt, all, words: new Set(all.split(/[ |]+/)) };
    normCache.set(r, c);
  }
  return c;
}

export function detectXrefs(recipes: readonly Recipe[], graph: Readonly<Record<string, unknown>>): { books: number; title: TitleHit[]; phrase: PhraseHit[] } {
  const groups = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const b = bookOf(r);
    (groups.get(b) ?? groups.set(b, []).get(b)!).push(r);
  }
  const title: TitleHit[] = [];
  const phrase: PhraseHit[] = [];
  for (const [book, rs] of groups) {
    const titles = rs
      .map((r) => ({ r, n: norm(r.name).replace(/ (a|an|the) /g, " ") }))
      .filter((t) => t.n.trim().split(" ").length >= 2)
      .map((t) => ({ ...t, plural: t.n.replace(/ $/, "s "), first: t.n.trim().split(" ")[0]! }));
    for (const r of rs) {
      const { texts, nt, all, words } = normTexts(r);
      for (const t of titles) {
        if (t.r.id === r.id) continue; // a title inside this recipe's own name counts too (hill-0303 "...with Creamed Peas")
        if (!words.has(t.first) || (!all.includes(t.n) && !all.includes(t.plural))) continue; // first word: a cheap pre-check
        const k = nt.findIndex((s) => s.includes(t.n) || s.includes(t.plural));
        if (k >= 0) title.push({ kind: "title", id: r.id, base: t.r.id, book, text: texts[k]! });
      }
      if (!xrefCovered(graph, r.id)) {
        for (const s of new Set(texts)) if (XREF_PHRASE.test(s)) phrase.push({ kind: "phrase", id: r.id, book, text: s });
      }
    }
  }
  return { books: groups.size, title, phrase };
}
