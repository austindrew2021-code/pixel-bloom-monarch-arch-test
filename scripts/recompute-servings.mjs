// Sets a recipe's serving count where it is still carrying dish()'s stamped 4
// and the computed portion is plainly not one portion.
//
//   node --experimental-strip-types scripts/recompute-servings.mjs [--dry]
//
// Slice boundaries come from EVERY recipe start in the file, not only the ones
// being changed: bounding a slice by the next *wanted* recipe let an edit run
// past the end of its own recipe and rewrite a neighbour's count, which turned
// a deliberate "serves 12" burgoo into 7.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { RECIPES } from "../src/lib/recipes.ts";
import { fromIngredients } from "../src/lib/food-energy.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib");
const dry = process.argv.includes("--dry");
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function proposeServings(r) {
  const c = fromIngredients(r);
  // Only the stamped default, and only where the portion is not a portion —
  // either too many calories to be one plate, or too much food to be one bowl.
  // A relish batch fails on weight while its calories stay low.
  if (r.servings !== 4) return null;
  if (c.nutrition.cal <= 900 && c.gramsPerServing <= 1200) return null;
  const s = r.steps.join(" ");
  const all = `${r.name} ${r.description} ${(r.tags || []).join(" ")}`;
  const totalG = c.gramsPerServing * 4;

  if (r.plate === "dessert" || (r.tags || []).includes("baking")) {
    if (/springform|cheesecake/i.test(`${all} ${s}`)) return 12;
    if (/\bbundt\b|tube pan|angel food pan/i.test(s)) return 12;
    if (/9x13|9 x 13|13x9/i.test(s)) return /\bbars?\b|brownies|squares/i.test(all) ? 24 : 12;
    if (/two layer|2 layers|layer (?:cake )?(?:tins|pans)/i.test(s)) return 12;
    // A whole-dish dessert is sliced, and must be tested before the small-item
    // rules: "apple pot pie" hit the rolls rule and came out at thirty-six.
    if (/\bpie\b|cobbler|pandowdy|crumble|crisp|\btart\b|shoofly|trifle|charlotte/i.test(all)) return 8;
    if (/\bcookies?\b|snickerdoodle|rugelach|linzer|shortbread|macaroon|biscotti|wedding cakes?\b/i.test(all))
      return clamp(Math.round(totalG / 35), 12, 48);
    if (/\bbrownies?\b|\bbars?\b|\bsquares\b|blondie/i.test(all)) return clamp(Math.round(totalG / 55), 9, 36);
    if (/cinnamon rolls?|sticky buns?|\bmuffins?\b|scones?|cupcakes?|\brolls?\b/i.test(all))
      return clamp(Math.round(totalG / 90), 8, 24);
    if (/loaf|quick bread|\bnut bread\b/i.test(all)) return 10;
    return clamp(Math.round(totalG / 120), 6, 16);
  }

  // A relish or pickle is spooned out, not plated: about 60 g to a serving.
  if ((r.tags || []).some((t) => t === "relish" || t === "sauce"))
    return clamp(Math.round(totalG / 60), 8, 40);

  // A joint: about 180 g of cooked meat to a person, bone already discounted.
  if (r.plate === "roast") {
    const meatG = r.ingredients.reduce((t, i) => {
      const one = fromIngredients({ ingredients: [i], servings: 1, steps: [] });
      return t + (one.nutrition.protein >= 12 ? one.gramsPerServing : 0);
    }, 0);
    if (meatG >= 1500) return clamp(Math.round(meatG / 180), 5, 24);
  }

  // Everything else: a plated portion by weight. Bounded at twelve — an
  // unbounded rule turned a lobster supper into twenty-four servings.
  const PORTION = { soup: 400, green: 320, toast: 220, bowl: 450, curry: 450, pasta: 420, skillet: 450, roast: 450, fish: 430, taco: 400 };
  const portion = PORTION[r.plate];
  if (!portion) return null;
  const n = Math.round(totalG / portion);
  return n >= 5 ? clamp(n, 5, 12) : null;
}

const want = new Map();
for (const r of RECIPES) {
  const n = proposeServings(r);
  if (n && n !== r.servings) want.set(r.id, n);
}
if (dry) {
  for (const [id, n] of want) console.log(`${id}: 4 -> ${n}`);
  console.log(`${want.size} proposed`);
  process.exit(0);
}

const files = [...readdirSync(dir).filter((f) => /^catalog-.*\.ts$/.test(f) && f !== "catalog-kit.ts"), "recipes.ts"];
const ALL_IDS = new Set(RECIPES.map((r) => r.id));
const START = /\b(\w+)\(\s*"([a-z0-9-]+)"\s*,/g;
const NUT = /\{\s*cal:[^{}]*\}/;
let done = 0;

for (const file of files) {
  const path = join(dir, file);
  let text = readFileSync(path, "utf8");

  // Object-literal recipes first: `id: "x",` on its own line.
  const lines = text.split("\n");
  let touched = false;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)id:\s*"([a-z0-9-]+)",?\s*$/);
    if (!m || !want.has(m[2])) continue;
    const n = want.get(m[2]);
    let end = i + 1;
    while (end < lines.length && !/^\s*id:\s*"/.test(lines[end])) end++;
    let at = -1;
    for (let j = i + 1; j < end; j++) if (/^\s*servings:\s*\d+/.test(lines[j])) { at = j; break; }
    if (at >= 0) lines[at] = lines[at].replace(/servings:\s*\d+/, `servings: ${n}`);
    else lines.splice(i + 1, 0, `${m[1]}servings: ${n},`);
    done++; want.delete(m[2]); touched = true;
  }
  if (touched) { text = lines.join("\n"); }

  // Positional helper calls. Boundaries come from every recipe, not just ours.
  const starts = [...text.matchAll(START)].filter((m) => m[1] !== "I" && ALL_IDS.has(m[2]));
  for (let i = starts.length - 1; i >= 0; i--) {
    const id = starts[i][2];
    if (!want.has(id)) continue;
    const n = want.get(id);
    const from = starts[i].index + starts[i][0].length;
    const to = i + 1 < starts.length ? starts[i + 1].index : text.length;
    const slice = text.slice(from, to);

    const inline = slice.match(/servings:\s*\d+/);
    if (inline) {
      text = text.slice(0, from + inline.index) + `servings: ${n}` + text.slice(from + inline.index + inline[0].length);
      done++; want.delete(id); continue;
    }
    // No servings anywhere: append it as the helper's trailing argument. The
    // Southern helper takes an `extra` object there; everything else a number.
    const nut = slice.match(NUT);
    if (!nut) continue;
    const at = from + nut.index + nut[0].length;
    text = text.slice(0, at) + (file === "catalog-southern.ts" ? `, { servings: ${n} }` : `, ${n}`) + text.slice(at);
    done++; want.delete(id);
  }
  writeFileSync(path, text);
}
console.log(`set ${done} serving counts; ${want.size} could not be placed`);
if (want.size) console.log([...want.keys()].join(", "));
