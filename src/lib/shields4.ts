/** Four new allergy shields (egg, soy, sesame, fish), Nov 2 DRAFT pending Line's review. Strict: a recipe passes
 * only if no name, ingredient row, step or description mentions the allergen or anything that may contain it.
 * Bought products and unresolved cross-references fail through shields4-doubt.ts. Only ever removes a pass. */
import type { Recipe } from "./types";

export type Shield4Id = "egg" | "soy" | "sesame" | "fish";

// Words that only look like an allergen (removed before matching). Nothing here is a food that may contain it.
const LOOKALIKE: Record<Shield4Id, RegExp> = {
  // Size comparisons are not egg (Nov 7): "butter the size of an egg", "size of a small egg", "egg-sized", "as big as an egg".
  egg: /\b(?:the )?size of (?:an? |two |three |\d+ )?(?:small |large |big |hen'?s |pigeon'?s |goose |good[- ]sized )?eggs?\b|\b(?:as )?(?:big|large|small) as (?:an? )?(?:small |large |hen'?s )?eggs?\b|\begg[- ]?sized?\b|\b(?:cabbage|lettuce|veal|beef|meat) rolls\b|\begg[- ]?plants?\b|\begg[- ]?(?:beaters?|whisks?|slicers?|cups?|timers?|shaped|shape)\b/gi,
  soy: /\bcandy[- ]?(?:thermometers?|stage)\b/gi,
  sesame: /(?!)/g,
  fish: /\bfish[- ]?(?:slices?|kettles?|knives|knife|forks?|servers?|pans?|platters?|plates?)\b|\b(?:shell|jelly|cray|craw|star)fish(?:es)?\b/gi,
};

export const SHIELD4_TERMS: Record<Shield4Id, RegExp> = {
  egg: new RegExp(
    String.raw`\beggs?\b|\byolks?\b|\bwhites\b|\bwhite of\b|\balbumen\b|\bmeringues?\b|\bmayonnaise\b|\bmayo\b|\baioli\b|\bcustards?\b|\beggnog\b|\bnoodles?\b|\bhollandaise\b|\bb[ée]arnaise\b|\btartar(?:e)? sauce\b|\bcaesar\b|\bquiche\b|\bfrittata\b|\bomel(?:et|ette)s?\b|\bsouffl[ée]s?\b|\bzabaglione\b|\bmarshmallow` +
      // baked goods with unknown contents
      String.raw`|\bcakes?\b|\bcookies?\b|\bbiscuits?\b|\bcrackers?\b|\bwafers?\b|\blady[- ]?fingers\b|\bmacaroons?\b|\bmuffins?\b|\bbrioche\b|\bchallah\b|\bdough[- ]?nuts?\b|\bpancakes?\b|\bwaffles?\b|\bcrumbs\b|\bgraham\b|\bpastry\b|\bpastries\b|\bpie[- ]?crust\b|\bpatty shells?\b|\bpuff paste\b|\bbread\b|\bbreads\b|\brolls\b|\bbuns?\b|\btoast\b|\bsponge\b|\bcroutons?\b|\bzwieback\b|\bgingersnaps?\b|\bfresh pasta\b|\begg pasta\b`,
    "i",
  ),
  soy: /\bsoy|\bsoya\b|\bsoybeans?\b|\btofu\b|\btempeh\b|\bedamame\b|\bmiso\b|\btamari\b|\bshoyu\b|\blecithin\b|textured vegetable protein|\btvp\b|\bbean[- ]curd\b|\bnatto\b|\bkecap\b|\bteriyaki\b|\bhoisin\b|\bponzu\b|\boyster sauce\b|\bchinese sauce\b|\bworcestershire\b|\bvegetable oil\b|\bshortening\b|\bmargarine\b|\bcrisco\b|\boleo\b|\bvegetable protein\b|\bchocolate chips?\b|\bmilk chocolate\b|\bcandy\b|\bcandies\b/i,
  sesame: /\bsesame\b|\btahin[ia]\b|\bhalvah?\b|\bhalwa\b|\bza'?atar\b|\bzaatar\b|\bgom[ae]sh?io\b|\bhumm?[ou]s\b|\bhoumous\b|\bfurikake\b|\bbenne\b|\bgingelly\b|\bdukkah\b|\bshichimi\b|\beverything (?:bagel|seasoning)\b|\bseeded (?:buns?|rolls?|bread)\b/i,
  fish: new RegExp(
    String.raw`\bfish(?:es)?\b|\banchov(?:y|ies)\b|\bworcestershire\b|\bcaesar\b|\bfish sauce\b|\bnam pla\b|\bnuoc mam\b|\bpatis\b|\bfumet\b|\bcourt[- ]?bouillon\b|\bcaviare?s?\b|\broes?\b|\bhard[- ]roes?\b|\bsoft[- ]roes?\b|\bbottarga\b|\btarama\b|\btaramasalata\b|\bikura\b|\btobiko\b|\bmasago\b|\bmentaiko\b|\b[a-z]+fish(?:es)?\b|\bbonito\b|\bdashi\b|\bkatsuobushi\b|\bsurimi\b|\bimitation crab\b|\bcod[- ]?liver\b|\boyster sauce\b|\bxo sauce\b|\bshrimp paste\b|\bbelacan\b|\bkimchi\b|\bcurry paste\b|\bchinese sauce\b` +
      String.raw`|\b(?:salmon|tuna|cod|codfish|scrod|haddock|haddie|halibut|trout|mackerel|sardines?|herrings?|kippers?|kippered|bloaters?|bass|snapper|tilapia|sole|flounder|plaice|perch|pike|pickerel|carp|catfish|mullet|pompano|shad|smelts?|whitefish|swordfish|mahi[- ]?mahi|grouper|monkfish|hake|pollock|pollack|turbot|brill|eels?|sturgeon|whiting|bluefish|redfish|rockfish|porgy|tilefish|skate|shark|barramundi|branzino|bream|arctic char|capelin|lox|gravlax|lutefisk|bacalao|bacalhau|baccal[aà]|finnan|kedgeree|brewis|sprats?|pilchards?|alewives|weakfish|muskellunge|walleye|tautog|sheepshead|croaker|tarpon|wahoo|cusk|hoki|orange roughy|sablefish|black cod|yellowtail|hamachi|eel|unagi|sashimi|sushi|butterfish|kingfish|whitebait|blowfish|sunfish|crappies?|bullheads?|buffalo[- ]?fish|muskallonge|muskalonge|grayling|john dory|dory|gurnards?|gurnets?|blackfish|squeteague|scup|porgies|sardels?|sardelles?|lampreys?|tunny|albacore|ling|coalfish|tench|barbel|gudgeons?|minnows?|mudfish|jewfish|cunners?|menhaden|eulachons?|candlefish|sculpins?|dogfish|wolffish|lumpfish|ciscoes|ciscos?|tullibees?|saugers?|bonitas?|amberjacks?|cobia|dorado|bonefish|snook|stockfish|klipfish|saltfish|kedjeree|brandade|gefilte|red mullet|sea[- ]?bass|striped bass|lake trout|steelhead|anchovette|sild|brisling|tunas|salmons)(?:e?s)?\b`,
    "i",
  ),
};

type Row = { name: string; raw?: string };
const textsOf = (r: Recipe): string[] => [
  r.name,
  ...r.ingredients.flatMap((i: Row) => (i.raw && i.raw !== i.name ? [i.name, i.raw] : [i.name])),
  ...(r.steps ?? []),
  r.description ?? "",
];

/** True when the printed text (rows, steps, name, description) mentions `id` or something that may contain it. */
export function shield4TermFail(recipe: Recipe, id: Shield4Id): boolean {
  // Pipe-joined so a term cannot span two rows or steps.
  const text = textsOf(recipe).join(" | ");
  return SHIELD4_TERMS[id].test(text.replace(LOOKALIKE[id], " "));
}

// Cached on the joined text: the library and the screen rebuild recipe objects, but the words repeat.
const CACHE = new Map<string, Set<Shield4Id>>();
/** The new shields this recipe fails on its printed terms (name, rows, steps, description). */
export function shield4TermFails(recipe: Recipe): Set<Shield4Id> {
  // Pipe-joined so a term cannot span two rows or steps.
  const text = textsOf(recipe).join(" | ");
  let hit = CACHE.get(text);
  if (!hit) {
    hit = new Set((["egg", "soy", "sesame", "fish"] as const).filter((id) => SHIELD4_TERMS[id].test(text.replace(LOOKALIKE[id], " "))));
    if (CACHE.size > 50000) CACHE.clear();
    CACHE.set(text, hit);
  }
  return hit;
}
