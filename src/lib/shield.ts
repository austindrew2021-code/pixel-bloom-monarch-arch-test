import type { AllergyId, Nutrition, PlannedMeal, Protein, Recipe } from "./types";
import { withDietScreen } from "./catalog-final.ts";

export const ALLERGIES: { id: AllergyId; label: string; hint: string }[] = [
  { id: "gluten", label: "Gluten", hint: "Wheat, pasta, bread" },
  { id: "dairy", label: "Dairy", hint: "Milk, cheese, butter" },
  { id: "nuts", label: "Nuts", hint: "Peanut to pecan" },
  { id: "shellfish", label: "Shellfish", hint: "Shrimp, crab, mussels" },
  { id: "spicy", label: "Spicy", hint: "Chili, cayenne, hot sauce" },
];

const PATTERNS: Record<AllergyId, RegExp> = {
  // pastry, bulgur, biscuit and semolina were missing, which is how a tourtière
  // and a baked kibbeh came to sit behind a gluten-free filter.
  gluten:
    /flour|pasta|spaghetti|penne|macaroni|lasagna|noodle|ramen|udon|bread|breadcrumb|panko|tortilla|wheat|bun|bagel|naan|pita|dumpling|couscous|orzo|soy sauce|pie crust|pastry|puff pastry|phyllo|filo|dough|cracker|seitan|barley|bulgur|semolina|rye|farro|spelt|wraps?|crouton|biscuit|cake flour|pretzel/i,
  dairy:
    /milk|butter|cream|cheese|parmesan|mozzarella|cheddar|yogurt|yoghurt|ricotta|feta|halloumi|paneer|sour cream|mascarpone|whey|ghee|brie|ice cream/i,
  nuts: /peanut|almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|pine nut/i,
  shellfish: /shrimp|prawn|crab|lobster|clam|mussel|scallop|oyster|crawfish|crayfish/i,
  spicy:
    /chili|chile|cayenne|jalape[nñ]o|hot sauce|pepper flake|harissa|sriracha|gochujang|chipotle|scotch bonnet|habanero|berbere/i,
};

/*
 * Gluten the word list above never saw. QA found dishes passing as gluten-free
 * with linguine, ziti, baguettes, graham crumbs, matzo meal, beer, puff paste,
 * a flour-roux white sauce or gravy, period soy-based "Chinese sauce", frozen
 * meatballs or "serve on toast" in them. A false "safe" is worse than a false
 * "unsafe" here, so wheat-by-default prepared foods count. These only ever take
 * a gluten-free pass away.
 *
 * They read the ingredient rows (not the dish name, so flourless "peanut butter
 * cookies" is not condemned by its title) and, for gluten only, the steps,
 * because old books put the toast, the crust and the crackers in the method.
 * A gluten-free, rice, corn or nut form is never matched.
 */
const CONJ = String.raw`(?:(?!(?:or|and|with|nor)\b)\w+[- ])?`;
const NOT_GF = String.raw`(?<!\b(?:gluten[- ]free|gf|rice|corn|almond|chickpea|cassava|tapioca|buckwheat)[- ]${CONJ})`;
// Corn muffins and corn, nut or potato bread are wheat by default: only a plainly
// gluten-free form (or a rice, almond, chickpea... one) clears these words.
const NOT_GF_STRICT = String.raw`(?<!\b(?:gluten[- ]free|gf|rice|almond|chickpea|cassava|tapioca|buckwheat|coconut|sorghum)[- ]${CONJ})`;
const GLUTEN_INGREDIENT = new RegExp(
  "(?:" +
  NOT_GF_STRICT +
    String.raw`\b(?:muffins?|corn[- ]?bread|cornbread|(?:nut|potato) bread)\b` +
  "|" +
  NOT_GF +
    "(?:" +
    String.raw`\b(?:linguine|fettuccine|fettuccini|tagliatelle|pappardelle|bucatini|rigatoni|ziti|rotini|fusilli|farfalle|orecchiette|ditalini|cavatappi|gemelli|vermicelli|ravioli|tortellini|tortelloni|manicotti|cannelloni|gnocchi|spaetzle|baguettes?|ciabatta|focaccia|brioche|croissants?|challah|crostini|sourdough|pumpernickel|zwieback|hardtack|rolls|toast|sippets|crumbs|saltines?|graham|gingersnaps?|cookies?|wafers?|lady[- ]?fingers|matzo|matzah|matzoh|lager|stout|malt|malted|oats|oatmeal|muffins?|waffles?|freekeh|kamut|einkorn|triticale|durum|farina|shoyu|pierogi|pierogies|perogies|panettone|cornflakes|cheerioats)\b` +
    String.raw`|(?<!\broot )\bbeer\b|(?<!\bginger )\bale\b` +
    String.raw`|\b(?:sponge|pound|layer|coffee|service|angel food|chiffon|sheet)[- ]cake\b|\bcake[- ](?:mix|crumbs|batter)\b|^cake$` +
    String.raw`|\b(?:pie|puff|plain|short)[- ]paste\b|\bpie[- ]crust\b|^crust$|\b(?:tart|pie|pastry|patty) shells?\b|\bpancake (?:batter|mix)\b` +
    String.raw`|\b(?:french|italian|bread|sandwich|sourdough|white|rye|wheat) loa(?:f|ves)\b|\bcorn flakes\b|\bempanada (?:discs|dough|wrappers|shells)\b|^soy$` +
    String.raw`|\bgravy\b|\b(?:egg|fritter|frying) batter\b|\b(?:chinese|japanese|chop suey) sauce\b|\bfiggy duff\b|\b(?:frozen|cooked|prepared|store-bought) meatballs\b` +
    String.raw`|(?<!\balabama )\bwhite sauce\b|\bcream sauce\b|\bb[eé]chamel\b|\broux\b` +
    // Line's Oct 9 audit: period "flower", baba, golden buck, condensed soups.
    String.raw`|^flower$|\bbaba\b(?! gh?anou\w+)|\bgolden buck\b|\bcream of (?:mushroom|chicken|celery|potato) soup\b|\b(?:condensed )?tomato soup\b` +
    // Wheat by default: prepared sauces, mixes and cubes carry wheat unless the row says gluten-free
    // (white and shiro miso, and a "gluten-free" or "GF" label, are taken at their word).
    String.raw`|(?<!\b(?:white|shiro)[- ])\bmiso\b(?! ?\(?(?:white|shiro))|(?<!\bcourt[- ])\bbouillon\b|\btaco seasoning\b|\bonion soup mix\b|\bworcestershire\b|\bworcester sauce\b|\b(?:barbecue|barbeque|bbq) sauce\b` +
    String.raw`|\bgochujang\b|\bsurimi\b|\bimitation crab(?:meat)?\b|\bbangers?\b|\bomelet(?:te)? batter\b|\btempura batter\b|\b(?:teriyaki|hoisin) sauce\b|\blicorice\b|\bliquorice\b` +
    // Named sauces that are a flour-and-butter roux or white sauce (period fish books: drawn-butter,
    // poulette, parsley, egg, caper, anchovy, shrimp ... sauce).
    String.raw`|\b(?:drawn[- ]butter|melted[- ]butter|poulette|parsley|egg|caper|anchovy|shrimp|lobster|oyster|crab|mushroom|brown|velout[eé]|allemande|normandy|supr[eê]me|bordelaise|mustard|curry|onion|celery|cheese|newburg|lyonnaise|bigarade|piquante|robert|cardinal|nantua|mornay|cream or drawn-butter) sauces?\b` +
    // Plate-approved brand-risk rule (same as Worcestershire / miso): steak sauce, chili sauce, bottled or
    // prepared dressings and chicken / beef broth, stock, bouillon or consomme fail unless the row says gluten-free / GF.
    // Bare "French dressing" is the period homemade one (oil, vinegar, salt) and is not matched unless the row says bottled / prepared.
    // A dressing row that points at a recipe ("(page 204)", "homemade") is the homemade one and is not matched.
    String.raw`|\bsteak sauce\b|\ba\.?1 (?:steak )?sauce\b|\bchil+i+ sauce\b|\bchilli sauce\b|\b(?:chicken|beef)[- ](?:(?:broth|stock|bouillon|soup|base)\b|consomm(?:e\b|é))|\b(?:(?:broth|stock)[- ]cubes?\b|consomm(?:e\b|é)[- ]cubes?\b)` +
    String.raw`|^(?!.*\b(?:homemade|home-made|page \d+|recipe)\b).*\b(?:(?:(?:bottled|prepared|commercial|store-bought)(?: \w+){0,2}|creamy|zesty|italian|ranch|catalina|russian|thousand island|caesar|blue cheese|honey[- ]mustard|poppy ?seed|green goddess|oil[- ]and[- ]vinegar) (?:salad )?dressing|salad dressing|dressing mix)\b` +
    // Survivor review of the 255 wired Betty / Kraft rows: a boxed meat marinade, seasoned salt (a blend), French fried
    // onions and frozen French-fried potatoes (wheat-flour coated) and sweet-and-sour sauce (soy-based, bottled or the book's own) are the same brand risk.
    String.raw`|\bseasoned salt\b|\bfrench[- ]fried (?:onions|potatoes)\b|\bfrozen (?:french )?fries\b|\bfrench fries\b|\bsweet[- ]and[- ]sour sauce\b|^(?!.*\b(?:homemade|home-made|page \d+|recipe)\b).*\bmarinade\b` +
    String.raw`|\bscones?\b|\bcr[eê]pes?\b|\bcream puffs?\b|\bstuffing mix\b` +
    // Line's Oct 17 audit: a bare "batter" row (wheat batter on fried fish), a French roll soaked in milk, and Leb-kuchen / ginger cake
    // (ginger "cakes" are excluded below because of ginger root) fail unless the row says gluten-free / GF.
    String.raw`|\bbatter\b|\bfrench rolls?\b|\bleb-?kuchen\b|\bginger ?cakes?\b` +
    // Boxed baking mixes are wheat unless the row says gluten-free.
    String.raw`|\b(?:brownie|biscuit|muffin|waffle|cornbread|corn bread|cookie|bread|gingerbread|pizza(?: crust| dough)?|baking|devil'?s food)[- ]mix\b|\bbisquick\b|\bbrownie mixes\b` +
    // A "<word> cake" row is a baked cake, but not a rice, fish, yeast or other savoury cake.
    String.raw`|\b(?!(?:rice|fish|yeast|crab|salmon|potato|tuna|lentil|hoe|meat|shrimp|bean|chickpea|zucchini|carrot|veggie|vegetable|cheese|ice|johnny|jonny|ginger) cakes?\b)[a-z]+ cakes?\b` +
    ")" +
  ")",
  "i",
);
const GLUTEN_STEP = new RegExp(
  NOT_GF +
    "(?:" +
    String.raw`\b(?:on|onto|over|with|of|the|buttered|hot|fresh|dry|anchovy|french) toast\b` +
    String.raw`|\btoast under\.|\bbuttered and salted cereal\b|\bsippets\b|\bpaste,? no\b|\b(?:pint|cups?) of (?:thick |thin |medium )?white sauce\b|\bwith white sauce\b|\b(?:lady[- ]?fingers|sponge-cake|puff[- ]paste|pie[- ]paste|pie[- ]crust|graham|matzo)\b` +
    String.raw`|\b(?:top|under|upper|pastry)[- ]crust\b|\bpastry-(?:lined|covered)\b|\blined with (?:\w+ )?(?:pastry|paste|pie crust)\b|\b(?:tart|pie|pastry|patty) shells?\b|\bbiscuit dough\b|\bbuttered noodles\b` +
    String.raw`|\bcrackers?\b|(?<!\bloose )\bcrumbs\b|\bbread ?crumbs\b` +
    // Line's Oct 9 audit.
    String.raw`|\b(?:open|unbaked|baked) shells?\b|\b_?choux?_? paste\b|\blay in paste\b|\bof (?:the [^,]{0,12})?flower\b|\b(?:white|spice|eggless white) cake\b|\bbaba\b(?! gh?anou\w+)` +
    // Gravy and a bread serve-with named only in the method; omelet and fritter batters.
    String.raw`|\bgravy\b|\bwith (?:\w+ )?bread\b|\b(?:egg|omelet(?:te)?|fritter|frying|tempura) batter\b|\bbangers?\b` +
    ")",
  "i",
);
// Bare "flour" in a step (a roux, a dredge, a thickened sauce), unless it is a gluten-free flour or
// the step says there is none ("do not add flour", "no flour in it").
const FLOUR_STEP =
  /(?<!\b(?:gluten[- ]free|gf|rice|corn|almond|chickpea|cassava|tapioca|buckwheat|coconut|potato|masa|sorghum)[- ](?:\w+[- ])?)(?<!\b(?:no|not|without|nor|never|any) (?:\w+ )?)\bflour\b/i;

const LABELLED_GF = /\bgluten[- ]free\b|\bgf\b/i;

// Recipes the word lists cannot see: the row text says "as above" or only names the filling of a
// sandwich, and the pastry, toast or bread lives in another recipe (Line's Oct 9 audit).
// What a description says it contains: "No butter finish", "no cheese", "without pectin" are
// negations, and "a paprika butter of oil" is oil, so none of those count.
const NEGATED = /\b(?:no|without|never|non|nor|free of|hold the|skip the)[- ](?:\w+[- ]){0,2}\w+|\b\w+ butter of oil\b/gi;
const descText = (r: Recipe) => (r.description ?? "").replace(NEGATED, " ");

// Phrases in a method or description that name a gluten word without meaning wheat: corn tortillas
// (when a row lists corn / masa / gluten-free tortillas), curry gravy (a masala / curry recipe),
// spring and cabbage rolls, "noodles are the vegetable", a pastry bag, baba ghanoush, bagel spice,
// "ground almonds instead of crumbs", an egg-batter eggnog (rum / whiskey / brandy), cornmeal dumplings,
// "toast" as a verb and a hoe cake's "Bread when there is no oven". Only ever removes a gluten hit
// from a description or a step; rows are read in full.
const CORN_TORTILLA_ROW = /\b(?:corn|masa|gluten[- ]free|gf)[- ](?:\w+ )?tortillas?\b/i;
const CURRY_ROW = /\b(?:garam masala|masala|curry|turmeric)\b/i;
const EGGNOG_ROW = /\b(?:rum|whiske?y|brandy|bourbon)\b/i;
const GLUTEN_SAFE_PHRASES = new RegExp(
  [
    String.raw`\b(?:spring|cabbage|summer|lettuce) rolls?\b`,
    String.raw`\bnoodles? (?:are|is) the \w+`,
    String.raw`\bpastry bags?(?: and tubes?)?\b`,
    String.raw`\bbaba gh?anou\w+`,
    String.raw`\b(?:everything )?bagel (?:spice|seasoning)\b`,
    String.raw`\binstead of (?:\w+ )?(?:crumbs|flour|bread)\b`,
    String.raw`\bcorn ?meal dumplings?\b`,
    String.raw`\b(?:skillet|oven|dry|pan)[- ]toast\b`,
    String.raw`\bbread when there is(?: no oven)?\b`,
  ].join("|"),
  "gi",
);
function glutenText(r: Recipe, text: string): string {
  // diet.ts rewrites "corn tortillas" to "gf" before this runs and keeps the printed row in `raw`.
  const rows = r.ingredients.map((i) => (i as { raw?: string }).raw ?? i.name);
  let t = text.replace(GLUTEN_SAFE_PHRASES, " ");
  if (rows.some((n) => CORN_TORTILLA_ROW.test(n))) t = t.replace(/\btortillas?(?: strips?| chips?)?\b/gi, " ");
  if (rows.some((n) => CURRY_ROW.test(n))) t = t.replace(/\bgravy\b/gi, " ");
  if (rows.some((n) => EGGNOG_ROW.test(n))) t = t.replace(/\begg batter\b/gi, " ");
  return t;
}

// Follow-up (Line's friction asks). A DESCRIPTION is not an ingredient list: "stuffed in pita",
// "Tacos, bowls, sandwiches" and "Shawarma, roast chicken, bread" are serve-withs, so pita, sandwiches
// and bread are not read from a description (rows and steps still count). A rice-noodle row clears
// "noodles" in the description (a wheat noodle or pasta row still fails on its own), and two phrases that name a
// dish whose rows hold no wheat: grated-potato dumplings and "sauce for pasta".
const RICE_NOODLE_ROW = /\brice (?:noodles?|vermicelli|sticks?)\b/i;
const DESC_SERVE_WITH = /\b(?:pita|sandwich(?:es)?|bread)\b/gi;
const DESC_SAFE_PHRASES = /\b(?:grated[- ])?potato dumplings?\b|\bsauce for pasta\b/gi;
// Held blocked for Line's call: a bare serve-with bread/sandwich in the description of a dish that is not a
// sauce, rub or filling, which Line did not ask to clear (md-chickpea-stew "Bread.", wn-white-bean-skillet
// "Bread.", bint-057 "cheese and bread", plnt-078 "make a sensational sandwich", vg-hummus-bowl "pita chips optional"
// with a step that says "Eat with pita").
const DESC_SERVE_WITH_HELD = new Set(["md-chickpea-stew", "wn-white-bean-skillet", "bint-057", "plnt-078", "vg-hummus-bowl"]);
function glutenDescText(r: Recipe, desc: string): string {
  if (DESC_SERVE_WITH_HELD.has(r.id)) return glutenText(r, desc);
  const rows = r.ingredients.map((i) => (i as { raw?: string }).raw ?? i.name);
  let t = glutenText(r, desc).replace(DESC_SERVE_WITH, " ").replace(DESC_SAFE_PHRASES, " ");
  if (rows.some((n) => RICE_NOODLE_ROW.test(n))) t = t.replace(/\bnoodles?\b/gi, " ");
  return t;
}

const GLUTEN_BY_ID = new Set(["ac-0024", "hill-0312", "hill-0197", "hill-0208", "hill-0210", "hill-0230"]);
// Names of dishes that are wheat by construction.
const GLUTEN_NAME = /\bsandwich(?:es)?\b/i;
// Words that carry wheat when a description names them ("Bread for the broth", "Celery or white bread").
const GLUTEN_DESC = new RegExp(
  NOT_GF +
    String.raw`(?<!\b(?:not|no|without|never|instead of|skip the|hold the) (?:\w+ )?)\b(?:bread|toast|noodles?|pasta|tortillas?|buns?|rolls|biscuits?|pastry|couscous|crackers?|croutons?|pita|naan|dumplings?|pierogi|bagels?|sandwich(?:es)?|crumbs)\b`,
  "i",
);
const TORTILLA_STEP = /(?<!\b(?:corn|masa|gluten[- ]free|gf)[- ])\btortillas?\b/i;

/** Gluten in an ingredient row, a step or the description that the name-and-tag check misses. */
function glutenBeyondNames(recipe: Recipe): boolean {
  const steps = recipe.steps ?? [];
  const desc = descText(recipe);
  return (
    GLUTEN_BY_ID.has(recipe.id) ||
    (recipe.tags ?? []).includes("gluten") ||
    (!LABELLED_GF.test(recipe.name) && GLUTEN_NAME.test(recipe.name)) ||
    // A row that labels itself gluten-free ("angel food cake (gluten-free)"; diet.ts
    // leaves "gf" where it said so) is taken at its word by these extra words.
    recipe.ingredients.some((i) => !LABELLED_GF.test(i.name) && GLUTEN_INGREDIENT.test(i.name.trim())) ||
    steps.some((s) => { const t = glutenText(recipe, s); return GLUTEN_STEP.test(t) || FLOUR_STEP.test(t); }) ||
    // Steps that warm "the tortillas" when no row lists one (lettuce-cup and taco-bar templates).
    (steps.some((s) => TORTILLA_STEP.test(s)) && !recipe.ingredients.some((i) => /tortilla|\bgf\b|\bcorn\b|\bmasa\b/i.test(i.name))) ||
    (!LABELLED_GF.test(desc) && !/^gf-/.test(recipe.id) && ((d) => GLUTEN_STEP.test(d) || FLOUR_STEP.test(d) || GLUTEN_DESC.test(d))(glutenDescText(recipe, desc)))
  );
}

/*
 * The same gap for the other allergens. The word lists above name the obvious
 * forms and miss the rest: cheeses whose row never says "cheese" (pecorino,
 * provolone, cotija, queso fresco), crema, labneh, eggnog and a milk-and-butter
 * white sauce; a bare "nuts" or "chopped nuts" row, chestnuts, pesto, macaroons
 * and mole paste; squid, octopus and other molluscs; curry pastes, Tabasco
 * (and the period "tobasco"), gochugaru, kimchi, ssamjang, doubanjiang, Cajun
 * seasoning, peri-peri, guajillo, Aleppo, horseradish and a spoonful of ground
 * red pepper. Like the gluten words, these only ever take a pass away, read the
 * ingredient rows and not the dish name, and never match a free-from form:
 * coconut, oat, almond or soy milk, vegan butter, dairy-free cheese, butternut
 * squash, nutmeg, doughnuts, coconut, water chestnuts, cream of tartar, a
 * nut-free row, red bell pepper and sweet paprika all stay as they were.
 *
 * The steps are read too, but only for plain mentions the ingredient list left
 * out ("Add the nuts and vanilla", "thinned with cream", "Serve with
 * horseradish"), never for a verb ("cream the shortening") or a colour ("nut-brown").
 */
const NOT_DAIRY_FREE = String.raw`(?<!\b(?:vegan|dairy[- ]free|non[- ]dairy|plant[- ]based|coconut|cashew|almond|soy|oat|rice|hemp|nut)[- ](?:(?:shredded|grated|sliced|crumbled|whipped|sour|heavy|light|plain|greek|unsweetened|canned|full[- ]fat|style|parmesan|cheddar|cream)[- ])?)`;
const DAIRY_WORDS =
  String.raw`pecorino|parmigiano|grana padano|provolone|cotija|queso|crema|labneh|labne|eggnog|egg nog|gruy[eè]re|gouda|gorgonzola|fontina|asiago|monterey jack|pepper jack|colby|emmenth?al|emmentaler|camembert|manchego|stilton|roquefort|edam|havarti|burrata|raclette|taleggio|ch[eè]vre|neufch[aâ]tel|velveeta|kefir|skyr|quark|curds?|custard|half[- ]and[- ]half|cr[eè]me fra[iî]che|cr[eè]me anglaise|cr[eè]me p[aâ]tissi[eè]re|casein|caseinate|b[eé]chamel|mornay|alfredo|hollandaise|b[eé]arnaise|lassi|raita|tzatziki|kulfi|dulce de leche|cajeta|junket|clabber|ranch dressing`;
const DAIRY_INGREDIENT = new RegExp(
  NOT_DAIRY_FREE +
    "(?:" +
    String.raw`\b(?:${DAIRY_WORDS})\b` +
    String.raw`|\bromano\b(?! beans?\b)|(?<!\balabama )\bwhite sauce\b|\b(?:sliced|shredded|grated) swiss\b|^swiss$` +
    ")",
  "i",
);
// Rows that are not dairy although they carry one of the words above.
const DAIRY_LOOKALIKE =
  /\bbalsamic crema\b|\bcrema di balsamico\b|\bcustard (?:apples?|cups?|squash)\b|\bwater kefir\b|\b(?:soy ?)?bean curds?\b/gi;
const DAIRY_STEP = new RegExp(
  NOT_DAIRY_FREE +
    "(?:" +
    String.raw`\b(?:${DAIRY_WORDS}|milk|buttermilk|(?<!\bhead ?)cheese(?! ?(?:cloth|grater|knife|plane)\b)|sour cream|whipped cream|ice cream|parmesan|mozzarella|cheddar|ricotta|feta|yogh?urt|ghee)\b` +
    // "cream" the noun, not the verb ("cream the shortening", "cream until light").
    String.raw`|\bcream\b(?![- ](?:the|together|until|well|thoroughly|it|them|of tartar|of wheat|colou?red|soda|sherry|crackers)\b)` +
    String.raw`|(?<!\b(?:peanut|nut|apple|cocoa|shea|sun|almond|cashew|seed) )\bbutter\b(?![- ](?:beans?|lettuce|squash|muslin|paper)\b)` +
    String.raw`|(?<!\b(?:alabama|the) )\bwhite sauce\b` +
    // "Buttered toast", "well buttered" and "buttering the dish" are butter, but a buttered
    // mould, dish, pan or platter is only greased (hill-0002, so-coconut-pralines stay safe).
    String.raw`|\bbuttered\b(?![- ](?:mou?lds?|dish(?:es)?|pans?|tins?|platters?|paper|baking|pudding|sheets?|cups?|casseroles?|ramekins?|bowls?|forms?)\b)|\bbuttering\b` +
    String.raw`|\bcreamy gravy\b|\bcream gravy\b` +
    ")",
  "i",
);
// Polisher boilerplate that turns up in recipes with no cheese in them, and
// custard used as a texture or a dish.
const DAIRY_STEP_LOOKALIKE =
  /\bspoon any sauce or cheese over the top\b|\buntil the cheese runs\b|\bconsistency of (?:a )?custard\b|\blike (?:a )?(?:soft |thick )?custard\b|\bcustard (?:or muffin )?cups?\b|\bcolou?r of (?:peanut )?butter\b/gi;

const NUT_FREE = /\b(?:tree[- ])?nuts?[- ]free\b/i;
const NUT_INGREDIENT = new RegExp(
  String.raw`(?<!\b(?:water|chinese water) )\bchestnuts?\b(?! mushrooms?\b)` +
    String.raw`|(?<!\b(?:litchi|lichee|lychee|tiger|kola|cola|betel|areca|water|size of a) )\bnuts?\b(?![- ]?(?:free|brown|of butter)\b)` +
    String.raw`|\b(?:nut ?meats?|nutmeats?|filberts?|brazil nuts?|groundnuts?|praline|pralines|marzipan|frangipane|nougat|nutella|gianduja|amaretti|turr[oó]n|torrone|orgeat|frangelico|nocino|baklava|dukkah|pignoli|pignolia|pi[nñ]on nuts?)\b` +
    String.raw`|(?<!\bcoconut )\bmacaroons?\b|(?<!\bnut[- ]free )\bpesto\b|\bmole (?:paste|sauce|poblano|negro|concentrate)\b|\bsatay sauce\b|\b(?:panang|penang)\b`,
  "i",
);
const NUT_STEP = new RegExp(
  String.raw`(?<!\b(?:water|litchi|lichee|lychee|tiger) )\b(?:nuts|nut ?meats|nutmeats|chestnuts)\b(?![- ]?(?:free|brown)\b)` +
    String.raw`|\bput a nut\b|\bmacaroons?\b(?<!\bcoconut macaroons?)|\b(?:panang|penang)\b`,
  "i",
);

const SHELLFISH_FREE = /\bshellfish[- ]free\b|\bshrimp[- ]free\b|\b(?:vegan|vegetarian)\b|\b(?:no|without) (?:shrimp|shellfish)\b/i;
const SHELLFISH_INGREDIENT =
  /(?<!\b(?:imitation|vegan|mock) )\b(?:langoustines?|langostinos?|scampi|squid|calamari|octopus|cuttlefish|cockles?|whelks?|abalone|conch|periwinkles?|sea urchins?|krill|crawdads?|[ée]crevisses?|frutti di mare|shellfish|quahogs?|geoducks?|xo sauce|razor clams?)\b|\bcurry paste\b|\b(?:massaman|panang|penang|laksa|khao soi|rendang|tom yum) paste\b|\b(?:kimchi|kimchee)\b/i;
const SHELLFISH_STEP = new RegExp(
  String.raw`(?<!\b(?:imitation|vegan|mock) )\b(?:shrimps?|prawns?|crab ?meat|crabs?|lobsters?|clams?|mussels?|scallops?|oysters?|crawfish|crayfish|squid|calamari|octopus|shellfish)\b` +
    String.raw`(?![- ](?:sized|shaped|mushrooms?|sauce|plant|crackers|apples?|shell)\b)`,
  "i",
);
const SHELLFISH_STEP_LOOKALIKE = /\bscallop(?:ed|ini|s)? (?:edges?|the edges?)\b|\bcrab apples?\b/gi;

// Spicy: chili-based pastes and sauces, clearly hot peppers, and the pungent
// roots (horseradish, wasabi). Not sweet or smoked paprika, bell peppers,
// pimiento, poblano, ancho, pepperoncini, curry powder or Japanese curry roux.
const SPICY_INGREDIENT = new RegExp(
  String.raw`(?<!\bjam[oó]n )\b(?:serranos?(?! ham\b)|tabasco|tobasco|chilli|chillies|bird'?s[- ]eye|piri[- ]piri|peri[- ]peri|pili[- ]pili|gochugaru|korean red pepper|ssamjang|doubanjiang|toban ?djan|sambal|nduja|zhug|zhoug|schug|guajillos?|aleppo|[aá]rbol|pequ[ií]n|piqu[ií]n|ghost peppers?|bhut jolokia|cajun|creole seasoning|horseradish|wasabi|hot paprika|hot mustard|chinese mustard|hot peppers?|hot curry|buffalo sauce|wing sauce|frank'?s red ?hot|cholula|valentina|tapat[ií]o|crushed red pepper|ground red pepper)\b|\bred pepper \(cayenne\)` +
    String.raw`|(?<!\b(?:white|water|baek|mild|non-spicy) )\b(?:kimchi|kimchee)\b|\bjerk (?:seasoning|paste|marinade|sauce|rub)\b` +
    String.raw`|\b(?:curry|massaman|panang|penang|laksa|rendang|tom yum|vindaloo|khao soi) paste\b`,
  "i",
);
// A spoonful, pinch or dash of plain "red pepper" is ground cayenne; a whole one
// (no unit, or by the cup or tablespoon) is the vegetable.
const RED_PEPPER_ROW = /^(?:ground |dried )?red pepper$/i;
const SPOON_UNIT = /^(?:tsp|teaspoons?|teaspoonfuls?|saltspoons?|saltspoonfuls?|pinch(?:es)?|dash(?:es)?|grains?|specks?|few grains)$/i;
const SPICY_STEP = new RegExp(
  String.raw`\b(?:tabasco|tobasco|cayenne|chil(?:i|e|li)(?:e?s)?|jalape[nñ]os?|horseradish|wasabi|crushed red pepper|red pepper flakes|harissa|sriracha|gochujang|gochugaru|chipotles?|habaneros?|scotch bonnets?|curry paste)\b` +
    String.raw`|\b(?:salt and|teaspoonfuls? of|teaspoons? of|tsp\.? of|pinch of|dash of) red pepper\b`,
  "i",
);

type Row = Recipe["ingredients"][number];
const strip = (re: RegExp, s: string) => s.replace(re, " ");

// Descriptions carry what the cataloguer meant ("a little peanut", "chicken or shrimp",
// "Spicy vegetable relish"), so every allergen reads them with its method words.
const NUT_WORDS = /\b(?:peanuts?|almonds?|walnuts?|pecans?|cashews?|pistachios?|hazelnuts?|macadamias?|pine nuts?)\b/i;
const SPICY_DESC = /(?<!\b(?:not|non|no|never|less|mild)[- ])\bspicy\b/i;
const HTCF_SHELLFISH_BY_ID = new Set(["htcf-1024"]); // "the sauce given for Baked Trout with Mushroom Sauce" (oyster liquor, oysters, shrimps)

const BEYOND_NAMES: Partial<Record<AllergyId, (recipe: Recipe) => boolean>> = {
  gluten: glutenBeyondNames,
  dairy: (r) =>
    r.ingredients.some((i: Row) => !/\b(?:dairy[- ]free|non[- ]dairy|vegan|plant[- ]based)\b/i.test(i.name) && DAIRY_INGREDIENT.test(strip(DAIRY_LOOKALIKE, i.name).trim())) ||
    (r.steps ?? []).some((s) => DAIRY_STEP.test(strip(DAIRY_STEP_LOOKALIKE, s))) ||
    (!/\b(?:dairy[- ]free|non[- ]dairy|vegan)\b/i.test(descText(r)) && DAIRY_STEP.test(strip(DAIRY_STEP_LOOKALIKE, descText(r)))),
  nuts: (r) =>
    r.ingredients.some((i: Row) => !NUT_FREE.test(i.name) && NUT_INGREDIENT.test(i.name)) ||
    (r.steps ?? []).some((s) => NUT_STEP.test(s)) ||
    (!NUT_FREE.test(descText(r)) && [NUT_WORDS, NUT_INGREDIENT, NUT_STEP].some((re) => re.test(descText(r)))),
  shellfish: (r) =>
    HTCF_SHELLFISH_BY_ID.has(r.id) ||
    r.ingredients.some((i: Row) => !SHELLFISH_FREE.test(i.name) && SHELLFISH_INGREDIENT.test(i.name)) ||
    (r.steps ?? []).some((s) => SHELLFISH_STEP.test(strip(SHELLFISH_STEP_LOOKALIKE, s))) ||
    (!SHELLFISH_FREE.test(descText(r)) &&
      (SHELLFISH_STEP.test(strip(SHELLFISH_STEP_LOOKALIKE, descText(r))) || SHELLFISH_INGREDIENT.test(descText(r)))),
  spicy: (r) =>
    r.ingredients.some((i: Row) => SPICY_INGREDIENT.test(i.name) || (RED_PEPPER_ROW.test(i.name.trim()) && SPOON_UNIT.test((i.unit ?? "").trim()))) ||
    (r.steps ?? []).some((s) => SPICY_STEP.test(s)) ||
    [SPICY_STEP, SPICY_INGREDIENT, SPICY_DESC].some((re) => re.test(descText(r))),
};

// Follow-up. Rows the gluten check reads as gluten-free forms, for the shield as the badge already does:
// a row that is exactly corn / masa / gluten-free tortillas or almond flour (flour tortillas, "tortillas",
// "corn tortillas or flour tortillas", masa harina and everything else still fail), and, in the Crisco
// book only, a row that is the title of the book's own gluten-free dressing / marinade recipe.
const GF_FORM_ROW = /^(?:(?:corn|masa|gluten[- ]free|gf) tortillas?|(?:blanched |super[- ]?fine )?almond flour)$/i;
export const CRIS_OWN_RECIPE_TITLES = new Set([
  "poppy seed fruit salad dressing", // cris-047
  "fruit salad dressing", // cris-025
  "green goddess salad dressing", // cris-028
  "italian dressing", // cris-036
  "mild garlic marinade", // cris-043
]);
const isOwnTitleRow = (id: string, n: string) =>
  id.startsWith("cris-") && n.trim().length > 0 && n.trim().toLowerCase().split(/ or /).every((p) => CRIS_OWN_RECIPE_TITLES.has(p.trim()));
// A printed row that says rice noodle(s) clears the word "noodle" (only the one right after "rice": wheat, egg and bare
// "noodles" rows, or "rice noodles or egg noodles", keep their noodle). Rice vermicelli is already cleared by "rice".
const RICE_NOODLES = /\brice noodles?\b/gi;
function glutenView(recipe: Recipe): Recipe {
  let changed = false;
  const ingredients = recipe.ingredients.map((i) => {
    const printed = (i as { raw?: string }).raw ?? i.name;
    if (/\brice noodles?\b/i.test(printed)) {
      const name = /^noodles?$/i.test(i.name.trim()) ? "rice" : i.name.replace(RICE_NOODLES, "rice");
      changed = true; return { ...i, name, raw: printed };
    }
    if (GF_FORM_ROW.test(i.name.trim()) || GF_FORM_ROW.test(printed.trim())) { changed = true; return { ...i, name: "gf", raw: printed }; }
    if (isOwnTitleRow(recipe.id, printed)) { changed = true; return { ...i, name: "book recipe row", raw: printed }; }
    return i;
  });
  return changed ? { ...recipe, ingredients } : recipe;
}

export function recipeAllergens(input: Recipe): AllergyId[] {
  // Catalog-final recipes: printed rows plus the foods the row adder would have
  // listed (never shown), so the bypass cannot clear an allergen.
  const recipe = withDietScreen(input);
  // Pipe-joined so a pattern cannot span two rows: "grated coconut" next to
  // "butter" is not coconut butter, and "short-grain rice" next to "milk" is
  // not rice milk.
  const blobOf = (r: Recipe) => [r.name, ...r.tags, ...r.ingredients.map((i) => i.name)].join(" | ");
  const blob = blobOf(recipe);
  const gv = glutenView(recipe);
  return ALLERGIES.map((a) => a.id).filter((id) => {
    const r = id === "gluten" ? gv : recipe;
    return PATTERNS[id].test(id === "gluten" ? blobOf(gv) : blob) || (BEYOND_NAMES[id]?.(r) ?? false);
  });
}

export function recipeSafe(recipe: Recipe, allergies: AllergyId[]): boolean {
  if (allergies.length === 0) return true;
  const has = new Set(recipeAllergens(recipe));
  return !allergies.some((a) => has.has(a));
}

export function proteinDot(protein?: Protein): string {
  switch (protein) {
    case "chicken":
      return "bg-food-yolk";
    case "beef":
      return "bg-food-tomato";
    case "lamb":
      return "bg-food-char";
    case "pork":
      return "bg-food-salmon";
    case "fish":
      return "bg-food-leaf";
    case "seafood":
      return "bg-food-herb";
    case "veg":
      return "bg-food-leaf";
    case "eggs":
      return "bg-food-cream";
    case "turkey":
      return "bg-food-crust";
    default:
      return "bg-muted";
  }
}

export function proteinLabel(protein?: Protein): string {
  if (!protein) return "mix";
  if (protein === "veg") return "veg";
  return protein;
}

const COST: Record<Protein, number> = {
  chicken: 14,
  beef: 20,
  lamb: 24,
  pork: 13,
  fish: 18,
  seafood: 22,
  veg: 9,
  eggs: 8,
  turkey: 15,
};

export function plateCost(recipe: Recipe, household: number): number {
  const base = COST[recipe.protein] + recipe.ingredients.length * 0.45;
  const scaled = base * (household / Math.max(1, recipe.servings));
  return Math.round(scaled * 2) / 2;
}

/** What the same plate would run at a restaurant or takeout counter — roughly 2x grocery cost. */
const TAKEOUT_COST: Record<Protein, number> = {
  chicken: 30,
  beef: 42,
  lamb: 50,
  pork: 28,
  fish: 38,
  seafood: 46,
  veg: 20,
  eggs: 18,
  turkey: 32,
};

export function takeoutCost(recipe: Recipe, household: number): number {
  const base = TAKEOUT_COST[recipe.protein];
  const scaled = base * (Math.max(1, household) / Math.max(1, recipe.servings));
  return Math.round(scaled * 2) / 2;
}

/** Estimated dollars saved by cooking this plate instead of ordering it in. */
export function mealSavings(recipe: Recipe, household: number): number {
  return Math.max(0, takeoutCost(recipe, household) - plateCost(recipe, household));
}

export const SNACKS: { name: string; nutrition: Nutrition }[] = [
  { name: "Eggs", nutrition: { cal: 180, protein: 12, carbs: 1, fat: 14 } },
  { name: "Greek yogurt", nutrition: { cal: 150, protein: 15, carbs: 8, fat: 4 } },
  { name: "Protein shake", nutrition: { cal: 160, protein: 25, carbs: 6, fat: 2 } },
  { name: "Cottage cheese", nutrition: { cal: 180, protein: 20, carbs: 8, fat: 5 } },
  { name: "Protein bar", nutrition: { cal: 210, protein: 20, carbs: 22, fat: 7 } },
];

export function skipTitle(skip?: PlannedMeal["skip"]): string {
  if (skip === "takeout") return "Eating out";
  if (skip === "rest") return "Night off";
  return "No dinner planned";
}
