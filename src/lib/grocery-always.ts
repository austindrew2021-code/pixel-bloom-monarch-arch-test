/** Basics we ask about — never auto-skip until they check them into the pantry. */
export const BASIC_STAPLES = [
  "salt",
  "black pepper",
  "olive oil",
  "vegetable oil",
  "oil",
  "flour",
  "sugar",
  "baking powder",
  "baking soda",
  "garlic",
  "water",
];

/** @deprecated use BASIC_STAPLES */
export const DEFAULT_ALWAYS_HAVE = BASIC_STAPLES;

const VEG_PEPPER = new Set(["bell", "green", "red", "yellow", "sweet", "chili", "banana", "jalapeno"]);

export function isAlwaysHave(name: string, always: string[]): boolean {
  const n = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!n || !always.length) return false;
  const tokens = new Set(n.split(" "));
  return always.some((raw) => {
    const k = raw
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!k) return false;
    if (k.includes(" ")) {
      if (n.includes(k)) return true;
      if (k === "black pepper") return tokens.has("pepper") && ![...tokens].some((t) => VEG_PEPPER.has(t));
      return false;
    }
    if (k === "pepper") return tokens.has("pepper") && ![...tokens].some((t) => VEG_PEPPER.has(t));
    return tokens.has(k);
  });
}

export function isBasicStaple(name: string): boolean {
  return isAlwaysHave(name, BASIC_STAPLES);
}
