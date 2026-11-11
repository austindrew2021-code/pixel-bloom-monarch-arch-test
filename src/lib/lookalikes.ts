/*
 * One lookalike list for the shield and the diet badges (Nov 2): moved here from diet.ts so
 * shield.ts reads it too and the two never disagree. Plant milks are not dairy.
 */
/** Flours, milks and sauces that carry the trigger word but not the thing. */
export function withoutLookalikes(text: string): string {
  return text
    .replace(
      /\b(almond|coconut|chickpea|rice|corn|cassava|tapioca|buckwheat|oat|gluten[- ]free|masa|potato|nut)\s+(flour|meal|pasta|noodles?|tortillas?|wrappers?)\b/gi,
      // "gf", not a blank: what is left ("rice bread crumbs" -> "gf crumbs")
      // still reads as a gluten-free form to the gluten check in shield.ts.
      "gf",
    )
    // Bread and crumbs: only a plainly gluten-free form clears them. Corn, nut and potato bread
    // (and corn muffins, see shield.ts) are wheat by default.
    .replace(/\b(almond|coconut|chickpea|rice|cassava|tapioca|buckwheat|gluten[- ]free|masa)\s+(bread|crumbs?)\b/gi, "gf")
    .replace(/\bcorn(starch|meal|flour)\b/gi, " ")
    .replace(/\bgluten[- ]free\b/gi, "gf")
    .replace(/\brice (noodles?|paper|vermicelli|wine)\b/gi, " ")
    .replace(/\b(tamari|coconut aminos)\b/gi, " ")
    .replace(
      /\b(coconut|almond|soy|oat|cashew|rice|hemp|nut)\s+(milk|cream|butter|yogurt|yoghurt)\b/gi,
      " ",
    )
    .replace(/\b(peanut|nut|apple|cocoa|shea|sun)\s*butter\b/gi, " ")
    .replace(/\bbutter(nut|milk squash|head)\b/gi, " ")
    .replace(/\bcream of tartar\b/gi, " ")
    .replace(/\bnutritional yeast\b/gi, " ")
    .replace(/\b(oyster|chicken of the woods|lion's mane)\s+mushrooms?\b/gi, " ")
    .replace(/\bscallop(ed|ini)?\s+(squash|potatoes)\b/gi, " ");
}

