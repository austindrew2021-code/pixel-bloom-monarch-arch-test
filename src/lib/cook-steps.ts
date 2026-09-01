import type { Recipe } from "./types";
import { knownDishMethod, writeDishMethod, hasSpecialistMethod } from "./write-method.ts";
import { scaleQty } from "./cuisine.ts";
import { prettyFrac } from "./format.ts";

type RecipeLike = Pick<Recipe, "name" | "minutes" | "protein" | "plate" | "tags" | "ingredients" | "steps"> & {
  id?: string;
};

const MAX_STEPS = 14;

const JUNK_NAME =
  /^(ingredients?|directions?|instructions?|method|recipes?|index|contents|preface|introduction|chapter\s+\d+|camp cookery)$/i;

const VERB =
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|char|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|uncover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|purée|puree|mash|shred|roll|knead|steam|pressure|nestle|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|adjust|remove|return|transfer|flip|turn|skim|strain|chill|freeze|thaw|soak|marinate|deglaze|reduce|thicken|crumble|sprinkle|dust|dredge|coat|dip|broil|blanch|peel|core|trim|rinse|wash|set|put|place|drop|press|shape|form|score|tie|truss|cook|scald|dissolve|cream|sift|whip|baste|carve|ladle|dot|glaze|wilt|sweat|bloom|steep|frost|ice|crack|juice|zest|halve|quarter|cube|pull|lock|flatten|melt|wrap|scatter|drizzle|paint|scramble|crisp|reheat|keep|dollop|smash|wipe|blot|loosen|swirl|pack|unmold|line|lift|discard|nest|thread|prick|joint|skewer|try|lay|let|assemble|garnish|divide|cool|unmold|make|shake|eat|fluff|refrigerate|air-?fry|prick|griddle|work|open|flake|pipe|invert|bloom|get|moisten|lower|separate|pile|swipe|shave|smear|arrange|stack|blind-?bake|nestle)\b/i;

const HEAT_VERB = /\b(brown|sear|simmer|bake|roast|fry|boil|grill|broil|cook|toast|steam|pressure)\b|saut[eé]/i;

function minutesWord(n: string | number, unit?: string): string {
  const num = Number(n);
  const u = (unit || "minute").toLowerCase();
  if (/^hours?$|^hrs?$/.test(u)) return num === 1 ? "hour" : "hours";
  return num === 1 ? "minute" : "minutes";
}

function tidyCookText(s: string): string {
  let t = s.replace(/\s+/g, " ").trim();
  t = t.replace(/\b1 minutes\b/gi, "1 minute");
  t = t.replace(/\b1 hours\b/gi, "1 hour");
  t = t.replace(/\b(so the mix is set)(?:[,.]?\s+\1)+\b/gi, "$1");
  t = t.replace(/\b(so everything is ready)(?:[,.]?\s+\1)+\b/gi, "$1");
  t = t.replace(/\bin an even layer in an even layer\b/gi, "in an even layer");
  t = t.replace(/\b(until everything is hot and combined)\. Cook, stirring, \1\.?/gi, "$1.");
  t = t.replace(/\bthe the\b/gi, "the");
  t = t.replace(/\bremaining the\b/gi, "remaining");
  t = t.replace(/\bthe can of the\s+/gi, "the ");
  t = t.replace(/\bthe slice of the\s+/gi, "the ");
  t = t.replace(/\ba can of the\s+/gi, "the ");
  t = t.replace(/\bthe hot the\s+/gi, "the hot ");
  t = t.replace(/\ba little hot the\s+/gi, "a little of the hot ");
  t = t.replace(/\bover hot the\s+/gi, "over the ");
  t = t.replace(/\bHot the\s+/g, "Heat the ");
  t = t.replace(/\b(ravioli|butter|chicken|beef|pork|turkey|onion|garlic) \1\b/gi, "$1");
  t = t.replace(/\bIn the same pan, Let\b/g, "In the same pan, let");
  t = t.replace(/\bStir in the and the\b/gi, "Stir in the");
  t = t.replace(/\bthe bunch of the\b/gi, "the");
  t = t.replace(/\bthe head of the\b/gi, "the");
  t = t.replace(/\bAdd the on a\b/gi, "On a");
  t = t.replace(/\bFold in the fold\b/gi, "Fold it over");
  t = t.replace(/\bAdd and cook\b/gi, "Cook");
  t = t.replace(/\bEgg on top\. the\b/gi, "Egg on top, with the");
  t = t.replace(/\band and\b/gi, "and");
  t = t.replace(/\bAdd the lay\b/gi, "Lay");
  t = t.replace(/\bFold in the together\b/gi, "Fold together");
  t = t.replace(/\bEat cold until the sauce is even\.?/gi, "Eat cold.");
  t = t.replace(/\buntil the sauce is even so the mix is set/gi, "until the sauce is even");
  t = t.replace(/\bthe (cold|chopped|melted|hot|warm|boiling|fresh|ground|grated) the\b/gi, "the $1");
  t = t.replace(/\bthe the\b/gi, "the");
  t = t.replace(/\s+/g, " ").trim();
  return finishSentence(t);
}

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
    if (recipe.protein === "veg") {
      return /tofu|tempeh|bean|lentil|chickpea|mushroom|eggplant|cauliflower|squash/.test(n);
    }
    if (recipe.protein === "chicken" || recipe.protein === "turkey") return /chicken|turkey|thigh|breast|duck|goose|rabbit/.test(n);
    if (recipe.protein === "beef") return /beef|steak|chuck|lamb|filet|mignon|sirloin|bison|venison|elk/.test(n);
    if (recipe.protein === "pork") return /pork|ham|bacon|sausage/.test(n);
    if (recipe.protein === "fish" || recipe.protein === "seafood") return /fish|salmon|shrimp|cod|tuna|clam/.test(n);
    if (recipe.protein === "eggs") return /egg/.test(n);
    return false;
  });
  return hit?.name ?? recipe.ingredients[0]?.name ?? "the vegetables";
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
  if (VERB.test(first)) return null;

  const tokens = raw
    .split(/\s*,\s*|\s+or\s+|\s+and\s+/i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== "and");
  if (tokens.length === 0) return null;

  if (tokens.some((t) => /fry|deep-fry|crumb/.test(t)) && tokens.some((t) => /egg/.test(t))) {
    return finishSentence(`Dip in beaten egg, then ${joinList(tokens.filter((t) => !/egg/.test(t)))}, and fry until gold`);
  }

  const batterish = tokens.some((t) => /milk|flour|butter|sugar|dough|crumb/.test(t));
  const cookedEgg = recipe.steps.some((s) => /scramble|beat|fry|stir in/.test(s.toLowerCase()) && /egg/.test(s.toLowerCase()));
  if (tokens.length >= 1 && (SERVE_WORDS.has(tokens[0]!) || SERVE_WORDS.has(tokens[0]!.replace(/s$/, "")))) {
    if (batterish || (cookedEgg && tokens.some((t) => /egg/.test(t)))) return finishSentence(`Stir in the ${joinList(tokens)}`);
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
  if (/^spread on /i.test(lower)) {
    return finishSentence(`Spread the mixture ${lower.replace(/^spread /i, "")}`);
  }
  if (/^cream\.?$/i.test(lower) && (recipe.plate === "dessert" || /shortcake|berry|cake/i.test(recipe.name))) {
    return "Spoon cream over the top and serve.";
  }
  if (canned[lower]) {
    if (lower === "roll" && /cabbage|holub|golub|stuffed cabbage/i.test(`${recipe.name} ${(recipe.tags ?? []).join(" ")}`)) {
      return "Roll each leaf around a spoon of the filling, tucking in the sides so they hold.";
    }
    return canned[lower];
  }
  const finish = finishToken(lower);
  if (finish) {
    if (lower === "cream" && (recipe.plate === "dessert" || /shortcake|berry|cake/i.test(recipe.name))) {
      return "Spoon cream over the top and serve.";
    }
    if (lower === "egg" || lower === "eggs") {
      if (recipe.ingredients.some((i) => /flour|milk|butter|sugar|dough/i.test(i.name))) {
        return "Beat in the egg.";
      }
    }
    return finish;
  }

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
    /^(flip|turn|sear|render|simmer|bake|roast|boil|cook|fry|sauté|saute|steam|rest|cover|broil|chill)(?: for)? (\d+)(?:[-–]\d+)?(?:\s+(minutes?|mins?|hours?|hrs?))?(?: a side| per side)?$/,
  );
  if (timed) {
    const verb = timed[1]!.toLowerCase();
    const n = timed[2]!;
    const unit = timed[3] || "minutes";
    const dur = `${n} ${minutesWord(n, unit)}`;
    const meat = proteinNoun(recipe);
    if (verb === "flip" || verb === "turn") {
      return `Flip the ${meat} and cook ${dur} on the other side.`;
    }
    if (verb === "sear") {
      return `Sear the ${meat} ${dur} per side.`;
    }
    if (verb === "render") {
      return `Cook the ${meat} skin-side down ${dur}, until the fat is rendered and the skin is gold.`;
    }
    if (verb === "steam") return `Cover and steam for ${dur}, until tender all the way through.`;
    if (verb === "rest") {
      const blob = `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${recipe.plate}`.toLowerCase();
      if (isDoughRest(recipe) || /cornmeal|meal|mush|batter|dough|flour/.test(`${blob} ${meat}`)) {
        return `Rest ${dur} so the mix hydrates and thickens.`;
      }
      if (/meatloaf|loaf/.test(blob)) {
        return `Rest the loaf ${dur} so it slices clean.`;
      }
      return `Rest the ${meat} ${dur} off the heat so the juices settle.`;
    }
    if (verb === "cover") return `Cover the pan and cook ${dur}.`;
    if (verb === "broil") {
      const range = lower.match(/(\d+\s*[-–]\s*\d+)/);
      return `Broil ${range ? range[1].replace(/\s+/g, "") : dur}, until the top is browned and bubbling.`;
    }
    if (verb === "chill") return `Chill ${dur} so the mix is set.`;
    if (verb === "simmer" || verb === "boil" || verb === "cook") {
      return `${capitalize(verb)} for ${dur}, until the food is tender and cooked through.`;
    }
    return `${capitalize(timed[1]!)} for ${dur}.`;
  }
  const high = lower.match(/^high pressure (\d+) minutes?$/);
  if (high) return `Lock the lid. Cook at high pressure for ${high[1]} ${minutesWord(high[1])}.`;
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
  if (/^stir in the morning/i.test(lower)) {
    return "Stir in the morning. Eat cold, or warm for 30 seconds if you want.";
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
    const blob = `${recipe.name} ${recipe.steps.join(" ")}`.toLowerCase();
    if (/mold|mould|paste|terrine/.test(blob)) {
      return "Turn out of the mold and slice.";
    }
    return `Slice the ${proteinNoun(recipe)} across the grain and spoon the pan juices over.`;
  }
  if (/^spoon over/i.test(lower)) {
    return `Spoon the pan sauce over the ${proteinNoun(recipe)}.`;
  }

  const onThe = lower.match(/^(.+?) on the (fish|chicken|meat|pork|lamb|steak|vegetables|veg)$/);
  if (onThe && !VERB.test(onThe[1]!.split(/\s+/)[0] ?? "x")) {
    return finishSentence(`Rub ${onThe[1]} on the ${onThe[2]}`);
  }

  const ovenRange = lower.match(/^(\d{3})\s*°?\s*f\s+(\d+)\s*(?:to|-|–)\s*(\d+)\s*minutes?$/);
  if (ovenRange) {
    return `Bake at ${ovenRange[1]}°F for ${ovenRange[2]} to ${ovenRange[3]} minutes.`;
  }
  const ovenOnly = lower.match(/^(\d{3})\s*°?\s*f(?:\s+(\d+)\s*minutes?)?$/);
  if (ovenOnly) {
    const air = (recipe.tags ?? []).includes("air-fryer") || /air-?fryer/.test(recipe.name);
    if (ovenOnly[2] && air) {
      return `Air-fry at ${ovenOnly[1]}°F for ${ovenOnly[2]} minutes, turning once.`;
    }
    return ovenOnly[2]
      ? `Bake at ${ovenOnly[1]}°F for ${ovenOnly[2]} minutes.`
      : `Heat the oven to ${ovenOnly[1]}°F.`;
  }
  const slowH = lower.match(/^(high|low)\s+(\d+)\s*hours?/);
  if (slowH) {
    return `Cover and cook on ${slowH[1]} for ${slowH[2]} hours, until tender.`;
  }

  if (/^fold\.?$/i.test(lower) || /^fold\.\s+/i.test(lower)) {
    return "Fold it over and slide it onto a plate.";
  }
  if (/^fold\b/i.test(lower) && !/^fold and serve\.?$/i.test(lower)) {
    if (/^fold(?:\s+in)?\s+(gently|carefully|slowly|lightly)\b/i.test(lower)) {
      return finishSentence(capitalize(t));
    }
    const rest = lower.replace(/^fold(?:\s+in)?\s+/i, "").replace(/[.]+$/, "");
    if (!rest || rest === "fold" || /^slide\b/i.test(rest)) {
      return "Fold it over and slide it onto a plate.";
    }
    if (rest) {
      const noun = /^the\s+/i.test(rest) ? rest : `the ${rest}`;
      return finishSentence(`Fold in ${noun}`);
    }
  }

  if (/^steam\b/i.test(lower) && !hasTime(t) && !/until/i.test(lower)) {
    return finishSentence(`${capitalize(t.replace(/[.]$/, ""))}, until just tender, 4–5 minutes`);
  }

  if (/^cut apples/i.test(lower)) {
    return "Peel and cut the apples into thick slices.";
  }
  if (/^slice pears/i.test(lower)) {
    return "Peel and slice the pears.";
  }

  if (/^assemble\b/i.test(lower) || /^add the assemble\b/i.test(lower)) {
    return "Divide among bowls. Spoon the sauce over the top and serve.";
  }
  if (/^in the (?:same )?pan,?\s+/i.test(lower)) {
    return finishSentence(`In the same pan, ${lower.replace(/^in the (?:same )?pan,?\s+/i, "")}`);
  }
  if (/^soak(?: the)? beans/i.test(lower)) {
    return "Soak the beans in plenty of cold water overnight, or at least 8 hours. Drain.";
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
    if (/^\d/.test(body) || /°/.test(body)) {
      const range = body.match(/(\d{3})\s*°?\s*f\s+(\d+)\s*(?:to|-|–)\s*(\d+)\s*minutes?/i);
      if (range) return `Bake at ${range[1]}°F for ${range[2]} to ${range[3]} minutes.`;
      const one = body.match(/(\d{3})\s*°?\s*f\s+(\d+)\s*minutes?/i);
      if (one) return `Bake at ${one[1]}°F for ${one[2]} minutes.`;
      return finishSentence(`Bake at ${body}`);
    }
    const first = (body.split(/\s+/)[0] ?? "").toLowerCase();
    if (
      first.length >= 2 &&
      /^(in|on|at|to|for|into|onto|over|under|after|before|once|when|while|until|if|with|from|the|and|some|half|this|that|each)$/.test(
        first,
      )
    ) {
      return finishSentence(capitalize(body));
    }
    if (body.length >= 40) return finishSentence(capitalize(body));
    if (first.length >= 4) return finishSentence(capitalize(body));
    return finishSentence(`Add the ${body.toLowerCase()}`);
  }
  return t;
}

function patternEnrich(step: string, recipe: RecipeLike): string | null {
  const s = step.replace(/\s+/g, " ").trim();
  const meat = proteinNoun(recipe);

  const high = s.match(/high pressure (\d+)\s*minutes?/i);
  if (high && !/lock the lid/i.test(s)) {
    return `Lock the Instant Pot lid. Cook at high pressure for ${high[1]} ${minutesWord(high[1])}.`;
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

  const toastAsNoun = /\b(serve|plate|over|on|with|from)\b.*\btoast\b/i.test(s) && !/\btoast(?:ed|ing)? the\b/i.test(s);
  const doNotHeat = /\bdo not\b|\bdon't\b/i.test(s);
  if (HEAT_VERB.test(s) && !hasTime(s) && !doNotHeat && !toastAsNoun) {
    const d = inferDuration(s, recipe);
    if (d) {
      const sentences = s.match(/[^.!?]+[.!?]+/g);
      const heatAt = sentences?.findIndex((x) => HEAT_VERB.test(x) && !/\bdo not\b/i.test(x)) ?? -1;
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
    if (/^(add|stir|pour|return|fold|nestle|cover|simmer)\b/i.test(s)) {
      /* already in a pan — don't start a new one */
    } else if (/\bbrown\b|\bsear\b|\bfry\b|saut[eé]/i.test(s)) {
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

function keepPiece(s: string): boolean {
  return s.trim().length >= 4;
}

function isJunkMethod(steps: string[]): boolean {
  const junk =
    /ingredients on the list|the rest of the list|flip \d+ with|use the ingredients|bubbling at the edges and hot in the center/i;
  return steps.some((s) => junk.test(s));
}

const AND_NEXT_ACTION =
  /\s+and\s+(?=(?:heat|warm|fry|stir|add|spread|toss|bake|simmer|broil|sear|grill|fold|drain|mash|whisk|pour|serve|plate|roast|boil|cook|wilt|steam|crisp|brown|saute|sauté|toast|blend|chill|rest|top|finish|kill|set|return|transfer|cover|uncover|reduce|season|lay)\b)/i;

function unpackOneStep(raw: string): string[] {
  const t = raw.trim();
  if (t.length < 5) return [];
  const sentences = t.split(/(?<=[.!?])\s+(?=[A-Za-z"“(\d])/);
  const pieces = sentences.length > 1 ? sentences : t.split(/\s*;\s+/);
  const out: string[] = [];
  for (const piece of pieces) {
    const p = piece.trim();
    if (p.length < 5) continue;
    const parts = p.split(AND_NEXT_ACTION);
    if (parts.length > 1 && (parts[0]?.length ?? 0) >= 20 && VERB.test(parts[0]!)) {
      out.push(parts[0]!.trim());
      for (let i = 1; i < parts.length; i++) out.push(capitalize(parts[i]!.trim()));
    } else {
      out.push(p);
    }
  }
  return out.length ? out : [t];
}

function splitIfPacked(steps: string[]): string[] {
  const out: string[] = [];
  for (const raw of steps) {
    for (const p of unpackOneStep(raw)) {
      if (p.trim().length >= 5) out.push(p.trim());
    }
  }
  return out.length ? out : steps;
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
  const blob = `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${recipe.plate}`.toLowerCase();
  if (isDrink(recipe)) return "Taste, adjust the sweet or sour, and serve.";
  if (recipe.plate === "green" || /salad|slaw|aspic/.test(blob)) return "Serve cold, on a chilled plate.";
  if ((recipe.tags ?? []).includes("chilled") || /yogurt|parfait|overnight|muesli/.test(blob)) {
    return "Serve cold, straight from the fridge.";
  }
  if (recipe.plate === "dessert") return "Cool until just set, then slice or spoon and serve.";
  if (recipe.plate === "toast") return "Serve right away so the bread stays crisp.";
  if (recipe.plate === "soup") return "Taste for salt. Ladle into warm bowls.";
  return "Rest 2 minutes, then plate and serve hot.";
}

function isUsableCookStep(s: string): boolean {
  const t = s.trim();
  if (t.length < 36) return false;
  if (!VERB.test(t)) return false;
  if (/^(gravy|potatoes|rice|bread|salad|slaw|chips) from\b/i.test(t) && t.length < 48) return false;
  return true;
}

function isFromABook(recipe: RecipeLike): boolean {
  const tags = recipe.tags ?? [];
  if (tags.some((t) => t.startsWith("book-") || t === "vintage" || t === "wartime" || t.startsWith("era-") || t === "southern")) {
    return true;
  }
  const id = recipe.id ?? "";
  return /^(so-|vh-|ar-|wg-)/.test(id);
}

function isKeepableMethod(steps: string[], recipe: RecipeLike): boolean {
  if (isJunkMethod(steps)) return false;
  if (isClearMethod(steps, recipe)) return true;
  const solid = (s: string) => s.length >= 40 && VERB.test(s) && mentionsFood(s, recipe);
  if (steps.length >= 3 && steps.every(solid)) return true;
  if (steps.length >= 3 && steps.every((s) => isUsableCookStep(s))) return true;
  if (steps.length >= 3 && steps.filter(isUsableCookStep).length >= 3 && steps.every((s) => s.length >= 20)) return true;
  if (isFromABook(recipe) && steps.length >= 3 && steps.every((s) => s.length >= 24 && VERB.test(s))) return true;
  if (steps.length >= 3 && steps.every((s) => s.length >= 24 && VERB.test(s)) && !isJunkMethod(steps)) return true;
  return false;
}

const NEW_COOK_STAGE =
  /\b(preheat|heat|bake|roast|broil|grill|sear|simmer|boil|steam|chill|rest|serve|plate|drain|transfer|fry|poach|whisk|spread|toast|fold|brown|saute|sauté|wilt|cook|lock|blend|mash|score|pat|set|stir|spoon|add|pour|toss|mix|soak|assemble|pile|swipe|roll)\b/i;

function isDoughRest(recipe: RecipeLike): boolean {
  const blob = `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${recipe.plate}`.toLowerCase();
  return (
    /sourdough|dough|starter|bread flour|baking|hoe cake|cornmeal|batter|mush|pastry/.test(blob) ||
    recipe.ingredients.some((i) => /starter|bread flour|cornmeal|flour/.test(i.name))
  );
}

function lengthenShortCard(s: string, recipe: RecipeLike): string {
  const raw = finishSentence(s.replace(/\s+/g, " ").trim());
  if (raw.length >= 40) return raw;
  const t = raw.replace(/[.]+$/, "").trim();
  const lower = t.toLowerCase();
  const meat = proteinNoun(recipe);

  if (/^do not stir/i.test(t)) {
    return "Do not stir — leave it layered so the top stays frosty.";
  }
  if (/^do not boil/i.test(t)) {
    return "Do not let it boil, or the milk will curdle. Keep it just steaming.";
  }
  if (/^lower(?: the)? heat/i.test(t)) {
    return "Lower the heat so it cooks gently without burning.";
  }
  if (/^drain\.?$/i.test(t)) {
    return "Drain well, then continue with the next step.";
  }
  if (/^serve cold/i.test(t)) {
    return "Serve cold, straight from the fridge.";
  }
  if (/^instantly on toast/i.test(t)) {
    return "Spoon instantly over hot toast and serve at once.";
  }
  if (/^pat ½ inch/i.test(t) || /^pat 1\/2 inch/i.test(t)) {
    return "Pat the dough out ½ inch thick and cut into pieces.";
  }
  if (/^blend and serve/i.test(t)) {
    return "Stir until everything is hot and combined, then serve.";
  }
  if (/^cook down/i.test(t)) {
    return finishSentence(`${t}, until the pot is thick and the flavors have come together`);
  }
  if (/^rest before carving/i.test(t)) {
    return `Rest the ${meat} 15–20 minutes off the heat before carving so the juices settle.`;
  }
  if (/^spoon batter in/i.test(t)) {
    return "Spoon the batter in, a few at a time, leaving room to turn them.";
  }
  if (/^cakes? ½ inch/i.test(t) || /^cakes? 1\/2 inch/i.test(t)) {
    return "Shape into cakes ½ inch thick and lay them on a hot greased griddle.";
  }
  if (/^broil until browned/i.test(t)) {
    return "Broil until browned on both sides, 8–10 minutes, then serve hot.";
  }
  if (/^turn out onto a plate/i.test(t)) {
    return "Turn the curds out onto a plate so they hold their shape.";
  }
  if (/^cook until almost done/i.test(t)) {
    return "Cook until almost tender, then add the rest of the food.";
  }
  if (/^taste for salt/i.test(t) || /^taste and add salt/i.test(t)) {
    return "Taste and add salt until the flavor is round, then serve.";
  }
  if (/^serve at once/i.test(t) || /^serve (very )?hot/i.test(t) || /^serve right away/i.test(t) || /^serve clear/i.test(t) || /^plate and serve/i.test(t)) {
    return serveLine(recipe);
  }
  if (/^heat gently/i.test(t)) {
    return "Heat gently until steaming, and do not let it boil.";
  }
  if (/^chill until firm/i.test(t)) {
    return "Chill until firm, at least 2 hours, then turn out of the mold.";
  }
  if (/^chill overnight/i.test(t)) {
    return "Chill overnight so the flavors settle and the mix is set.";
  }
  if (/^chill in the icebox/i.test(t) || /^chill in a mold/i.test(t)) {
    return finishSentence(`${t} so it is cold through and holds its shape`);
  }
  if (/^fold and serve/i.test(t)) {
    return "Fold together just until combined, then plate and serve.";
  }
  if (/^mash a few/i.test(t) || /^mash some beans/i.test(t)) {
    return "Mash some of the beans against the side of the pot so the soup turns creamy.";
  }
  if (/^add chicken\.?$/i.test(t) || /^add chicken$/i.test(t)) {
    return `Nestle the ${meat} back into the sauce and simmer 5 minutes so it drinks the gravy.`;
  }
  if (/^add crab\.?$/i.test(t)) {
    return "Fold in the crab gently so the lumps stay whole.";
  }
  if (/^pour b[ée]chamel/i.test(t)) {
    return "Pour the béchamel over the top in an even layer.";
  }
  if (/^spread over the mince/i.test(t)) {
    return "Spread the mash over the mince in an even layer, sealing the edges.";
  }
  if (/^broil until charred/i.test(t)) {
    return "Broil until the edges are charred and the meat is just cooked through.";
  }
  if (/^melt cheddar off heat/i.test(t)) {
    return "Take the pan off the heat and melt in the cheddar, stirring until the sauce is smooth.";
  }
  if (/^rest, slice, spoon (sauce|gravy)/i.test(t)) {
    const what = /gravy/i.test(t) ? "gravy" : "sauce";
    return `Rest the ${meat} 5 minutes off the heat. Slice across the grain and spoon the ${what} over.`;
  }
  if (/^assemble\b/i.test(t) || /^add the assemble/i.test(t)) {
    return "Divide among bowls. Spoon the sauce over the top and serve.";
  }
  if (/^green onion/i.test(t)) {
    return "Scatter the sliced green onion over the top and serve hot.";
  }
  if (/^bread\.?$/i.test(t)) {
    return "Serve with warm bread for scooping.";
  }
  if (/^soak(?: the)? beans/i.test(t) || /^soak overnight/i.test(t)) {
    return "Soak the beans in plenty of cold water overnight, or at least 8 hours. Drain.";
  }
  if (/^rest 5/i.test(t) || /^rest 5–10 minutes off the heat/i.test(t) || /^rest \d/i.test(t)) {
    if (isDoughRest(recipe)) return finishSentence(`Rest ${t.replace(/^rest\s+/i, "")} so the mix hydrates`);
    if (/meatloaf|loaf/i.test(recipe.name)) return "Rest the loaf 5–10 minutes off the heat so it slices clean.";
    if (recipe.protein === "veg" && !/tofu|tempeh/.test(meat)) {
      return finishSentence(`Rest ${t.replace(/^rest\s+/i, "")} so it settles, then continue`);
    }
    return `Rest the ${meat} 5–10 minutes off the heat so the juices settle, then slice.`;
  }
  if (/^fold in /i.test(t)) {
    return finishSentence(`${t} just until they disappear into the mix`);
  }
  if (/^serve with /i.test(t)) {
    return finishSentence(`Spoon onto plates and serve with ${t.replace(/^serve with /i, "")} on the side`);
  }
  if (/^serve over /i.test(t)) {
    return finishSentence(`Spoon over ${t.replace(/^serve over /i, "")} and serve hot`);
  }
  if (/^serve on /i.test(t)) {
    return finishSentence(`Spoon onto ${t.replace(/^serve on /i, "")} and serve at once`);
  }
  if (/^cook (?:a pot of )?the /i.test(t) && /(rice|quinoa|farro|grain|pasta)/i.test(t)) {
    return finishSentence(`${t} in salted water until tender, then drain`);
  }
  if (/^cook a pot of /i.test(t)) {
    return finishSentence(`${t} in salted water until tender, then drain`);
  }
  if (/^pour into /i.test(t)) {
    return finishSentence(`${t} and spread it in an even layer`);
  }
  if (/^pour over /i.test(t) || /^pour fat over /i.test(t)) {
    return finishSentence(`${t} so everything is coated`);
  }
  if (/^spread /i.test(t)) {
    return finishSentence(`${t} in an even layer, all the way to the edges`);
  }
  if (/^add /i.test(t)) {
    return finishSentence(`${t} and cook, stirring, until everything is hot and combined`);
  }
  if (/^pour /i.test(t)) {
    return finishSentence(`${t} in an even layer`);
  }
  if (/^squeeze (lemon|lime) over/i.test(t)) {
    return finishSentence(`${t} so the food tastes bright, then serve`);
  }
  if (/^cover and (steam|roast|bake|simmer)/i.test(t)) {
    return finishSentence(`${t}, until tender all the way through`);
  }
  if (/^spoon into cups/i.test(t) || /^spoon onto /i.test(t)) {
    return finishSentence(`${t} and serve while they are hot`);
  }
  if (/^chill /i.test(t)) {
    if (/so the mix is set|so it is cold|so it firms|so the flavors/i.test(t)) return finishSentence(t);
    return finishSentence(`${t} so the mix is set`);
  }
  if (/^take off the heat/i.test(t)) {
    return "Take the pan off the heat and let it sit 1 minute so it settles.";
  }
  if (/^slide onto a plate/i.test(t)) {
    return "Slide onto a plate and serve at once, while it is still hot.";
  }
  if (/^get out /i.test(t)) {
    return finishSentence(`${t.replace(/\.?$/, "")} so everything is within reach`);
  }
  if (/^shape /i.test(t) && t.length < 48) {
    return finishSentence(`${t.replace(/[.]$/, "")} with wet hands so they hold together`);
  }
  if (/^roll thin/i.test(t) && t.length < 48) {
    return finishSentence(`${t.replace(/[.]$/, "")} on a floured board`);
  }
  if (/^roll warm/i.test(t)) {
    return "Roll the sponge up while it is still warm so it does not crack.";
  }
  if (/^roll up/i.test(t) && t.length < 40) {
    return finishSentence(`${t.replace(/[.]$/, "")} and pinch the seam so the filling stays in`);
  }
  if (VERB.test(t)) {
    return finishSentence(t);
  }
  return finishSentence(capitalize(t));
}

function foldShortSteps(steps: string[], recipe?: RecipeLike): string[] {
  const out: string[] = [];
  for (const raw of steps) {
    let s = finishSentence(raw.replace(/\s+/g, " ").trim());
    if (!keepPiece(s)) continue;
    if (recipe && (s.length < 40 || !VERB.test(s))) {
      const expanded = expandFragment(s, recipe);
      if (expanded.length >= 28 && expanded.toLowerCase() !== s.toLowerCase()) s = expanded;
    }
    const weak = s.length < 36 || !VERB.test(s);
    const newStage = NEW_COOK_STAGE.test(s) && !/^lower(?: the)? heat/i.test(s) && !/^drain\.?$/i.test(s);
    if (out.length && weak && !newStage) {
      out[out.length - 1] = `${out[out.length - 1]!.replace(/[.]+$/, "")}. ${s}`;
      continue;
    }
    out.push(s);
  }
  if (!out.length) return steps.filter(keepPiece);
  if (out.length >= 2 && (out[0]!.length < 36 || !VERB.test(out[0]!))) {
    out[1] = `${out[0]!.replace(/[.]+$/, "")}. ${out[1]}`;
    out.shift();
  }
  const mapped = out.map((s) => {
    if (!recipe) return s;
    if (/^Serve hot\.?$/i.test(s) || /^Serve right away\.?$/i.test(s)) {
      return recipe ? serveLine(recipe) : "Plate and serve hot.";
    }
    if (/^Heat the oven to \d{3}°F\.?$/i.test(s)) {
      return `${s.replace(/\.?$/, "")} and set a rack in the middle.`;
    }
    if (/^Rest \d+[–-]?\d* minutes, then plate\.?$/i.test(s)) {
      return s.replace(/\.?$/, " and serve hot.");
    }
    if (/^Chill at least \d+ minutes\.?$/i.test(s)) {
      if (/so the mix is set/i.test(s)) return s;
      return s.replace(/\.?$/, " so the mix is set.");
    }
    if (/^Lock the lid\.?$/i.test(s)) {
      return "Lock the Instant Pot lid and make sure the valve is sealed.";
    }
    if (/^Drain on paper\.?$/i.test(s)) {
      return "Lift out and drain on a rack or paper so they stay crisp.";
    }
    if (/^Stir until even\.?$/i.test(s)) {
      return "Stir until the mix is even, with no dry pockets.";
    }
    if (/^Use a heavy pot over medium heat\.?$/i.test(s)) {
      return "Set a heavy pot over medium heat until the fat shimmers.";
    }
    if (/^Soak(?: the)? beans\.?$/i.test(s) || /^Soak overnight\.?$/i.test(s)) {
      return "Soak the beans in plenty of cold water overnight, or at least 8 hours. Drain.";
    }
    if (/^Chill(?: for)? (\d+)\s*minutes?\.?$/i.test(s) && s.length < 40) {
      if (/so the mix/i.test(s)) return s;
      return s.replace(/\.?$/, " so the mix firms up.");
    }
    if (/^Bake (\d+)\s*minutes? at (\d{3})°?F\.?$/i.test(s)) {
      return s.replace(
        /^Bake (\d+)\s*minutes? at (\d{3})°?F\.?$/i,
        "Bake at $2°F for $1 minutes, until the center is set and the top is gold.",
      );
    }
    if (/^Bake(?: covered)? (\d+(?:\.\d+)?)\s*hours? at (\d{3})°?F\.?$/i.test(s) || /^Bake covered (\d+)\s*minutes? at (\d{3})°?F\.?$/i.test(s)) {
      return finishSentence(`${s.replace(/\.?$/, "")}, until tender all the way through`);
    }
    if (/^Bake at (\d{3})°F for (\d+) minutes\.?$/i.test(s) && s.length < 40) {
      return s.replace(/\.?$/, ", until the center is set.");
    }
    if (/^Nestle in tomato sauce\.?$/i.test(s)) {
      return "Nestle the rolls in the tomato sauce, cover, and simmer until tender.";
    }
    if (/^Toss pasta\.?$/i.test(s)) {
      return "Drain the pasta, saving a cup of the water. Toss with the sauce.";
    }
    if (/^Serve with the /i.test(s) && s.length < 40) {
      return s.replace(/^Serve with /i, "Spoon into bowls and serve with ").replace(/\.?$/, " on the side.");
    }
    if (/^Serve over the /i.test(s) && s.length < 40) {
      return s.replace(/^Serve over /i, "Spoon over ").replace(/\.?$/, " and serve hot.");
    }
    if (s.length >= 40 && !(HEAT_VERB.test(s) && !hasTime(s) && s.length < 72)) return s;
    const next = expandFragment(s, recipe);
    const long = next.length >= 40 ? next : genericEnrich(next, recipe);
    return lengthenShortCard(long, recipe);
  }).filter(keepPiece);
  const collapsed: string[] = [];
  for (const s of mapped) {
    const last = collapsed[collapsed.length - 1];
    if (last && /^Set a wide skillet over medium-high heat\.?$/i.test(last) && /^Set a wide skillet over medium-high heat\./i.test(s)) {
      collapsed[collapsed.length - 1] = s;
      continue;
    }
    if (last && /^Set a wide skillet over medium-high heat\.?$/i.test(last) && /\b(brown|sear|fry|sauté|saute)\b/i.test(s)) {
      collapsed[collapsed.length - 1] = `${last.replace(/[.]+$/, "")}. ${s.replace(/^Set a wide skillet over medium-high heat\.\s*/i, "")}`;
      continue;
    }
    if (last && /^Use a heavy pot over medium heat\.?$/i.test(last) && /\b(simmer|stew|boil)\b/i.test(s)) {
      collapsed[collapsed.length - 1] = `${last.replace(/[.]+$/, "")}. ${s.replace(/^Use a heavy pot over medium heat\.\s*/i, "")}`;
      continue;
    }
    collapsed.push(s);
  }
  return collapsed.length ? collapsed : mapped;
}

function expandToMinCards(steps: string[], recipe: RecipeLike): string[] {
  let out = foldShortSteps(splitIfPacked(steps), recipe);
  const blob = out.join(" ");
  const first = out[0] ?? "";
  if (
    out.length < 3 &&
    /\b(bake|roast|oven)\b/i.test(blob) &&
    !/preheat|heat the oven/i.test(first) &&
    !/\bbroil\b/i.test(blob)
  ) {
    out = [`Heat the oven to ${ovenTemp(recipe)}°F and set a rack in the middle.`, ...out];
  }
  if (out.length && /\b(brown|sear|fry|sauté|saute|wilt)\b/i.test(out[0]!) && !/\b(skillet|pan|pot|oven)\b/i.test(out[0]!)) {
    out[0] = `Set a wide skillet over medium-high heat. ${out[0]}`;
  }
  if (out.length < 3) {
    const last = out[out.length - 1] ?? "";
    if (!/\b(serve|plate|ladle|eat)\b/i.test(last)) out.push(serveLine(recipe));
  }
  if (out.length < 3 && out.length === 2) {
    const longest = out.reduce((a, b, i) => (b.length > out[a]!.length ? i : a), 0);
    const split = unpackOneStep(out[longest]!);
    if (split.length > 1) out.splice(longest, 1, ...split.map((s) => finishSentence(s)));
  }
  return out.slice(0, MAX_STEPS);
}

const STOP_TOK = new Set([
  "fresh", "ground", "dried", "white", "black", "green", "whole", "juice", "kosher",
  "large", "small", "hot", "cold", "chopped", "sliced", "minced", "cooked", "raw",
  "unsalted", "salted", "extra", "virgin", "olive", "ripe", "mixed", "the", "and",
]);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pluralFoodName(name: string): string {
  if (/^ear of corn$/i.test(name)) return "ears of corn";
  if (/s$/i.test(name)) return name;
  if (/leaf$/i.test(name)) return name.replace(/leaf$/i, "leaves");
  if (/potato$/i.test(name)) return name.replace(/potato$/i, "potatoes");
  if (/tomato$/i.test(name)) return name.replace(/tomato$/i, "tomatoes");
  return `${name}s`;
}

function singularFoodName(name: string): string {
  const n = name.replace(/^the\s+/i, "");
  if (/^ears of corn$/i.test(n)) return "ear of corn";
  if (/\b(couscous|molasses|bass|citrus|hummus|asparagus|octopus|oats)\b/i.test(n)) return n;
  if (/leaves$/i.test(n)) return n.replace(/leaves$/i, "leaf");
  if (/potatoes$/i.test(n)) return n.replace(/potatoes$/i, "potato");
  if (/tomatoes$/i.test(n)) return n.replace(/tomatoes$/i, "tomato");
  if (/s$/i.test(n) && !/ss$/i.test(n)) return n.replace(/s$/i, "");
  return n;
}

function namePattern(name: string): string {
  const t = name.trim();
  if (/\b(couscous|molasses|bass|citrus|hummus|asparagus|octopus|oats)\b/i.test(t)) return escapeRe(t);
  const base = t.replace(/s$/i, "");
  if (base.length < 3) return escapeRe(t);
  return `${escapeRe(base)}s?`;
}

function prettyUnit(unit: string, qty: number): string {
  const raw = unit.trim().toLowerCase();
  if (!raw) return "";
  const map: Record<string, string> = {
    tbsp: "tablespoon", tablespoon: "tablespoon", tablespoons: "tablespoon",
    tsp: "teaspoon", teaspoon: "teaspoon", teaspoons: "teaspoon",
    cup: "cup", cups: "cup", oz: "ounce", ounce: "ounce", ounces: "ounce",
    lb: "pound", pound: "pound", pounds: "pound", pint: "pint", pints: "pint",
    quart: "quart", quarts: "quart", clove: "clove", cloves: "clove",
    can: "can", cans: "can", slice: "slice", slices: "slice",
    sprig: "sprig", sprigs: "sprig", pinch: "pinch", pinches: "pinch",
    dash: "dash", dashes: "dash", bunch: "bunch", bunches: "bunch",
  };
  const word = map[raw] ?? raw.replace(/s$/, "");
  if (word === "pinch" || word === "dash" || word === "bunch") return qty === 1 ? word : `${word}es`;
  if (qty > 0 && qty <= 1) return word;
  if (word.endsWith("s")) return word;
  return `${word}s`;
}

function amountPhrase(ing: { name: string; qty: number; unit: string }): string {
  const name = ing.name.replace(/^the\s+/i, "");
  let qty = Number(ing.qty);
  let unit = (ing.unit ?? "").trim();
  if (/^(tbsp|tablespoons?)$/i.test(unit) && qty > 0 && qty < 0.4) {
    qty *= 3;
    unit = /^tbsp$/i.test(ing.unit.trim()) ? "tsp" : "teaspoon";
  }
  if (!qty && !unit) return `the ${name}`;
  if (/pinch|dash/i.test(unit) && (!qty || qty === 1)) {
    return `a ${unit.replace(/s$/i, "").toLowerCase()} of ${name}`;
  }
  const q = prettyFrac(qty || 1);
  const u = prettyUnit(unit, qty || 1);
  if (!u) {
    if (!qty) return `the ${name}`;
    if (qty === 1) return `the ${singularFoodName(name)}`;
    if (qty < 1) return `the ${q} ${singularFoodName(name)}`;
    return `the ${q} ${pluralFoodName(singularFoodName(name))}`;
  }
  return `the ${q} ${u} of ${name}`;
}

function ingTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_TOK.has(w));
}

/**
 * Words too common to prove an ingredient was used: a method that says
 * “season with salt” has not thereby called for the salt pork on the list.
 */
const WEAK_TOK = new Set([
  "salt", "pepper", "water", "oil", "sugar", "flour", "butter", "milk", "stock",
  "broth", "sauce", "cream", "powder", "fat", "dry", "mix", "bean", "beans",
]);

function ingIsMentioned(blob: string, ing: { name: string }): boolean {
  const t = blob.toLowerCase();
  const n = ing.name.toLowerCase();
  if (t.includes(n)) return true;
  // A shape of pasta is used when the method says “pasta” or “noodles”, and the
  // same for a variety of rice or a kind of stock. Without these the polisher
  // thinks the ingredient went unused and bolts it onto an unrelated step.
  if (/spaghetti|penne|linguine|fettuccine|macaroni|rigatoni|orzo|noodle|lasagna|ziti|farfalle|bucatini|tagliatelle|pappardelle|rotini|fusilli|shells|elbow|vermicelli|ramen|udon|soba|couscous/.test(n) &&
    /\b(pasta|noodles?|spaghetti|macaroni)\b/.test(t)) return true;
  if (/\brice\b/.test(n) && /\brice\b/.test(t)) return true;
  if (/\b(stock|broth|bouillon|consomm)/.test(n) && /\b(stock|broth|liquid)\b/.test(t)) return true;
  if (/\b(yogurt|yoghurt)\b/.test(n) && /\b(yogurt|yoghurt)\b/.test(t)) return true;
  if (/\bmayonnaise\b/.test(n) && /\bmayo\b/.test(t)) return true;
  if (/kale|chard|spinach|collard|mustard green/.test(n) && /\bgreens?\b/.test(t)) return true;
  if (/sourdough|bread|toast|bun|tortilla|wrap/.test(n) && /\b(toast|bread|tortilla|wrap|bun|crouton)\b/.test(t)) return true;
  if (/flour|cornmeal|baking powder|baking soda|sugar/.test(n) && /\bdry ingredients\b/.test(t)) return true;
  // “Chop the vegetables” is prep, not use — a soup whose method only ever says
  // that has still never put the tomatoes in the pot.
  const cooked = t.replace(/\b(chop|dice|slice|mince|cut|prep|wash|peel|trim|scrub|get out)\b[^.]*?\bvegetables?\b/g, " ");
  if (/onion|carrot|celery|tomato|pepper|potato|cabbage|okra|lima|pea/.test(n) && /\bvegetables?\b/.test(cooked)) return true;
  if (/beef|chicken|pork|lamb|turkey|veal/.test(n) && /\bmeats?\b/.test(t)) return true;
  if (/\beggs?\b/.test(n) && /\b(yolk|white|meringue|beaten|egg)\b/.test(t)) return true;
  if (/bourbon|whiskey|whisky|rum|brandy/.test(n) && /\b(whiskey|whisky|bourbon|spirit|rum|brandy)\b/.test(t)) return true;
  if (/parmesan|pecorino|gruyere|cheddar|cheese/.test(n) && /\b(cheese|parmesan|cheddar|toast)\b/.test(t)) return true;
  if (/white bread|bread|toast/.test(n) && /\b(toast|bread|crouton)\b/.test(t)) return true;
  if (/bread crumbs|breadcrumb|crumbs/.test(n) && /\b(crumb|egg and crumb)\b/.test(t)) return true;
  if (/cornmeal|corn meal/.test(n) && /\b(meal|cornmeal|dodger)\b/.test(t)) return true;
  if (/^(fat|lard|drippings?)$/.test(n) && /\b(fat|lard|butter|oil|dripping)\b/.test(t)) return true;
  if (/ham steak|\bham\b/.test(n) && /\bham\b/.test(t)) return true;
  if (/frog/.test(n) && /\b(frog|legs)\b/.test(t)) return true;
  if (/stuffing|breadcrumb/.test(n) && /\bstuffing\b/.test(t)) return true;
  if (/turkey|chicken|hen|broiling|frying chicken|suckling pig|leg of lamb|opossum/.test(n) && /\b(bird|cavity|hen|skin|roast|pig|lamb|leg)\b/.test(t)) return true;
  if (/pie dough|pastry/.test(n) && /\b(dough|pastry|paste|crust)\b/.test(t)) return true;
  if (/hard-cooked egg/.test(n) && /\begg/.test(t)) return true;
  if (/worcestershire/.test(n) && /\bworce/i.test(t)) return true;
  if (/\beggs?\b/.test(n) && /\b(yolk|white|meringue|beaten|egg)\b/.test(t)) return true;
  if (/bourbon|whiskey|whisky|rum|brandy/.test(n) && /\b(whiskey|whisky|bourbon|spirit|rum|brandy)\b/.test(t)) return true;
  if (/cheddar|american cheese|grated cheese/.test(n) && /\b(cheese|cheddar|rarebit)\b/.test(t)) return true;
  if (/bread crumbs|breadcrumb|crumbs/.test(n) && /\b(crumb|egg and crumb|crumbs)\b/.test(t)) return true;
  if (/strawberry jam|\bjam\b/.test(n) && /\bjam\b/.test(t)) return true;
  const toks = ingTokens(ing.name);
  // Prefer the distinctive words. “Salt pork” is only used if the method says
  // “pork” — a stray “season with salt” elsewhere does not count.
  const strong = toks.filter((w) => !WEAK_TOK.has(w));
  const useful = strong.length ? strong : toks;
  return useful.some((w) => w.length > 2 && new RegExp(`\\b${escapeRe(w)}s?\\b`, "i").test(t));
}

function isMeasuredIng(ing: { unit: string }): boolean {
  return /cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|lb|pound|pint|quart|ml|liter|can|pinch|dash|clove|slice|sprig|bunch|stick/i.test(ing.unit || "");
}

function hasAmountNear(step: string, token: string): boolean {
  const esc = escapeRe(token);
  if (new RegExp(`(?:\\d+(?:\\.\\d+)?|[½¼¾⅓⅔⅛]|\\d+[½¼¾⅓⅔⅛])\\s*(?:[a-z.]+\\s+){0,4}${esc}`, "i").test(step)) {
    return true;
  }
  return new RegExp(
    `\\b(?:cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|pounds?|oz|lb|pinch(?:es)?|cloves?)\\s+(?:of\\s+)?(?:the\\s+)?${esc}`,
    "i",
  ).test(step);
}

function isSeasoningIng(ing: { name: string; aisle?: string }): boolean {
  const n = ing.name.toLowerCase();
  if (/^salt$|kosher salt|black pepper|^pepper$/.test(n)) return false;
  return (
    /chili powder|cumin|paprika|oregano|cinnamon|garam|turmeric|curry|berbere|coriander|allspice|cayenne|pepper flake|mustard powder|nutmeg|clove|cardamom|thyme|rosemary|sage|fennel|za.?atar|five.?spice|taco seasoning|italian seasoning|poultry seasoning|chili flake|crushed red/i.test(
      n,
    ) || ing.aisle === "Herbs & Spices"
  );
}

function tidyThe(s: string): string {
  return s
    .replace(/\bremaining the\b/gi, "remaining")
    .replace(/\bsplash more the\b/gi, "splash more")
    .replace(/\bmake a the\b/gi, "make a")
    .replace(/\bfold in the them\b/gi, "fold them")
    .replace(/\bfold in the it\b/gi, "fold it")
    .replace(/\badd the lay\b/gi, "lay")
    .replace(/\bcold the\b/gi, "the cold")
    .replace(/\bthe can of the\s+/gi, "the ")
    .replace(/\bthe slice of the\s+/gi, "the ")
    .replace(/\ba can of the\s+/gi, "the ")
    .replace(/\bthe hot the\s+/gi, "the hot ")
    .replace(/\ba little hot the\s+/gi, "a little of the hot ")
    .replace(/\bover hot the\s+/gi, "over the ")
    .replace(/\bHot the\s+/g, "Heat the ")
    .replace(/\bdrained the\s+(?=\d|[½¼¾⅓⅔⅛])/gi, "drained ")
    .replace(/\bsimmering the\s+(?=\d|[½¼¾⅓⅔⅛])/gi, "simmering ")
    .replace(/\bthe main ingredient\b/gi, "the vegetables")
    .replace(
      /\b(soft|melted|unsalted|salted|chopped|sliced|minced|diced|fresh|ground|grated|crushed|smashed|beaten|boiling|cold)\s+the\s+(\d+[^\s]*|[½¼¾⅓⅔⅛])\s+(tablespoons?|teaspoons?|cups?|ounces?|pounds?|cloves?|cans?|slices?)\s+of\s+/gi,
      (_m, adj: string, qty: string, unit: string) => `the ${qty} ${unit} of ${String(adj).toLowerCase()} `,
    )
    .replace(/\bthe (cold|chopped|melted|hot|warm|boiling|fresh|ground|grated|sliced|minced|diced|toasted|roasted) the\b/gi, "the $1")
    .replace(/\bthe bunch of the\b/gi, "the")
    .replace(/\bthe head of the\b/gi, "the")
    .replace(/\bthe the\b/gi, "the")
    .replace(/\s+/g, " ")
    .trim();
}

function listedCookingWater(recipe: RecipeLike): { name: string; qty: number; unit: string } | undefined {
  return recipe.ingredients.find((i) => /^(hot |cold |boiling |filtered )?(water)$/i.test(i.name));
}

function isVolumeWater(ing: { qty: number; unit: string } | undefined): boolean {
  if (!ing) return false;
  return Number(ing.qty) >= 0.25 && /cup|cups|pint|quart|oz|tbsp|tablespoon|ml|liter/i.test(ing.unit || "");
}

/** Turn book nicknames (“dry ingredients”, “vegetables”, “meats”) into the listed foods. */
function expandNicknames(step: string, recipe: RecipeLike): string {
  let s = step;
  const dry = recipe.ingredients.filter((i) =>
    /flour|cornmeal|corn meal|baking powder|baking soda|sugar|cocoa|cornstarch|\bmeal\b/.test(i.name) &&
    !/^salt$|kosher salt/.test(i.name),
  );
  if (dry.length && /\b(the )?dry ingredients\b/i.test(s)) {
    s = s.replace(/\b(the )?dry ingredients\b/gi, joinList(dry.map(amountPhrase)));
  }
  const veg = recipe.ingredients.filter((i) =>
    /\b(onions?|carrots?|celery|tomatoes?|peppers?|potatoes?|cabbage|okra|lima beans?|peas?|parsnip|turnip|green peppers?|bell peppers?|zucchini|mushrooms?)\b/i.test(
      i.name,
    ),
  );
  // “any … vegetables” and “more vegetables” mean whatever is left over, so
  // spelling them out re-lists food the cook already put in the pot.
  const vague = /\b(any|more|remaining|other|extra|leftover)\b[^.]{0,24}\bvegetables?\b/i.test(s);
  if (!vague && veg.length >= 2 && /\bvegetables?\b/i.test(s) && !veg.some((v) => s.toLowerCase().includes(v.name.toLowerCase()))) {
    const phrase = joinList(veg.map(amountPhrase));
    s = s.replace(/\bthe vegetables\b/gi, phrase);
    s = s.replace(/\bvegetables\b/gi, phrase);
  }
  const meats = recipe.ingredients.filter((i) =>
    /\b(beef|chicken|pork|lamb|turkey|veal|ham hock|squirrel|rabbit|bird)\b/i.test(i.name),
  );
  if (meats.length >= 2 && /\bmeats?\b/i.test(s) && !meats.some((m) => s.toLowerCase().includes(m.name.toLowerCase()))) {
    const phrase = joinList(meats.map(amountPhrase));
    s = s.replace(/\bthe meats\b/gi, phrase);
    s = s.replace(/\bmeats\b/gi, phrase);
  }
  const crumbs = recipe.ingredients.find((i) => /breadcrumb|cracker crumb|crumbs/i.test(i.name));
  if (crumbs && /\bcrumbs\b/i.test(s) && !s.toLowerCase().includes(crumbs.name.toLowerCase())) {
    s = s.replace(/\bthe crumbs\b/gi, amountPhrase(crumbs));
    s = s.replace(/\bcrumbs\b/gi, amountPhrase(crumbs));
  }
  return s;
}

function alignCookToList(steps: string[], recipe: RecipeLike): string[] {
  const ings = [...recipe.ingredients].sort((a, b) => b.name.length - a.name.length);
  const spices = ings.filter(isSeasoningIng);
  const water = listedCookingWater(recipe);
  const volumeWater = isVolumeWater(water);
  const spicePhrase = spices.length ? joinList(spices.map(amountPhrase)) : "";

  let out = steps.map((s) => expandNicknames(tidyThe(s), recipe));

  // An amount belongs on the line that first calls for the ingredient. Repeating
  // it later turns a doneness cue into nonsense — "until the 8 slices of bread
  // is deep gold" — so each ingredient is spelled out once and referred to after.
  const quantified = new Set<string>();

  out = out.map((step) => {
    let s = step;
    if (spicePhrase) {
      s = s.replace(/\bany remaining spices\b/gi, spicePhrase);
      s = s.replace(/\bthe spices\b/gi, spicePhrase);
      s = s.replace(/\bspices\b/gi, spicePhrase);
    }
    const seasoning = ings.find((i) => /seasoning/i.test(i.name));
    if (seasoning && /\bseasoning\b/i.test(s) && !new RegExp(escapeRe(seasoning.name), "i").test(s)) {
      s = s.replace(/\bseasoning\b/gi, amountPhrase(seasoning));
    }
    if (volumeWater && water) {
      const amt = amountPhrase(water);
      s = s.replace(/\ba splash of (?:the )?(?!pasta )water\b/gi, amt);
      s = s.replace(/\ba little (?:of (?:the )?)?water\b/gi, amt);
      s = s.replace(/\ba bit of (?:the )?water\b/gi, amt);
      s = s.replace(/\bsome water\b/gi, amt);
    } else if (recipe.plate === "pasta" && /splash of water/i.test(s) && !/pasta water/i.test(s)) {
      s = s.replace(/\ba splash of water\b/gi, "a splash of the pasta water");
    }
    for (const ing of ings) {
      if (/^(kosher salt|salt|black pepper|pepper)$/i.test(ing.name)) continue;
      if (!(Number(ing.qty) > 0)) continue;
      if (quantified.has(ing.name)) continue;
      // "a little of the dressing" is a deliberate part of the whole — leave it.
      const vague = new RegExp(
        `\\b(?:a splash of|a little|a bit of|enough|some)\\s+(?:the\\s+)?${escapeRe(ing.name)}\\b(?!\\s+water\\b)`,
        "i",
      );
      if (vague.test(s)) {
        s = s.replace(vague, amountPhrase(ing));
        quantified.add(ing.name);
      }
    }
    for (const ing of ings) {
      if (!isMeasuredIng(ing) || !(Number(ing.qty) > 0)) continue;
      if (/^(kosher salt|salt|black pepper|pepper)$/i.test(ing.name)) continue;
      if (quantified.has(ing.name)) continue;
      if (!ingIsMentioned(s, ing)) continue;
      if (hasAmountNear(s, ing.name)) continue;
      const tok = ingTokens(ing.name).sort((a, b) => b.length - a.length)[0] ?? ing.name;
      if (hasAmountNear(s, tok)) continue;
      const amt = amountPhrase(ing);
      const full = new RegExp(
        `\\b((?:soft|melted|unsalted|salted|chopped|sliced|minced|diced|cubed|fresh|ground|grated|crushed|smashed|beaten|toasted|roasted|boiling|cold)\\s+)?(?:(?:the|a)\\s+(?:can|slice)\\s+of\\s+)?(?:the\\s+)?${escapeRe(ing.name)}\\b`,
        "i",
      );
      if (full.test(s)) {
        s = s.replace(full, (m: string, adj: string, offset: number, whole: string) => {
          const before = typeof whole === "string" ? whole.slice(0, offset) : "";
          const after = typeof whole === "string" ? whole.slice(offset + m.length) : "";
          // “the pasta water” is the starchy cooking liquid, not 12 oz of pasta.
          if (/^\s*water\b/i.test(after)) return m;
          // “each slice of bread” already counts the bread — don't restate it.
          if (/\b(slices?|pieces?|cans?|cups?|cloves?|stalks?|sprigs?|spoonfuls?)\s+of\s+$/i.test(before)) return m;
          if (/(?:^|[.!?]\s+)$/.test(before) && !adj && /^(butter|oil|salt|pepper|milk|flour|sugar|cream|toast|warm)\b/i.test(m)) {
            return m;
          }
          // A doneness cue points back at food already in the pan.
          if (/\buntil\s+(?:the\s+)?$/i.test(before)) return m;
          if (/\b(splash|little|bit|more|cream sauce|white sauce)\s+(?:of\s+)?(?:the\s+)?$/i.test(before)) return m;
          if (/\bremaining\s+$/i.test(before)) return ing.name;
          quantified.add(ing.name);
          if (!adj) return amt;
          return amt.replace(new RegExp(`\\b${escapeRe(ing.name)}\\b`, "i"), `${adj.trim()} ${ing.name}`);
        });
      }
    }
    return s;
  });

  const blob = out.join(" ");
  let unused = ings.filter((i) => {
    if (/^(kosher salt|salt|black pepper|pepper|oil|olive oil|ice|crushed ice)$/i.test(i.name)) return false;
    if (/^water$/i.test(i.name) && !volumeWater) return false;
    return !ingIsMentioned(blob, i);
  });
  if (unused.length) {
    const isSide = (i: { name: string }) =>
      /\b(bread|toast|sourdough|bun|roll|tortilla|wrap|pita|naan|rice|quinoa|potato|noodle|pasta|couscous|baguette)\b/i.test(
        i.name,
      );
    // Things that go on at the table. Stirring yogurt or cilantro into a pot
    // that then simmers for half an hour is not a recipe anyone should follow.
    const isGarnish = (i: { name: string }) =>
      /\b(yogurt|yoghurt|sour cream|cr[eè]me fra[iî]che|cilantro|scallions?|green onions?|chives?|hot sauce|sriracha|lime wedges?|lemon wedges?|sesame seeds?|croutons?)\b/i.test(
        i.name,
      );
    // A fat left over from a roast belongs on the meat before it goes in, not
    // stirred into a bird that has been in the oven for an hour and a half.
    // Only for something that actually gets rubbed and roasted — butter in a
    // cobbler belongs in the topping, not smeared on the dish.
    const roasts =
      recipe.plate !== "dessert" &&
      out.some((s) => /\b(roast|bake|oven)\b/i.test(s)) &&
      out.some((s) => /\b(pat|dry|salt it|rub|sear|brown|dredge|dust|coat|season)\b/i.test(s));
    const isRoastFat = (i: { name: string }) =>
      roasts && /^(butter|oil|olive oil|neutral oil|lard|drippings?|bacon fat|chicken fat|pork fat|fat)\b/i.test(i.name);
    // A coating goes on raw food. Stirring panko into a cutlet that has already
    // been seared is the difference between schnitzel and a pan of crumbs.
    const cooksHot = out.some((s) => /\b(sear|fry|roast|bake|griddle|brown)\b/i.test(s));
    const isCoating = (i: { name: string }) =>
      cooksHot &&
      /\b(breadcrumbs?|bread crumbs|panko|cornstarch|corn starch|potato starch|rice flour|cornmeal|semolina|matzo meal|cracker crumbs)\b/i.test(
        i.name,
      );
    const garnishes = unused.filter((i) => isGarnish(i) && !isSide(i));
    const roastFats = unused.filter((i) => !isGarnish(i) && !isSide(i) && isRoastFat(i));
    const coatings = unused.filter((i) => !garnishes.includes(i) && !roastFats.includes(i) && isCoating(i));
    unused = unused.filter(
      (i) => !garnishes.includes(i) && !roastFats.includes(i) && !coatings.includes(i),
    );
    if (coatings.length) {
      // The egg and flour that bind the coating belong with it, not stirred in later.
      const binders = unused.filter((i) => /^(eggs?|flour|all-purpose flour|milk|buttermilk)$/i.test(i.name));
      unused = unused.filter((i) => !binders.includes(i));
      const all = [...binders, ...coatings];
      const line = finishSentence(
        binders.length
          ? `Set out ${joinList(all.map(amountPhrase))} in shallow dishes. Dip each piece in the egg, then press it through the crumbs so it is coated all over`
          : `Press each piece through ${joinList(coatings.map(amountPhrase))} so it is coated all over, and shake off the loose crumbs`,
      );
      const cookAt = out.findIndex((s) => /\b(sear|fry|roast|bake|griddle|brown)\b/i.test(s));
      out.splice(Math.max(0, cookAt), 0, line);
    }
    if (garnishes.length) {
      const line = finishSentence(`Top each bowl with ${joinList(garnishes.map(amountPhrase))} at the table`);
      const at = out.findIndex((s) => /\b(serve|plate|ladle|spoon into)\b/i.test(s));
      const target = at >= 0 ? at : out.length - 1;
      if (target >= 0) out[target] = `${out[target]!.replace(/[.]+$/, "")}. ${line}`;
      else out.push(line);
    }
    if (roastFats.length) {
      const line = finishSentence(`Rub ${joinList(roastFats.map(amountPhrase))} over it before it goes in`);
      const at = out.findIndex((s) => /\b(pat|dry|salt it|dredge|season|heat the oven)\b/i.test(s));
      const target = at >= 0 ? at : 0;
      if (out[target]) out[target] = `${out[target]!.replace(/[.]+$/, "")}. ${line}`;
      else out.unshift(line);
    }
    const flavor = unused.filter((i) => !isSide(i));
    const sides = unused.filter(isSide);
    const pasteAt = out.findIndex((s) => /\b(mash|glaze|paste|rub the)\b/i.test(s));
    const bigFood = (i: { name: string }) =>
      /\b(fillet|cod|chicken|steak|bok|shrimp|fish|pork|beef|greens|kale|chard|ham|turkey)\b/i.test(i.name);
    const mixIn = pasteAt >= 0 ? flavor.filter((i) => !bigFood(i)) : flavor;
    if (mixIn.length) {
      const add = finishSentence(`Stir in ${joinList(mixIn.map(amountPhrase))}`);
      // Prefer a step that is still loading the pot. Tacking an ingredient onto
      // “simmer until the greens are silk” tells the cook to add it an hour late.
      const usable = (s: string) => !/\b(serve|plate|ladle|wilt|saute|sauté|brown|sear|fry|bake|roast)\b/i.test(s);
      const loading = out.findIndex(
        (s) => /\b(add|stir|mix|whisk|combine|cover|put|place|bring)\b/i.test(s) && usable(s) && !/\buntil\b/i.test(s),
      );
      const idx =
        loading >= 0
          ? loading
          : out.findIndex(
              (s) => /\b(add|stir|mix|whisk|combine|season|simmer|toss|pour|beat|layer|sift)\b/i.test(s) && usable(s),
            );
      if (idx >= 0) {
        out[idx] = `${out[idx]!.replace(/[.]+$/, "")}. ${add}`;
      } else if (out.length) {
        const last = out.length - 1;
        const target = /\b(serve|plate|ladle)\b/i.test(out[last]!) && last > 0 ? last - 1 : last;
        out[target] = `${out[target]!.replace(/[.]+$/, "")}. ${add}`;
      } else {
        out.push(add);
      }
    }
    if (sides.length) {
      const bread = sides.filter((i) => /bread|toast|sourdough|bun|roll|tortilla|wrap|pita|naan|baguette/i.test(i.name));
      const rest = sides.filter((i) => !bread.includes(i));
      if (bread.length) {
        const toastLine = finishSentence(`Toast the ${joinList(bread.map(amountPhrase))} and serve the food on top`);
        const serveAt = out.findIndex((s) => /\b(serve|plate|float toast|cover with cheese)\b/i.test(s));
        if (serveAt >= 0 && /toast|bread|cheese|float/i.test(out[serveAt]!)) {
          /* already a bread step — leave it, amounts may already be there */
        } else if (serveAt >= 0) {
          out[serveAt] = `${out[serveAt]!.replace(/[.]+$/, "")}. ${toastLine}`;
        } else {
          out.push(toastLine);
        }
      }
      if (rest.length) {
        // Fried rice whose rice is served on the side is not fried rice. When the
        // dish is named for the starch, it belongs in the pan, not beside it.
        const dishName = recipe.name.toLowerCase();
        const central = rest.filter((i) =>
          ingTokens(i.name).some((w) => w.length > 3 && dishName.includes(w.replace(/e?s$/, ""))),
        );
        const beside = rest.filter((i) => !central.includes(i));
        if (central.length) {
          const line = finishSentence(
            `Add ${joinList(central.map(amountPhrase))} to the pan and toss over the heat until it is hot through and coated, 2–3 minutes`,
          );
          // The last plating line, not the first mention of a plate — searing
          // meat "move to a plate" is mid-method, and the rice goes in near the end.
          let at = -1;
          out.forEach((s, i) => {
            if (/^(plate|serve|spoon onto|ladle|scoop)\b/i.test(s.trim())) at = i;
          });
          const target = at > 0 ? at - 1 : Math.max(0, out.length - 2);
          if (out[target]) out[target] = `${out[target]!.replace(/[.]+$/, "")}. ${line}`;
          else out.push(line);
        }
        if (beside.length) {
          const last = out.length - 1;
          const line = finishSentence(`Serve with ${joinList(beside.map(amountPhrase))}`);
          if (last >= 0 && /\b(serve|plate)\b/i.test(out[last]!)) {
            out[last] = `${out[last]!.replace(/[.]+$/, "")}. ${line}`;
          } else {
            out.push(line);
          }
        }
      }
    }
  }

  return out.map((s) => {
    let next = finishSentence(tidyThe(s));
    if (/^Serve hot\.?$/i.test(next)) next = serveLine(recipe);
    if (next.length < 40) next = lengthenShortCard(next, recipe);
    return tidyCookText(next);
  }).filter(keepPiece);
}

const FRAC_VAL: Record<string, number> = {
  "⅛": 0.125, "¼": 0.25, "⅓": 1 / 3, "½": 0.5, "⅔": 2 / 3, "¾": 0.75,
};

function parseQtyToken(raw: string): number | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (FRAC_VAL[t] != null) return FRAC_VAL[t]!;
  const mixedUni = t.match(/^(\d+)([⅛¼⅓½⅔¾])$/);
  if (mixedUni) return Number(mixedUni[1]) + (FRAC_VAL[mixedUni[2]!] ?? 0);
  const mixedAscii = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedAscii) return Number(mixedAscii[1]) + Number(mixedAscii[2]) / Number(mixedAscii[3]);
  const ascii = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (ascii && Number(ascii[2]) > 0) return Number(ascii[1]) / Number(ascii[2]);
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const STEP_UNIT =
  "tablespoons?|teaspoons?|cups?|ounces?|pounds?|tbsp|tsp|oz|lb|cloves?|cans?|pints?|quarts?|pinches?|dashes?|slices?|sprigs?|bunches?|sticks?|grams?|ml";

const FRAC_GLYPHS = "⅛¼⅓½⅔¾";
const QTY_TOKEN = String.raw`\d+\s+\d+\s*/\s*\d+|\d+\s*/\s*\d+|\d+[${FRAC_GLYPHS}]|[${FRAC_GLYPHS}]|\d+(?:\.\d+)?`;

function normCookUnit(u: string): string {
  const x = String(u || "").toLowerCase().replace(/s$/, "");
  if (/^(tbsp|tablespoon)$/.test(x)) return "tbsp";
  if (/^(tsp|teaspoon)$/.test(x)) return "tsp";
  if (/^(oz|ounce)$/.test(x)) return "oz";
  if (/^(lb|pound)$/.test(x)) return "lb";
  return x;
}

function closeQty(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.12;
}

/**
 * Cook-card amounts always come from the ingredient list.
 * Times, oven temps, and inch measures stay put. A written "½ cup of parmesan"
 * scales even when a "1½ cups of milk" in the same sentence already did.
 */
export function scaleMethodSteps(
  steps: string[],
  ingredients: { name: string; qty: number; unit: string }[],
  household: number,
  servings: number,
): string[] {
  if (!steps.length) return steps;
  const scale = household !== servings;
  const measured = [...ingredients]
    .filter((i) => Number(i.qty) > 0)
    .sort((a, b) => b.name.length - a.name.length);

  return steps.map((step) => {
    const held: string[] = [];
    const hold = (m: string) => {
      held.push(m);
      return `\u0000${held.length - 1}\u0000`;
    };
    let s = step
      .replace(/\b\d+\s*(?:-|–|to)\s*\d+\s*(?:minutes?|mins?|hours?|seconds?)\b/gi, hold)
      .replace(/\b\d+\s*(?:minutes?|mins?|hours?|seconds?)\b/gi, hold)
      .replace(/\b\d{2,3}\s*°?\s*F\b/gi, hold)
      .replace(/\b\d+\s*(?:-|–)?(?:inch(?:es)?|cm)\b/gi, hold)
      .replace(/\b\d+\s*degrees\b/gi, hold)
      .replace(/\bserves?\s+\d+\b/gi, hold)
      .replace(/\b\d+-pound mold\b/gi, hold);

    if (scale) {
      s = s.replace(
        /\b(shape|form|make)\s+(\d+)\s+(small\s+)?(cakes|patties|meatballs|balls|fritters|dumplings)\b/gi,
        (match: string, verb: string, qtyTok: string, small: string | undefined, noun: string) => {
          const q = Number(qtyTok);
          if (!q) return match;
          const qty = scaleQty(q, household, servings);
          const n = qty === 1 ? noun.replace(/s$/i, "") : /s$/i.test(noun) ? noun : `${noun}s`;
          return hold(`${verb} ${prettyFrac(qty)} ${small ?? ""}${n}`.replace(/\s+/g, " "));
        },
      );
      s = s.replace(
        /\b(\d+(?:\.\d+)?)[- ](pounds?|ounces?)\s+(beef|roast|turkey|bird|brisket|pork|salmon|shoulder|ham|chicken|lamb|point|fillet|steak)/gi,
        (match: string, qtyTok: string, unitWord: string, food: string) => {
          const q = Number(qtyTok);
          if (!q) return match;
          const qty = scaleQty(q, household, servings);
          const u = unitWord.replace(/s$/i, "");
          return hold(`${prettyFrac(qty)}-${u} ${food}`);
        },
      );
    }

    for (const ing of measured) {
      const nameRe = namePattern(ing.name);
      const hasUnit = Boolean((ing.unit || "").trim());
      if (hasUnit) {
        const re = new RegExp(
          `(the\\s+)?(${QTY_TOKEN})\\s+(${STEP_UNIT})(\\s+of)?(\\s+the)?\\s+(${nameRe})\\b`,
          "gi",
        );
        s = s.replace(
          re,
          (
            match: string,
            the: string | undefined,
            qtyTok: string,
            unitWord: string,
            ofWord: string | undefined,
            the2: string | undefined,
            nameHit: string,
            offset: number,
            whole: string,
          ) => {
            const q = parseQtyToken(qtyTok);
            if (q == null || q <= 0) return match;
            const before = whole.slice(Math.max(0, offset - 28), offset);
            const remaining = /\b(remaining|rest of|half (?:of )?the)\b/i.test(before);
            const partial = remaining || Boolean(the2);
            const unitOk = normCookUnit(unitWord) === normCookUnit(ing.unit);
            const listed = Number(ing.qty);
            const ratio = q / Math.max(listed, 0.001);
            const full = unitOk && !partial && (closeQty(q, listed) || (ratio >= 0.4 && ratio <= 2.5));
            if (remaining && unitOk && closeQty(q, listed)) {
              return hold(`the remaining ${ing.name}`);
            }
            if (full) {
              const qty = scale ? scaleQty(listed, household, servings) : listed;
              return hold(amountPhrase({ name: ing.name, qty, unit: ing.unit }));
            }
            if (!scale) return match;
            const qty = scaleQty(q, household, servings);
            return hold(
              `${the ?? ""}${prettyFrac(qty)} ${prettyUnit(unitWord, qty)}${ofWord ?? ""}${the2 ?? ""} ${nameHit}`,
            );
          },
        );
      } else {
        const re = new RegExp(`(the\\s+)?(${QTY_TOKEN})\\s+(${nameRe})\\b`, "gi");
        s = s.replace(
          re,
          (match: string, the: string | undefined, qtyTok: string, nameHit: string, offset: number, whole: string) => {
            const q = parseQtyToken(qtyTok);
            if (q == null || q <= 0) return match;
            const before = whole.slice(Math.max(0, offset - 28), offset);
            if (/\b(remaining|rest of|into|for)\b/i.test(before)) return match;
            const listed = Number(ing.qty);
            const full = closeQty(q, listed);
            if (full) {
              const qty = scale ? scaleQty(listed, household, servings) : listed;
              return hold(amountPhrase({ name: ing.name, qty, unit: "" }));
            }
            if (!scale) return match;
            const qty = scaleQty(q, household, servings);
            const label = qty === 1 ? nameHit.replace(/s$/i, "") : nameHit;
            return hold(`${the ?? ""}${prettyFrac(qty)} ${label}`);
          },
        );
      }
    }

    if (scale) {
      s = s.replace(
        new RegExp(`(\\bthe\\s+)?(${QTY_TOKEN})\\s+(${STEP_UNIT})\\b`, "gi"),
        (_m, the: string | undefined, qtyTok: string, unitWord: string) => {
          const q = parseQtyToken(qtyTok);
          if (q == null || q <= 0) return _m;
          const scaled = scaleQty(q, household, servings);
          return `${the ?? ""}${prettyFrac(scaled)} ${prettyUnit(unitWord, scaled)}`;
        },
      );
    }

    s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => held[Number(i)] ?? "");
    return tidyThe(s);
  });
}

function makeFollowable(step: string, recipe: RecipeLike, siblings: string[]): string {
  let s = finishSentence(step.replace(/\s+/g, " ").trim());
  const lower = s.toLowerCase().replace(/[.]+$/, "");
  const blob = siblings.join(" ");

  if (/stir in the fresh mint/i.test(s) && /do not stir/i.test(blob)) {
    return "Garnish with fresh mint.";
  }
  if (/^fold in\b/i.test(lower)) {
    const rest = lower.replace(/^fold in\s+/i, "").replace(/[.]+$/, "");
    if (/^(gently|carefully|slowly|lightly|just|until|them|it)\b/i.test(rest) || rest.length < 3) {
      return finishSentence(`Fold ${rest || "until just combined"}`);
    }
    const noun = /^the\s+/i.test(rest) ? rest : `the ${rest}`;
    return finishSentence(`Fold in ${noun}`);
  }
  if (s.length >= 40 && VERB.test(s)) return s;
  if (s.length >= 28 && VERB.test(s)) return s;
  if (!VERB.test(s) && lower.length >= 4) return finishSentence(capitalize(lower));
  return s;
}

function mergeShortBookSteps(steps: string[]): string[] {
  const out: string[] = [];
  for (const raw of steps) {
    const s = finishSentence(raw.replace(/\s+/g, " ").trim());
    if (!keepPiece(s)) continue;
    if (out.length && s.length < 28) {
      out[out.length - 1] = `${out[out.length - 1]!.replace(/[.]+$/, "")}. ${s}`;
      continue;
    }
    out.push(s);
  }
  return out.filter((s) => keepPiece(s));
}

function faithfulBookMethod(steps: string[], recipe: RecipeLike): string[] {
  const pieces = splitIfPacked(steps)
    .map((s) => finishSentence(s.replace(/\s+/g, " ").trim()))
    .filter(keepPiece);
  const expanded = pieces.map((s) => expandFragment(s, recipe)).filter((e) => keepPiece(e) && !isJunkMethod([e]));
  const followable: string[] = [];
  for (const s of expanded) {
    const e = makeFollowable(s, recipe, expanded);
    if (keepPiece(e) && !isJunkMethod([e])) followable.push(e);
  }
  const uniq: string[] = [];
  for (const s of followable) {
    const key = s.toLowerCase().slice(0, 52);
    if (uniq.some((u) => u.toLowerCase().slice(0, 52) === key)) continue;
    if (/^do not stir/i.test(s) && uniq.some((u) => /garnish with fresh mint/i.test(u))) {
      uniq[uniq.length - 1] = "Garnish with fresh mint. Do not stir.";
      continue;
    }
    uniq.push(s);
  }
  const merged = mergeShortBookSteps(uniq.length ? uniq : pieces);
  if (merged.length < 2) {
    const last = merged[merged.length - 1] ?? "";
    if (!/\b(serve|plate|ladle|chill|rest)\b/i.test(last)) merged.push(serveLine(recipe));
  }
  return (merged.length ? merged : pieces).slice(0, MAX_STEPS);
}

export function polishSteps(recipe: RecipeLike): string[] {
  const original = recipe.steps.map((s) => finishSentence(s.replace(/\s+/g, " ").trim())).filter(keepPiece);
  let out: string[];
  if (isKeepableMethod(original, recipe)) {
    out = original.slice(0, MAX_STEPS);
  } else {
    const split = splitIfPacked(original)
      .map((s) => finishSentence(s.replace(/\s+/g, " ").trim()))
      .filter(keepPiece);
    if (isKeepableMethod(split, recipe)) {
      out = split.slice(0, MAX_STEPS);
    } else if (isFromABook(recipe)) {
      const stubId = recipe.id ?? "";
      if (stubId === "vh-ww2-chipped-beef" || stubId === "vh-jw-gefilte" || stubId === "vh-va-beaten-biscuits") {
        out = knownDishMethod(recipe) ?? faithfulBookMethod(split.length ? split : original, recipe);
      } else {
        out = faithfulBookMethod(split.length ? split : original, recipe);
      }
    } else if (hasSpecialistMethod(recipe) || original.length < 3 || split.length < 3) {
      out = writeDishMethod(recipe);
    } else {
      const known = knownDishMethod(recipe);
      if (known) {
        out = known;
      } else {
        const source = split.length ? split : original;
        const originalHasCook = source.filter((s) => VERB.test(s) && s.length >= 12).length >= 1 && !isJunkMethod(source);
        const expanded = expandToMinCards(source, recipe);
        const usable = expanded.filter(isUsableCookStep);
        if (usable.length >= 3 && !isJunkMethod(usable)) {
          out = expanded.filter((s) => keepPiece(s) && VERB.test(s) && !isJunkMethod([s]));
        } else if (originalHasCook) {
          out = expanded.filter(keepPiece);
        } else {
          out = writeDishMethod(recipe);
        }
      }
    }
  }
  out = foldShortSteps(out, recipe);
  if (out.filter(isUsableCookStep).length < 3) {
    const keepableSource = isKeepableMethod(original, recipe) || isKeepableMethod(out, recipe);
    if (keepableSource) {
      out = expandToMinCards(out, recipe);
    } else if (hasSpecialistMethod(recipe) || !isFromABook(recipe)) {
      const written = writeDishMethod(recipe);
      if (written.filter(isUsableCookStep).length >= 3) out = written;
      else out = expandToMinCards(out, recipe);
    } else {
      out = expandToMinCards(out, recipe);
    }
  }
  const aligned = alignCookToList(out, recipe).map(tidyCookText);
  const deduped: string[] = [];
  for (const s of aligned) {
    if (deduped.length && deduped[deduped.length - 1]!.toLowerCase() === s.toLowerCase()) continue;
    deduped.push(s);
  }
  return deduped;
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

