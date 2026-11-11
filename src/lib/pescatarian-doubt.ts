/**
 * Nov 7 r5 (Line FA0D #5): recipes the pescatarian filter must refuse although no ingredient row names the meat, because
 * the print cooks the dish in or with it. id -> the printed words. Read by isPescatarian (diet.ts).
 */
export const PESC_DOUBT: Readonly<Record<string, string>> = {
  "so-cornbread-dressing": "Fill turkey or hen and roast as required.", // the dressing is cooked inside the bird
  "ds-jul-11-stuffed-spanish-cake": "a stiff jelly whipped in", // the Spanish cream is set with gelatine jelly (Nov 10 r5)
};


/**
 * Nov 11 r6 (Line 7624 #2/#3): pescatarian passes whose printed STEPS (not rows) name meat, a meat fat, gelatine, or a
 * stock or broth not named fish, clam, oyster, shrimp, a fish court bouillon or vegetable. Rows are read by the word lists
 * in diet.ts. id -> the printed words, verbatim. Optional and "if desired" variants count (safe side).
 */
export const PESC_DOUBT_R6: Readonly<Record<string, string>> = {
  "cris-006": "cooked roast beef strips",
  "htcf-0737": "Have a large salmon-trout cleaned and larded.",
  "km-096": "You can add tablespoon dry red Jello for color and flavor.",
  "vh-kp-foil-potato": "A spoon of bacon grease if butter is short.",
  "kleber-0012": "Stock may be used if same is available.",
  "kleber-0206": "Cook white stock 20 minutes with onion, carrot, bay leaf, parsley and peppercorns",
  "ys-039": "Pour in hot unstrained broth (2 qt).",
  // Steps fry or cook in an unnamed fat (deep fat, hot fat: usually lard in these books); no fat row to read.
  "hill-0179": "fry in deep fat and drain on soft paper.",
  "hill-0181": "fry in deep fat and drain on brown paper.",
  "hm-victory-soup": "Sweat the chopped onion in a little fat 5 minutes.",
  "htcf-0434": "When brown, fry half a dozen prepared herrings in the same fat.",
  "htcf-0990": "Drain off the fat, add a little flour and cook to a smooth paste.",
  "kleber-0053": "Fry in smoking fat until nicely browned, then drain on browned paper.",
  "kleber-0055": "Cook in deep fat.",
  "kleber-0061": "Have spider very hot with plenty of hot fat.",
  "km-084": "Dip into batter and place in deep hot fat or oil until done.",
  "pta-063": "Cut with floured doughnut cutter and fry in deep fat (365-375 degrees).",
  "pta-064": "Cut with doughnut cutter and fry in deep, hot fat (375 degrees) until golden brown, turning once.",
  "pta-103": "Dip clams in batter, fry in deep fat, and drain on paper towels.",
  "so-cheese-appetizer": "Pat into small balls and fry in deep fat.",
  "so-corn-bread-fritters": "Drop from a spoon into deep boiling fat and fry until golden brown.",
  "so-corn-fritters": "Drop by spoonsful into hot deep fat and fry until well browned.",
  "so-crab-croquettes": "Fry in deep hot fat until golden brown.",
  "so-doughnuts": "Cover the board with flour and heat the fat for frying.",
  "so-fried-oysters": "Have the fat hot and fry the oysters quickly.",
  "so-potato-croquettes": "Fry in deep hot fat (390° F.) until golden brown, which usually requires about one minute.",
  "so-rice-croquettes": "Mix all well and mold into balls and fry in hot fat until brown.",
  "so-shrimp-rice-croquettes": "Fry in deep fat.",
  "vh-sf-carrot-croquettes": "Fry in 365°F fat 3–4 minutes, until deep gold.",
  "ys-034": "Cook in melted fat in double boiler or in heavy skillet over low heat, stirring frequently.",
  "ys-063": "Drop by spoonfuls into hot fat in skillet.",
  // A printed variant swaps in meat (safe side).
  "hill-0284": "Oyster, chicken, turkey or sweetbread à la Newburgh may be prepared by substituting one of the above ingredients for the lobster.",
};

/**
 * Nov 11 r6 (Line 7624 #3, hand-read): How to Cook Fish recipes whose stock or broth row is made from the fish in the
 * recipe's own printed steps, so the row is named. Being in a fish book is not enough. id -> the printed words.
 * Only the stock/broth row is cleared; every other check (deep fat, drippings, cross-references) still applies.
 */
export const PESC_STOCK_NAMED: Readonly<Record<string, string>> = {
  "htcf-0391": "make a stock of the fish bones and water",
  "htcf-0478": "mix with an equal quantity of the fish broth",
  "htcf-0481": "Take out the fish, strain the broth", // the mackerel's own cooking liquid (onions, parsley, wine, water)
  "htcf-1183": "make a stock of the fish bones",
  "htcf-0285": "Half cover with stock made from the fish trimmings", // still fails: cross-reference to htcf-0281
  "htcf-0980": "in stock made from the bone and trimmings", // still fails: deep fat row
  "htcf-0981": "Simmer the trimmings of the fish", // "this stock" and "fish stock"; still fails: deep fat row
};
