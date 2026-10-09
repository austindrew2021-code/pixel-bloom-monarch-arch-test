import type { AllergyId, Nutrition, PlannedMeal, Protein, Recipe } from "./types";

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
const NOT_GF = String.raw`(?<!\b(?:gluten[- ]free|gf|rice|corn|almond|chickpea|cassava|tapioca|buckwheat)[- ](?:\w+[- ])?)`;
const GLUTEN_INGREDIENT = new RegExp(
  NOT_GF +
    "(?:" +
    String.raw`\b(?:linguine|fettuccine|fettuccini|tagliatelle|pappardelle|bucatini|rigatoni|ziti|rotini|fusilli|farfalle|orecchiette|ditalini|cavatappi|gemelli|vermicelli|ravioli|tortellini|tortelloni|manicotti|cannelloni|gnocchi|spaetzle|baguettes?|ciabatta|focaccia|brioche|croissants?|challah|crostini|sourdough|pumpernickel|zwieback|hardtack|rolls|toast|sippets|crumbs|saltines?|graham|gingersnaps?|cookies?|wafers?|lady[- ]?fingers|matzo|matzah|matzoh|lager|stout|malt|malted|oats|oatmeal|muffins?|waffles?|freekeh|kamut|einkorn|triticale|durum|farina|shoyu|pierogi|pierogies|perogies|panettone|cornflakes|cheerioats)\b` +
    String.raw`|(?<!\broot )\bbeer\b|(?<!\bginger )\bale\b` +
    String.raw`|\b(?:sponge|pound|layer|coffee|service|angel food|chiffon|sheet)[- ]cake\b|\bcake[- ](?:mix|crumbs|batter)\b|^cake$` +
    String.raw`|\b(?:pie|puff|plain|short)[- ]paste\b|\bpie[- ]crust\b|^crust$|\b(?:tart|pie|pastry|patty) shells?\b|\bpancake (?:batter|mix)\b` +
    String.raw`|\b(?:french|italian|bread|sandwich|sourdough|white|rye|wheat) loa(?:f|ves)\b|\bcorn flakes\b|\bempanada (?:discs|dough|wrappers|shells)\b|^soy$` +
    String.raw`|\bgravy\b|\b(?:egg|fritter|frying) batter\b|\b(?:chinese|japanese|chop suey) sauce\b|\bfiggy duff\b|\b(?:frozen|cooked|prepared|store-bought) meatballs\b` +
    String.raw`|(?<!\balabama )\bwhite sauce\b|\bcream sauce\b|\bb[eé]chamel\b|\broux\b` +
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
    ")",
  "i",
);

const LABELLED_GF = /\bgluten[- ]free\b|\bgf\b/i;

/** Gluten in an ingredient row or a step that the name-and-tag check misses. */
function glutenBeyondNames(recipe: Recipe): boolean {
  return (
    // A row that labels itself gluten-free ("angel food cake (gluten-free)"; diet.ts
    // leaves "gf" where it said so) is taken at its word by these extra words.
    recipe.ingredients.some((i) => !LABELLED_GF.test(i.name) && GLUTEN_INGREDIENT.test(i.name.trim())) ||
    (recipe.steps ?? []).some((s) => GLUTEN_STEP.test(s))
  );
}

export function recipeAllergens(recipe: Recipe): AllergyId[] {
  // Pipe-joined so a pattern cannot span two rows: "grated coconut" next to
  // "butter" is not coconut butter, and "short-grain rice" next to "milk" is
  // not rice milk.
  const blob = [recipe.name, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)].join(" | ");
  return ALLERGIES.map((a) => a.id).filter(
    (id) => PATTERNS[id].test(blob) || (id === "gluten" && glutenBeyondNames(recipe)),
  );
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
