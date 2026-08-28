import type { Recipe } from "./types";
import { writeDishMethod } from "./write-method.ts";

type RecipeLike = Pick<Recipe, "name" | "minutes" | "protein" | "plate" | "tags" | "ingredients" | "steps">;

const JUNK_NAME =
  /^(ingredients?|directions?|instructions?|method|recipes?|index|contents|preface|introduction|chapter\s+\d+|camp cookery)$/i;

const VERB =
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|char|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|uncover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|purée|puree|mash|shred|roll|knead|steam|pressure|nestle|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|adjust|remove|return|transfer|flip|turn|skim|strain|chill|freeze|thaw|soak|marinate|deglaze|reduce|thicken|crumble|sprinkle|dust|dredge|coat|dip|broil|blanch|peel|core|trim|rinse|wash|set|put|place|drop|press|shape|form|score|tie|truss|cook|scald|dissolve|cream|sift|whip|baste|carve|ladle|dot|glaze|wilt|sweat|bloom|steep|frost|ice|crack|juice|zest|halve|quarter|cube|pull|lock|flatten|melt|wrap|char|scatter|drizzle|paint|scramble|crisp|reheat|keep|dollop|smash|wipe|blot|loosen|swirl|pack|unmold|line|lift|discard|nest|thread|prick|joint|skewer|try)\b/i;

const HEAT_VERB = /\b(brown|sear|simmer|bake|roast|fry|boil|grill|broil|cook|toast|steam|pressure)\b|saut[eé]/i;

export function cleanRecipeName(name: string): string | null {
  let n = name
    .replace(/[="]+/g, " ")
    .replace(/\\"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  n = n.replace(/^recipe for\s+/i, "");
  n = n.replace(/^the\s+southern cook book.*/i, "");
  if (!n || JUNK_NAME.test(n)) return null;
  if (n.length < 3 || n.length > 72) return null;
  if (n === n.toUpperCase() && /[A-Z]/.test(n) && n.length > 4) {
    n = n.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return n;
}

function finishSentence(s: string): string {
  const t = s.trim();
  if (!t) return t;
  if (/[.!?]$/.test(t)) return t;
  return `${t}.`;
}

function capitalize(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t[0]!.toUpperCase() + t.slice(1);
}

function hasTime(s: string): boolean {
  return /\d+\s*(?:-|–|to\s+\d+\s*)?(minutes?|mins?|hours?|seconds?|°\s*F|°F)\b/i.test(s);
}

function isPressure(recipe: RecipeLike): boolean {
  const blob = `${(recipe.tags ?? []).join(" ")} ${recipe.steps.join(" ")}`.toLowerCase();
  return blob.includes("instant-pot") || blob.includes("high pressure") || blob.includes("pressure cooker");
}

function isDrink(recipe: RecipeLike): boolean {
  return (recipe.tags ?? []).some((t) => t === "drink");
}

function ingredientLine(recipe: RecipeLike, n = 6): string {
  const list = recipe.ingredients.map((i) => i.name).filter(Boolean);
  if (list.length === 0) return "the ingredients on the list";
  if (list.length === 1) return list[0]!;
  if (list.length <= n) return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
  return `${list.slice(0, n).join(", ")}, and the other ingredients`;
}

function mentionsFood(step: string, recipe: RecipeLike): boolean {
  const s = step.toLowerCase();
  if (/\b(cavity|skin|pan|pot|skillet|oven|pasta water|juices|bowl|batter|dough|mixture|sauce|gravy|bun|toast|lid|trivet|sheet|edges|flatbread)\b/i.test(s)) {
    return true;
  }
  return recipe.ingredients.some((i) => {
    const tokens = i.name
      .toLowerCase()
      .split(/\s+/)
      .flatMap((w) => [w, w.replace(/s$/, "")])
      .filter((w) => w.length > 3 && !["fresh", "ground", "dried", "white", "black", "green", "whole", "juice"].includes(w));
    if (s.includes(i.name.toLowerCase())) return true;
    return tokens.some((w) => s.includes(w));
  });
}

function isHotFlat(recipe: RecipeLike): boolean {
  const blob = `${recipe.name} ${(recipe.tags ?? []).join(" ")}`.toLowerCase();
  return /pizza|lahmacun|flatbread|socca|naan|pide|manoush|focaccia|galette/.test(blob);
}

function ovenTemp(recipe: RecipeLike): string {
  const blob = recipe.steps.join(" ");
  const m = blob.match(/(\d{3})\s*°?\s*F/i);
  if (m) return m[1]!;
  if (/very hot|screaming/i.test(blob)) return isHotFlat(recipe) ? "500" : "450";
  if (/\bhot oven\b|very hot oiled/i.test(blob)) return isHotFlat(recipe) ? "500" : "425";
  if (recipe.plate === "dessert") return "350";
  if (isHotFlat(recipe)) return "500";
  if (recipe.plate === "roast") return "400";
  return "375";
}

function proteinNoun(recipe: RecipeLike): string {
  const hit = recipe.ingredients.find((i) => {
    const n = i.name.toLowerCase();
    if (recipe.protein === "veg") return false;
    if (recipe.protein === "chicken" || recipe.protein === "turkey") return /chicken|turkey|thigh|breast|duck|goose|rabbit/.test(n);
    if (recipe.protein === "beef") return /beef|steak|chuck|lamb|filet|mignon|sirloin|bison|venison|elk/.test(n);
    if (recipe.protein === "pork") return /pork|ham|bacon|sausage/.test(n);
    if (recipe.protein === "fish" || recipe.protein === "seafood") return /fish|salmon|shrimp|cod|tuna|clam/.test(n);
    if (recipe.protein === "eggs") return /egg/.test(n);
    return false;
  });
  return hit?.name ?? "the main ingredient";
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function minutesIn(s: string): number | null {
  const m = s.match(/(\d+)\s*(?:-|–|to\s+\d+\s*)?minutes?/i);
  return m ? Number(m[1]) : null;
}

function bakeFinish(recipe: RecipeLike, minutes: number | null): string {
  const blob = `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${recipe.plate}`.toLowerCase();
  if (recipe.plate === "dessert" || /cake|clafoutis|pie|tart|cookie|brownie|pudding/.test(blob)) {
    return "until set in the center";
  }
  if (isHotFlat(recipe) || (minutes !== null && minutes <= 12)) {
    return "until the edges are browned and crisp";
  }
  if (/casserole|gratin|lasagna|lasagne|hotdish|dauphinois|mac and cheese|macaroni cheese/.test(blob)) {
    return "until bubbling at the edges and hot in the center";
  }
  return "until cooked through and the top is gold";
}

function clarifyOvenLanguage(s: string, recipe: RecipeLike): string {
  const pizza = isHotFlat(recipe);
  const tempOf = (heat: string): string => {
    if (/very hot|screaming/i.test(heat)) return pizza ? "500" : "450";
    if (/moderate/i.test(heat)) return "350";
    if (/quick/i.test(heat)) return "425";
    if (/\bhot\b/i.test(heat)) return pizza ? "475" : "425";
    return ovenTemp(recipe);
  };

  let t = s;
  t = t.replace(
    /\b(bake|roast|cook)\s+(very hot|screaming hot|hot|in a (?:very )?hot oven|in a moderate oven|in a quick oven)\s+(?:for\s+)?(\d+)(?:\s*-\s*\d+)?\s*minutes?/gi,
    (_w, verb: string, heat: string, mins: string) => `${verb} at ${tempOf(heat)}°F for ${mins} minutes`,
  );
  t = t.replace(
    /\b(bake|roast|cook)\s+(\d{3})\s*°?\s*F\s+(\d+)(?:\s*-\s*\d+)?\s*minutes?/gi,
    (_w, verb: string, temp: string, mins: string) => `${verb} at ${temp}°F for ${mins} minutes`,
  );
  return t;
}

function unabbrev(s: string, recipe: RecipeLike): string {
  const paste = recipe.ingredients.find((i) => /\bpaste\b/i.test(i.name));
  const dough = recipe.ingredients.find((i) => /dough|pastry/i.test(i.name));
  const meat = proteinNoun(recipe);
  let t = s;
  if (paste && !new RegExp(paste.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(t)) {
    t = t.replace(/\bpaste\b/gi, paste.name);
  }
  if (meat !== "the main ingredient") {
    t = t.replace(/\b(?:ground\s+)?meat\b/gi, meat);
  }
  t = t.replace(/\bspices\b/gi, (match) => {
    if (/\bsalt\b/i.test(t) && /\bpepper\b/i.test(t)) return "spices";
    if (/\bsalt\b/i.test(t)) return "pepper and spices";
    return "salt, pepper, and spices";
  });
  if (dough && !new RegExp(dough.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(t)) {
    t = t.replace(/\bdough\b/gi, dough.name);
  }
  return t;
}

const FINISH_TOKEN: Record<string, string> = {
  lemon: "Squeeze lemon over the top so the food tastes bright.",
  lime: "Squeeze lime over the top.",
  cilantro: "Scatter chopped cilantro over the top.",
  parsley: "Scatter chopped parsley over the top.",
  mint: "Scatter chopped mint over the top.",
  chives: "Scatter chopped chives over the top.",
  basil: "Tear basil over the top.",
  roll: "Roll it up and eat while the edges are still crisp.",
  bread: "Serve with warm bread.",
  pita: "Serve with warm pita.",
  injera: "Serve with injera.",
  rice: "Spoon over hot cooked rice and serve.",
  invert: "Invert onto a platter.",
  oil: "Drizzle olive oil over the top.",
  sugar: "Dust with sugar.",
  mash: "Mash until mostly smooth, with some texture left.",
  pepper: "Grind black pepper over the top.",
  rest: "Rest 5–10 minutes off the heat.",
  fold: "Fold and serve.",
  cheese: "Scatter cheese over the top.",
  lettuce: "Serve on lettuce leaves.",
  cream: "Stir in the cream off the heat.",
  nutmeg: "Grate nutmeg over the top.",
  yogurt: "Spoon yogurt over the top.",
  tahini: "Drizzle tahini over the filling.",
  amba: "Spoon amba over the filling.",
  salt: "Taste and add salt.",
  cumin: "Stir in the cumin.",
  dijon: "Whisk in the Dijon.",
  vinegar: "Whisk in the vinegar.",
  shallot: "Stir in the minced shallot.",
  scallion: "Fold in the sliced scallions.",
  scallions: "Fold in the sliced scallions.",
  garlic: "Stir in the garlic.",
  eggs: "Serve with eggs.",
  egg: "Serve with eggs.",
  crouton: "Add croutons.",
  toast: "Serve with toast.",
};

const SERVE_WORDS = new Set(["rice", "bread", "pita", "injera", "lettuce", "eggs", "egg", "toast", "crouton"]);

function finishToken(token: string): string | undefined {
  const k = token.toLowerCase().trim();
  return FINISH_TOKEN[k] ?? FINISH_TOKEN[k.replace(/s$/, "")];
}

function isSkilletPanSauce(recipe: RecipeLike, tokens: string[]): boolean {
  const name = `${recipe.name} ${recipe.plate}`.toLowerCase();
  if (recipe.plate !== "skillet" && recipe.plate !== "fish") return false;
  if (!/duck|steak|filet|magret|\bchop\b|scallop/.test(name)) return false;
  const t = tokens.join(" ");
  return /\bwine\b/.test(t) && /shallot|thyme|butter/.test(t);
}

function expandNounList(s: string, recipe: RecipeLike): string | null {
  const raw = s.replace(/[.]+$/, "").trim();
  if (!raw) return null;
  const first = raw.split(/[\s,]/)[0] ?? "";
  const leadingCookVerb =
    VERB.test(first) && !/^(mash|roll|invert|rest|fold|strain|blend|spread|peel|oil|salt|pepper|toast)$/i.test(first);
  if (leadingCookVerb) return null;

  const tokens = raw
    .split(/\s*,\s*|\s+or\s+|\s+and\s+/i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== "and");
  if (tokens.length === 0) return null;

  if (/\bor\b/i.test(raw) && tokens.every((t) => SERVE_WORDS.has(t) || SERVE_WORDS.has(t.replace(/s$/, "")))) {
    return finishSentence(`Serve with ${joinList(tokens)}`);
  }

  if (tokens.length >= 1 && (SERVE_WORDS.has(tokens[0]!) || SERVE_WORDS.has(tokens[0]!.replace(/s$/, "")))) {
    return finishSentence(`Serve with ${joinList(tokens)}`);
  }

  if (tokens.every((t) => finishToken(t))) {
    return tokens.map((t) => finishToken(t)!).join(" ");
  }

  if (tokens.length >= 2 && tokens.every((t) => /^[a-z][a-z '-]+$/.test(t) && t.split(/\s+/).length <= 3)) {
    if (isSkilletPanSauce(recipe, tokens)) {
      return "Pour off extra fat, leaving a thin film. Add the shallot and cook 1 minute. Add the wine and thyme, and simmer 2 minutes. Swirl in the butter.";
    }
    return finishSentence(`Add the ${joinList(tokens)}`);
  }
  return null;
}

function prepLine(recipe: RecipeLike): string {
  const names = recipe.ingredients.map((i) => i.name.toLowerCase());
  const bits: string[] = [];
  if (names.some((n) => /\bonion\b/.test(n) && !/juice|powder|soup/.test(n))) bits.push("Dice the onion.");
  if (names.some((n) => /\bgarlic\b/.test(n))) bits.push("Peel and mince the garlic.");
  if (names.some((n) => /\b(carrot|celery|bell pepper|potato|zucchini)\b/.test(n))) bits.push("Chop the vegetables.");
  if (names.some((n) => /\b(chicken|beef|pork|turkey|fish|shrimp)\b/.test(n))) bits.push("Pat the meat dry and salt it.");
  return bits.slice(0, 2).join(" ");
}

function mise(recipe: RecipeLike): string {
  const items = ingredientLine(recipe, 6);
  const prep = prepLine(recipe);
  const parts = [`Get out ${items}.`];
  if (prep) parts.push(prep);
  if (isDrink(recipe)) parts.push("Chill a glass.");
  else if (isPressure(recipe)) parts.push("Set the Instant Pot on the counter with the lid nearby.");
  else if (recipe.steps.some((s) => /\b(bake|roast|oven)\b/i.test(s))) {
    parts.push(`Heat the oven to ${ovenTemp(recipe)}°F.`);
  }
  parts.push(`The whole method takes about ${recipe.minutes} minutes.`);
  return parts.join(" ");
}

function inferDuration(step: string, recipe: RecipeLike): string | null {
  const s = step.toLowerCase();
  if (/\bbrown\b|\bsear\b/.test(s)) return "6–8 minutes";
  if (/\bsoften\b|saut[eé]/.test(s)) return "4–5 minutes";
  if (/\bsimmer\b/.test(s)) return recipe.minutes >= 90 ? "45–60 minutes" : recipe.minutes >= 50 ? "20–30 minutes" : "10–15 minutes";
  if (/\bboil\b/.test(s) && /pasta|noodle|spaghetti|macaroni|penne/.test(s)) return "8–10 minutes";
  if (/\bboil\b/.test(s)) return "10 minutes";
  if (/\bbake\b/.test(s)) return `${Math.max(18, Math.round(recipe.minutes * 0.65))} minutes at ${ovenTemp(recipe)}°F`;
  if (/\broast\b/.test(s)) return `${Math.max(25, recipe.minutes - 15)} minutes`;
  if (/\bgrill\b/.test(s)) return "3–4 minutes per side";
  if (/\bfry\b/.test(s)) return "3–4 minutes per side, until gold";
  if (/\btoast\b/.test(s)) return "1–2 minutes";
  if (/\brest\b/.test(s)) return "5–10 minutes";
  if (/\bsoak\b/.test(s)) return "overnight, or at least 8 hours";
  if (/\bchill\b/.test(s)) return "at least 30 minutes";
  if (/\bcover\b/.test(s) && /\b15\b/.test(s)) return null;
  return null;
}

function expandFragment(s: string, recipe: RecipeLike): string {
  let t = s.trim().replace(/^\([^)]{0,48}\)\s*/, "");
  t = t.replace(/=\s*/g, "").replace(/;+/g, ".").replace(/\s+/g, " ").trim();
  t = clarifyOvenLanguage(t, recipe);
  t = unabbrev(t, recipe);
  const lower = t.toLowerCase().replace(/[.]+$/, "");

  const canned: Record<string, string> = {
    spread: "Spread the mixture in an even layer.",
    strain: "Strain through a fine mesh.",
    peel: "Peel the skins.",
    blend: "Blend until smooth, about 30 seconds.",
    broil: "Broil 2–4 minutes, until the top is browned.",
    salt: "Season with salt and taste.",
    "quick release": "Turn the valve to quick-release the pressure. Open the lid when it drops.",
    rice: "Spoon over hot cooked rice and serve.",
    serve: "Serve hot.",
    "serve hot": "Serve hot.",
    nutmeg: "Grate nutmeg over the top.",
    cilantro: "Scatter chopped cilantro over the top.",
    lime: "Finish with a squeeze of lime.",
    lemon: "Squeeze lemon over the top so the food tastes bright.",
    parsley: "Scatter chopped parsley over the top.",
    "olive on top": "Finish each piece with a stuffed olive.",
    chill: "Chill at least 30 minutes.",
    "mix well": "Mix until even, with no dry pockets.",
    mash: "Mash until mostly smooth, with some texture left.",
    oil: "Drizzle olive oil over the top.",
    bread: "Serve with warm bread.",
    pita: "Serve with warm pita.",
    invert: "Invert onto a platter.",
    rest: "Rest 5–10 minutes off the heat.",
    fold: "Fold and serve.",
    sugar: "Dust with sugar.",
    pepper: "Grind black pepper over the top.",
    roll: "Roll it up and eat while the edges are still crisp.",
    "drain extra fat": "Tilt the pan and drain off extra fat so the sauce is not greasy.",
  };
  if (canned[lower]) return canned[lower];
  const finish = finishToken(lower);
  if (finish) return finish;

  if (/spread thin on/i.test(lower)) {
    const dough = recipe.ingredients.find((i) => /dough|pastry/i.test(i.name))?.name ?? "dough";
    return `Roll the ${dough} out thin on a sheet. Spread the filling all the way to the edges.`;
  }
  if (/very hot oiled skillet|hot oiled skillet/i.test(lower)) {
    return "Heat a well-oiled skillet in a 500°F oven, or set it over high heat on the stove.";
  }
  const bakeOrStove = lower.match(/bake or stove (\d+)/i);
  if (bakeOrStove) {
    return `Bake, or cook on the stove, for ${bakeOrStove[1]} minutes, until the edges are browned and crisp.`;
  }

  const timed = lower.match(
    /^(flip|turn|sear|render|simmer|bake|roast|boil|cook|fry|sauté|saute|steam|rest|cover|broil|chill)(?: for)? (\d+)(?:-\d+)?(?: minutes?| hours?)?(?: a side| per side)?$/,
  );
  if (timed) {
    const verb = timed[1]!.toLowerCase();
    const n = timed[2]!;
    const meat = proteinNoun(recipe);
    if (verb === "flip" || verb === "turn") {
      return `Flip the ${meat} and cook ${n} minutes on the other side.`;
    }
    if (verb === "sear") {
      return `Sear the ${meat} ${n} minutes per side.`;
    }
    if (verb === "render") {
      return `Cook the ${meat} skin-side down ${n} minutes, until the fat is rendered and the skin is gold.`;
    }
    if (verb === "steam") return `Cover and steam for ${n} minutes.`;
    if (verb === "rest") return `Rest the ${meat} ${n} minutes off the heat so the juices settle.`;
    if (verb === "cover") return `Cover the pan and cook ${n} minutes.`;
    if (verb === "broil") return `Broil ${n} minutes, until the top is browned.`;
    if (verb === "chill") return /hour/.test(lower) ? `Chill ${n} hours.` : `Chill ${n} minutes.`;
    return `${capitalize(timed[1]!)} for ${n} minutes.`;
  }
  const high = lower.match(/^high pressure (\d+) minutes?$/);
  if (high) return `Lock the lid. Cook at high pressure for ${high[1]} minutes.`;
  const natural = lower.match(/^natural(?: release)?(?: (\d+))?/);
  if (natural && lower.startsWith("natural")) {
    return natural[1]
      ? `Let the pressure release naturally for ${natural[1]} minutes, then open the lid.`
      : "Let the pressure release naturally, then open the lid.";
  }
  const ice = lower.match(/^ice bath (\d+) minutes?$/);
  if (ice) return `Move to an ice bath for ${ice[1]} minutes.`;
  const saute = lower.match(/^(.+?) on sauté (\d+) minutes?$/);
  if (saute) return `Add ${saute[1]} and cook on Sauté for ${saute[2]} minutes.`;
  if (/^rice avocado/i.test(lower)) {
    return "Mash or rice the avocado with the onion juice, lemon juice, mayonnaise, and a pinch of salt until spreadable, about 1 minute.";
  }
  if (/^toast bread/i.test(lower)) {
    return "Toast the bread rounds 1–2 minutes per side, until both sides are gold.";
  }

  const meatName = proteinNoun(recipe);
  const has = (re: RegExp) => recipe.ingredients.some((i) => re.test(i.name));
  const bare: Record<string, string> = {
    shred: `Shred the ${meatName} with two forks.`,
    skim: "Skim the foam off the top with a spoon.",
    poke: "Poke holes all over with a fork so the liquid can soak in.",
    sesame: "Scatter sesame seeds over the top.",
    cocoa: "Dust the top with cocoa.",
    berries: "Spoon berries over the top.",
    tostadas: "Spoon the filling onto tostadas.",
    tortillas: "Warm the tortillas in a dry pan until they flex.",
    "warm tortillas": "Warm the tortillas in a dry pan until they flex.",
    "save a cup": "Ladle out a cup of the pasta water and keep it for the sauce.",
    "save water": "Ladle out a cup of the pasta water and keep it for the sauce.",
    "fold flour": "Fold in the flour until just combined, with no dry pockets.",
    "spoon on": "Spoon the topping on.",
    "cut wedges": "Cut into wedges and serve hot.",
    "pour cups": "Pour into cups or ramekins.",
    "stir bread in": "Stir the bread in until it soaks and the soup thickens.",
    "butterfly shrimp": "Butterfly the shrimp: cut along the back and open them flat.",
    "nestle fish": `Nestle the ${meatName} in the sauce.`,
    mozzarella: "Scatter mozzarella over the top.",
    corn: has(/\bcorn\b/) ? "Stir in the corn." : "",
    wine: has(/wine/) ? "Pour in the wine and let it bubble 1 minute." : "",
    "whipped cream": "Spread whipped cream over the top.",
  };
  if (bare[lower]) return bare[lower];

  if (/^chunk\b/i.test(lower)) {
    const rest = lower.replace(/^chunk\s+/i, "").replace(/\.$/, "");
    return finishSentence(rest ? `Cut the ${rest} into large chunks` : "Cut the vegetables into large chunks");
  }
  const lastN = lower.match(/^([a-z][a-z ]{2,24}) last (\d+)$/);
  if (lastN && /cheese|mozzarella|breadcrumb|parmesan/i.test(lastN[1]!)) {
    return `Scatter ${lastN[1]} over the top and bake ${lastN[2]} more minutes, until melted.`;
  }

  const addCook = lower.match(/^([a-z][a-z ',]{1,48}) (\d+)(?:-\d+)? minutes?$/);
  if (addCook && !VERB.test(addCook[1]!)) {
    return `Add the ${addCook[1]} and cook ${addCook[2]} minutes, until tender.`;
  }

  if (/^mix\b/i.test(t) && !/until|bowl/i.test(t)) {
    return finishSentence(`${t.replace(/[.]$/, "")} in a bowl until even`);
  }
  if (/^stir in\b/i.test(lower) && !/until/i.test(lower)) {
    return finishSentence(`Stir in ${lower.replace(/^stir in\s+/i, "")} until the sauce is even`);
  }

  if (/^score (fat|skin)/i.test(lower)) {
    const meat = proteinNoun(recipe);
    if (recipe.plate === "skillet" || /breast/i.test(recipe.name)) {
      return `Pat the ${meat} dry. Score the skin in a crosshatch, cutting the fat not the meat. Salt both sides.`;
    }
    return `Pat the ${meat} dry. Score the skin all over so the fat can render. Salt well.`;
  }
  const coldPan = lower.match(/cold pan.*?(?:fat-side down|skin(?:-side)? down).*?(\d+)\s*minutes?/);
  if (coldPan) {
    const meat = proteinNoun(recipe);
    return `Set the ${meat} skin-side down in a cold skillet. Cook over medium heat for ${coldPan[1]} minutes, until the fat is rendered and the skin is gold.`;
  }
  if (/^slice\.?$/i.test(lower) || /^slice$/i.test(lower)) {
    return `Slice the ${proteinNoun(recipe)} across the grain and spoon the pan juices over.`;
  }
  if (/^spoon over/i.test(lower)) {
    return `Spoon the pan sauce over the ${proteinNoun(recipe)}.`;
  }

  const onThe = lower.match(/^(.+?) on the (fish|chicken|meat|pork|lamb|steak|vegetables|veg)$/);
  if (onThe && !VERB.test(onThe[1]!.split(/\s+/)[0] ?? "x")) {
    return finishSentence(`Rub ${onThe[1]} on the ${onThe[2]}`);
  }

  const ovenOnly = lower.match(/^(\d{3})\s*°?\s*f(?:\s+(\d+)\s*minutes?)?$/);
  if (ovenOnly) {
    return ovenOnly[2]
      ? `Roast at ${ovenOnly[1]}°F for ${ovenOnly[2]} minutes, until tender and browned.`
      : `Heat the oven to ${ovenOnly[1]}°F.`;
  }

  if (/^oil,/.test(lower) && /salt/.test(lower)) {
    const bits = lower
      .replace(/on the .+$/, "")
      .split(/\s*,\s*/)
      .map((x) => x.replace(/\.$/, "").trim())
      .filter(Boolean);
    return finishSentence(`Toss with ${joinList(bits)}`);
  }

  if (/thin pan/i.test(lower) && /crepe/i.test(lower)) {
    return "Heat a thin pan over medium. Cook the crêpes one at a time, swirling a thin layer of batter.";
  }

  if (/^(flatten|melt|make|wrap|char|nestle|season|finish|heat|rub|chunk)\b/i.test(lower)) {
    return finishSentence(capitalize(t));
  }

  const nouns = expandNounList(t, recipe);
  if (nouns) return nouns;

  t = finishSentence(capitalize(t));
  if (t.length >= 40 && VERB.test(t)) return t;
  if (!VERB.test(t)) {
    const body = t.replace(/[.]$/, "");
    if (/^\d/.test(body) || /°/.test(body)) return finishSentence(`Cook ${body.toLowerCase()}`);
    const first = (body.split(/\s+/)[0] ?? "").toLowerCase();
    if (first.length >= 4 && !/^(the|and|with|from|into|some|half|this|that|each)$/.test(first)) {
      return finishSentence(capitalize(body));
    }
    return finishSentence(`Add the ${body.toLowerCase()}`);
  }
  return t;
}

function patternEnrich(step: string, recipe: RecipeLike): string | null {
  const s = step.replace(/\s+/g, " ").trim();
  const meat = proteinNoun(recipe);

  const high = s.match(/high pressure (\d+)\s*minutes?/i);
  if (high && !/lock the lid/i.test(s)) {
    return `Lock the Instant Pot lid. Cook at high pressure for ${high[1]} minutes.`;
  }
  const nat = s.match(/natural(?: release)? (\d+)/i);
  if (nat && s.length < 48) {
    return `Let the pressure release naturally for ${nat[1]} minutes, then open the lid.`;
  }

  if (/\bbrown\b/i.test(s) && /onion/i.test(s) && /beef|pork|turkey|meat/i.test(s)) {
    const drain = /drain/i.test(s) ? " Drain extra fat." : "";
    return `Set a wide skillet over medium-high heat. Add the ${meat} and the chopped onion. Cook 6–8 minutes, breaking the meat up with a spoon, until no pink remains.${drain}`;
  }

  if (/^brown\b/i.test(s) && s.length < 90 && !hasTime(s)) {
    return `Set a wide skillet over medium-high heat. Add the ${meat}. Cook 6–8 minutes, turning, until browned. ${s.replace(/^brown[^.]*\.\s*/i, "")}`.trim();
  }

  const simmerN = s.match(/simmer(?: for)? (\d+)\s*minutes?/i);
  if (simmerN && s.length < 140 && !/medium-low|pour off extra fat|swirl in the butter/i.test(s)) {
    const without = s.replace(/\s*simmer(?: for)? \d+\s*minutes?\.?/i, "").trim();
    const head = without ? finishSentence(without) + " " : "";
    const names = recipe.ingredients.map((i) => i.name).join(" ");
    const saucey = /ketchup|tomato|marinara|cream|mustard|wine|sauce/i.test(`${s} ${names}`);
    const tail = saucey
      ? `Turn the heat to medium-low and simmer ${simmerN[1]} minutes, stirring now and then, until the sauce thickens.`
      : `Turn the heat to medium-low and simmer ${simmerN[1]} minutes, stirring now and then.`;
    return `${head}${tail}`.replace(/\s+/g, " ");
  }

  if (/spoon onto toasted buns/i.test(s) || /onto toasted buns/i.test(s)) {
    const bun = recipe.ingredients.find((i) => /bun|roll/i.test(i.name))?.name ?? "buns";
    return `Toast the ${bun} 1–2 minutes, cut side down, until gold. Spoon the filling onto the ${bun} and serve hot.`;
  }

  if (/^mix\b/i.test(s) && /shape|roll|patty/i.test(s) && !hasTime(s)) {
    return `${finishSentence(s)} Set a skillet over medium-high heat and brown 3–4 minutes per side.`;
  }

  if (/\bbake\b/i.test(s) && hasTime(s) && !/until/i.test(s)) {
    const extraSentences = (s.match(/[.!?]/g) ?? []).length > 1;
    if (extraSentences) return null;
    const mins = minutesIn(s);
    return s.replace(/\.$/, `, ${bakeFinish(recipe, mins)}.`);
  }

  if (/drop spoonfuls/i.test(s) && /cover/i.test(s)) {
    return s.replace(/do not peek\.?/i, "Do not lift the lid — the dumplings steam in 15 minutes.");
  }

  return null;
}

function genericEnrich(step: string, recipe: RecipeLike): string {
  let s = finishSentence(step);

  if (HEAT_VERB.test(s) && !hasTime(s)) {
    const d = inferDuration(s, recipe);
    if (d) {
      const sentences = s.match(/[^.!?]+[.!?]+/g);
      const heatAt = sentences?.findIndex((x) => HEAT_VERB.test(x)) ?? -1;
      if (sentences && heatAt >= 0) {
        const target = sentences[heatAt]!.replace(/[.!?]\s*$/, "");
        sentences[heatAt] = /\buntil\b/i.test(target) ? `${target} — about ${d}.` : `${target} for ${d}.`;
        s = sentences.join(" ").replace(/\s+/g, " ");
      } else if (/\buntil\b/i.test(s)) {
        s = s.replace(/\.$/, ` — about ${d}.`);
      } else {
        s = s.replace(/\.$/, ` for ${d}.`);
      }
    }
  }

  if (isPressure(recipe) && /saut[eé]/i.test(s) && !/instant pot/i.test(s)) {
    s = `Set the Instant Pot to Sauté. ${s}`;
  } else if (HEAT_VERB.test(s) && !/\b(skillet|pan|pot|oven|saucepan|sheet|dish|instant pot|grill)\b/i.test(s)) {
    if (/\bbrown\b|\bsear\b|\bfry\b|saut[eé]/i.test(s)) {
      s = `Set a wide skillet over medium-high heat. ${s}`;
    } else if (/\bsimmer\b|\bstew\b/i.test(s)) {
      s = `Use a heavy pot over medium heat. ${s}`;
    } else if (/\bboil\b/i.test(s) && /pasta|noodle|spaghetti|macaroni/i.test(s)) {
      s = `Bring a large pot of salted water to a boil. ${s}`;
    }
  }

  if (/\bdrain\b/i.test(s) && /\bfat\b/i.test(s) && s.length < 80) {
    s = "Tilt the pan and drain off extra fat so the sauce is not greasy.";
  }

  return finishSentence(s.replace(/\s+/g, " "));
}

function enrichStep(raw: string, recipe: RecipeLike): string {
  const expanded = expandFragment(raw, recipe);
  return patternEnrich(expanded, recipe) ?? genericEnrich(expanded, recipe);
}

function splitIfPacked(steps: string[]): string[] {
  if (steps.length <= 3) {
    const out: string[] = [];
    for (const raw of steps) {
      const parts = raw.split(/(?<=[.!?])\s+(?=[A-Za-z"“(\d])/);
      const pieces = parts.length > 1 ? parts : raw.split(/(?<=\.)\s+/);
      for (const p of pieces) {
        const t = p.trim();
        if (t.length >= 5) out.push(t);
      }
    }
    return out.length ? out : steps;
  }
  return steps.map((s) => s.trim()).filter((s) => s.length >= 8);
}

function isClearStep(step: string, recipe: RecipeLike): boolean {
  if (step.length < 50) return false;
  if (!VERB.test(step)) return false;
  if (HEAT_VERB.test(step) && !hasTime(step) && !/\buntil\b/i.test(step)) return false;
  return mentionsFood(step, recipe);
}

function isClearMethod(steps: string[], recipe: RecipeLike): boolean {
  if (steps.length < 5) return false;
  const clear = steps.filter((s) => isClearStep(s, recipe)).length;
  return clear >= Math.min(5, steps.length) && steps.every((s) => s.length >= 40);
}

function serveLine(recipe: RecipeLike): string {
  if (isDrink(recipe)) return "Taste, adjust the sweet or sour, and serve.";
  if (recipe.plate === "dessert") return "Cool until just set, then slice or spoon and serve.";
  if (recipe.plate === "toast") return "Serve right away so the bread stays crisp.";
  if (recipe.plate === "soup") return "Taste for salt. Ladle into warm bowls.";
  return "Rest 2 minutes, then plate and serve hot.";
}

function isKeepableMethod(steps: string[], recipe: RecipeLike): boolean {
  const junk =
    /ingredients on the list|the rest of the list|flip \d+ with|use the ingredients|bubbling at the edges and hot in the center/i;
  if (steps.some((s) => junk.test(s))) return false;
  if (isClearMethod(steps, recipe)) return true;
  if (steps.length >= 4 && steps.every((s) => s.length >= 40 && VERB.test(s))) return true;
  return false;
}

export function polishSteps(recipe: RecipeLike): string[] {
  const original = recipe.steps.map((s) => finishSentence(s.replace(/\s+/g, " ").trim())).filter((s) => s.length >= 8);
  if (isKeepableMethod(original, recipe)) return original.slice(0, 8);
  return writeDishMethod(recipe);
}

function cleanDescription(recipe: Recipe, name: string): string {
  let d = (recipe.description ?? "").replace(/[="]+/g, " ").replace(/\s+/g, " ").trim();
  d = d.replace(/…\s*$/, "").trim();
  if (d.length < 20 || JUNK_NAME.test(d) || /to obtain good broth/i.test(d)) {
    return `${name} — homemade, about ${recipe.minutes} minutes.`;
  }
  if (d.length > 180) d = `${d.slice(0, 177).replace(/\s+\S*$/, "")}.`;
  return d;
}

export function polishRecipe(recipe: Recipe): Recipe | null {
  const name = cleanRecipeName(recipe.name);
  if (!name) return null;
  const ingredients = recipe.ingredients.filter((i) => i.name && !JUNK_NAME.test(i.name.trim()));
  if (ingredients.length < 1) return null;
  const next = { ...recipe, name, ingredients };
  return {
    ...next,
    description: cleanDescription(next, name),
    steps: polishSteps(next),
  };
}

export function polishCatalog(list: Recipe[]): Recipe[] {
  const out: Recipe[] = [];
  const seen = new Set<string>();
  for (const recipe of list) {
    const polished = polishRecipe(recipe);
    if (!polished || seen.has(polished.id)) continue;
    seen.add(polished.id);
    out.push(polished);
  }
  return out;
}

export function isBannedDishName(name: string): boolean {
  return cleanRecipeName(name) === null;
}

export function foodsUsedInStep(step: string, ingredients: Recipe["ingredients"]): Recipe["ingredients"] {
  return ingredients.filter((ing) => {
    const n = ing.name.toLowerCase();
    const t = step.toLowerCase();
    if (t.includes(n)) return true;
    return n
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["fresh", "ground", "dried", "white", "black", "green", "whole"].includes(w))
      .some((w) => t.includes(w));
  });
}
