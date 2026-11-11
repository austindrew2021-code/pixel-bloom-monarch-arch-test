export function prettyFrac(qty: number, snap = false): string {
  const table: [number, string][] = [
    [0.0625, "1/16"],
    [0.125, "⅛"],
    [1 / 6, "⅙"],
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.375, "⅜"],
    [0.5, "½"],
    [0.625, "⅝"],
    [2 / 3, "⅔"],
    [5 / 6, "⅚"],
    [0.75, "¾"],
    [0.875, "⅞"],
  ];
  for (const [n, s] of table) {
    if (Math.abs(qty - n) < 0.02) return s;
  }
  const whole = Math.floor(qty);
  const frac = qty - whole;
  if (whole >= 1 && frac > 0.02) {
    for (const [n, s] of table) {
      if (Math.abs(frac - n) < 0.02) return s.includes("/") ? `${whole} ${s}` : `${whole}${s}`;
    }
  }
  if (Number.isInteger(qty)) return String(qty);
  // A summed or scaled amount that lands between glyphs (⅓ + ¾ = 1.0833333333333333)
  // is rounded to the nearest eighth or sixth and shown as a fraction when asked
  // (`snap`); otherwise it shows as a short decimal, never a float tail.
  if (snap && qty > 0.03 && qty < 10) {
    const eighth = Math.round(qty * 8) / 8;
    const sixth = Math.round(qty * 6) / 6;
    const best = Math.abs(qty - sixth) < Math.abs(qty - eighth) - 1e-9 ? sixth : eighth;
    if (best > 0 && best !== qty) return prettyFrac(best);
  }
  return String(Number(qty.toFixed(2)) || Number(qty.toPrecision(2)));
}

export function formatQty(qty: number, unit: string): string {
  let q = qty;
  let raw = (unit || "").trim();
  if (/^(tbsp|tablespoons?)$/i.test(raw) && q > 0 && q < 0.4) {
    q *= 3;
    raw = /^tbsp$/i.test(unit.trim()) ? "tsp" : q <= 1 ? "teaspoon" : "teaspoons";
  }
  const pretty = prettyFrac(q, !/^(g|kg|ml|l|mg)$/i.test(raw));
  if (!raw) return pretty;
  const keepAbbrev = /^(tbsp|tsp|oz|lb|ml|g)$/i.test(raw);
  // "2 quart" reads as "2 quarts"; same for pint, gallon, cup, ounce, pound (display only).
  if (q > 1.02) return `${pretty} ${pluralUnitWord(raw, q)}`;
  if (keepAbbrev) return `${pretty} ${raw}`;
  const singular = /ies$/i.test(raw)
    ? raw.replace(/ies$/i, "y")
    : /s$/i.test(raw) && !/ss$/i.test(raw)
      ? raw.replace(/s$/i, "")
      : raw;
  return `${pretty} ${singular}`;
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function formatMinutes(n: number): string {
  if (n >= 120) {
    const h = Math.floor(n / 60);
    const m = n % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${n} min`;
}

/** Singular measure words that read plural above one: "2 cup" -> "2 cups". Display only;
 *  abbreviations (oz, lb), already-plural words and amounts of one or less are left alone. */
const PLURAL_UNITS = /^(quart|pint|gallon|cup|ounce|pound)$/i;
export function pluralUnitWord(word: string, q: number): string {
  if (!(q > 1.02) || !PLURAL_UNITS.test(word)) return word;
  return /^[A-Z]+$/.test(word) ? `${word}S` : `${word}s`;
}

/** Container / size nouns: a measure word right before one of these is a size ("a 12 quart pot",
 *  "2 pound package", "1 pound cake"), so it never takes a plural and its number never scales. */
export const VESSEL_WORDS = [
  "pot", "pan", "jar", "dish", "baking dish", "casserole", "mould", "mold", "piece", "crock", "package",
  "cake", "can", "box", "bag", "bottle", "carton", "loaf", "tin", "kettle", "saucepan", "skillet", "bowl",
  "pail", "jug", "crate", "basket", "keg", "barrel", "measure", "glass", "jelly glass", "mason jar",
  "roaster", "pitcher", "tub", "container", "platter", "sack", "boiler",
  "double boiler", "dutch oven", "stockpot", "kettle", "tube pan", "loaf pan", "springform", "cocotte", "ramekin",
  // r3: "12 cup bundt pan" (pp-022), "two 1 lb. coffee cans" (pp-017) scaled as food.
  "bundt pan", "coffee can",
];
const VESSEL_ALT = [...new Set(VESSEL_WORDS)].sort((a, b) => b.length - a.length).map((w) => w.replace(/ /g, "\\s+")).join("|");
/** Not a vessel: "can be", "cake flour", "loaf sugar", "pan drippings" name the food or a verb. */
const NOT_VESSEL = String.raw`(?!\s+(?:be|also|you|flour|crumbs|yeast|mix|sugar|drippings|juices?)\b)`;
/** Matches a vessel noun (singular or plural) at the start of the text. */
export const VESSEL_START = new RegExp(`^\\s*(?:(?:${VESSEL_ALT})(?:e?s)?)\\b${NOT_VESSEL}`, "i");
/** "12 quart pot", "1 1/2 quart casserole", "30 pound piece": a measure used as a size. */
export const VESSEL_SIZE = new RegExp(
  `\\b(?:\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|\\d+[⅛¼⅓½⅔¾⅙⅚]?|[⅛¼⅓½⅔¾⅙⅚])(?:\\.\\d+)?\\s+(?:quarts?|pints?|gallons?|cups?|ounces?|pounds?|lbs?|oz|liters?|litres?)\\.?\\s+(?:${VESSEL_ALT})(?:e?s)?\\b${NOT_VESSEL}`,
  "gi",
);
/** "9x13 pan", "9 × 9 × 2": dimensions, never scaled. */
export const DIMENSIONS = /\b\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?)?\b/gi;
/** formatQty for a row whose name starts with a vessel noun ("2 gallon crocks of …"): the unit stays singular. */
export function formatQtyFor(qty: number, unit: string, name: string): string {
  const out = formatQty(qty, unit);
  if (!VESSEL_START.test(name)) return out;
  return out.replace(/\b(quart|pint|gallon|cup|ounce|pound)(s)$/i, "$1").replace(/\b(QUART|PINT|GALLON|CUP|OUNCE|POUND)S$/, "$1");
}
