// Complete-coverage scan for the defect classes the recipe read-through found.
// Every shipped recipe is checked against every signature, so the counts below
// are the real population, not a sample.
import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { RECIPES } = await server.ssrLoadModule("/src/lib/recipes.ts");
await server.close();

const FAT = /\b(butter|ghee|oil|lard|dripping|shortening|bacon fat|schmaltz|tallow|margarine|duck fat)\b/i;
const BREADING = /\b(breadcrumbs?|panko|cornstarch|potato starch|rice flour|flour|beaten eggs?|eggs?)\b/i;
const DONE = /\b(roast \d+ minutes|bake \d+|lift out and drain|until cooked through|until browned|drain on|rest \d+)\b/i;

const findings = [];
const add = (kind, r, detail) => findings.push({ kind, id: r.id, name: r.name, detail });

for (const r of RECIPES) {
  const blob = r.steps.join(" ");
  const name = r.name.toLowerCase();
  const listed = r.ingredients.map((i) => i.name.toLowerCase()).join(" ; ");

  // 1. The name promises one technique and the method uses another.
  const promises = name.match(/\b(grilled|griddled|air-fryer|air-fried|steamed|smoked|barbecued|deep-fried)\b/);
  if (promises && /\b(wide skillet|film of|sear the)\b/i.test(blob) && !new RegExp(promises[1].replace(/-/g, ".?"), "i").test(blob)) {
    add("wrong-technique", r, `name says ${promises[1]}, method uses a skillet`);
  }

  // 2. A coating that arrives after the food is already cooked.
  const doneAt = r.steps.findIndex((s) => DONE.test(s));
  if (doneAt >= 0) {
    const late = r.steps.slice(doneAt).filter((s) => /\bstir in\b/i.test(s) && BREADING.test(s));
    if (late.length) add("breading-after-cooking", r, late[0].slice(0, 90));
  }

  // 3. The starch the dish is named for, demoted to a side.
  const sidelined = blob.match(/Serve with (?:the )?[^.]*\b(rice|noodles?|pasta|potatoes?|polenta|grits|couscous)\b/i);
  if (sidelined && new RegExp(`\\b${sidelined[1].replace(/e?s$/, "")}`, "i").test(name)) {
    add("core-starch-sidelined", r, sidelined[0].slice(0, 80));
  }

  // 4. A dish meant to be cold, cooked hot.
  const cold = /\b(salad|slaw|ceviche|poke|sunomono|gazpacho|tabbouleh|carpaccio|tartare|smoothie|agua fresca)\b/.test(name);
  if (cold && /(cook, stirring, until everything is hot|sear the|until browned in spots)/i.test(blob)) {
    add("cold-dish-cooked", r, blob.match(/[^.]*(?:until everything is hot|sear the)[^.]*/i)?.[0]?.slice(0, 80) ?? "");
  }

  // 5. A shaped or layered bake flattened into one pan of batter.
  const shaped = /\b(bars?|cookies|cobbler|rugelach|thumbprints?|galette|tarts?|linzer|biscotti|pies|rolls|crescents|turnovers|tassies|muffins)\b/.test(name);
  if (shaped && /Mix the batter or filling until even/i.test(blob)) {
    add("shaped-bake-flattened", r, "generic batter template on a shaped bake");
  }

  // 6. A raw sauce sent through the roux template.
  const rawSauce = /\b(pesto|chimichurri|harissa|aioli|salsa|cranberry sauce|cocktail sauce|vinaigrette|rub|dressing|gremolata|romesco|tzatziki)\b/.test(name);
  if (rawSauce && /Stir in any flour or starch|Whisk in the liquids/i.test(blob)) {
    add("raw-sauce-cooked", r, "roux/sauce template on an uncooked sauce");
  }

  // 7. Something that is not a fat, used as the fat in the pan.
  for (const m of blob.matchAll(/(?:a film of|a slick of|Heat a spoon of|skillet over [\w -]+ heat with|Melt|Warm) ((?:the )?[\w½¼¾ -]{3,40}?)(?:\.|,| over| and| in )/gi)) {
    const what = m[1].replace(/^the /i, "").replace(/^[\d½¼¾ ]+(cups?|tbsp|tsp|ounces?|pounds?|cans?|slices?) of /i, "").trim();
    if (what && !FAT.test(what) && !/^(medium|high|low|water)/i.test(what) && listed.includes(what.toLowerCase())) {
      add("non-fat-as-fat", r, `"${m[0].trim().slice(0, 60)}"`);
    }
  }

  // 8. The method names a category the list does not stock.
  if (/\bthe spices\b/i.test(blob) && !/\b(spice|curry powder|paprika|cumin|chili powder|seasoning)\b/i.test(listed)) {
    add("phantom-category", r, "calls for 'the spices' with none listed");
  }
  if (/\bthe herbs\b/i.test(blob) && !/\b(herb|parsley|cilantro|basil|thyme|rosemary|sage|dill|oregano|mint|chives)\b/i.test(listed)) {
    add("phantom-category", r, "calls for 'the herbs' with none listed");
  }
  if (/Wash and dry the greens/i.test(blob) && !/\b(greens|lettuce|romaine|spinach|arugula|kale|chard|mesclun|salad mix)\b/i.test(listed)) {
    add("phantom-category", r, "calls for 'the greens' with none listed");
  }

  // 9. A roast far too short for the weight on the list.
  const roast = blob.match(/Roast (\d+) minutes/i);
  const heavy = r.ingredients.find((i) => /lb|pound/i.test(i.unit) && Number(i.qty) >= 3);
  if (roast && heavy && Number(roast[1]) < 40) {
    add("roast-too-short", r, `${heavy.qty} ${heavy.unit} ${heavy.name} roasted ${roast[1]} minutes`);
  }
}

const counts = {};
for (const f of findings) counts[f.kind] = (counts[f.kind] ?? 0) + 1;
const affected = new Set(findings.map((f) => f.id)).size;
writeFileSync("/tmp/defect-scan.json", JSON.stringify(findings, null, 1));
console.log(JSON.stringify({ total: RECIPES.length, affected, ...counts }, null, 1));
