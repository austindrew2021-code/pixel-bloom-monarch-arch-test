import { NO_GAIN_FAIL, NOV7_BOUGHT_FAIL, PASS1_FAIL } from "./safety-doubt-data.ts";

/**
 * One gate for every safety pass, read by the shield (shield.ts recipeAllergens)
 * and by the diet checks (diet.ts), so a badge and the shield never disagree.
 * Tags: "vegetarian", "vegan", "gluten-free", "dairy-free", "sugar-free", "keto",
 * "shield-gluten", "shield-dairy", "shield-nuts", "shield-shellfish", "shield-spicy".
 * Only takes passes away.
 */
export function failsInDoubt(id: string | undefined, tag: string): boolean {
  if (!id) return false;
  return Boolean(PASS1_FAIL[id]?.includes(tag) || NO_GAIN_FAIL[id]?.includes(tag) || NOV7_BOUGHT_FAIL[id]?.includes(tag));
}

/**
 * Mild means no heat in doubt (Nov 2): curry in any form (dish, powder, paste, roux),
 * chiles (poblano, ancho, guajillo and the other named chiles, Nov 7), cayenne, hot peppers, hot sauces and pastes, jerk, pepper pot, the pungent
 * roots, Cajun, hot paprika, and "red pepper" by any unit. The title counts.
 */
export const NOT_MILD = new RegExp(
  String.raw`\b(?:curr(?:y|ies|ied)|garam masala|chil(?:i|e|li)(?:e?s)?|cayenne|poblanos?|anaheims?|anchos?|guajillos?|pasillas?|(?:chiles? )?de [aá]rbol|mulatos?|cascabels?|fresnos?|hatch|bird'?s[- ]eye|pepperoncin[io]s?|peperoncin[io]s?|aleppo|urfa|espelette|shishitos?|padr[oó]ns?|piquins?|pequins?|rajas|jalape[nñ]os?|serranos?(?! ham\b)|habaneros?|chipotles?|red peppers?|pepper flakes|hot sauces?|tabasco|tobasco|sriracha|sambal|gochujang|gochugaru|harissa|jerk|pepper[- ]?pots?|wasabi|horseradish|cajun|hot paprika|scotch bonnets?|piri[- ]piri|peri[- ]peri|berbere|vindaloo|hot peppers?)\b`,
  "i",
);

export function notMild(r: {
  name: string;
  description?: string;
  ingredients: { name: string }[];
  steps?: string[];
}): boolean {
  return [r.name, r.description ?? "", ...r.ingredients.map((i) => i.name), ...(r.steps ?? [])].some((t) => NOT_MILD.test(t));
}
