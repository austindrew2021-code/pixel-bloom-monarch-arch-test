/**
 * Diet/allergy screen corrections for catalog-final recipes (LINE-AUDIT-OCT9).
 *
 * The screen (catalog-final.ts, `dietScreen`) makes every book recipe's diet
 * tags and allergen results equal main's or stricter. These are the ONLY
 * allowed exceptions: foods main's row adder listed because the method names
 * the word while the printed text says the food is not used. Each entry drops
 * exactly that one food from that one recipe's screen. Anything else that
 * would loosen a book recipe's result fails book-claims.test.ts.
 *
 * `active` is false for all four as shipped (Oct 9): turning one on is a new
 * pass vs main (two of them raise the gluten-free count on the gluten-shield
 * stack from 1,293 to 1,294), which needs Kitchen/Ship sign-off. Line called
 * the over-cautious result "acceptable for a safety badge". Flip `active` to
 * apply an entry; the claims test then allows exactly that recipe to loosen.
 */
export type ScreenCorrection = {
  id: string;
  /** Screen row (as the row adder names it) that is dropped. */
  food: string;
  /** Applied only when true (see above). */
  active: boolean;
  /** Surfaces main got wrong because of that row. */
  surfaces: string[];
  reason: string;
};

export const DIET_SCREEN_CORRECTIONS: ScreenCorrection[] = [
  {
    id: "vh-la-jellied-fruit",
    active: false,
    food: "flour",
    surfaces: ["gluten-free filter/badge", "gluten shield"],
    reason: 'The method says "This is not baked, and there is no flour in it." Main\'s row adder listed flour from that sentence.',
  },
  {
    id: "vh-20-pineapple-gelatin",
    active: false,
    food: "flour",
    surfaces: ["gluten-free filter/badge", "gluten shield"],
    reason: 'The method says "Do not bake, and do not add flour." Main\'s row adder listed flour from that sentence.',
  },
  {
    id: "idah-027",
    active: false,
    food: "butter",
    surfaces: ["dairy-free filter/badge", "dairy shield"],
    reason: 'The method says "Grease duck with Crisco or Mazola (butter burns)": butter is named only to rule it out.',
  },
  {
    id: "so-brown-sugar-frosting",
    active: false,
    food: "cream of tartar",
    surfaces: ["dairy shield"],
    reason: "Cream of tartar is potassium bitartrate, not dairy. Main's row adder listed it and the shield's raw \"cream\" word read it as dairy.",
  },
];

const BY_ID = new Map<string, Set<string>>();
for (const c of DIET_SCREEN_CORRECTIONS) {
  if (!c.active) continue;
  const set = BY_ID.get(c.id) ?? new Set<string>();
  set.add(c.food.toLowerCase());
  BY_ID.set(c.id, set);
}

/** True when this screen food is a listed correction for this recipe. */
export function isCorrectedScreenFood(id: string | undefined, food: string): boolean {
  return Boolean(id && BY_ID.get(id)?.has(food.trim().toLowerCase()));
}
