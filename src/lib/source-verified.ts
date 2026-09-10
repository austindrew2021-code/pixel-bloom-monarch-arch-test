/**
 * Recipes that have been read line by line against the book they credit, and
 * corrected to match it.
 *
 * Membership here is a promise: the text in the catalog is the text that
 * reaches the cook. `polishRecipe` returns these untouched — no step
 * rewriting, no enrichment, no list alignment — because every one of those
 * passes is free to alter wording that was checked against a source, and
 * several of them did. A verified step that says "two heaping tablespoons"
 * says it because the book does.
 *
 * That makes this list load-bearing rather than decorative, so
 * `source-verified.test.ts` asserts the promise holds: for every id below,
 * what the catalog stores and what RECIPES renders must be identical.
 *
 * Add an id only after reading the recipe against the source text. The
 * running record, including the quantities the scan cannot settle, is in
 * docs/source-verification.md.
 */
export const VERIFIED_AGAINST_SOURCE: ReadonlySet<string> = new Set([
  // The Italian Cook Book — Maria Gentile, 1919 (Project Gutenberg #24407)
  "vh-gt-brodo",
  "vh-gt-minestrone",
  "vh-gt-risotto",
  "vh-gt-cacciatora",
  "vh-gt-pomodoro",
  "vh-gt-balsamella",
  "vh-gt-spaghetti-burro",
  "vh-gt-gnocchi",
  "vh-gt-zucchine",
  "vh-gt-panata",

  // The Southern Cook Book — Lustig, Sondheim & Rensel, 1935
  "so-avocado-canapes",
  "so-cheese-appetizer",
  "so-delicious-appetizer",
  "so-papaya-canape",
  "so-papaya-cocktail",
  "so-pigs-in-blankets",
  "so-shrimp-avocado-cocktail",
  "so-shrimp-paste",
  "so-egg-nog",
  "so-idle-hour-cocktail",
  "so-mint-julep",
  "so-mint-tea",
  "so-orange-julep",
  "so-planters-punch",
  "so-spiced-cider",
  "so-syllabub",
  "so-tom-and-jerry",
  "so-creole-batter-bread",
  "so-baking-powder-biscuits",
  "so-beaten-biscuits",
  "so-chitterlings",
  "so-corned-beef-hash-south",
  "so-creole-beef-stew",
  "so-creole-goulash",
  "so-dried-beef-maryland",
  "so-frogs-legs",
  "so-ham-pineapple",
  "so-baked-ham",
  "so-smithfield-ham",
  "so-broiled-ham",
  "so-stuffed-pork-chops",
  "so-parsnips-pork",
  "so-ribs-mission",
  "so-veal-fricassee",
  "so-veal-paprika",
  "so-chicken-tartare",
  "so-barbecued-chicken",
  "so-fried-chicken-maryland",
  "so-chicken-pot-pie",
  "so-roast-chicken",
  "so-roast-turkey",
  "so-chicken-cakes",
  "so-chicken-hash",
  "so-chicken-dumplings",
  "so-chicken-terrapin",
  "so-roast-duck",
  "so-roast-partridge",
  "so-mock-terrapin",
  "so-rice-chicken-casserole",
  "so-pigeon-pie",
  "so-squab-pilau",
  "so-cornbread-dressing",
  "so-oyster-stuffing",
  "so-apple-stuffing",
  "so-chestnut-stuffing",
  "so-bread-stuffing",
]);
