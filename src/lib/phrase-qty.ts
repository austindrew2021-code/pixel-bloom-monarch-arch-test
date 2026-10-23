// Display-only handling for ingredient rows whose printed name already carries the
// amount ("six or eight slices of tender bacon", "juice of half a lemon", "Meat of 2
// lobsters") and for unit-less container rows ("glass of brandy"). Catalog data is
// never changed; only the rendered qty/name strings on card, Cook and Shop.
import { prettyFrac } from "./format.ts";

const NUM_WORDS = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half|quarter|dozen";
const SIZE = "inch(?:es)?|in\\b|-inch|oz|ounces?|lbs?\\b|pounds?|qt|quarts?|pints?|cm|mm|%|cans?\\b|packages?|pkgs?|jars?|boxe?s?\\b|bottles?|envelopes?|sticks?|cups?\\b|coffee|tbsp|tsp|tablespoons?|teaspoons?|tablespoonfuls?|teaspoonfuls?";
const CONTAINER = /^(glass(?:es)?|wine-?glass(?:es)?|wine-?glassfuls?|cups?|cupfuls?|teacups?|teacupfuls?|tumblers?|tumblerfuls?|bowls?|bowlfuls?)(\s+of\s)/i;

const stripParens = (s: string) => s.replace(/\([^)]*\)/g, " ");

const NUM = "\\d+(?:\\s+\\d+\\/\\d+|\\/\\d+|\\.\\d+)?";
const MEASURE =
  "cups?|c\\.|tbsps?\\.?|tbls?\\.?|tsps?\\.?|tablespoons?|teaspoons?|tablespoonfuls?|teaspoonfuls?|oz\\.?|ounces?|lbs?\\.?|pounds?|qts?\\.?|quarts?|pints?|pts?\\.?|gallons?|inch(?:es)?|in\\.|cm|mm|ml|g\\b|kg|cans?|packages?|pkgs?\\.?|jars?|boxe?s?\\b|bottles?|envelopes?|sticks?";
// Leading count or count range of the food ("12 cloves", "4 large or 8 medium firm
// tomatoes", "14 or 16 pound round of beef"); a single count must not be followed by a
// measuring unit ("2 cups flour" is a measure, not a phrase).
const LEAD_COUNT = new RegExp(`^(${NUM})\\s+(?!(?:${MEASURE})(?![a-z]))[a-z]`, "i");
const LEAD_COUNT_RANGE = new RegExp(`^${NUM}\\s+(?:[a-z]+\\s+)?(?:or|to)\\s+${NUM}\\s+(?!(?:cups?|c\\.|tbsps?|tsps?|tablespoons?|teaspoons?|oz|ounces?|inch)(?![a-z]))[a-z]`, "i");
// Measure ranges ("1 to 2 teaspoons curry powder") and "N tablespoons plus …".
// "1 to 2 teaspoons", "1-3 cup" (no spaces) and "1 1/2-2# flank steak" ('#' = pounds).
const MEASURE_RANGE = new RegExp(
  `^${NUM}(?:\\s+(?:or|to)\\s+|\\s*-\\s*)${NUM}(?:\\s*#|\\s+(?:${MEASURE})(?![a-z]))`,
  "i",
);
const MEASURE_PLUS = new RegExp(`^${NUM}\\s+(?:${MEASURE})(?![a-z])[^,]*?\\bplus\\b`, "i");
const INDEFINITE = /\b(few|several)\b/i;

/** Which phrase class (if any) the extended rules add on top of the base rule. */
export function extendedClass(name: string): "lead-count" | "measure-range" | "measure-plus" | "few-several" | null {
  if (/^\s*(or|to)\b/i.test(name) || CONTAINER.test(name)) return null; // 'or'/'to' rows: later exact pass
  const n = name.trim();
  // "14 or 16 pound round of beef": a count range sizing the food itself (cf. kleber-0023).
  if (/^\d+\s+or\s+\d+\s+pound\s/i.test(n)) return "lead-count";
  if (MEASURE_RANGE.test(n)) return "measure-range";
  if (MEASURE_PLUS.test(n)) return "measure-plus";
  if (LEAD_COUNT_RANGE.test(n) || LEAD_COUNT.test(n)) return "lead-count";
  if (INDEFINITE.test(n)) return "few-several";
  return null;
}

/**
 * Catalog-only: the trailing parentheticals the 365 Desserts print uses for a no-count amount
 * ("salt (a little)", "almond (to flavor)", "rum (about 2 tablespoonfuls)"). Exactly this list;
 * applied only to catalog recipe rows (isPhraseRow with catalog = true), never to recipes users
 * type in themselves and never to items a user types into Shop.
 */
export const PRINTED_PHRASE_ENDINGS = [
  "a little",
  "a very little",
  "a very little speck",
  "to taste",
  "to flavor",
  "to color",
  "a grating",
  "a small quantity",
  "as many as desired",
  "a teacup full",
  "rather more than a pint",
  "a little cold",
  "nearly a quart",
  "nearly 1/2 pint",
  "about 2 tablespoonfuls",
] as const;

const PRINTED_PHRASE = new RegExp(`\\((?:${PRINTED_PHRASE_ENDINGS.join("|")})\\)\\s*$`, "i");

/** True when a catalog row's name ends in one of the book's printed no-count parentheticals. */
export function catalogPrintedPhrase(name: string): boolean {
  return PRINTED_PHRASE.test(name);
}

function baseCarriesAmount(name: string): boolean {
  if (CONTAINER.test(name)) return false;
  // Only the head of the name counts: drop parentheticals, anything after a comma,
  // and preparation tails ("cut into 4 slices", "to make one cup").
  const s = stripParens(name)
    .toLowerCase()
    .replace(/,.*$/, "")
    .replace(/\b(cut|to make)\b.*$/, "");
  if (/^\s*(juice|meat) of\b/.test(s)) return true;
  // Number word counting the food; skip sizes such as "one-inch" / "two quart".
  if (new RegExp(`(?<!-)\\b(${NUM_WORDS})\\b(?!-)(?!\\s*(?:${SIZE}))(?!\\s+cheese)`).test(s)) return true;
  // Digit/fraction counting the food ("Meat of 2 lobsters"); never a leading package
  // count ("1 (16 oz) can"), a dimension ("8-inch") or a size unit.
  const m = s.match(new RegExp(`(^|\\s)(\\d+(?:[/.]\\d+)?|[½¼¾⅓⅔⅛])\\s+(?!(?:${SIZE}))(?!(?:to|or)\\s+\\d)([a-z])`));
  if (m && (m.index ?? 0) > 0) return true;
  return false;
}

/** True when the name itself states how much food (the count of the food, not a size). */
export function nameCarriesAmount(name: string): boolean {
  return baseCarriesAmount(name) || extendedClass(name) !== null;
}

/** Phrase rule applies only to unit-less rows with base qty 1. */
/** Catalog recipe row: the printed name carries the amount, incl. the book's printed phrase endings. */
export function isPhraseRow(ing: { name: string; qty: number; unit: string }, catalog = false): boolean {
  return !(ing.unit || "").trim() && ing.qty === 1 && (nameCarriesAmount(ing.name) || (catalog && catalogPrintedPhrase(ing.name)));
}

export function isContainerRow(ing: { name: string; unit: string }): boolean {
  return !(ing.unit || "").trim() && CONTAINER.test(ing.name);
}

function containerFor(name: string, n: number): string {
  return name.replace(CONTAINER, (_m, noun: string, rest: string) => {
    const plural = n > 1.02;
    let base = noun.replace(/(es|s)$/i, (x) => (/glass$/i.test(noun.slice(0, -x.length)) || /ful$/i.test(noun.slice(0, -x.length)) || x === "s" ? "" : x));
    if (/glass(es)?$/i.test(noun)) base = noun.replace(/glasses$/i, "glass").replace(/glass$/i, "glass");
    const out = plural ? (/glass$/i.test(base) ? `${base}es` : `${base}s`) : base;
    return out + rest;
  });
}

export function multiplier(n: number): string {
  return Math.abs(n - 1) < 0.02 ? "" : ` ×${prettyFrac(n, true)}`;
}

/**
 * Display for a recipe ingredient (card / Cook). `scaled` is scaleQty(ing.qty,…);
 * `fmt` is formatQty. Returns the qty-span text and the name text.
 */
export function ingredientDisplay(
  ing: { name: string; qty: number; unit: string },
  scaled: number,
  fmt: (q: number, u: string) => string,
  catalog = false,
): { qty: string; name: string } {
  if (isPhraseRow(ing, catalog)) return { qty: "", name: ing.name + multiplier(scaled) };
  if (isContainerRow(ing)) return { qty: fmt(scaled, ing.unit), name: containerFor(ing.name, scaled) };
  return { qty: fmt(scaled, ing.unit), name: ing.name };
}

/** Display for a Shop line; phrase lines carry their multiplier in qty. */
export function shopLineDisplay(
  line: { name: string; qty: number; unit: string; phrase?: boolean },
  fmt: (q: number, u: string) => string,
): { qty: string; name: string } {
  if (line.phrase) return { qty: "", name: line.name + multiplier(line.qty) };
  if (isContainerRow(line)) return { qty: fmt(line.qty, line.unit), name: containerFor(line.name, line.qty) };
  return { qty: fmt(line.qty, line.unit), name: line.name };
}

/** Share/copy text for a Shop line: "- name (qty)" or "- phrase ×N". */
export function shopLineText(
  line: { name: string; qty: number; unit: string; phrase?: boolean },
  fmt: (q: number, u: string) => string,
): string {
  const d = shopLineDisplay(line, fmt);
  if (line.phrase) return `- ${d.name}`;
  return `- ${d.name}${line.unit || line.qty ? ` (${d.qty})` : ""}`;
}
