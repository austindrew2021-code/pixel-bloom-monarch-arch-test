import assert from "node:assert/strict";
import test from "node:test";
import { RECIPES } from "./recipes.ts";
import { searchRecipes } from "./search.ts";

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
