import assert from "node:assert/strict";
import test from "node:test";
import { barcodeCandidates, lookupBarcode, normalizeBarcode, nutritionFromOff, scaleNutrition } from "./barcode.ts";

test("normalizeBarcode keeps digits only", () => {
  assert.equal(normalizeBarcode(" 0000-0000-0001 "), "000000000001");
});

test("demo yogurt looks up without the network", async () => {
  const res = await lookupBarcode("000000000001", () => {
    throw new Error("network should not run for demo codes");
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.product.name, "Greek yogurt");
    assert.equal(res.product.nutrition.protein, 15);
  }
});

test("short codes ask for the printed numbers in plain English", async () => {
  const res = await lookupBarcode("12");
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.error, /numbers printed under the barcode/i);
});

test("nutritionFromOff prefers per-serving when present", () => {
  const got = nutritionFromOff(
    {
      "energy-kcal_serving": 150,
      proteins_serving: 15,
      carbohydrates_serving: 8,
      fat_serving: 4,
      "energy-kcal_100g": 90,
    },
    "1 cup",
  );
  assert.equal(got.per, "serving");
  assert.equal(got.serving, "1 cup");
  assert.equal(got.nutrition.cal, 150);
  assert.equal(got.nutrition.protein, 15);
});

test("nutritionFromOff falls back to 100g", () => {
  const got = nutritionFromOff({ "energy-kcal_100g": 89.4, proteins_100g: 3.3 });
  assert.equal(got.per, "100g");
  assert.equal(got.nutrition.cal, 89);
  assert.equal(got.nutrition.protein, 3);
});

test("scaleNutrition doubles a serving", () => {
  const got = scaleNutrition({ cal: 150, protein: 15, carbs: 8, fat: 4 }, 2);
  assert.deepEqual(got, { cal: 300, protein: 30, carbs: 16, fat: 8 });
});

test("barcodeCandidates adds the EAN-13 form of a 12-digit UPC", () => {
  const codes = barcodeCandidates("049000042566");
  assert.ok(codes.includes("049000042566"));
  assert.ok(codes.includes("0049000042566"));
});

test("lookup tries the leading-zero code when the raw UPC misses", async () => {
  const res = await lookupBarcode("049000042566", async (input) => {
    const url = String(input);
    if (url.includes("/0049000042566") && url.includes("world.openfoodfacts.org")) {
      return new Response(
        JSON.stringify({
          status: 1,
          product: { product_name: "Coca-Cola", brands: "Coca-Cola", nutriments: {} },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("nal.usda.gov")) {
      return new Response(JSON.stringify({ foods: [] }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: 0 }), { status: 200 });
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.product.name, "Coca-Cola");
    assert.equal(res.product.macrosKnown, false);
  }
});
