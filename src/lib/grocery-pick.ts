import type { Aisle } from "./types.ts";
import { productSearchUrl, type StoreBrand } from "./grocery-stores.ts";
import { STAPLES, type StapleProduct } from "./grocery-staples.ts";

export type CartNeed = {
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
  fromPantry?: boolean;
};

export type GroceryPick = {
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
  query: string;
  pickName: string;
  pickSize: string;
  packs: number;
  pickCad: number;
  addUrl: string;
  why: string;
  matched: boolean;
};

export type StoreOption = {
  id: string;
  name: string;
  brandLabel: string;
  sizeLabel: string;
  priceCad: number;
  packs: number;
  totalCad: number;
  unitHint: string;
  imageUrl: string;
  addUrl: string;
  inStock: boolean;
  why: string;
  live: boolean;
};

const OZ_G = 28.35;
const LB_G = 453.6;
const CUP_ML = 240;

const COUNT_UNITS = new Set([
  "",
  "ea",
  "each",
  "ct",
  "count",
  "clove",
  "cloves",
  "bunch",
  "bunches",
  "item",
  "items",
  "jar",
  "jars",
  "can",
  "cans",
  "bottle",
  "bottles",
  "box",
  "boxes",
  "bag",
  "bags",
  "pack",
  "packs",
  "pkg",
  "head",
  "heads",
]);

export function pickKey(item: { name: string; pickName: string; pickSize: string }): string {
  return `${item.name}::${item.pickName}::${item.pickSize}`;
}

export function needMassG(qty: number, unit: string, gramsPerCup?: number): number | null {
  const u = (unit || "").trim().toLowerCase();
  const q = Math.abs(qty) || 0;
  if (!q) return null;
  if (u === "g" || u === "gram" || u === "grams") return q;
  if (u === "kg" || u === "kilogram" || u === "kilograms") return q * 1000;
  if (u === "oz" || u === "ounce" || u === "ounces") return q * OZ_G;
  if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds") return q * LB_G;
  if ((u === "cup" || u === "cups") && gramsPerCup) return q * gramsPerCup;
  if ((u === "tbsp" || u === "tablespoon" || u === "tablespoons") && gramsPerCup) return (q / 16) * gramsPerCup;
  return null;
}

export function needVolumeMl(qty: number, unit: string): number | null {
  const u = (unit || "").trim().toLowerCase();
  const q = Math.abs(qty) || 0;
  if (!q) return null;
  if (u === "ml" || u === "milliliter" || u === "millilitre") return q;
  if (u === "l" || u === "liter" || u === "litre" || u === "liters" || u === "litres") return q * 1000;
  if (u === "cup" || u === "cups") return q * CUP_ML;
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons") return q * 15;
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return q * 5;
  return null;
}

export function needEach(qty: number, unit: string): number | null {
  const u = (unit || "").trim().toLowerCase();
  if (COUNT_UNITS.has(u)) return Math.max(1, Math.ceil(Math.abs(qty) || 1));
  return null;
}

type Cover = { packs: number; totalCad: number; leftover: number };

export function coverWith(product: StapleProduct, need: CartNeed, gramsPerCup?: number): Cover | null {
  const price = product.priceCad;
  const needG = needMassG(need.qty, need.unit, gramsPerCup);
  const needMl = needVolumeMl(need.qty, need.unit);
  const count = needEach(need.qty, need.unit);
  if (product.grams && needG != null && needG > 0) {
    const packs = Math.max(1, Math.ceil(needG / product.grams));
    return { packs, totalCad: roundMoney(packs * price), leftover: packs * product.grams - needG };
  }
  if (product.ml && needMl != null && needMl > 0) {
    const packs = Math.max(1, Math.ceil(needMl / product.ml));
    return { packs, totalCad: roundMoney(packs * price), leftover: packs * product.ml - needMl };
  }
  if (product.ml && count != null) {
    return { packs: count, totalCad: roundMoney(count * price), leftover: 0 };
  }
  if (product.each && count != null) {
    const packs = Math.max(1, Math.ceil(count / product.each));
    return { packs, totalCad: roundMoney(packs * price), leftover: packs * product.each - count };
  }
  // Fresh meat sold as 1 tray or per kg still covers a weighed recipe amount.
  if (product.each && needG != null && needG > 0) {
    return { packs: 1, totalCad: roundMoney(price), leftover: 0 };
  }
  // Extra-list items have no unit — one pack of the ingredient is enough.
  if (product.grams && count != null) {
    return { packs: 1, totalCad: roundMoney(price), leftover: 0 };
  }
  if (product.grams || product.ml) return null;
  return { packs: 1, totalCad: roundMoney(price), leftover: 0 };
}

export function rankEnough(
  need: CartNeed,
  products: StapleProduct[],
  gramsPerCup?: number,
  limit = 5,
): { product: StapleProduct; cover: Cover }[] {
  const scored = products
    .map((product) => {
      const cover = coverWith(product, need, gramsPerCup);
      return cover ? { product, cover } : null;
    })
    .filter((row): row is { product: StapleProduct; cover: Cover } => Boolean(row));
  scored.sort((a, b) => {
    if (a.cover.totalCad !== b.cover.totalCad) return a.cover.totalCad - b.cover.totalCad;
    if (a.cover.packs !== b.cover.packs) return a.cover.packs - b.cover.packs;
    return a.product.priceCad - b.product.priceCad;
  });
  return scored.slice(0, Math.max(1, limit));
}

export function pickCheapestEnough(
  need: CartNeed,
  products: StapleProduct[],
  gramsPerCup?: number,
): { product: StapleProduct; cover: Cover } | null {
  return rankEnough(need, products, gramsPerCup, 1)[0] ?? null;
}

export function parsePackageSizing(raw: string): {
  sizeLabel: string;
  unitHint: string;
  grams?: number;
  ml?: number;
  each?: number;
} {
  const text = raw.replace(/\s+/g, " ").trim();
  const [sizePart, hintPart] = text.split(",").map((s) => s.trim());
  const sizeLabel = sizePart || text;
  const unitHint = hintPart || "";
  const lower = sizeLabel.toLowerCase();
  const perKg = /\/\s*[\d.]*\s*kg\b/.test(lower) || lower.includes("/kg");
  const perLb = /\/\s*[\d.]*\s*lb\b/.test(lower) || lower.includes("/lb");
  if (perKg || perLb || /^\$/.test(sizeLabel)) {
    const per = perKg ? "per kg" : perLb ? "per lb" : sizeLabel;
    return { sizeLabel: per, unitHint: text, each: 1 };
  }
  const kg = lower.match(/^([\d.]+)\s*kg\b/);
  if (kg) return { sizeLabel, unitHint, grams: Number(kg[1]) * 1000 };
  const g = lower.match(/^([\d.]+)\s*g\b/);
  if (g) return { sizeLabel, unitHint, grams: Number(g[1]) };
  const l = lower.match(/^([\d.]+)\s*l\b/);
  if (l) return { sizeLabel, unitHint, ml: Number(l[1]) * 1000 };
  const ml = lower.match(/^([\d.]+)\s*ml\b/);
  if (ml) return { sizeLabel, unitHint, ml: Number(ml[1]) };
  const each = lower.match(/^([\d.]+)\s*(ea|ct|count|pk|pack)\b/);
  if (each) return { sizeLabel, unitHint, each: Math.max(1, Math.round(Number(each[1]))) };
  return { sizeLabel, unitHint };
}

export function matchStaple(name: string) {
  const q = normalizeKey(name);
  if (!q) return undefined;
  let best: (typeof STAPLES)[number] | undefined;
  let bestLen = 0;
  for (const staple of STAPLES) {
    for (const key of staple.keys) {
      const k = normalizeKey(key);
      if (!k) continue;
      if (q === k || q.includes(k)) {
        if (k.length > bestLen) {
          best = staple;
          bestLen = k.length;
        }
      }
    }
  }
  return best;
}

export function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "from",
  "of",
  "a",
  "an",
  "or",
  "to",
  "in",
  "on",
  "style",
  "pack",
  "club",
]);

/** Words that describe the same food (size, cut, brand, diet) — not a different food. */
const MODIFIERS = new Set([
  "size",
  "large",
  "extra",
  "medium",
  "small",
  "jumbo",
  "mini",
  "family",
  "club",
  "value",
  "fresh",
  "frozen",
  "raw",
  "dry",
  "dried",
  "whole",
  "half",
  "baby",
  "sweet",
  "yellow",
  "white",
  "red",
  "green",
  "brown",
  "black",
  "purple",
  "orange",
  "boneless",
  "skinless",
  "lean",
  "fat",
  "free",
  "range",
  "run",
  "cage",
  "organic",
  "natural",
  "salted",
  "unsalted",
  "ground",
  "cracked",
  "coarse",
  "fine",
  "freshly",
  "mill",
  "grade",
  "dozen",
  "count",
  "carton",
  "tray",
  "bag",
  "box",
  "bottle",
  "jar",
  "can",
  "tin",
  "bunch",
  "head",
  "loose",
  "bulk",
  "skin",
  "raised",
  "grain",
  "fed",
  "grass",
  "pasture",
  "halal",
  "kosher",
  "vegan",
  "vegetarian",
  "original",
  "classic",
  "premium",
  "select",
  "best",
  "pure",
  "real",
  "canadian",
  "atlantic",
  "local",
  "filtered",
  "microfiltered",
  "ultra",
  "homogenized",
  "homo",
  "lactose",
  "dairy",
  "omega",
  "plus",
  "nest",
  "laid",
  "nature",
  "farms",
  "farm",
  "blue",
  "menu",
  "name",
  "choice",
  "compliments",
  "president",
  "great",
  "pc",
  "organics",
  "plain",
  "unsweetened",
  "unsalted",
  "salted",
  "trimmed",
  "untrimmed",
  "crisp",
  "spanish",
  "cooking",
  "garlic",
  "herb",
  "chive",
  "parsley",
  "dill",
  "honey",
  "new",
  "old",
  "fancy",
  "cut",
  "wheat",
  "grain",
  "wholewheat",
  "skin",
  "bone",
  "less",
  "split",
  "value",
  "pack",
  "club",
  "from",
  "raised",
  "run",
  "laid",
  "nestlaid",
  "naturegg",
  "burnbrae",
  "neilson",
  "lactantia",
  "natrel",
  "northumberland",
  "kikkoman",
  "maple",
  "leaf",
  "prime",
  "farmer",
  "market",
  "maritime",
  "sufra",
  "zabiha",
  "watson",
  "ridge",
  "aurora",
  "pastene",
  "beatrice",
  "microfiltered",
  "ultrapur",
  "protein",
  "percent",
]);

const CUTS = new Set([
  "breast",
  "thigh",
  "wing",
  "drumstick",
  "fillet",
  "filet",
  "cutlet",
  "loin",
  "chop",
  "steak",
  "roast",
  "ground",
  "tenderloin",
  "rib",
  "brisket",
  "flank",
  "chuck",
  "shank",
]);

/** Leftover tokens that mean a different grocery, not a size or brand of this one. */
const OTHER_FOODS = new Set([
  "noodle",
  "pasta",
  "spaghetti",
  "linguine",
  "penne",
  "macaroni",
  "lasagna",
  "ramen",
  "bread",
  "bun",
  "bagel",
  "muffin",
  "cake",
  "cookie",
  "pastry",
  "croissant",
  "wrap",
  "tortilla",
  "pita",
  "chocolate",
  "chocolatey",
  "cocoa",
  "candy",
  "caramel",
  "fudge",
  "soup",
  "stew",
  "chili",
  "chowder",
  "salad",
  "sandwich",
  "burger",
  "pizza",
  "taco",
  "burrito",
  "nacho",
  "juice",
  "drink",
  "soda",
  "smoothie",
  "shake",
  "nog",
  "eggnog",
  "yogurt",
  "kefir",
  "butter",
  "margarine",
  "cheese",
  "oil",
  "vinegar",
  "dressing",
  "marinade",
  "mix",
  "batter",
  "coating",
  "stuffing",
  "pie",
  "tart",
  "bar",
  "cereal",
  "oatmeal",
  "granola",
  "chip",
  "cracker",
  "pretzel",
  "jam",
  "jelly",
  "honey",
  "rice",
  "bean",
  "pea",
  "lentil",
  "sauce",
  "salsa",
  "gravy",
  "broth",
  "stock",
  "milk",
  "cream",
  "ice",
  "tofu",
  "bacon",
  "ham",
  "sausage",
  "nugget",
  "meal",
  "kit",
  "toy",
  "candy",
  "peanut",
  "almond",
  "cashew",
  "walnut",
  "pecan",
  "hazelnut",
  "sunflower",
  "pumpkin",
  "cocoa",
  "apple",
  "cookie",
  "thigh",
  "wing",
  "drumstick",
  "beef",
  "pork",
  "turkey",
  "salmon",
  "tuna",
  "shrimp",
]);

const IRREGULAR_STEMS: Record<string, string> = {
  tomatoes: "tomato",
  potatoes: "potato",
  leaves: "leaf",
  berries: "berry",
  cloves: "clove",
  loaves: "loaf",
  halves: "half",
  breadcrumbs: "breadcrumb",
  breasts: "breast",
  thighs: "thigh",
  patties: "patty",
  fillets: "fillet",
  cutlets: "cutlet",
};

const COMPOUND_PARTS: Record<string, string[]> = {
  breadcrumb: ["bread", "crumb"],
  applesauce: ["apple", "sauce"],
};

const SYNONYMS: Record<string, string[]> = {
  breast: ["cutlet", "fillet", "filet"],
  pasta: ["spaghetti", "linguine", "penne", "fettuccine", "macaroni", "noodle"],
  broth: ["stock"],
  stock: ["broth"],
};

/** Prepared-food families. A product in a family only matches if the ingredient asked for that family. */
const PREPARED_GROUPS: { id: string; markers: string[] }[] = [
  { id: "deli", markers: ["sliced", "shaved", "deli", "sandwich", "lunch meat", "cold cut", "natural selections", "slices", "oven roasted"] },
  {
    id: "meal",
    markers: [
      "frozen meal",
      "single serve",
      "alfredo",
      "szechuan",
      "szzechuan",
      "cajun",
      "entree",
      "entrée",
      "skillet",
      "dinner kit",
      "burrito",
      "mac cheese",
      "macaroni cheese",
      "crave",
      "hungry man",
      "stouffer",
      "lean cuisine",
      "pizza",
      "fried rice",
      "fried",
      "meal",
    ],
  },
  { id: "breaded", markers: ["nugget", "breaded", "battered", "popcorn", "bites", "kiev", "cordon bleu", "tenders"] },
  { id: "broth", markers: ["broth", "stock", "soup", "bouillon", "gravy"] },
  { id: "burger", markers: ["burger", "patty", "patties", "sausage", "hot dog", "smokie", "smokies"] },
  { id: "seasoning", markers: ["seasoning", "spice", "powder", "granulated", "seasoned"] },
  { id: "marinade", markers: ["marinated", "souvlaki", "kebab", "satay", "tikka", "teriyaki"] },
  { id: "cooked", markers: ["stuffed", "rotisserie", "fully cooked", "smoked", "jerky", "medallion", "bacon wrapped", "wrapped"] },
  { id: "sauce", markers: ["sauce"] },
  { id: "canned", markers: ["canned", "chunk chicken", "seasoned chunk"] },
  {
    id: "plant",
    markers: [
      "plant",
      "plant based",
      "plant-based",
      "vegan",
      "dairy free",
      "dairy-free",
      "non dairy",
      "nondairy",
      "margarine",
      "buttery",
      "butter alternative",
      "not butter",
      "impossible",
      "beyond meat",
      "becel",
      "violife",
      "earth balance",
      "country crock",
    ],
  },
  { id: "vegpepper", markers: ["bell pepper", "bell", "jalapeno", "habanero", "banana pepper", "sweet pepper"] },
];

export function searchTermFor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
    .join(" ")
    .slice(0, 80);
}

/** Overlay fill searches the ingredient, never a Superstore catalog SKU name. */
const OVERLAY_DROP = new Set([
  "fresh",
  "dried",
  "chopped",
  "minced",
  "diced",
  "grated",
  "crushed",
  "peeled",
  "clove",
  "bunch",
  "stalk",
  "sprig",
  "pinch",
  "dash",
  "optional",
  "large",
  "small",
  "medium",
  "extra",
  "virgin",
  "purpose",
  "all",
  "kosher",
]);

export function overlaySearchQuery(ingredientName: string): string {
  const kept = searchTermFor(ingredientName)
    .split(/\s+/)
    .filter((word) => word && !OVERLAY_DROP.has(word));
  return (kept.join(" ") || searchTermFor(ingredientName)).slice(0, 80);
}

/** True when the shelf name is a stand-in (plant butter, oat milk) for a real ingredient. */
export function isOffFood(productName: string, query: string): boolean {
  const q = normalizeKey(query);
  const p = normalizeKey(productName);
  const qButter = /\bbutter\b/.test(q) && !/\b(peanut|almond|cashew|seed|cocoa|apple)\b/.test(q);
  if (qButter) {
    return /plant|\bvegan\b|margarine|dairy free|non dairy|buttery|\bspread\b|becel|violife|earth balance|country crock|not butter|butter alternative|flora plant|i cant believe|\bnatura\b|vitamite|blue bonnet/.test(
      p,
    );
  }
  const qMilk = /\bmilk\b/.test(q) && !/\b(coconut|condensed|evaporated|buttermilk|chocolate)\b/.test(q);
  if (qMilk) {
    return /plant|\bvegan\b|dairy free|non dairy|\boat\b|almond|soy|cashew|rice milk|oatly|\bsilk\b|lactose/.test(p);
  }
  return false;
}

export function isRelevantProduct(productName: string, query: string): boolean {
  if (isOffFood(productName, query)) return false;
  const need = requiredStems(query);
  if (need.length === 0) return true;
  const hay = productStems(productName);
  if (!need.every((stem) => hayHas(hay, stem))) return false;
  const queryGroups = preparedGroups(query);
  const productGroups = preparedGroups(productName);
  for (const group of productGroups) {
    if (!queryGroups.has(group)) return false;
  }
  if (!headsMatch(productName, query)) return false;
  return !hasOtherFood(productName, query);
}

function tokenize(text: string): string[] {
  return normalizeKey(text)
    .replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|oz|lb|ct|pk|pack|count)?\b/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !/^\d/.test(token));
}

function stem(token: string): string {
  const irregular = IRREGULAR_STEMS[token];
  if (irregular) return irregular;
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ses") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

function expandStem(value: string): string[] {
  const parts = COMPOUND_PARTS[value];
  const syn = SYNONYMS[value] ?? [];
  return [value, ...(parts ?? []), ...syn];
}

function requiredStems(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokenize(query)) {
    const value = stem(token);
    for (const piece of COMPOUND_PARTS[value] ?? [value]) {
      if (seen.has(piece)) continue;
      seen.add(piece);
      out.push(piece);
    }
  }
  return out;
}

function productStems(name: string): Set<string> {
  const hay = new Set<string>();
  for (const token of tokenize(name)) {
    const value = stem(token);
    hay.add(value);
    for (const piece of COMPOUND_PARTS[value] ?? []) hay.add(piece);
  }
  return hay;
}

function hayHas(hay: Set<string>, need: string): boolean {
  for (const option of expandStem(need)) {
    if (hay.has(option)) return true;
  }
  return false;
}

function preparedGroups(text: string): Set<string> {
  const hay = ` ${normalizeKey(text)} `;
  const groups = new Set<string>();
  for (const group of PREPARED_GROUPS) {
    if (group.markers.some((marker) => hayHasMarker(hay, marker))) groups.add(group.id);
  }
  return groups;
}

function hayHasMarker(hay: string, marker: string): boolean {
  const needle = normalizeKey(marker);
  if (!needle) return false;
  if (needle.includes(" ")) return hay.includes(needle);
  const want = stem(needle);
  return hay
    .trim()
    .split(/\s+/)
    .some((token) => stem(token) === want);
}

function contentStems(text: string): string[] {
  return tokenize(text)
    .map((token) => stem(token))
    .filter((token) => !MODIFIERS.has(token));
}

function headsMatch(productName: string, query: string): boolean {
  const queryParts = contentStems(query);
  const productParts = contentStems(productName);
  const queryHead = queryParts.at(-1);
  const productHead = productParts.at(-1);
  if (!queryHead || !productHead) return true;
  if (CUTS.has(queryHead) && CUTS.has(productHead) && queryHead !== productHead) {
    const syn = new Set(expandStem(queryHead));
    if (!syn.has(productHead)) return false;
  }
  const wanted = new Set(queryParts.flatMap((part) => expandStem(part)));
  if (wanted.has(productHead)) return true;
  const queryNamedACut = queryParts.some((part) => CUTS.has(part));
  if (!queryNamedACut && CUTS.has(productHead) && wanted.has(queryHead)) return true;
  return expandStem(productHead).some((option) => option === queryHead || wanted.has(option));
}

function hasOtherFood(productName: string, query: string): boolean {
  const wanted = new Set(requiredStems(query).flatMap((part) => expandStem(part)));
  for (const token of contentStems(productName)) {
    if (wanted.has(token) || CUTS.has(token)) continue;
    if (OTHER_FOODS.has(token)) return true;
  }
  return false;
}

export function matchCart(
  store: { brand: StoreBrand; name: string },
  lines: CartNeed[],
): { items: GroceryPick[]; totalCad: number } {
  const items = lines.filter((line) => !line.fromPantry).map((line) => pickForLine(store, line));
  const totalCad = roundMoney(items.reduce((sum, i) => sum + i.pickCad, 0));
  return { items, totalCad };
}

export function pickForLine(store: { brand: StoreBrand; name: string }, line: CartNeed): GroceryPick {
  const ranked = catalogRanked(store, line, 1);
  const top = ranked[0];
  if (!top) {
    const query = line.name;
    return {
      name: line.name,
      qty: line.qty,
      unit: line.unit,
      aisle: line.aisle,
      query,
      pickName: line.name,
      pickSize: "",
      packs: 1,
      pickCad: 0,
      addUrl: productSearchUrl(store, query),
      why: "No listed size yet. Store search is this name — pick a pack that covers the meal.",
      matched: false,
    };
  }
  const { product, cover } = top;
  const query = `${product.name} ${product.sizeLabel}`.trim();
  return {
    name: line.name,
    qty: line.qty,
    unit: line.unit,
    aisle: line.aisle,
    query,
    pickName: product.name,
    pickSize: product.sizeLabel,
    packs: cover.packs,
    pickCad: cover.totalCad,
    addUrl: product.url || productSearchUrl(store, query),
    why: whyLine(line, product, cover),
    matched: true,
  };
}

export function catalogOptions(
  store: { brand: StoreBrand; name: string },
  line: CartNeed,
  limit = 5,
): StoreOption[] {
  return catalogRanked(store, line, limit).map((row, index) => optionFromRank(store, line, row, index, false));
}

function catalogRanked(store: { brand: StoreBrand; name: string }, line: CartNeed, limit: number) {
  const staple = matchStaple(line.name);
  const products = staple?.products.filter((p) => p.brand === store.brand) ?? [];
  return rankEnough(line, products, staple?.gramsPerCup, limit);
}

export function optionFromRank(
  store: { brand: StoreBrand; name: string },
  line: CartNeed,
  row: { product: StapleProduct; cover: Cover },
  index: number,
  live: boolean,
): StoreOption {
  const { product, cover } = row;
  const brandLabel = product.name.split(" ")[0] ?? "";
  return {
    id: product.productId || `${product.name}:${product.sizeLabel}:${index}`,
    name: product.name,
    brandLabel,
    sizeLabel: product.sizeLabel,
    priceCad: product.priceCad,
    packs: cover.packs,
    totalCad: cover.totalCad,
    unitHint: product.unitHint || "",
    imageUrl: product.imageUrl || "",
    addUrl: product.url || productSearchUrl(store, `${product.name} ${product.sizeLabel}`.trim()),
    inStock: product.inStock !== false,
    why: index === 0 ? whyLine(line, product, cover) : `${cover.packs}× ${product.sizeLabel} covers the meal.`,
    live,
  };
}

function whyLine(need: CartNeed, product: StapleProduct, cover: Cover): string {
  const meal = [need.qty, need.unit].filter(Boolean).join(" ").trim() || "the meal";
  if (cover.packs === 1) {
    return `Cheapest ${product.sizeLabel} that covers ${meal}.`;
  }
  return `${cover.packs}× ${product.sizeLabel} — cheapest way to cover ${meal}.`;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatPickList(storeName: string, items: GroceryPick[]): string {
  const lines = items.map((item) =>
    item.matched
      ? `- ${item.packs}× ${item.pickName} (${item.pickSize}) · $${item.pickCad.toFixed(2)}`
      : `- ${item.name}`,
  );
  return [`Spoonful cheap cart for ${storeName}`, ...lines].join("\n");
}
