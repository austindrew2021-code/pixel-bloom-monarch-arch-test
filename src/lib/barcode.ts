import type { Nutrition } from "./types";

export type BarcodeProduct = {
  barcode: string;
  name: string;
  brand?: string;
  serving: string;
  per: "serving" | "100g";
  nutrition: Nutrition;
  /** False when a package was found but the database had no calories. */
  macrosKnown?: boolean;
};

function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function roundMacro(n: number): number {
  return Math.max(0, Math.round(n));
}

export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Offline / preview products so typing a code always works. */
export const DEMO_PRODUCTS: Record<string, BarcodeProduct> = {
  "000000000001": {
    barcode: "000000000001",
    name: "Greek yogurt",
    brand: "Spoonful demo",
    serving: "1 cup",
    per: "serving",
    nutrition: { cal: 150, protein: 15, carbs: 8, fat: 4 },
  },
  "000000000002": {
    barcode: "000000000002",
    name: "2% milk",
    brand: "Spoonful demo",
    serving: "1 cup",
    per: "serving",
    nutrition: { cal: 130, protein: 8, carbs: 12, fat: 5 },
  },
  "000000000003": {
    barcode: "000000000003",
    name: "Pasta",
    brand: "Spoonful demo",
    serving: "2 oz dry",
    per: "serving",
    nutrition: { cal: 210, protein: 7, carbs: 42, fat: 1 },
  },
  "000000000004": {
    barcode: "000000000004",
    name: "Tomato sauce",
    brand: "Spoonful demo",
    serving: "1/2 cup",
    per: "serving",
    nutrition: { cal: 70, protein: 2, carbs: 12, fat: 2 },
  },
  "000000000005": {
    barcode: "000000000005",
    name: "Peanut butter",
    brand: "Spoonful demo",
    serving: "2 tbsp",
    per: "serving",
    nutrition: { cal: 190, protein: 8, carbs: 7, fat: 16 },
  },
};

export function localProduct(code: string): BarcodeProduct | undefined {
  return DEMO_PRODUCTS[normalizeBarcode(code)];
}

/** UPC-A, EAN-13, and the same digits with or without a leading zero. */
export function barcodeCandidates(raw: string): string[] {
  const barcode = normalizeBarcode(raw);
  if (barcode.length < 6 || barcode.length > 14) return [];
  const out: string[] = [];
  const add = (code: string) => {
    if (code.length >= 6 && code.length <= 14 && !out.includes(code)) out.push(code);
  };
  add(barcode);
  if (barcode.length === 12) add(`0${barcode}`);
  if (barcode.length === 13 && barcode.startsWith("0")) add(barcode.slice(1));
  if (barcode.length >= 8 && barcode.length < 13) add(barcode.padStart(13, "0"));
  if (barcode.length >= 8 && barcode.length < 12) add(barcode.padStart(12, "0"));
  return out;
}

function sameCode(a: string, b: string): boolean {
  const x = a.replace(/\D/g, "").replace(/^0+/, "");
  const y = b.replace(/\D/g, "").replace(/^0+/, "");
  return x.length >= 6 && x === y;
}

export function nutritionFromOff(
  nutriments: Record<string, unknown>,
  servingSize?: string,
): Pick<BarcodeProduct, "nutrition" | "per" | "serving"> {
  const kcalServing = num(nutriments["energy-kcal_serving"] ?? nutriments["energy-kcal_value_serving"]);
  const proteinServing = num(nutriments.proteins_serving);
  const carbsServing = num(nutriments.carbohydrates_serving);
  const fatServing = num(nutriments.fat_serving);
  if (kcalServing !== null || proteinServing !== null) {
    return {
      per: "serving",
      serving: servingSize?.trim() || "1 serving",
      nutrition: {
        cal: roundMacro(kcalServing ?? 0),
        protein: roundMacro(proteinServing ?? 0),
        carbs: roundMacro(carbsServing ?? 0),
        fat: roundMacro(fatServing ?? 0),
      },
    };
  }
  return {
    per: "100g",
    serving: "100 g",
    nutrition: {
      cal: roundMacro(num(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"]) ?? 0),
      protein: roundMacro(num(nutriments.proteins_100g ?? nutriments.proteins) ?? 0),
      carbs: roundMacro(num(nutriments.carbohydrates_100g ?? nutriments.carbohydrates) ?? 0),
      fat: roundMacro(num(nutriments.fat_100g ?? nutriments.fat) ?? 0),
    },
  };
}

export function scaleNutrition(nutrition: Nutrition, servings: number): Nutrition {
  const n = Math.max(0.25, Math.min(8, servings));
  return {
    cal: roundMacro(nutrition.cal * n),
    protein: roundMacro(nutrition.protein * n),
    carbs: roundMacro(nutrition.carbs * n),
    fat: roundMacro(nutrition.fat * n),
  };
}

type OffJson = {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    product_name_fr?: string;
    generic_name?: string;
    brands?: string;
    serving_size?: string;
    nutriments?: Record<string, unknown>;
  };
};

const OFF_HOSTS = [
  "https://world.openfoodfacts.org",
  "https://ca.openfoodfacts.org",
  "https://us.openfoodfacts.org",
];

function productFromOff(barcode: string, product: NonNullable<OffJson["product"]>): BarcodeProduct | null {
  const name = (
    product.product_name ||
    product.product_name_en ||
    product.product_name_fr ||
    product.generic_name ||
    ""
  ).trim();
  if (!name) return null;
  const macros = nutritionFromOff(product.nutriments ?? {}, product.serving_size);
  const nutrition = macros.nutrition;
  const source = product.nutriments ?? {};
  const listed = [
    "energy-kcal_serving",
    "energy-kcal_100g",
    "energy-kcal",
    "proteins_serving",
    "proteins_100g",
    "proteins",
    "carbohydrates_serving",
    "carbohydrates_100g",
    "fat_serving",
    "fat_100g",
  ].some((key) => num(source[key]) !== null);
  return {
    barcode,
    name: name.slice(0, 80),
    brand: product.brands?.split(",")[0]?.trim().slice(0, 40),
    ...macros,
    macrosKnown: listed || nutrition.cal > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0,
  };
}

async function readOff(
  host: string,
  barcode: string,
  fetchImpl: typeof fetch,
): Promise<BarcodeProduct | null> {
  const res = await fetchImpl(`${host}/api/v2/product/${barcode}.json`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Spoonful/1.0 (meal planner; barcode lookup)",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as OffJson;
  if (json.status !== 1 || !json.product) return null;
  return productFromOff(barcode, json.product);
}

type UsdaFood = {
  description?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  labelNutrients?: {
    calories?: { value?: number };
    protein?: { value?: number };
    carbohydrates?: { value?: number };
    fat?: { value?: number };
  };
};

/** USDA's public demo key. Branded-food fallback when Open Food Facts has no row. */
const USDA_DEMO_KEY = "DEMO_KEY";

async function readUsda(codes: string[], fetchImpl: typeof fetch): Promise<BarcodeProduct | null> {
  const query = codes[0];
  if (!query) return null;
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Branded&pageSize=8&api_key=${USDA_DEMO_KEY}`;
  const res = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as { foods?: UsdaFood[] };
  const hit = (json.foods ?? []).find((food) => food.gtinUpc && codes.some((code) => sameCode(code, food.gtinUpc!)));
  if (!hit?.description) return null;
  const label = hit.labelNutrients;
  const nutrition = {
    cal: roundMacro(label?.calories?.value ?? 0),
    protein: roundMacro(label?.protein?.value ?? 0),
    carbs: roundMacro(label?.carbohydrates?.value ?? 0),
    fat: roundMacro(label?.fat?.value ?? 0),
  };
  const serving =
    hit.servingSize && hit.servingSizeUnit
      ? `${hit.servingSize} ${hit.servingSizeUnit}`
      : "1 serving";
  return {
    barcode: normalizeBarcode(hit.gtinUpc || query),
    name: hit.description.slice(0, 80),
    brand: (hit.brandName || hit.brandOwner || "").slice(0, 40) || undefined,
    serving,
    per: "serving",
    nutrition,
    macrosKnown: nutrition.cal > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0,
  };
}

export async function lookupBarcode(
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; product: BarcodeProduct } | { ok: false; error: string }> {
  const codes = barcodeCandidates(code);
  if (codes.length === 0) {
    return { ok: false, error: "Type the numbers printed under the barcode." };
  }
  for (const barcode of codes) {
    const demo = localProduct(barcode);
    if (demo) return { ok: true, product: { ...demo, macrosKnown: true } };
  }
  let reached = false;
  for (const barcode of codes) {
    for (const host of OFF_HOSTS) {
      try {
        const product = await readOff(host, barcode, fetchImpl);
        reached = true;
        if (product) return { ok: true, product };
      } catch {
        /* next host */
      }
    }
  }
  try {
    const usda = await readUsda(codes, fetchImpl);
    if (usda) return { ok: true, product: usda };
    reached = true;
  } catch {
    /* offline */
  }
  if (!reached) {
    return { ok: false, error: "Couldn't reach the food database. Check the numbers, or type the food name." };
  }
  return { ok: false, error: "No food found for that barcode. You can still type the name." };
}
