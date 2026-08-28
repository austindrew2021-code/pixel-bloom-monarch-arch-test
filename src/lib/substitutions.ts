export type SubOption = { name: string; note: string };

const TABLE: Record<string, SubOption[]> = {
  buttermilk: [
    { name: "milk + vinegar", note: "1 cup milk + 1 tbsp vinegar, rest 5 minutes" },
    { name: "yogurt", note: "Thin with a splash of water" },
  ],
  "heavy cream": [
    { name: "milk + butter", note: "¾ cup milk + ¼ cup melted butter" },
    { name: "evaporated milk", note: "Use 1:1 in sauces" },
  ],
  egg: [
    { name: "flax egg", note: "1 tbsp ground flax + 3 tbsp water" },
    { name: "mashed banana", note: "¼ cup per egg in baking" },
  ],
  butter: [
    { name: "olive oil", note: "Use ¾ the amount in savory cooking" },
    { name: "ghee", note: "1:1" },
  ],
  "sour cream": [
    { name: "Greek yogurt", note: "1:1" },
    { name: "crème fraîche", note: "1:1" },
  ],
  shallot: [{ name: "onion", note: "Use a little less; milder if you rinse" }],
  "fresh herbs": [{ name: "dried herbs", note: "Use ⅓ the amount" }],
  wine: [
    { name: "stock + splash of vinegar", note: "For deglazing" },
    { name: "grape juice + vinegar", note: "Non-alcoholic" },
  ],
  "chicken broth": [
    { name: "vegetable broth", note: "1:1" },
    { name: "bouillon + water", note: "Follow the jar" },
  ],
  "salt beef": [{ name: "corned beef", note: "Close cousin; still soak" }],
  "salt pork": [{ name: "bacon", note: "For scrunchions, chop and fry" }],
  "hard bread": [{ name: "stale hardtack or ship's biscuit", note: "Soak well" }],
  pecorino: [{ name: "parmesan", note: "A bit milder and less salty" }],
  guanciale: [
    { name: "pancetta", note: "Classic stand-in" },
    { name: "thick bacon", note: "Pat off extra smoke" },
  ],
  "scotch bonnet": [{ name: "habanero", note: "Same heat family; use less" }],
  tamarind: [{ name: "lime + brown sugar", note: "Sour-sweet approximation" }],
  tahini: [{ name: "peanut butter", note: "Different, but creamy and nutty" }],
  "coconut milk": [{ name: "cream + a drop of coconut extract", note: "If you must" }],
  eggplant: [{ name: "zucchini", note: "For moussaka layers, salt first" }],
  phyllo: [{ name: "puff pastry", note: "Heavier, still crisp" }],
  cod: [
    { name: "haddock", note: "1:1" },
    { name: "pollock", note: "1:1" },
  ],
  mozzarella: [{ name: "provolone", note: "Melts well" }],
  "ground beef": [
    { name: "ground turkey", note: "A little drier; add oil" },
    { name: "lentils", note: "For sauce and chili" },
  ],
  pancetta: [{ name: "thick bacon", note: "Pat off extra smoke" }],
  "gochujang": [{ name: "sriracha + miso", note: "Heat plus fermented depth" }],
  "fish sauce": [{ name: "soy sauce + pinch of salt", note: "Missing the funk, still salty" }],
  "paneer": [{ name: "firm tofu", note: "Press well, fry first" }],
  "cheese curds": [{ name: "torn mozzarella", note: "Won't squeak, still melts" }],
  "andouille sausage": [{ name: "smoked sausage", note: "Add extra paprika" }],
  "arborio rice": [{ name: "short-grain rice", note: "Stir a little more" }],
};

export function localSubs(ingredient: string): SubOption[] {
  const n = ingredient.toLowerCase();
  for (const [key, opts] of Object.entries(TABLE)) {
    if (n.includes(key) || key.includes(n)) return opts;
  }
  return [];
}
