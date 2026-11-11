import assert from "node:assert/strict";
import test from "node:test";
import { withDietScreen } from "./catalog-final.ts";
import { isPescatarian, isVegan, isVegetarian } from "./diet.ts";
import { PESC_DOUBT_R6, PESC_STOCK_NAMED } from "./pescatarian-doubt.ts";
import { RECIPES } from "./recipes.ts";
import { recipeAllergens, SHELLFISH_INGREDIENT, SHELLFISH_STEP } from "./shield.ts";
import { shield4TermFails } from "./shields4.ts";
import { XREF_GRAPH, XREF_OLD_INHERITED } from "./shields4-xref.ts";

// Nov 11 r6 (Line audit 7624 on safety r5 76f2455a): pescatarian word lists (meat, frog legs), unnamed stock / broth /
// bouillon / drippings / fat rows, a steps-only verbatim table, hand-read HTCF stock, and roe / caviar for vegetarian.
const byId = new Map(RECIPES.map((r) => [r.id, r]));
const get = (id: string) => {
  const r = byId.get(id);
  assert.ok(r, id);
  return r;
};
const printed = (id: string) => {
  const r = get(id);
  return [r.name, ...r.ingredients.map((i) => i.name), ...r.steps].join(" | ");
};

test("counts: pescatarian 3987 -> 3575, vegetarian 801 -> 800 (kleber-0205)", () => {
  assert.equal(RECIPES.filter(isPescatarian).length, 3575);
  assert.equal(RECIPES.filter(isVegetarian).length, 800);
});

// Line 7624 ruling 1: Caviare Dressing, and every roe / caviar / fish-egg word.
test("vegetarian: kleber-0205 Caviare Dressing fails vegetarian and vegan; no roe, caviar or fish-egg word passes either", () => {
  assert.equal(isVegetarian(get("kleber-0205")), false);
  assert.equal(isVegan(get("kleber-0205")), false);
  const ROE = /\b(?:caviare?s?|roes?|fish[- ]eggs?|bottarga|tarama(?:salata)?|ikura|tobiko|masago|lumpfish|coral)\b/i;
  const hits = RECIPES.filter((r) => ROE.test([r.name, r.description ?? "", ...r.ingredients.map((i) => i.name), ...r.steps].join(" | ")));
  assert.ok(hits.length >= 79, `${hits.length} roe/caviar recipes`);
  for (const r of hits) assert.ok(!isVegetarian(r) && !isVegan(r), r.id);
});

test("invariant: a vegetarian or vegan pass has no fish or shellfish term in its name or rows (the shields' own lists)", () => {
  const fishOrShellfish = (id: string) => {
    const r = withDietScreen(get(id));
    const blob = [r.name, ...r.ingredients.map((i) => i.name)].join(" | ");
    return shield4TermFails({ ...r, steps: [], description: "" }).has("fish") || SHELLFISH_INGREDIENT.test(blob) || SHELLFISH_STEP.test(blob);
  };
  let n = 0;
  for (const r of RECIPES) {
    if (!isVegetarian(r) && !isVegan(r)) continue;
    n++;
    assert.equal(fishOrShellfish(r.id), false, `${r.id} passes vegetarian/vegan with a fish or shellfish word`);
  }
  assert.ok(n >= 800);
  assert.equal(fishOrShellfish("kleber-0205"), true, "the invariant sees the caviare row");
  assert.ok(recipeAllergens(get("kleber-0205")).includes("fish"));
});

// Line 7624 ruling 2: the 21 meat ids and 25 frog ids; fixed in the word lists (diet.ts PESC_MEAT), not by id.
const LINE_MEAT = [
  "cris-006", "ds-mar-13-rennet-puffs", "ds-may-08-wine-custard", "fd-dec-10-jewish-stewed-cabbage",
  "fd-feb-15-oriental-stewed-prawns", "fd-nov-13-belgian-sweet-potato-pur-e", "hill-0127", "hill-0129", "hill-0219",
  "htcf-0281", "htcf-0737", "ip-shrimp-boil", "kleber-0069", "kleber-0208", "kleber-0265", "km-023", "km-096",
  "pta-093", "vh-kp-foil-potato", "ys-017", "ys-052",
];
const LINE_FROG = [
  "htcf-0295", "htcf-0296", "htcf-0297", "htcf-0298", "htcf-0299", "htcf-0301", "htcf-0302", "htcf-0303", "htcf-0304",
  "htcf-0305", "htcf-0306", "htcf-0307", "htcf-0309", "htcf-0310", "htcf-0311", "htcf-0312", "htcf-0313", "htcf-0314",
  "htcf-0315", "htcf-0316", "htcf-0317", "htcf-0318", "htcf-0319", "htcf-0320", "so-frogs-legs",
];
test("pescatarian: Line's 21 meat ids and 25 frog-leg ids all fail", () => {
  assert.equal(LINE_MEAT.length, 21);
  assert.equal(LINE_FROG.length, 25);
  for (const id of [...LINE_MEAT, ...LINE_FROG]) assert.equal(isPescatarian(get(id)), false, id);
});

// Line 7624 ruling 3: unnamed stock / broth rows, and "deep fat" / "hot fat" / bare "fat" rows.
const LINE_STOCK = [
  "ds-jun-11-turkish-sherbet", "fd-apr-30-italian-soup", "fd-aug-21-oriental-cabbage", "fd-aug-23-greek-cucumbers",
  "fd-jun-04-oriental-vegetable-curry", "fd-sep-10-spanish-rice", "hill-0194", "hill-0265", "hill-0270", "hill-0292",
  "hill-0294", "hill-0310", "hill-0336", "hill-0339", "hill-0349", "htcf-0026", "htcf-0034", "htcf-0052", "htcf-0056",
  "htcf-0058", "htcf-0059", "htcf-0062", "htcf-0063", "htcf-0065", "htcf-0068", "htcf-0070", "htcf-0071", "htcf-0074",
  "htcf-0076", "htcf-0083", "htcf-0084", "htcf-0108", "htcf-0114", "htcf-0122", "htcf-0143", "htcf-0164", "htcf-0179",
  "htcf-0180", "htcf-0183", "htcf-0196", "htcf-0203", "htcf-0206", "htcf-0213", "htcf-0215", "htcf-0216", "htcf-0217",
  "htcf-0218", "htcf-0219", "htcf-0224", "htcf-0225", "htcf-0228", "htcf-0230", "htcf-0233", "htcf-0234", "htcf-0236",
  "htcf-0265", "htcf-0272", "htcf-0273", "htcf-0275", "htcf-0286", "htcf-0369", "htcf-0428", "htcf-0474", "htcf-0489",
  "htcf-0491", "htcf-0496", "htcf-0497", "htcf-0499", "htcf-0500", "htcf-0506", "htcf-0507", "htcf-0508", "htcf-0509",
  "htcf-0510", "htcf-0515", "htcf-0519", "htcf-0520", "htcf-0541", "htcf-0565", "htcf-0567", "htcf-0569", "htcf-0573",
  "htcf-0584", "htcf-0592", "htcf-0623", "htcf-0624", "htcf-0631", "htcf-0647", "htcf-0648", "htcf-0651", "htcf-0652",
  "htcf-0656", "htcf-0659", "htcf-0660", "htcf-0662", "htcf-0668", "htcf-0669", "htcf-0686", "htcf-0693", "htcf-0734",
  "htcf-0738", "htcf-0741", "htcf-0758", "htcf-0764", "htcf-0784", "htcf-0787", "htcf-0791", "htcf-0793", "htcf-0797",
  "htcf-0798", "htcf-0801", "htcf-0828", "htcf-0833", "htcf-0835", "htcf-0843", "htcf-0861", "htcf-0869", "htcf-0871",
  "htcf-0874", "htcf-0875", "htcf-0876", "htcf-0877", "htcf-0884", "htcf-0918", "htcf-0919", "htcf-0930", "htcf-0945",
  "htcf-0946", "htcf-0950", "htcf-0958", "htcf-0959", "htcf-0963", "htcf-0964", "htcf-0975", "htcf-0980", "htcf-0981",
  "htcf-0998", "htcf-1000", "htcf-1003", "htcf-1031", "htcf-1035", "htcf-1047", "htcf-1071", "htcf-1080", "htcf-1108",
  "htcf-1116", "htcf-1130", "htcf-1150", "htcf-1152", "htcf-1153", "htcf-1171", "htcf-1178", "htcf-1181", "htcf-1182",
  "kfyr-127", "kleber-0262", "kr-gyeran-jjim", "so-horseradish-sauce", "so-madame-begue-soup",
];
const LINE_FAT = [
  "ds-jan-20-fritters-with-lemon-sauce", "ds-jul-06-crusades", "ds-jun-05-cerealine-fritters-with-apples",
  "ds-mar-11-potato-rolls-for-dessert", "ds-may-21-cerealine-blocks-with-jelly", "ds-oct-08-fruit-croquettes",
  "ds-sep-18-a-sweet-potato-pudding", "fd-sep-03-jewish-chrimsel", "hill-0182", "htcf-0013", "htcf-0047", "htcf-0048",
  "htcf-0051", "htcf-0060", "htcf-0096", "htcf-0100", "htcf-0103", "htcf-0104", "htcf-0120", "htcf-0121", "htcf-0128",
  "htcf-0131", "htcf-0133", "htcf-0177", "htcf-0190", "htcf-0197", "htcf-0199", "htcf-0207", "htcf-0211", "htcf-0214",
  "htcf-0274", "htcf-0277", "htcf-0284", "htcf-0287", "htcf-0326", "htcf-0327", "htcf-0341", "htcf-0343", "htcf-0400",
  "htcf-0401", "htcf-0406", "htcf-0418", "htcf-0420", "htcf-0431", "htcf-0443", "htcf-0452", "htcf-0453", "htcf-0511",
  "htcf-0529", "htcf-0531", "htcf-0545", "htcf-0546", "htcf-0580", "htcf-0585", "htcf-0637", "htcf-0640", "htcf-0641",
  "htcf-0642", "htcf-0646", "htcf-0687", "htcf-0688", "htcf-0689", "htcf-0690", "htcf-0691", "htcf-0692", "htcf-0694",
  "htcf-0695", "htcf-0730", "htcf-0760", "htcf-0772", "htcf-0774", "htcf-0775", "htcf-0821", "htcf-0822", "htcf-0824",
  "htcf-0841", "htcf-0842", "htcf-0844", "htcf-0845", "htcf-0846", "htcf-0847", "htcf-0848", "htcf-0865", "htcf-0878",
  "htcf-0899", "htcf-0900", "htcf-0901", "htcf-0902", "htcf-0903", "htcf-0904", "htcf-0905", "htcf-0906", "htcf-0907",
  "htcf-0916", "htcf-0921", "htcf-0933", "htcf-0934", "htcf-0936", "htcf-0937", "htcf-0938", "htcf-0940", "htcf-0941",
  "htcf-0944", "htcf-0960", "htcf-0965", "htcf-0983", "htcf-0991", "htcf-1004", "htcf-1018", "htcf-1022", "htcf-1023",
  "htcf-1024", "htcf-1079", "htcf-1083", "htcf-1085", "htcf-1087", "htcf-1093", "htcf-1094", "htcf-1115", "htcf-1119",
  "htcf-1121", "htcf-1122", "htcf-1135", "htcf-1148", "htcf-1149", "htcf-1155", "htcf-1157", "htcf-1166", "htcf-1204",
  "htcf-1221", "idah-017", "kfyr-001", "kfyr-009", "so-fried-eggplant", "so-fried-okra", "so-fried-squash-cakes",
  "so-hush-puppies", "ys-037", "ys-044", "ys-053", "ys-057", "ys-097",
];
test("pescatarian: Line's 159 unnamed stock/broth rows and 142 bare fat rows fail; full-fat coconut milk is not fat", () => {
  assert.equal(LINE_STOCK.length, 159);
  assert.equal(LINE_FAT.length, 142);
  for (const id of [...LINE_STOCK, ...LINE_FAT]) assert.equal(isPescatarian(get(id)), false, id);
  // Line listed these three for a bare "fat" row; the row is "full-fat coconut milk" (plant), so they keep the pass.
  for (const id of ["plnt-023", "plnt-034", "plnt-077"]) {
    assert.match(printed(id), /full[- ]fat,? [^|]*coconut milk/i, id);
    assert.equal(isPescatarian(get(id)), true, id);
  }
});

test("steps-only table: every entry quotes its own recipe's print verbatim and fails pescatarian", () => {
  assert.equal(Object.keys(PESC_DOUBT_R6).length, 32);
  for (const [id, words] of Object.entries(PESC_DOUBT_R6)) {
    assert.ok(printed(id).includes(words), id);
    assert.equal(isPescatarian(get(id)), false, id);
  }
  for (const id of ["cris-006", "htcf-0737", "km-096", "vh-kp-foil-potato", "hill-0284"]) assert.ok(id in PESC_DOUBT_R6, id);
});

test("hand-read HTCF stock: stock its own text makes from fish passes; deep fat or a cross-reference still fails", () => {
  for (const [id, words] of Object.entries(PESC_STOCK_NAMED)) assert.ok(printed(id).includes(words), id);
  for (const id of ["htcf-0391", "htcf-0478", "htcf-0481", "htcf-1183"]) assert.equal(isPescatarian(get(id)), true, id);
  for (const id of ["htcf-0285", "htcf-0980", "htcf-0981"]) assert.equal(isPescatarian(get(id)), false, id);
  // White / brown / bare stock, "stock or water" and a bare court bouillon fail (HTCF Court Bouillon VIII has bacon).
  for (const id of ["htcf-0058", "htcf-0059", "htcf-1035", "htcf-0042", "htcf-0281"]) assert.equal(isPescatarian(get(id)), false, id);
});

test("named fish, shellfish or vegetable stock passes; non-food senses are not stock", () => {
  for (const id of ["htcf-0231", "kfyr-152", "so-oyster-soup", "kr-sundubu", "lentil-soup", "trp-059", "plnt-021", "htcf-0001", "bcx-072"])
    assert.equal(isPescatarian(get(id)), true, id);
});

test("edge cases: liquids each recipe makes itself from fish or vegetables pass; dripping / 'cooking stock' rows fail", () => {
  for (const id of ["so-shrimp-gumbo", "so-crayfish-bisque", "so-bouillabaisse", "vh-jw-gefilte", "malpeque-mussels", "plnt-002", "plnt-033"])
    assert.equal(isPescatarian(get(id)), true, id);
  for (const id of ["plnt-074", "htcf-0631", "htcf-0648", "ys-052", "kleber-0208", "kleber-0265"]) assert.equal(isPescatarian(get(id)), false, id);
});

test("cross-references (Line 7624 #5): new edges, and losses inherited through the graph", () => {
  assert.deepEqual(XREF_GRAPH["htcf-0176"], ["htcf-0173"]);
  assert.deepEqual(XREF_GRAPH["hill-0127"], ["hill-0126"]);
  assert.deepEqual(XREF_GRAPH["hill-0129"], ["hill-0126"]);
  assert.deepEqual(XREF_GRAPH["kleber-0213"], ["kleber-0206"]);
  assert.deepEqual(XREF_GRAPH["htcf-0965"], []);
  assert.deepEqual(XREF_GRAPH["htcf-1190"], []);
  assert.deepEqual(XREF_GRAPH["hill-0160"], ["hill-0159"]); // Turquoise Salad No. 1 passes, so No. 2 keeps its pass
  for (const id of ["hill-0127", "hill-0129", "ac-0034", "kleber-0213", "htcf-0282", "htcf-0283", "htcf-0287", "htcf-0181", "htcf-0479"]) {
    assert.ok(XREF_OLD_INHERITED[id]?.includes("pescatarian"), id);
    assert.equal(isPescatarian(get(id)), false, id);
  }
});
