import type { Nutrition } from "./types";

export type BarcodeProduct = {
  barcode: string;
  name: string;
  brand?: string;
  serving: string;
  per: "serving" | "100g";
  nutrition: Nutrition;
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
    generic_name?: string;
    brands?: string;
    serving_size?: string;
    nutriments?: Record<string, unknown>;
  };
};

export async function lookupBarcode(
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; product: BarcodeProduct } | { ok: false; error: string }> {
  const barcode = normalizeBarcode(code);
  if (barcode.length < 6) {
    return { ok: false, error: "Type the numbers printed under the barcode." };
  }
  const demo = localProduct(barcode);
  if (demo) return { ok: true, product: demo };
  try {
    const res = await fetchImpl(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false, error: "Couldn't look that up. Check the numbers, or type the name of the food." };
    }
    const json = (await res.json()) as OffJson;
    const product = json.product;
    if (json.status !== 1 || !product) {
      return { ok: false, error: "No food found for that barcode. You can still type the name." };
    }
    const name = (product.product_name_en || product.product_name || product.generic_name || "").trim();
    if (!name) {
      return { ok: false, error: "That barcode has no name. Type what the package says." };
    }
    const macros = nutritionFromOff(product.nutriments ?? {}, product.serving_size);
    return {
      ok: true,
      product: {
        barcode,
        name: name.slice(0, 80),
        brand: product.brands?.split(",")[0]?.trim().slice(0, 40),
        ...macros,
      },
    };
  } catch {
    return { ok: false, error: "Couldn't reach the food database. Check the numbers, or type the food name." };
  }
}
