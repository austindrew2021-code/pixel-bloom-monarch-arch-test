import type { Aisle, Recipe } from "./types";

/**
 * Steps match the list.
 *
 * A cook step is allowed to name a food only if the ingredient rows carry it,
 * because Shop-from-plan is built from those rows: a step that says "whisk in
 * baking powder" against a list that never mentions baking powder sends a 5pm
 * parent to the store for flour and home without the leavener.
 *
 * The catalogs are the first line — a title whose author left the sugar off is
 * fixed in the catalog. This pass is the floor under all 1539 wired titles: it
 * runs after the method is polished, so it also catches foods the polisher
 * itself names ("a film of oil", "spoon over hot cooked rice") on a list that
 * never had them.
 */

type Pantry = { name: string; qty: number; unit: string; aisle: Aisle };

type ListFix = {
  /** The food as a step names it. */
  named: RegExp;
  /** Same letters, different food — stripped before `named` is tried. */
  notNamed?: RegExp;
  /** An ingredient row that already covers the mention. */
  covered: RegExp;
  /** What goes on the list when nothing covers it. */
  add: Pantry;
  /** Diets this food would break. The step is left alone rather than lie. */
  breaks?: readonly string[];
  /** The dish makes this food itself, so there is nothing to buy. */
  madeHere?: (recipe: Recipe) => boolean;
};

/** A loaf the cook bakes from the flour already on the list is not a shopping line. */
function bakesItsOwnBread(recipe: Recipe): boolean {
  const steps = recipe.steps.join(" ").toLowerCase();
  if (!/\bdough\b|\bbatter\b|\bknead\b/.test(steps)) return false;
  return recipe.ingredients.some((i) => /\bflour\b|\bcornmeal\b|\bmasa\b/i.test(i.name));
}

const VEGAN = ["vegan", "plant-based", "dairy-free"] as const;
const NO_MEAT = ["vegan", "plant-based", "vegetarian"] as const;

/**
 * Only foods a shopper can actually be sent for. Vague method words ("the
 * spices", "the greens", "a little liquid") stay out — they name a role, not a
 * thing to buy.
 */
const LIST_FIXES: readonly ListFix[] = [
  {
    named: /\bsalt(?:ed|ing)?\b/i,
    notNamed: /\bunsalted\b|\bsalt pork\b|\bsalt cod\b|\bsalted butter\b|\bsalt and pepper of\b/i,
    covered: /\bsalt\b/i,
    add: { name: "salt", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
  },
  {
    named: /\bolive oil\b/i,
    covered: /\bolive oil\b/i,
    add: { name: "olive oil", qty: 2, unit: "tbsp", aisle: "Pantry" },
  },
  {
    named: /\boil\b/i,
    notNamed: /\bolive oil\b|\boil of\b/i,
    covered: /\boil\b|\bdrippings?\b|\blard\b|\bshortening\b|\bbacon fat\b|\bghee\b|^fat$|\bsuet\b|\btallow\b/i,
    add: { name: "oil", qty: 2, unit: "tbsp", aisle: "Pantry" },
  },
  {
    named: /\bbutter(?:ed|y)?\b/i,
    notNamed: /\bbutter(?:milk|nut)\b|\bpeanut butter\b|\balmond butter\b|\bapple butter\b|\bcocoa butter\b|\bnut butter\b|\bbutter beans?\b|\bbutter lettuce\b/i,
    covered: /\bbutter\b/i,
    add: { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
    breaks: VEGAN,
  },
  {
    named: /\bmilk\b/i,
    // "the colour of milk chocolate" is a description of a roux, not a dairy
    // row. It was putting a cup of milk into the gumbo.
    notNamed: /\b(coconut|almond|oat|soy|evaporated|condensed|butter)milk\b|\bcoconut milk\b|\balmond milk\b|\boat milk\b|\bsoy milk\b|\bevaporated milk\b|\bcondensed milk\b|\bmilk chocolate\b|\bmilk bread\b/i,
    covered: /\bmilk\b|\bcream\b|\bhalf.and.half\b/i,
    add: { name: "milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
    breaks: VEGAN,
  },
  {
    named: /\beggs?\b/i,
    notNamed: /\beggplants?\b|\begg noodles?\b/i,
    covered: /\beggs?\b|\byolks?\b|\bwhites?\b|\bmayonnaise\b/i,
    add: { name: "egg", qty: 1, unit: "", aisle: "Dairy & Eggs" },
    breaks: ["vegan", "plant-based"],
  },
  {
    named: /\bflour\b/i,
    notNamed: /\b(almond|coconut|chickpea|rice|corn|cassava|rye|oat|bread|cake|pastry|semolina|buckwheat|masa) flour\b|\bflour the\b/i,
    covered: /\bflour\b|\bbisquick\b|\bpancake mix\b/i,
    add: { name: "flour", qty: 0.5, unit: "cup", aisle: "Pantry" },
  },
  {
    named: /\bbrown sugar\b/i,
    covered: /\bbrown sugar\b|\bmuscovado\b|\bdemerara\b/i,
    add: { name: "brown sugar", qty: 0.25, unit: "cup", aisle: "Pantry" },
  },
  {
    named: /\bsugars?\b/i,
    notNamed: /\bbrown sugar\b|\bsugar snap\b|\bsugar pumpkin\b|\bicing sugar\b|\bpowdered sugar\b|\bsugar-free\b/i,
    covered: /\bsugar\b|\bhoney\b|\bmolasses\b|\bmaple syrup\b|\bcorn syrup\b|\bdark syrup\b|\bagave\b/i,
    add: { name: "sugar", qty: 0.25, unit: "cup", aisle: "Pantry" },
  },
  {
    named: /\bbaking powder\b/i,
    covered: /\bbaking powder\b|\bself.rising\b|\bbisquick\b|\bpancake mix\b/i,
    add: { name: "baking powder", qty: 2, unit: "tsp", aisle: "Pantry" },
  },
  {
    named: /\bbaking soda\b|\bsoda\b/i,
    notNamed: /\bclub soda\b|\bsoda water\b|\bbaking powder\b|\bsoda bread\b|\bcream soda\b/i,
    covered: /\bbaking soda\b|\bsaleratus\b|\bself.rising\b/i,
    add: { name: "baking soda", qty: 1, unit: "tsp", aisle: "Pantry" },
  },
  {
    named: /\bcream of tartar\b/i,
    covered: /\bcream of tartar\b/i,
    add: { name: "cream of tartar", qty: 1, unit: "tsp", aisle: "Pantry" },
  },
  {
    named: /\bvanilla\b/i,
    covered: /\bvanilla\b/i,
    add: { name: "vanilla", qty: 1, unit: "tsp", aisle: "Pantry" },
  },
  {
    named: /\bcorn ?starch\b|\bpotato starch\b|\bstarch\b/i,
    notNamed: /\bstarchy\b|\bstarch is how\b/i,
    covered: /starch\b|\barrowroot\b|\btapioca\b|\bflour\b/i,
    add: { name: "cornstarch", qty: 1, unit: "tbsp", aisle: "Pantry" },
  },
  {
    named: /\bpanko\b/i,
    covered: /\bpanko\b|\bbread ?crumbs?\b|\bcracker crumbs\b/i,
    add: { name: "panko", qty: 1, unit: "cup", aisle: "Bakery" },
  },
  {
    // The verb "to rice" (rice the potatoes, rice the yolks) is not the grain.
    named: /\brice\b/i,
    notNamed: /\brice (?:noodles?|cakes?|flour|vinegar|wine|paper|wraps?|krispies)\b|\brice\s+(?:the|them|it)\b|\brice and squeeze\b|\briced\b/i,
    covered: /\brice\b(?! (?:noodle|cake|flour|vinegar|wine|paper))|\bpaella\b|\brisotto\b|\bcongee\b/i,
    add: { name: "rice", qty: 1.5, unit: "cups", aisle: "Pantry" },
  },
  {
    named: /\bcouscous\b/i,
    covered: /\bcouscous\b/i,
    add: { name: "couscous", qty: 1.5, unit: "cups", aisle: "Pantry" },
  },
  {
    named: /\bbread\b/i,
    notNamed: /\bbread ?crumbs?\b|\bbread(?:ing|ed)\b|\b(?:corn|short|ginger|flat|sweet|spoon|soda|banana|monkey|quick)bread\b|\bbread flour\b|\bbread pudding\b|\bbread machine\b/i,
    covered: /\bbread\b|\btoast\b|\bbaguette\b|\broll?s?\b|\bbun\b|\bpita\b|\bnaan\b|\bsourdough\b|\btortillas?\b|\binjera\b|\bbiscuits?\b|\bchallah\b|\bbrioche\b|\bfocaccia\b|\bcrackers?\b|\bmuffins?\b|\bcroissants?\b/i,
    add: { name: "bread", qty: 4, unit: "slices", aisle: "Bakery" },
    madeHere: bakesItsOwnBread,
  },
  {
    named: /\bonions?\b/i,
    notNamed: /\bgreen onions?\b|\bspring onions?\b|\bonion (?:powder|juice|salt)\b/i,
    covered: /\bonions?\b|\bshallots?\b|\bleeks?\b|\bsofrito\b|\bmirepoix\b/i,
    add: { name: "onion", qty: 1, unit: "", aisle: "Produce" },
  },
  {
    named: /\bgarlic\b/i,
    notNamed: /\bgarlic (?:powder|salt)\b|\bgarlic scapes?\b/i,
    covered: /\bgarlic\b|\bsofrito\b|\bgarlic paste\b/i,
    add: { name: "garlic", qty: 3, unit: "cloves", aisle: "Produce" },
  },
  {
    named: /\bscallions?\b|\bgreen onions?\b/i,
    covered: /\bscallions?\b|\bgreen onions?\b|\bspring onions?\b|\bchives\b/i,
    add: { name: "scallions", qty: 3, unit: "", aisle: "Produce" },
  },
  {
    named: /\btomatoe?s?\b/i,
    notNamed: /\btomato (?:paste|sauce|juice|puree|purée|salad|soup|salsa)\b|\bsun.?dried tomatoe?s?\b|\btomatillos?\b/i,
    covered: /\btomatoe?s?\b|\bpassata\b|\bmarinara\b|\bsalsa\b|\bketchup\b/i,
    add: { name: "tomato", qty: 2, unit: "", aisle: "Produce" },
  },
  {
    named: /\bcelery\b/i,
    notNamed: /\bcelery (?:seed|salt)\b/i,
    covered: /\bcelery\b|\bmirepoix\b/i,
    add: { name: "celery", qty: 2, unit: "stalks", aisle: "Produce" },
  },
  {
    named: /\blemons?\b/i,
    notNamed: /\blemongrass\b|\blemon (?:balm|thyme|verbena)\b|\bpreserved lemons?\b/i,
    covered: /\blemons?\b|\blemon juice\b|\bpreserved lemon\b/i,
    add: { name: "lemon", qty: 1, unit: "", aisle: "Produce" },
  },
  {
    named: /\blimes?\b/i,
    notNamed: /\blime (?:leaf|leaves)\b|\bkaffir\b|\blimestone\b/i,
    covered: /\blimes?\b|\blime juice\b/i,
    add: { name: "lime", qty: 1, unit: "", aisle: "Produce" },
  },
  {
    named: /\bcilantro\b/i,
    covered: /\bcilantro\b|\bcoriander leaf\b|\bfresh coriander\b/i,
    add: { name: "cilantro", qty: 0.5, unit: "bunch", aisle: "Produce" },
  },
  {
    named: /\bthyme\b/i,
    covered: /\bthyme\b|\bherbes de provence\b|\bbouquet garni\b|\bitalian seasoning\b/i,
    add: { name: "thyme", qty: 0.5, unit: "tsp", aisle: "Herbs & Spices" },
  },
  {
    named: /\bcayenne\b/i,
    covered: /\bcayenne\b|\bred pepper flakes?\b|\bhot sauce\b|\bchili powder\b/i,
    add: { name: "cayenne", qty: 0.25, unit: "tsp", aisle: "Herbs & Spices" },
  },
  {
    named: /\bturmeric\b/i,
    covered: /\bturmeric\b|\bcurry powder\b|\bgaram masala\b/i,
    add: { name: "turmeric", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
  },
  {
    named: /\bfish sauce\b/i,
    covered: /\bfish sauce\b|\bnam pla\b|\banchov/i,
    add: { name: "fish sauce", qty: 1, unit: "tbsp", aisle: "Pantry" },
    breaks: NO_MEAT,
  },
  {
    named: /\balmonds?\b/i,
    notNamed: /\balmond (?:flour|milk|extract|butter|paste)\b/i,
    covered: /\balmonds?\b/i,
    add: { name: "almonds", qty: 0.5, unit: "cup", aisle: "Pantry" },
  },
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The steps with the dish's own title taken out. "Serve banana bread warm" names
 * the thing being cooked, not a loaf to buy, and the same goes for a rice
 * croquette or a butter tart.
 */
function cookedText(recipe: Recipe): string {
  const title = recipe.name.trim();
  const joined = recipe.steps.join(" ⁋ ");
  if (title.length < 3) return joined;
  return joined.replace(new RegExp(escapeRe(title), "gi"), " the dish ");
}

/**
 * "There is no flour in this batter" is a promise the recipe makes, not a row
 * to buy. It put half a cup of flour into the three-ingredient flourless
 * pancakes. Two words after the negator is enough to swallow the food itself
 * without eating the rest of the sentence.
 */
const NEGATED = /\b(?:no|without|never)\s+[\w-]+(?:\s+[\w-]+)?|\bnot\s+(?:add|use|put|include|contain)\s+[\w-]+/gi;

/**
 * A food can be named as a measure, a simile, or a piece of furniture and still
 * not be an ingredient. Gentile's balsamella asks for "a piece of butter as big
 * as an egg" and her gnocchi are rolled out on a "bread board" — which bought
 * this catalog one egg and four slices of bread. A batter "of the consistency
 * of milk" bought a cup of milk the same way. Strip the figure of speech
 * before asking whether the food was named, the same way NEGATED strips a
 * denial.
 */
const FIGURES = /\bas (?:big|large|thick|small|round|thin) as an? [\w-]+|\bthe (?:size|consistency|thickness|colour|color) of (?:an? )?[\w-]+|\b(?:bread|pastry|cutting|chopping|carving) board\b|\begg(?:-| )sized\b|\bpea(?:-| )sized\b/gi;

function namesFood(steps: string, fix: ListFix): boolean {
  const said = steps.replace(NEGATED, " ").replace(FIGURES, " ");
  const blob = fix.notNamed ? said.replace(new RegExp(fix.notNamed.source, "gi"), " ") : said;
  return fix.named.test(blob);
}

function isCovered(recipe: Recipe, fix: ListFix): boolean {
  return recipe.ingredients.some((i) => fix.covered.test(i.name.toLowerCase()));
}

/** Foods this recipe's own diet tags forbid. Adding one would make the tag a lie. */
function forbidden(recipe: Recipe, fix: ListFix): boolean {
  if (!fix.breaks) return false;
  const tags = recipe.tags ?? [];
  return fix.breaks.some((t) => tags.includes(t));
}

/**
 * Puts every food the polished method names onto the ingredient rows. Returns
 * the same object when the list already covers the method.
 */
export function alignListToCook(recipe: Recipe): Recipe {
  const steps = cookedText(recipe);
  const extra: Pantry[] = [];
  for (const fix of LIST_FIXES) {
    if (!namesFood(steps, fix)) continue;
    if (isCovered(recipe, fix)) continue;
    if (extra.some((e) => fix.covered.test(e.name))) continue;
    if (forbidden(recipe, fix)) continue;
    if (fix.madeHere?.(recipe)) continue;
    extra.push(fix.add);
  }
  if (extra.length === 0) return recipe;
  return { ...recipe, ingredients: [...recipe.ingredients, ...extra] };
}

/**
 * Foods a step names that the ingredient rows do not carry. Empty for every
 * wired title — the alignment test walks the whole catalog with this.
 */
export function unlistedFoodsInSteps(recipe: Recipe): string[] {
  const steps = cookedText(recipe);
  return LIST_FIXES.filter(
    (fix) => namesFood(steps, fix) && !isCovered(recipe, fix) && !forbidden(recipe, fix) && !fix.madeHere?.(recipe),
  ).map((fix) => fix.add.name);
}
