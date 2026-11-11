import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  compare,
  needAmount,
  canMatchesFlOz,
  US_FL_OZ_ML,
  coverNeed,
  normalizeUpc,
  parseAttrs,
  pickExact,
  shieldBlocks,
  type MatchProduct,
  type NeedLine,
} from "./grocery-match.ts";
import { parsePackageSizing, pickForLine } from "./grocery-pick.ts";

const store = { brand: "superstore" as const, name: "Atlantic Superstore" };

/** Product from a PC Express-style title and packageSizing string. */
function P(name: string, size: string, price: number, extra: Partial<MatchProduct> = {}): MatchProduct {
  const s = parsePackageSizing(size);
  return {
    brand: "superstore",
    name,
    sizeLabel: s.sizeLabel,
    priceCad: price,
    grams: s.grams,
    ml: s.ml,
    each: s.each,
    perKgCad: s.perKgCad,
    unitPrice: s.unitPrice,
    productId: `${name.replace(/\W+/g, "_")}_${size.replace(/\W+/g, "")}`,
    ...extra,
  };
}
const L = (name: string, qty: number, unit: string, aisle = "Other"): NeedLine => ({ name, qty, unit, aisle });
const picked = (r: ReturnType<typeof pickExact>) => (r.pick ? `${r.pick.product.name}|${r.pick.cover.packs}` : "ASK");

// ---------------------------------------------------------------- meat type and cut

test("thighs never become breasts, even when breasts are cheaper", () => {
  const r = pickExact({
    line: L("boneless skinless chicken thighs", 600, "g"),
    products: [P("Boneless Skinless Chicken Breasts", "650 g", 8.99), P("Boneless Skinless Chicken Thighs", "620 g", 10.49)],
  });
  assert.equal(picked(r), "Boneless Skinless Chicken Thighs|1");
  const only = pickExact({ line: L("boneless skinless chicken thighs", 600, "g"), products: [P("Boneless Skinless Chicken Breasts", "650 g", 8.99)] });
  assert.equal(only.status, "ask");
  assert.match(only.choices[0]!.label, /cut: breast, recipe says thigh/);
});

test("ground never becomes stewing and stewing never becomes ground", () => {
  const products = [P("Lean Ground Beef", "454 g", 6.49), P("Stewing Beef", "454 g", 8.99)];
  assert.equal(picked(pickExact({ line: L("stewing beef", 400, "g"), products })), "Stewing Beef|1");
  assert.equal(picked(pickExact({ line: L("lean ground beef", 400, "g"), products: [P("Stewing Beef", "454 g", 5.99), P("Lean Ground Beef", "454 g", 7.49)] })), "Lean Ground Beef|1");
});

test("lean ground beef is not extra lean or medium", () => {
  const r = pickExact({
    line: L("lean ground beef", 1, "lb"),
    products: [P("Extra Lean Ground Beef", "454 g", 6.99), P("Medium Ground Beef", "454 g", 5.49), P("Lean Ground Beef", "454 g", 7.49)],
  });
  assert.equal(picked(r), "Lean Ground Beef|1");
});

test("bone-in vs boneless: the stated one only; unstated with both on the shelf asks", () => {
  const products = [P("Chicken Thighs Bone In Skin On", "1 kg", 8.49), P("Chicken Thighs Boneless Skinless", "620 g", 10.49)];
  assert.equal(picked(pickExact({ line: L("chicken thighs boneless", 600, "g"), products })), "Chicken Thighs Boneless Skinless|1");
  assert.equal(picked(pickExact({ line: L("bone-in chicken thighs", 600, "g"), products })), "Chicken Thighs Bone In Skin On|1");
  const unsure = pickExact({ line: L("chicken thighs", 600, "g"), products });
  assert.equal(unsure.status, "ask");
  assert.match(unsure.reason, /bone-in or boneless/);
  assert.equal(unsure.choices.length, 2);
});

test("a recipe that says boneless won't take a pack that doesn't say it", () => {
  const r = pickExact({ line: L("boneless skinless chicken thighs", 600, "g"), products: [P("Chicken Thighs", "$11.00/1kg", 9)] });
  assert.equal(r.status, "ask");
  assert.match(r.choices[0]!.label, /doesn't say boneless/);
});

test("frozen never counts as fresh: by title and by the store's own aisle", () => {
  const r = pickExact({
    line: L("boneless skinless chicken thighs", 600, "g"),
    products: [P("PC Frozen Boneless Skinless Chicken Thighs", "1 kg", 9.49), P("Boneless Skinless Chicken Thighs", "620 g", 10.49)],
  });
  assert.equal(picked(r), "Boneless Skinless Chicken Thighs|1");
  const aisle = compare("salmon fillet", P("Seaquest Pink Salmon Fillets", "400 g", 11.99, { breadcrumbs: ["Food", "Frozen", "Frozen Fish & Seafood"] }));
  assert.equal(aisle.ok, false);
  assert.ok(aisle.differs.some((d) => /frozen aisle/.test(d)));
  assert.equal(compare("fresh salmon fillet", P("Coho Salmon Fillets, Previously Frozen", "$30.86/1kg", 21.88)).ok, false);
  // A recipe that asks for frozen takes frozen.
  assert.equal(compare("frozen peas", P("Green Giant Frozen Peas", "750 g", 3.99)).ok, true);
});

test("marinated, breaded, smoked and meal products never stand in for raw meat", () => {
  for (const name of [
    "Marinated Chicken Thighs (See product description for marinade options)",
    "Seasoned Chicken Thighs",
    "Mina Spicy Chicken Burgers",
    "Hot Smoked Salmon, Regular",
    "Pesto Butter Salmon Fillet Entrée",
    "Buttermilk Chicken Breast Pieces",
  ]) {
    const need = /salmon/i.test(name) ? "salmon fillet" : /breast/i.test(name) ? "chicken breast" : "chicken thighs";
    assert.equal(compare(need, P(name, "500 g", 5)).ok, false, name);
  }
});

test("salted vs unsalted butter, and plant spreads are not butter", () => {
  const r = pickExact({
    line: L("unsalted butter", 1, "cup"),
    products: [P("No Name Salted Butter", "454 g", 5.99), P("Becel Plant Butter Unsalted", "454 g", 4.99), P("Gay Lea Unsalted Butter", "454 g", 7.29)],
    gramsPerCup: 227,
  });
  assert.equal(picked(r), "Gay Lea Unsalted Butter|1");
});

test("generic 'chicken' or 'beef' with no cut asks with labelled cuts, never picks", () => {
  const r = pickExact({
    line: L("chicken", 1, "kg"),
    products: [P("Chicken Drumsticks, Club Pack", "$9.46/1kg", 10.58), P("Boneless Skinless Chicken Breast", "1 kg", 16), P("Chicken Thighs", "$9.46/1kg", 12.71)],
  });
  assert.equal(r.status, "ask");
  assert.equal(r.pick, null);
  assert.match(r.reason, /no cut/);
  assert.match(r.choices[0]!.label, /^Choice 1: .*cut: /);
  assert.equal(pickExact({ line: L("beef", 1, "kg"), products: [P("Lean Ground Beef", "1 kg", 12)] }).status, "ask");
  // The catalog path follows the same rule.
  const line = pickForLine(store, { name: "chicken", qty: 1, unit: "kg", aisle: "Meat & Seafood" });
  assert.equal(line.matched, false);
  assert.equal(line.status, "ask");
});

// ---------------------------------------------------------------- diet and allergy shields

test("vegetarian and vegan shields block meat, fish and animal products", () => {
  const meat = P("Boneless Skinless Chicken Thighs", "620 g", 10.49);
  assert.ok(shieldBlocks(meat, { prefs: ["vegetarian"] }).length > 0);
  assert.equal(pickExact({ line: L("chicken thighs", 600, "g"), products: [meat], profile: { prefs: ["vegetarian"] } }).choices.length, 0);
  assert.ok(shieldBlocks(P("Gay Lea Unsalted Butter", "454 g", 7.29), { prefs: ["vegan"] }).length > 0);
  assert.ok(shieldBlocks(P("No Name Large Eggs", "12 ea", 4.29), { prefs: ["vegan"] }).length > 0);
  assert.equal(shieldBlocks(P("Yellow Onions", "3 lb", 3.79), { prefs: ["vegan"] }).length, 0);
});

test("allergy shields read the title and the ingredient list, and fail when there is no list", () => {
  const broth = P("Campbell's Chicken Broth", "900 ml", 1.47);
  assert.match(shieldBlocks(broth, { allergies: ["gluten"] })[0] ?? "", /no ingredient list/);
  assert.equal(shieldBlocks({ ...broth, ingredients: "Chicken stock, salt, carrot, onion, celery." }, { allergies: ["gluten"] }).length, 0);
  assert.ok(shieldBlocks({ ...broth, ingredients: "Chicken stock, wheat flour, salt." }, { allergies: ["gluten"] }).length > 0);
  assert.ok(shieldBlocks(P("Kikkoman Soy Sauce", "591 ml", 5.5), { prefs: ["gluten-free"] }).length > 0);
  assert.equal(
    shieldBlocks(P("Kikkoman Gluten-Free Soy Sauce", "296 ml", 5.99, { ingredients: "Water, soybeans, salt, rice, sugar." }), { allergies: ["gluten"] }).length,
    0,
  );
  assert.ok(shieldBlocks(P("Granola Bar", "200 g", 3, { ingredients: "Oats, honey. May contain peanuts." }), { allergies: ["nuts"] }).length > 0);
  assert.ok(shieldBlocks(P("Hellmann's Real Mayonnaise", "890 ml", 6.99), { allergies: ["egg"] }).length > 0);
  assert.ok(shieldBlocks(P("Raw Shrimp", "400 g", 9.99), { allergies: ["shellfish"] }).length > 0);
  assert.ok(shieldBlocks(P("Tahini", "454 g", 6.99), { allergies: ["sesame"] }).length > 0);
  assert.ok(shieldBlocks(P("Atlantic Salmon Fillet", "454 g", 12.99), { allergies: ["fish"] }).length > 0);
  assert.ok(shieldBlocks(P("Firm Tofu", "454 g", 3.49), { allergies: ["soy"] }).length > 0);
  assert.ok(shieldBlocks(P("Kraft Smooth Peanut Butter", "1 kg", 7.99), { allergies: ["nuts"] }).length > 0);
  // Raw single-ingredient foods are judged by their title.
  assert.equal(shieldBlocks(P("Boneless Skinless Chicken Thighs", "620 g", 10.49), { allergies: ["gluten", "dairy", "nuts"] }).length, 0);
});

test("a shield-failing product is never picked and never offered as a choice", () => {
  const r = pickExact({
    line: L("soy sauce", 2, "tbsp"),
    products: [P("Kikkoman Soy Sauce", "591 ml", 5.5), P("No Name Light Soy Sauce", "450 ml", 2.5)],
    profile: { prefs: ["gluten-free"] },
  });
  assert.equal(r.status, "ask");
  assert.equal(r.choices.length, 0);
  assert.match(r.reason, /allergy or diet/);
  const ok = pickExact({
    line: L("soy sauce", 2, "tbsp"),
    products: [P("Kikkoman Soy Sauce", "591 ml", 5.5), P("Kikkoman Gluten-Free Soy Sauce", "296 ml", 5.99, { ingredients: "Water, soybeans, salt, rice." })],
    profile: { allergies: ["gluten"] },
  });
  assert.equal(picked(ok), "Kikkoman Gluten-Free Soy Sauce|1");
});

test("a diet word in the recipe line must be on the product", () => {
  const r = pickExact({
    line: L("gluten free soy sauce", 250, "ml"),
    products: [P("Kikkoman Soy Sauce", "250 ml", 3.49), P("Kikkoman Gluten-Free Soy Sauce", "296 ml", 5.99)],
  });
  assert.equal(picked(r), "Kikkoman Gluten-Free Soy Sauce|1");
});

// ---------------------------------------------------------------- amounts, per-kg meat, cost

test("pack quantity covers the scaled amount: 3 lb from 454 g packs is 3 packs", () => {
  const r = pickExact({ line: L("lean ground beef", 3, "lb"), products: [P("Lean Ground Beef", "454 g", 7.49)] });
  assert.equal(picked(r), "Lean Ground Beef|3");
  assert.equal(r.pick!.cover.totalCad, 22.47);
});

test("per-kg meat: tray weight from price ÷ $/kg, more trays for more meat, never 'one tray covers it'", () => {
  const tray = P("Stewing Beef", "$15.41/1kg $6.99/1lb", 5.2);
  assert.equal(tray.perKgCad, 15.41);
  const c = coverNeed(tray, L("stewing beef", 1, "kg"))!;
  assert.equal(c.packs, 3);
  assert.equal(c.totalCad, 15.6);
  const r = pickExact({ line: L("stewing beef", 1, "kg"), products: [tray, P("Stewing Beef Value Pack", "1 kg", 14.99)] });
  assert.equal(picked(r), "Stewing Beef Value Pack|1");
  // Store-reported average weight wins over the estimate.
  assert.equal(coverNeed({ ...tray, estGrams: 1003 }, L("stewing beef", 1, "kg"))!.packs, 1);
});

test("meat weighed to order costs the needed weight × $/kg", () => {
  const counter = P("Beef Stewing Cubes", "$22.00/1kg", 22, { soldByWeight: true });
  const c = coverNeed(counter, L("stewing beef", 750, "g"))!;
  assert.equal(c.totalCad, 16.5);
  assert.equal(c.byWeight, true);
});

test("a '1 ea' pack with no weight can't be confirmed to cover a weighed amount: ask", () => {
  const r = pickExact({ line: L("boneless skinless chicken thighs", 600, "g"), products: [P("PC Blue Menu Extra Lean Boneless Skinless Chicken Thighs", "1 ea, $15.00/1ea", 15)] });
  assert.equal(r.status, "ask");
  assert.match(r.choices[0]!.label, /size or weight not listed/);
});

test("lowest total cost wins over lowest unit price; a pack that doesn't cover never wins", () => {
  const small = pickExact({ line: L("long grain white rice", 500, "g"), products: [P("No Name Long Grain White Rice", "900 g", 3.49), P("No Name Long Grain White Rice", "8 kg", 17.99)] });
  assert.equal(small.pick!.product.sizeLabel, "900 g");
  const big = pickExact({ line: L("long grain white rice", 2, "kg"), products: [P("No Name Long Grain White Rice", "900 g", 3.49), P("No Name Long Grain White Rice", "2 kg", 6.99)] });
  assert.equal(big.pick!.product.sizeLabel, "2 kg");
  assert.equal(big.pick!.cover.packs, 1);
});

test("equal totals: lower unit price first, then less leftover", () => {
  const byUnit = pickExact({ line: L("long grain white rice", 400, "g"), products: [P("Rice A Long Grain White Rice", "450 g", 4.0), P("Rice B Long Grain White Rice", "500 g", 4.0)] });
  assert.match(byUnit.pick!.product.name, /Rice B/);
  const byLeft = pickExact({
    line: L("long grain white rice", 400, "g"),
    products: [P("Rice A Long Grain White Rice", "500 g", 4.0, { unitPrice: { cad: 8, per: "kg" } }), P("Rice B Long Grain White Rice", "450 g", 4.0, { unitPrice: { cad: 8, per: "kg" } })],
  });
  assert.match(byLeft.pick!.product.name, /Rice B/);
});

test("cheapest among exact matches only: a cheaper wrong item never wins", () => {
  const r = pickExact({
    line: L("fresh salmon fillet", 400, "g"),
    products: [P("Frozen Atlantic Salmon Fillets", "454 g", 9.99), P("Smoked Salmon", "300 g", 8.99), P("Atlantic Salmon Fillet Fresh", "454 g", 12.99), P("Atlantic Salmon Fillet Fresh Club", "908 g", 24.99)],
  });
  assert.equal(picked(r), "Atlantic Salmon Fillet Fresh|1");
});

test("'1 can' with more than one can size on the shelf asks; one size picks", () => {
  const one = pickExact({ line: L("canned diced tomatoes", 1, "can"), products: [P("No Name Diced Tomatoes", "796 ml", 1.79), P("Aylmer Diced Tomatoes", "796 ml", 2.49)] });
  assert.equal(picked(one), "No Name Diced Tomatoes|1");
  const two = pickExact({ line: L("canned diced tomatoes", 1, "can"), products: [P("No Name Diced Tomatoes", "796 ml", 1.79), P("Aurora Diced Tomatoes", "398 ml", 1.29)] });
  assert.equal(two.status, "ask");
  assert.equal(two.choices.length, 2);
});

// ---------------------------------------------------------------- ask when unsure, reasons, UPC

test("no exact match returns up to 3 labelled choices of the same kind and picks nothing", () => {
  const r = pickExact({
    line: L("extra lean ground beef", 454, "g"),
    products: [P("Lean Ground Beef", "454 g", 7.49), P("Medium Ground Beef", "454 g", 6.49), P("Regular Ground Beef", "454 g", 5.99), P("Lean Ground Pork", "454 g", 5.49), P("Beef Stir Fry Strips", "454 g", 8.99)],
  });
  assert.equal(r.status, "ask");
  assert.equal(r.pick, null);
  assert.equal(r.choices.length, 3);
  r.choices.forEach((c, i) => assert.match(c.label, new RegExp(`^Choice ${i + 1}: .+ — .+ · \\$`)));
  for (const c of r.choices) assert.match(c.product.name, /Ground Beef/);
  assert.doesNotMatch(r.reason, /pick a pack/i);
});

test("every pick says why: size, unit price, total and rivals", () => {
  const r = pickExact({ line: L("lean ground beef", 1, "lb"), products: [P("PC Lean Ground Beef", "454 g, $1.65/100g", 7.49), P("Lean Ground Beef", "$15.41/1kg", 6.2)] });
  assert.equal(picked(r), "PC Lean Ground Beef|1");
  assert.match(r.reason, /1× 454 g · \$16\.50\/kg · \$7\.49 total covers 1 lb lean ground beef; lowest total of 2 exact matches/);
});

test("pinnedUpc comes from the product GTIN, normalised for an Instacart line item", () => {
  assert.equal(normalizeUpc("00061483020268"), "061483020268");
  assert.equal(normalizeUpc("00000020731007"), "000020731007");
  assert.equal(normalizeUpc(""), undefined);
  const r = pickExact({ line: L("unsalted butter", 454, "g"), products: [P("No Name Unsalted Butter", "454 g", 5.99, { gtin: "00060383685003" })] });
  assert.equal(r.pinnedUpc, "060383685003");
});

test("one attribute schema for recipe lines and product titles", () => {
  const a = parseAttrs("Fresh Atlantic Salmon Fillets, Skin On, Packaged");
  assert.deepEqual([a.species, a.cuts, a.skin, a.form, a.category], [["salmon"], ["fillet"], "skin-on", "fresh", "seafood"]);
  const b = parseAttrs("PC Organics Extra Lean Ground Beef");
  assert.deepEqual([b.species, b.ground, b.fat, b.organic, b.bone], [["beef"], true, "extra-lean", true, "boneless"]);
  const c = parseAttrs("Chicken Leg (Back Attached), Club Pack");
  assert.deepEqual([c.cuts, c.bone], [["leg"], "bone-in"]);
  const d = parseAttrs("No Name Salted Butter");
  assert.deepEqual([d.salted, d.category], ["salted", "dairy"]);
});

// ---------------------------------------------------------------- recorded PC Express responses

type Tile = { productId?: string; brand?: string | null; title: string; packageSizing?: string; pricing: { price: string }; pricingUnits?: { type?: string } | null };
const REC = JSON.parse(readFileSync(new URL("./grocery-match.fixtures.json", import.meta.url), "utf8")) as { lines: Record<string, Tile[]> };
function recorded(line: string): MatchProduct[] {
  return (REC.lines[line] ?? []).map((t) =>
    P(`${t.brand ?? ""} ${t.title}`.replace(/\s+/g, " ").trim(), t.packageSizing ?? "", Number(t.pricing.price), {
      productId: t.productId,
      soldByWeight: t.pricingUnits?.type === "SOLD_BY_WEIGHT",
    }),
  );
}

test("recorded: 600 g boneless skinless thighs picks a boneless skinless thigh pack that covers it", () => {
  const r = pickExact({ line: L("boneless skinless chicken thighs", 600, "g", "Meat & Seafood"), products: recorded("boneless skinless chicken thighs") });
  assert.equal(r.status, "pick");
  const a = parseAttrs(r.pick!.product.name);
  assert.deepEqual([a.cuts, a.bone, a.skin], [["thigh"], "boneless", "skinless"]);
  assert.notEqual(a.form, "frozen");
  assert.equal(a.prepared.length, 0);
  assert.ok(r.pick!.cover.leftover >= 0);
});

test("recorded: 1 kg stewing beef buys stewing beef that covers 1 kg, never ground beef", () => {
  const r = pickExact({ line: L("stewing beef", 1, "kg", "Meat & Seafood"), products: recorded("stewing beef") });
  assert.equal(r.status, "pick");
  assert.match(r.pick!.product.name, /stewing/i);
  assert.doesNotMatch(r.pick!.product.name, /ground/i);
  for (const row of r.ranked) assert.ok(row.cover.leftover >= 0, row.product.name);
});

test("recorded: 1.5 lb lean ground beef never takes medium, extra lean or a 1-tray guess", () => {
  const r = pickExact({ line: L("lean ground beef", 1.5, "lb", "Meat & Seafood"), products: recorded("lean ground beef") });
  assert.equal(r.status, "pick");
  for (const row of r.ranked) {
    const a = parseAttrs(row.product.name);
    assert.equal(a.fat, "lean", row.product.name);
    assert.ok(row.cover.leftover >= 0, row.product.name);
  }
});

test("recorded: fresh salmon fillet is never frozen, smoked or an entrée", () => {
  const r = pickExact({ line: L("fresh salmon fillet", 400, "g", "Meat & Seafood"), products: recorded("fresh salmon fillet") });
  assert.equal(r.status, "pick");
  for (const row of r.ranked) assert.doesNotMatch(row.product.name, /frozen|smoked|entr|pesto|breaded/i);
});

test("recorded: generic chicken asks; ungraded ground lamb takes the only grade with a reason", () => {
  const chicken = pickExact({ line: L("chicken", 1, "kg", "Meat & Seafood"), products: recorded("chicken") });
  assert.equal(chicken.status, "ask");
  assert.ok(chicken.choices.every((c) => /^Choice \d: /.test(c.label)));
  // Ruling 7: only lean ground lamb on the shelf, so the cheapest grade is picked and the line says why.
  const lamb = pickExact({ line: L("ground lamb", 454, "g", "Meat & Seafood"), products: recorded("ground lamb") });
  assert.equal(lamb.status, "pick");
  assert.match(lamb.pick!.product.name, /ground lamb/i);
  assert.match(lamb.reason, /No regular or medium ground lamb on the shelf, so this is the cheapest grade \(lean\)/);
});

test("recorded: unsalted butter is unsalted dairy butter", () => {
  const r = pickExact({ line: L("unsalted butter", 1, "cup", "Dairy & Eggs"), products: recorded("unsalted butter"), gramsPerCup: 227 });
  assert.equal(r.status, "pick");
  for (const row of r.ranked) assert.match(row.product.name, /unsalted/i);
  for (const row of r.ranked) assert.doesNotMatch(row.product.name, /plant|becel|margarine|peanut|almond/i);
});

// ---------------------------------------------------------------- r2: Line audit 6f8a (Nov 7)

const I = (name: string, ingredients: string, size = "500 g", price = 4.99) => P(name, size, price, { ingredients });

test("r2 allergy: a may-contain / traces / facility sentence that names the allergen fails it", () => {
  const nuts = { allergies: ["nuts"] };
  for (const panel of [
    "Oats, sugar. May contain traces of tree nuts.",
    "Oats, sugar. May contain: peanuts.",
    "Oats, sugar. May contain peanuts or other nuts.",
    "Oats, sugar. Made in a facility that also processes tree nuts.",
    "Oats, sugar. Processed in a facility with peanuts",
    "Oats, sugar; manufactured on shared equipment with almonds",
    "Oats, sugar. Produced in a plant that handles nuts.",
  ]) {
    assert.ok(shieldBlocks(I("Granola", panel), nuts).length > 0, panel);
  }
  assert.ok(shieldBlocks(I("Crackers", "Rice, salt. May contain traces of milk."), { allergies: ["dairy"] }).length);
  assert.ok(shieldBlocks(I("Rice Crackers", "Rice, salt. Processed in a facility with wheat."), { allergies: ["gluten"] }).length);
  assert.ok(shieldBlocks(I("Pretzels", "Corn, salt. May contain traces of sesame seeds."), { allergies: ["sesame"] }).length);
  assert.ok(shieldBlocks(I("Fish Sticks", "Pollock. May contain crustaceans."), { allergies: ["shellfish"] }).length);
  assert.ok(shieldBlocks(I("Pasta", "Durum semolina. May contain: egg."), { allergies: ["egg"] }).length);
  // A "free" claim is not a warning.
  assert.deepEqual(shieldBlocks(I("Granola", "Oats, honey. Made in a peanut-free facility."), nuts), []);
  assert.deepEqual(shieldBlocks(I("Granola", "Oats, honey. Produced in a facility free from peanuts and tree nuts."), nuts), []);
  assert.deepEqual(shieldBlocks(I("Granola", "Oats, honey. May contain traces of sesame."), nuts), []);
});

test("r2 lookalikes: eggplant isn't egg; plant milk and nut butters pass vegan when clean", () => {
  const egg = { allergies: ["egg"] };
  const vegan = { prefs: ["vegan"] };
  assert.deepEqual(shieldBlocks(P("Eggplant", "1 ea", 1.99), egg), []);
  assert.deepEqual(shieldBlocks(I("Coconut Milk", "Coconut, water, guar gum.", "400 ml", 1.99), vegan), []);
  assert.deepEqual(shieldBlocks(I("Smooth Peanut Butter", "Peanuts, hydrogenated vegetable oil, salt."), vegan), []);
  assert.deepEqual(shieldBlocks(I("Becel Plant Butter", "Plant oils (palm, canola, avocado), water, salt, natural flavour.", "454 g"), vegan), []);
  assert.deepEqual(shieldBlocks(I("Unsweetened Almond Beverage", "Filtered water, almonds, calcium carbonate, sunflower lecithin.", "1.89 L"), { prefs: ["vegan"], allergies: ["soy"] }), []);
  assert.deepEqual(shieldBlocks(I("Dark Chocolate", "Cocoa mass, sugar, cocoa butter."), { allergies: ["dairy"] }), []);
  assert.deepEqual(shieldBlocks(I("Vegetable Broth", "Water, carrot, onion, celery, salt.", "900 ml"), { prefs: ["vegetarian"] }), []);
  assert.deepEqual(shieldBlocks(P("Honeycrisp Apples", "1.36 kg", 5.99), vegan), []);
  assert.deepEqual(shieldBlocks(P("Butternut Squash", "1 ea", 2.99), { allergies: ["dairy"] }), []);
  assert.deepEqual(shieldBlocks(P("Sugar Snap Peas", "227 g", 3.49), { prefs: ["sugar-free"] }), []);
  assert.deepEqual(shieldBlocks(I("Buckwheat Groats", "Buckwheat."), { allergies: ["gluten"] }), []);
  assert.deepEqual(shieldBlocks(I("Scalloped Potatoes Kit", "Potatoes, corn starch, salt, onion powder."), { allergies: ["shellfish"] }), []);
  assert.deepEqual(shieldBlocks(I("Provolone Slices", "Pasteurized milk, salt, bacterial culture, microbial enzyme."), egg), []);
  assert.deepEqual(shieldBlocks(I("Chilean Sea Bass Fillet", "Chilean sea bass."), { allergies: ["spicy"] }), []);
  assert.deepEqual(shieldBlocks(I("Rice Noodles", "Rice flour, water."), { allergies: ["gluten"] }).filter((x) => !/flour/.test(x)), shieldBlocks(I("Rice Noodles", "Rice flour, water."), { allergies: ["gluten"] }));
  // The real thing still blocks.
  assert.ok(shieldBlocks(I("Smooth Peanut Butter", "Peanuts, salt."), { allergies: ["nuts"] }).length);
  assert.ok(shieldBlocks(P("Salted Butter", "454 g", 5.99), vegan).length);
  assert.ok(shieldBlocks(I("Egg Noodles", "Wheat flour, eggs."), egg).length);
  assert.ok(shieldBlocks(I("Chicken Broth", "Chicken stock, salt.", "900 ml"), { prefs: ["vegetarian"] }).length);
  assert.ok(shieldBlocks(I("Coconut Milk", "Coconut, water, sodium caseinate.", "400 ml"), vegan).length);
  assert.ok(shieldBlocks(I("Honey Granola", "Oats, honey."), vegan).length);
});

test("r2 printed can size: 2 cans (796 ml) covers 1,592 ml", () => {
  assert.deepEqual(needAmount(L("canned diced tomatoes (796 ml)", 2, "can")), { ml: 1592, printed: true });
  assert.equal(needAmount(L("canned diced tomatoes 28 fl oz", 1, "can")).canFlOz, 28); // r5: fl oz cans match by Imperial–US range
  assert.deepEqual(needAmount(L("can (796 ml) diced tomatoes", 2, "")), { ml: 1592, printed: true });
  assert.deepEqual(needAmount(L("canned diced tomatoes", 2, "can")), { packages: 2 });
  const r = pickExact({ line: L("canned diced tomatoes (796 ml)", 2, "can"), products: [P("No Name Diced Tomatoes", "398 ml", 1.29)] });
  assert.equal(picked(r), "No Name Diced Tomatoes|4");
  assert.equal(r.pick!.cover.totalCad, 5.16);
  // Both sizes on the shelf: the size is stated, so no size question, cheapest total that covers 1,592 ml.
  const both = pickExact({ line: L("canned diced tomatoes (796 ml)", 2, "can"), products: [P("No Name Diced Tomatoes", "398 ml", 1.29), P("No Name Diced Tomatoes", "796 ml", 1.79)] });
  assert.equal(picked(both), "No Name Diced Tomatoes|2");
  assert.equal(both.pick!.product.ml, 796);
  // A pack with no volume can't be shown to cover a printed ml size: ask, don't guess.
  const unsized = pickExact({ line: L("canned diced tomatoes (796 ml)", 2, "can"), products: [P("No Name Diced Tomatoes", "1 ea", 1.29)] });
  assert.equal(unsized.status, "ask");
});

test("r2 bare cheese always asks, even with one kind on the shelf", () => {
  const two = pickExact({ line: L("cheese", 200, "g"), products: [P("Black Diamond Old Cheddar Cheese", "400 g", 6.49), P("Mozzarella Cheese", "340 g", 5.49)] });
  assert.equal(two.status, "ask");
  assert.equal(two.pick, null);
  assert.deepEqual(two.choices.map((c) => c.differs[0]).sort(), ["mozzarella", "old cheddar"]);
  const one = pickExact({ line: L("shredded cheese", 1, "cup"), products: [P("Mozzarella Cheese", "340 g", 5.49)], gramsPerCup: 113 });
  assert.equal(one.status, "ask");
  // A named cheese picks.
  assert.equal(picked(pickExact({ line: L("old cheddar cheese", 200, "g"), products: [P("Black Diamond Old Cheddar Cheese", "400 g", 6.49)] })), "Black Diamond Old Cheddar Cheese|1");
});

test("r2 organic: wins when cheapest, required only when asked, excluded when the user says no organic", () => {
  const shelf = [P("PC Organics Organic Carrots", "1.36 kg", 2.29), P("Carrots", "1.36 kg", 2.49)];
  assert.equal(picked(pickExact({ line: L("carrots", 1, "kg"), products: shelf })), "PC Organics Organic Carrots|1");
  assert.equal(picked(pickExact({ line: L("carrots", 1, "kg"), products: [P("PC Organics Organic Carrots", "1.36 kg", 3.49), P("Carrots", "1.36 kg", 2.49)] })), "Carrots|1");
  assert.equal(picked(pickExact({ line: L("organic carrots", 1, "kg"), products: [P("Carrots", "1.36 kg", 1.99), P("PC Organics Organic Carrots", "1.36 kg", 3.49)] })), "PC Organics Organic Carrots|1");
  // The user says they don't want organic: on the line, or as a profile setting.
  for (const name of ["non-organic carrots", "carrots, not organic", "conventional carrots"]) {
    const r = pickExact({ line: L(name, 1, "kg"), products: shelf });
    assert.equal(picked(r), "Carrots|1", name);
    assert.ok(r.ranked.every((x) => !/organic/i.test(x.product.name)), name);
  }
  const prof = pickExact({ line: L("carrots", 1, "kg"), products: shelf, profile: { prefs: ["no-organic"] } });
  assert.equal(picked(prof), "Carrots|1");
  const onlyOrganic = pickExact({ line: L("carrots", 1, "kg"), products: [shelf[0]!], profile: { prefs: ["no-organic"] } });
  assert.equal(onlyOrganic.status, "ask");
  assert.equal(onlyOrganic.choices.length, 0);
  assert.equal(parseAttrs("non-organic carrots").organic, false);
});

test("r2 ungraded ground meat: regular/medium/unlabelled first; else cheapest grade with the reason", () => {
  const r = pickExact({ line: L("ground beef", 454, "g"), products: [P("Lean Ground Beef", "454 g", 5.99), P("Medium Ground Beef", "454 g", 6.49), P("Extra Lean Ground Beef", "454 g", 7.99)] });
  assert.equal(picked(r), "Medium Ground Beef|1");
  assert.doesNotMatch(r.reason, /cheapest grade/);
  const leanOnly = pickExact({ line: L("ground beef", 454, "g"), products: [P("Extra Lean Ground Beef", "454 g", 7.99), P("Lean Ground Beef", "454 g", 6.99)] });
  assert.equal(picked(leanOnly), "Lean Ground Beef|1");
  assert.match(leanOnly.reason, /No regular or medium ground beef on the shelf, so this is the cheapest grade \(lean\)/);
  // A named grade is still exact.
  assert.equal(pickExact({ line: L("lean ground beef", 454, "g"), products: [P("Extra Lean Ground Beef", "454 g", 8.49)] }).status, "ask");
});

test("r2 a free-from claim only removes what follows it, never the ingredients before it", () => {
  assert.ok(shieldBlocks(I("Peanut Brittle", "Peanuts, sugar, corn syrup, free from artificial colours."), { allergies: ["nuts"] }).length);
  assert.ok(shieldBlocks(I("Cookies", "Wheat flour, sugar. Free from peanuts. May contain traces of tree nuts."), { allergies: ["nuts"] }).length);
});

test("r2 one eggplant against a priced-by-weight single item counts one item, egg shield passes", () => {
  const r = pickExact({ line: L("eggplant", 1, "ea"), products: [P("Indian Eggplant", "$7.71/1kg", 0.77)], profile: { allergies: ["egg"] } });
  assert.equal(picked(r), "Indian Eggplant|1");
  assert.equal(r.pick!.cover.totalCad, 0.77);
});

test("r3 choices never offer a different product type: soy milk is not soy sauce, tamari is", () => {
  const shelf = [
    I("Earth's Own Gluten-Free Original Soy Milk Alternative", "Water, soybeans, cane sugar.", "1.75 L", 4.79),
    I("San J Organic Gluten-Free Tamari", "Water, organic soybeans, salt, organic alcohol.", "296 ml", 8.29),
    I("President's Choice Beef and Broccoli", "Beef, broccoli, soy sauce (water, soybeans, wheat, salt).", "350 g", 3.75),
    I("No Name Light Soy Sauce", "Water, wheat, soybeans, salt.", "450 ml", 2.5),
  ];
  const r = pickExact({ line: L("soy sauce", 2, "tbsp"), products: shelf, profile: { prefs: ["gluten-free"] } });
  assert.equal(r.status, "ask");
  assert.equal(r.choices.length, 1);
  assert.match(r.choices[0]!.product.name, /Tamari/);
  assert.match(r.choices[0]!.label, /sold as tamari, a soy sauce/);
  assert.ok(r.choices.every((c) => !/Soy Milk|Beef and Broccoli/.test(c.product.name)));
  assert.match(r.reason, /the only close one of the same kind/);
  // Without the gluten setting the regular soy sauce is the exact pick; tamari is never silently substituted.
  assert.equal(picked(pickExact({ line: L("soy sauce", 2, "tbsp"), products: shelf })), "No Name Light Soy Sauce|1");
  assert.equal(pickExact({ line: L("soy sauce", 2, "tbsp"), products: [shelf[1]!] }).status, "ask");
});

test("r3 nothing of the same kind on the shelf: no choices, and the reason says nothing fits", () => {
  const r = pickExact({
    line: L("granola", 500, "g"),
    products: [P("Cheerios Cereal", "778 g", 7.99), P("Corn Pops Cereal", "300 g", 5.49), I("Original Granola", "Oats. May contain traces of tree nuts.")],
    profile: { allergies: ["nuts"] },
  });
  assert.equal(r.status, "ask");
  assert.deepEqual(r.choices, []);
  assert.match(r.reason, /Every match failed your allergy or diet settings|Nothing on the shelf fits/);
  const none = pickExact({ line: L("granola", 500, "g"), products: [P("Cheerios Cereal", "778 g", 7.99), P("Corn Pops Cereal", "300 g", 5.49)] });
  assert.deepEqual(none.choices, []);
  assert.match(none.reason, /^Nothing on the shelf fits 500 g granola/);
});

test("r3 bare cheese choices are cheeses, not cream cheese or cheese spread", () => {
  const r = pickExact({
    line: L("cheese", 200, "g"),
    products: [P("No Name Pasteurized Cream Cheese", "250 g", 2.98), P("Cheez Whiz Cheese Spread", "450 g", 4.99), P("No Name Old Cheddar Cheese", "200 g", 3.99), P("Mozzarella Cheese", "340 g", 5.49)],
  });
  assert.equal(r.status, "ask");
  assert.deepEqual(r.choices.map((c) => c.product.name).sort(), ["Mozzarella Cheese", "No Name Old Cheddar Cheese"]);
});

// ---------------------------------------------------------------- r4: Line audit 2703 (Nov 7)

test("r4 a whole-word 'nut' anywhere on the label fails a nut allergy", () => {
  const nuts = { allergies: ["nuts"] };
  for (const s of [
    "Not suitable for people with nut allergies.",
    "Not suitable for those with a nut allergy.",
    "Allergy advice: contains nut.",
    "Unsuitable for nut allergy sufferers.",
    "Warning: nut allergy.",
    "Contains: nut.",
    "Contains: Nut",
  ]) {
    assert.ok(shieldBlocks(I("Plain Granola", `Oats, sugar, sunflower oil. ${s}`), nuts).length, s);
  }
  assert.ok(shieldBlocks(P("Mixed Nut Bar", "200 g", 3.99), nuts).length);
});

test("r4 nutmeg, coconut, butternut and doughnut still pass a nut allergy", () => {
  const nuts = { allergies: ["nuts"] };
  assert.deepEqual(shieldBlocks(I("Ground Nutmeg", "Nutmeg."), nuts), []);
  assert.deepEqual(shieldBlocks(I("Coconut Milk", "Coconut, water, guar gum.", "400 ml"), nuts), []);
  assert.deepEqual(shieldBlocks(P("Butternut Squash", "1 ea", 2.99), nuts), []);
  assert.deepEqual(shieldBlocks(I("Plain Doughnuts", "Enriched wheat flour, sugar, palm oil, salt, yeast."), nuts), []);
  assert.deepEqual(shieldBlocks(I("Spiced Cake", "Flour, sugar, nutmeg, cinnamon, coconut oil."), nuts), []);
  assert.deepEqual(shieldBlocks(I("Granola", "Oats, honey. Made in a nut-free facility."), nuts), []);
});

test("r4 cheese ruling: bare cheese asks; mozzarella, feta and brie may be choices; curd cheeses and spreads never", () => {
  const r = pickExact({
    line: L("cheese", 200, "g"),
    products: [
      P("Black Diamond Old Cheddar Cheese", "400 g", 6.49),
      P("Mozzarella Cheese", "340 g", 5.49),
      P("Philadelphia Cream Cheese", "250 g", 3.49),
      P("Cottage Cheese", "500 g", 4.29),
      P("Ricotta Cheese", "475 g", 4.99),
      P("Feta Cheese", "200 g", 5.99),
      P("Brie Cheese", "200 g", 6.99),
      P("Cheez Whiz Cheese Spread", "250 g", 3.99),
    ],
  });
  assert.equal(r.status, "ask");
  assert.equal(r.pick, null);
  assert.equal(r.choices.length, 3);
  for (const c of r.choices) assert.doesNotMatch(c.product.name, /cream cheese|cottage|ricotta|spread|whiz/i);
  // Every allowed kind can be offered; the three cheapest are shown.
  assert.deepEqual(r.choices.map((c) => c.product.name).sort(), ["Feta Cheese", "Mozzarella Cheese", "Black Diamond Old Cheddar Cheese"].sort());
  const soft = pickExact({ line: L("cheese", 200, "g"), products: [P("Brie Cheese", "200 g", 6.99), P("Philadelphia Cream Cheese", "250 g", 3.49)] });
  assert.deepEqual(soft.choices.map((c) => c.product.name), ["Brie Cheese"]);
});

test("r5 'N cans (X fl oz)' takes N of a shelf can whose metric size is X fl oz, Imperial to US", () => {
  // 28 fl oz = 795.6 ml Imperial … 828.1 ml US; the 796 ml can is that can.
  assert.equal(canMatchesFlOz(796, 28), true);
  assert.equal(canMatchesFlOz(828, 28), true);
  assert.equal(canMatchesFlOz(540, 19), true);
  assert.equal(canMatchesFlOz(398, 14), true);
  assert.equal(canMatchesFlOz(355, 12), true);
  assert.equal(canMatchesFlOz(398, 28), false);
  assert.equal(canMatchesFlOz(750, 28), false);
  assert.equal(canMatchesFlOz(840, 28), false);
  const n = needAmount(L("canned diced tomatoes (28 fl oz)", 2, "cans"));
  assert.equal(n.cans, 2);
  assert.equal(n.canFlOz, 28);
  assert.equal(Math.round(n.ml!), Math.round(2 * 28 * US_FL_OZ_ML));
  const both = pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("No Name Diced Tomatoes", "398 ml", 1.29), P("No Name Diced Tomatoes", "796 ml", 1.79)] });
  assert.equal(picked(both), "No Name Diced Tomatoes|2");
  assert.equal(both.pick!.product.ml, 796);
  assert.equal(both.pick!.cover.totalCad, 3.58);
  // A US-size 828 ml can is the same can.
  assert.equal(picked(pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("Hunt's Diced Tomatoes", "828 ml", 2.49)] })), "Hunt's Diced Tomatoes|2");
  const k6 = pickExact({ line: L("canned diced tomatoes 19 fl oz", 2, "can"), products: [P("No Name Diced Tomatoes", "540 ml", 1.59)] });
  assert.equal(picked(k6), "No Name Diced Tomatoes|2");
});

test("r5 no matching can size: cover the US volume, never less", () => {
  // Only 398 ml cans for 2 × 28 fl oz: US volume 1,656 ml → 5 × 398 ml (4 × 398 = 1,592 ml would be short).
  const small = pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("No Name Diced Tomatoes", "398 ml", 1.29)] });
  assert.equal(picked(small), "No Name Diced Tomatoes|5");
  assert.ok(small.pick!.cover.packs * 398 >= 2 * 28 * US_FL_OZ_ML);
  // A 750 ml can is neither 28 fl oz measure: 3 × 750 ml covers 1,656 ml.
  const odd = pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("Import Diced Tomatoes", "750 ml", 2.0)] });
  assert.equal(odd.pick?.cover.packs, 3);
});

test("r5 a loose fl oz amount converts at the US rate", () => {
  assert.equal(Math.round(needAmount(L("pasta sauce 24 fl oz", 1, "jar")).ml!), Math.round(24 * US_FL_OZ_ML));
  assert.equal(Math.round(needAmount(L("milk", 12, "fl oz")).ml!), Math.round(12 * US_FL_OZ_ML));
  // 24 fl oz US = 710 ml: a 700 ml jar (enough in Imperial, 682 ml) is not enough; the 750 ml jar is.
  const jar = pickExact({ line: L("pasta sauce 24 fl oz", 1, "jar"), products: [P("Tomato Basil Pasta Sauce", "700 ml", 2.99), P("Tomato Basil Pasta Sauce", "750 ml", 3.49)] });
  assert.equal(jar.pick?.product.ml, 750);
  assert.equal(jar.pick?.cover.packs, 1);
});

test("r5 a product with no metric size asks for a fl oz line", () => {
  const r = pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("No Name Diced Tomatoes", "1 ea", 1.79)] });
  assert.equal(r.status, "ask");
  assert.equal(r.pick, null);
  const byWeight = pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("No Name Diced Tomatoes", "796 g", 1.79)] });
  assert.equal(byWeight.status, "ask");
});

test("r4 a bare oz is weight: grams against the product's weight; a volume-only product asks", () => {
  const need = needAmount(L("canned diced tomatoes (28 oz)", 2, "cans"));
  assert.equal(need.ml, undefined);
  assert.equal(Math.round(need.g!), Math.round(2 * 28 * 28.35));
  // Products listed by weight: 2 × 19 oz = 1,077 g is covered by 2 × 540 g; 2 × 28 oz = 1,588 g needs 2 × 796 g
  // (3 × 540 g = $3.87 also covers but costs more than 2 × 796 g = $3.58).
  const byWeight = pickExact({ line: L("chickpeas (19 oz)", 2, "cans"), products: [P("No Name Chickpeas", "540 g", 1.49), P("Unico Chickpeas", "796 g", 2.49)] });
  assert.equal(byWeight.status, "pick");
  assert.equal(byWeight.pick!.cover.totalCad, 2.98);
  assert.equal(byWeight.pick!.product.grams, 540);
  assert.ok(byWeight.pick!.cover.packs * 540 >= 2 * 19 * 28.35);
  const heavy = pickExact({ line: L("diced tomatoes (28 oz)", 2, "cans"), products: [P("No Name Diced Tomatoes", "796 g", 1.79), P("No Name Diced Tomatoes", "540 g", 1.29)] });
  assert.equal(picked(heavy), "No Name Diced Tomatoes|2");
  assert.equal(heavy.pick!.product.grams, 796);
  // The product only lists a volume: oz weight isn't converted to ml, so the picker asks.
  const volumeOnly = pickExact({ line: L("canned diced tomatoes (28 oz)", 2, "cans"), products: [P("No Name Diced Tomatoes", "398 ml", 1.29), P("No Name Diced Tomatoes", "796 ml", 1.79)] });
  assert.equal(volumeOnly.status, "ask");
  assert.equal(volumeOnly.pick, null);
  const k6 = pickExact({ line: L("canned diced tomatoes 19 oz", 2, "can"), products: [P("No Name Diced Tomatoes", "540 ml", 1.59)] });
  assert.equal(k6.status, "ask");
});

test("r5 can range edges follow the ruling: X × 28.41 … X × 29.57 ml, whole-ml labels", () => {
  // 28 × 28.41 = 795.48 and 28 × 29.57 = 827.96.
  assert.equal(canMatchesFlOz(795, 28), true);
  assert.equal(canMatchesFlOz(794, 28), false);
  assert.equal(canMatchesFlOz(828, 28), true);
  assert.equal(canMatchesFlOz(829, 28), false);
  // 10 × 28.41 = 284.1: the 284 ml can; 12 × 29.57 = 354.84: the 355 ml can.
  assert.equal(canMatchesFlOz(284, 10), true);
  assert.equal(canMatchesFlOz(355, 12), true);
  assert.equal(canMatchesFlOz(341, 12), true);
  assert.equal(canMatchesFlOz(340, 12), true);
  assert.equal(canMatchesFlOz(339, 12), false);
});

test("r5 when the shelf has the named can, take N of it even if smaller cans are cheaper in total", () => {
  const r = pickExact({
    line: L("canned diced tomatoes (28 fl oz)", 2, "cans"),
    products: [P("No Name Diced Tomatoes", "398 ml", 0.5), P("No Name Diced Tomatoes", "796 ml", 1.79), P("Hunt's Diced Tomatoes", "828 ml", 1.99)],
  });
  assert.equal(picked(r), "No Name Diced Tomatoes|2");
  assert.equal(r.pick!.product.ml, 796);
  assert.ok(r.ranked.every((x) => x.product.ml === 796 || x.product.ml === 828));
});

test("r5 products that list only fl oz (no metric size) ask, for can lines and loose fl oz lines", () => {
  const can = pickExact({ line: L("canned diced tomatoes (28 fl oz)", 2, "cans"), products: [P("Imported Diced Tomatoes", "28 fl oz", 1.99)] });
  assert.equal(can.status, "ask");
  assert.equal(can.pick, null);
  const loose = pickExact({ line: L("coconut milk", 8, "fl oz"), products: [P("Coconut Milk", "13.5 fl oz", 2.49)] });
  assert.equal(loose.status, "ask");
  const metric = pickExact({ line: L("coconut milk", 8, "fl oz"), products: [P("Coconut Milk", "13.5 fl oz", 2.49), P("Thai Kitchen Coconut Milk", "400 ml", 1.99)] });
  assert.equal(picked(metric), "Thai Kitchen Coconut Milk|1");
});

test("r5 other fl oz spellings are fl oz, never weight oz; a metric size on the line wins", () => {
  for (const name of ["canned diced tomatoes 28 US fl oz", "canned diced tomatoes 28 fluid ounces", "canned diced tomatoes 28 fl. oz."]) {
    const n = needAmount(L(name, 1, "can"));
    assert.equal(n.canFlOz, 28, name);
    assert.equal(n.g, undefined, name);
    assert.equal(Math.round(n.ml!), 828, name);
    // Only 398 ml cans: cover 828 ml (3 cans), never 1 can.
    const r = pickExact({ line: L(name, 1, "can"), products: [P("No Name Diced Tomatoes", "398 ml", 1.29)] });
    assert.equal(r.pick?.cover.packs, 3, name);
  }
  assert.equal(needAmount(L("canned diced tomatoes 28 fl oz (796 ml)", 1, "can")).ml, 796);
  assert.equal(needAmount(L("canned diced tomatoes 28 fl oz (796 ml)", 2, "cans")).ml, 1592);
  assert.equal(Math.round(needAmount(L("milk", 8, "fluid ounces")).ml!), Math.round(8 * US_FL_OZ_ML));
});

test("r5 chestnut fails a nut allergy (fail safe); water chestnut passes", () => {
  const nuts = { allergies: ["nuts"] } as never;
  const p = (name: string, ingredients: string) => ({ name, ingredients, priceCad: 1, brand: "superstore", sizeLabel: "" }) as never;
  assert.ok(shieldBlocks(p("Roasted Chestnuts", "Chestnuts."), nuts).length > 0);
  assert.equal(shieldBlocks(p("Sliced Water Chestnuts", "Water chestnuts, water."), nuts).length, 0);
});
