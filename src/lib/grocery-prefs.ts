import type { AllergyId, PrefId } from "./types.ts";

/** Grocery-only setting: when on, the store picker never picks or offers organic products. Off by default. */
export const NO_ORGANIC: PrefId = "no-organic";

export const NO_ORGANIC_TOGGLE = {
  label: "No organic",
  hint: "Never pick organic groceries, even when cheaper",
} as const;

export function noOrganicOn(prefs: readonly string[] | undefined): boolean {
  return Boolean(prefs?.includes(NO_ORGANIC));
}

/** Add or remove one id; the store's togglePref uses this. */
export function toggleIn<T extends string>(list: readonly T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** The allergy and diet profile the grocery picker gets, including the no-organic setting. */
export function groceryProfile(allergies: readonly AllergyId[] | undefined, prefs: readonly PrefId[] | undefined): { allergies: string[]; prefs: string[] } {
  return { allergies: [...(allergies ?? [])], prefs: [...(prefs ?? [])] };
}
