import assert from "node:assert/strict";
import test from "node:test";
import { RECIPES } from "./recipes.ts";

/**
 * A source credit is a claim the reader can check: it names a book, an author,
 * a year, and an Internet Archive item they can open. Fourteen of the catalog's
 * twenty-two archive identifiers pointed at nothing — `nationalwartimen00unit`
 * for a guide filed under `nationalwartimen04unit`, `saladssandwiches00hill`
 * for `saladssandwiches00hillrich` — and three of them cited works that were
 * never written at all, naming a tradition where the author should be.
 *
 * These tests cannot reach archive.org, so they guard the shapes that gave the
 * fabrications away. The identifiers themselves were checked against the
 * archive's search API, and the method is written up in
 * docs/source-verification.md so the next one can be checked the same way.
 */

/** Every identifier below was confirmed to resolve to a real archive item. */
const CONFIRMED = new Set([
  "southerncookbook00lustrich",
  "bostoncookingsc00farm",
  "whatmrsfisherkno00fishrich",
  "whitehousecookbo00gill",
  "howtocookfish00gree",
  "suffragecookbook00kleb",
  "virginiahousewif00rand",
  "campingwoodcraft00keph",
  "365dessertsdesse00nels",
  "365foreigndishes00phil",
  "americancookery12815gut",
  "chinesejapanesec00boss_1",
  "foodsthatwillwin15464gut",
  "cu31924003580952",
  "italiancookbooka00gentiala",
  "nationalwartimen04unit",
  "cu31924003574187",
  "saladssandwiches00hillrich",
  "the-woman-suffrage-cook-book-compilation-accessible-version",
]);

test("every archive identifier the catalog cites is one that was checked", () => {
  const unchecked = new Set<string>();
  for (const r of RECIPES) {
    const id = r.source?.archiveId;
    if (id && !CONFIRMED.has(id)) unchecked.add(`${id} (${r.id})`);
  }
  assert.deepEqual(
    [...unchecked],
    [],
    `new archive identifiers appear in the catalog. Check each one resolves —\n` +
      `https://archive.org/advancedsearch.php?q=identifier:(<id>)&fl[]=identifier&output=json\n` +
      `— then add it to CONFIRMED:\n${[...unchecked].join("\n")}`,
  );
});

test("a source names a work and a person, not a tradition", () => {
  // "Vegetarian cookery, 1900–1910" by "Early vegetarian household" and
  // "American luncheon cookery" by "Household pages, 1925" were not books.
  const vague: string[] = [];
  for (const r of RECIPES) {
    const s = r.source;
    if (!s) continue;
    if (s.author && /household|traditional|pages,|cookery, \d{4}/i.test(s.author)) {
      vague.push(`${r.id}: "${s.book}" by "${s.author}"`);
    }
  }
  assert.deepEqual([...new Set(vague)], [], vague.join("\n"));
});

test("a source credit carries a book, an author, a year and an archive item", () => {
  const thin: string[] = [];
  for (const r of RECIPES) {
    const s = r.source;
    if (!s) continue;
    if (!s.book || !s.author || !s.year || !s.archiveId || !s.credit) thin.push(r.id);
  }
  assert.deepEqual([...new Set(thin)], [], thin.join(", "));
});
