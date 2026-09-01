// Scans the shipped catalog for defect classes the existing sweeps do not cover:
//   ghost   - a real ingredient named in the method but missing from the list
//   twice   - the same ingredient added in two different steps
//   unused  - an ingredient on the list the method never mentions
//   dupname - two recipes sharing a display name
import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { RECIPES } = await server.ssrLoadModule("/src/lib/recipes.ts");
await server.close();

// Pantry staples and generic words: never worth flagging as a missing purchase.
const STAPLE =
  /^(water|salt|pepper|oil|butter|sugar|flour|milk|egg|eggs|ice|heat|stock|broth|sauce|dough|batter|mixture|pan|dish|pot|bowl|oven|top|side|edge|center|middle|piece|pieces|half|slice|slices|cup|cups|serving|servings|rest|extra|more|some|the|and|or|it|them)$/;

// Words a method uses to refer back to something it already has — a listed
// ingredient by its category, or a component the method itself just made.
// Naming one of these is never evidence of a missing shopping-list line.
const REFERS_BACK =
  /^(clove|cloves|vegetable|vegetables|veg|meat|meats|leaf|leaves|pasta|noodle|noodles|dressing|fish|filling|stuffing|yolk|yolks|white|whites|green|greens|bread|cheese|crust|pastry|herb|herbs|spice|spices|juice|zest|soup|stew|toast|gravy|glaze|salad|loaf|custard|crumb|crumbs|meal|cake|cakes|syrup|roll|rolls|cube|cubes|dripping|drippings|bone|bones|nut|nuts|seed|seeds|skin|skins|shell|shells|stem|stems|tops|root|roots|liquid|liquor|marinade|brine|rub|paste|puree|curd|cream|milk-solids|grounds|beans|grains|rice|fruit|fruits|berries|onion|onions|garlic|shallot|greens|stalk|stalks|strip|strips|wedge|wedges|round|rounds|chunk|chunks|sprig|sprigs|pinch|dash|drizzle|handful|portion|portions|batch|layer|layers|mix|blend|base|body|solids|scraps|trimmings|sheets|sheet|pan|pans|topping|toppings|parchment|rack|racks|dish|dishes)$/;

// Singular/plural variants, so "limes" matches a listed "lime".
const variants = (w) => [w, w.replace(/s$/, ""), w.replace(/es$/, ""), w.replace(/ies$/, "y"), `${w}s`, `${w}es`];

// Corpus-wide vocabulary of ingredient head nouns, so "named in the method" is
// judged against words that really are ingredients somewhere in the app.
const head = (name) =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const VOCAB = new Set();
for (const r of RECIPES) {
  for (const i of r.ingredients) {
    const words = head(i.name);
    const last = words[words.length - 1];
    if (last && last.length > 3 && !STAPLE.test(last)) VOCAB.add(last);
  }
}

const norm = (s) => s.toLowerCase().replace(/[^a-z\s-]/g, " ");
const findings = [];

for (const r of RECIPES) {
  const blob = norm(r.steps.join(" "));
  const listWords = new Set(r.ingredients.flatMap((i) => head(i.name)));

  // ghost: a vocabulary ingredient the method calls for that nobody can buy.
  const ghosts = new Set();
  for (const m of blob.matchAll(/\b(?:the|some|your|of)\s+([a-z-]{4,})\b/g)) {
    const w = m[1];
    if (!VOCAB.has(w) || REFERS_BACK.test(w)) continue;
    if (!variants(w).some((v) => listWords.has(v))) ghosts.add(w);
  }
  if (ghosts.size) findings.push({ kind: "ghost", id: r.id, name: r.name, detail: [...ghosts].join(", ") });

  // twice: the same listed ingredient introduced by two separate steps.
  for (const i of r.ingredients) {
    const words = head(i.name).filter((w) => w.length > 3 && !STAPLE.test(w));
    const key = words[words.length - 1];
    if (!key) continue;
    const hits = r.steps.filter((s) =>
      new RegExp(`\\b(add|stir in|pour in|mix in|fold in|tip in|drop in)\\b[^.]{0,60}\\b${key}`, "i").test(s),
    );
    if (hits.length > 1) {
      findings.push({ kind: "twice", id: r.id, name: r.name, detail: `${i.name} — ${hits.length} steps` });
      break;
    }
  }

  // unused: on the shopping list, never referenced by the method.
  // A line counts as used if the method names any content word of it — "chicken
  // thighs" is used by a step that just says "sear the chicken".
  const unused = r.ingredients
    .filter((i) => {
      const words = head(i.name).filter((w) => w.length > 3 && !STAPLE.test(w) && !REFERS_BACK.test(w));
      return words.length > 0 && !words.some((w) => variants(w).some((v) => blob.includes(v)));
    })
    .map((i) => i.name);
  if (unused.length) findings.push({ kind: "unused", id: r.id, name: r.name, detail: unused.join(", ") });
}

// dupname: same dish name shown twice in the picker.
const byName = new Map();
for (const r of RECIPES) {
  const k = r.name.trim().toLowerCase();
  byName.set(k, [...(byName.get(k) ?? []), r.id]);
}
for (const [name, ids] of byName) {
  if (ids.length > 1) findings.push({ kind: "dupname", id: ids.join(" / "), name, detail: `${ids.length} entries` });
}

const counts = {};
for (const f of findings) counts[f.kind] = (counts[f.kind] ?? 0) + 1;
writeFileSync("/tmp/gap-scan.json", JSON.stringify(findings, null, 1));
console.log(JSON.stringify({ total: RECIPES.length, ...counts }, null, 1));
