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
  "cu31924003574187",
  "saladssandwiches00hillrich",
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

/**
 * Items that resolve on archive.org but are not the work that cites them. An
 * identifier that opens is not evidence that the page it opens holds the
 * recipe, and it is not evidence that the item is the book: the National
 * Wartime Nutrition Guide is a four-page USDA pamphlet — the "Basic 7" food
 * groups and a dozen conservation hints — and carries no recipes at all. Twelve
 * recipes cited it. Their credits were withdrawn rather than guessed at.
 */
const NOT_A_COOKBOOK = new Map([
  [
    "the-woman-suffrage-cook-book-compilation-accessible-version",
    "that identifier is a 28-page 2020 Johns Hopkins Sheridan Libraries " +
      "sampler of holiday sweets drawn from three different suffrage " +
      "cookbooks. It is not Burr's Woman Suffrage Cook Book, and the 1886 " +
      "book is not on the archive under any identifier.",
  ],
  [
    "nationalwartimen04unit",
    "National Wartime Nutrition Guide (USDA, 1943) is a four-page food-group " +
      "chart. It contains no recipes.",
  ],
]);

test("no recipe credits an item that is not the work it is cited as", () => {
  const wrong: string[] = [];
  for (const r of RECIPES) {
    const id = r.source?.archiveId;
    const why = id ? NOT_A_COOKBOOK.get(id) : undefined;
    if (why) wrong.push(`${r.id} cites ${id} — ${why}`);
  }
  assert.deepEqual([...new Set(wrong)], [], wrong.join("\n"));
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
