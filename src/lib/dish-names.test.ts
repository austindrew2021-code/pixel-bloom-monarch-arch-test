import assert from "node:assert/strict";
import test from "node:test";
import { RECIPES } from "./recipes.ts";
import { searchRecipes } from "./search.ts";
import { COLLECTIONS } from "./collections.ts";

/**
 * Renaming a dish to its source book's title hides it from everyone who knows
 * it by its ordinary name.
 *
 * Reading the 466 archive-sourced recipes against their books renamed 33 of
 * them to what the book prints — "Shrimp Creole" became "Stewed shrimp à la
 * Créole", "Holishkes" became "Kal dolmar", "Potato latkes" became "Potato
 * pancakes". Nothing was deleted and the catalog still held 1,539 dishes, but
 * to anyone searching the app they were gone.
 *
 * The book's title belongs in the description and in `aliases`. The name stays
 * the one a cook would type. These are the searches that broke.
 */
const FAMILIAR: [string, string][] = [
  ["shrimp creole", "vh-pc-shrimp-creole"],
  ["grillades", "vh-pc-grillades"],
  ["courtbouillon", "vh-pc-courtbouillon"],
  ["goulash", "vh-365-goulash"],
  ["irish stew", "vh-365-irish-stew"],
  ["borscht", "vh-365-borscht"],
  ["chicken curry", "vh-365-curry-chicken"],
  ["gefilte fish", "vh-jw-gefilte"],
  ["latkes", "vh-jw-latkes"],
  ["holishkes", "vh-jw-cabbage-rolls"],
  ["knaidlach", "vh-jw-matzo-ball"],
  ["matzo ball soup", "vh-jw-matzo-ball"],
  ["blancmange", "vh-ds-blancmange"],
  ["apple tapioca", "vh-ds-apple-tapioca"],
  ["prune whip", "vh-ds-prune-whip"],
  ["tomato aspic", "vh-hi-tomato-aspic"],
  ["chicken salad", "vh-hi-chicken-salad"],
  ["fried rice", "vh-bj-fried-rice"],
  ["salmon loaf", "vh-og-salmon-loaf"],
  ["creamed salt cod", "vh-og-creamed-cod"],
  ["broiled mackerel", "vh-og-broiled-mackerel"],
  ["kabobs", "vh-kp-kabobs"],
  ["campfire potatoes", "vh-kp-foil-potato"],
  ["trail beans", "vh-kp-trail-beans"],
  ["indian pudding", "vh-am-indian-pudding"],
  ["slapjacks", "vh-am-slapjacks"],
  ["hot slaw", "vh-sf-hot-slaw"],
  ["carrot marmalade", "vh-ww1-carrot-marmalade"],
  ["cabbage with pork", "vh-bj-cabbage-pork"],
];

test("the dishes people know by name are still findable by that name", () => {
  const lost: string[] = [];
  for (const [query, id] of FAMILIAR) {
    if (!searchRecipes(query).some((r) => r.id === id)) lost.push(`${query} -> ${id}`);
  }
  assert.deepEqual(
    lost,
    [],
    `a rename hid these from search. Put the familiar name back and keep the\n` +
      `book's title in aliases:\n${lost.join("\n")}`,
  );
});

test("a recipe renamed to a book title carries the name it lost", () => {
  // Every dish whose name is no longer the everyday one keeps that one in
  // aliases, so the search above can never be the only thing holding it up.
  const bookish = RECIPES.filter((r) => r.source && /à la|a la|fisch|kleis|dolmar|tamana/i.test(r.name));
  for (const r of bookish) {
    assert.ok(
      (r.aliases ?? []).length > 0,
      `${r.id} is named for the book ("${r.name}") and lists no everyday alias`,
    );
  }
});

/**
 * A `book-*` tag is a provenance claim: it puts the dish on that book's shelf
 * in the app. Sixty-three recipes lost a source credit they could not support,
 * and thirty-five of them kept the tag, so they went on standing on the shelf
 * of a book they are not in. Two of those shelves — Pennsylvania Dutch and
 * Early vegetarian — were named for books that were never written at all.
 */
test("a dish only stands on a book's shelf if it is credited to that book", () => {
  const unearned = RECIPES.filter(
    (r) => !r.source && r.tags.some((t) => t.startsWith("book-")),
  ).map((r) => `${r.id}: ${r.tags.filter((t) => t.startsWith("book-")).join(" ")}`);
  assert.deepEqual(
    unearned,
    [],
    `these carry a book tag with no source credit behind it:\n${unearned.join("\n")}`,
  );
});

/**
 * Reading the books renamed some tags too, and a tag no shelf matches is a
 * dish that has quietly left the shelf. "How to Cook Fish" lost all six of its
 * verified dishes that way: they were retagged `book-how-to-cook-fish` while
 * the shelf went on matching `book-olive-green`.
 */
test("no book shelf is empty", () => {
  const empty = COLLECTIONS.filter(
    (c) => c.id.startsWith("book-") && !RECIPES.some((r) => c.match(r)),
  ).map((c) => `${c.id} (${c.label})`);
  assert.deepEqual(empty, [], `these shelves show nothing:\n${empty.join("\n")}`);
});

test("no recipe is unreachable from every shelf in the app", () => {
  // The accounting guarantee: a dish that matches no collection can only be
  // found by typing its name, which is how 33 of them went missing once.
  const stranded = RECIPES.filter((r) => !COLLECTIONS.some((c) => c.match(r))).map((r) => r.id);
  assert.deepEqual(stranded, [], `on no shelf at all:\n${stranded.join("\n")}`);
});

test("a book tag the shelves do not match is a dish that has left the shelf", () => {
  // book-how-to-cook-fish was such a tag: six verified dishes carried it while
  // the shelf went on matching book-olive-green, so the shelf showed nothing.
  const shelves = COLLECTIONS.filter((c) => c.id.startsWith("book-"));
  const matched = new Set<string>();
  for (const c of shelves) {
    for (const r of RECIPES) if (c.match(r)) for (const t of r.tags) if (t.startsWith("book-")) matched.add(t);
  }
  const used = new Set(RECIPES.flatMap((r) => r.tags).filter((t) => t.startsWith("book-")));
  const unshelved = [...used].filter((t) => !matched.has(t)).sort();
  assert.deepEqual(
    unshelved,
    [],
    `these book tags are on dishes but no shelf matches them:\n${unshelved.join("\n")}`,
  );
});
