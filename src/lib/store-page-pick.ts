import { isRelevantProduct } from "./grocery-pick.ts";

export type StorePageCard = {
  name: string;
  priceCad: number | null;
};

export function parseCardPrice(text: string): number | null {
  const cleaned = text
    .replace(/,/g, "")
    .replace(/\$\s*\d+(?:\.\d+)?\s*\/\s*[\d.]*\s*(g|kg|ml|l|oz|lb|ea|100\s*g)/gi, " ");
  const m = cleaned.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n < 500 ? n : null;
}

export function looksLikeBotWall(text: string): boolean {
  const t = text.toLowerCase();
  return /we do not like robots|real shoppers|are you a robot|i'?m not a robot|unusual traffic|verify you are human|captcha|access denied|blocked for|automated|max challenge|challenge attempts|please refresh the page|just a moment|checking your browser|too many attempts|attention required/.test(
    t,
  );
}

/** Drop pack sizes so "Butter 454 g" still matches butter. */
export function nameForMatch(name: string): string {
  return name
    .replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|oz|lb|ct|pk|pack|count)?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HOUSE_BRAND = /\b(compliments|no name|great value|selection)\b/i;

/** Cheapest pack on a search page whose name is the food, not a neighbour (peanut butter for butter). */
export function pickCheapestLiteral(cards: StorePageCard[], query: string): StorePageCard | null {
  const q = nameForMatch(query.replace(/\s+/g, " ").trim());
  if (!q) return null;
  const relevant = cards.filter((card) => card.name && isRelevantProduct(nameForMatch(card.name), q));
  if (!relevant.length) return null;
  const priced = relevant.filter((card) => card.priceCad != null);
  const pool = priced.length ? priced : relevant;
  pool.sort((a, b) => {
    const pa = a.priceCad ?? 80;
    const pb = b.priceCad ?? 80;
    if (Math.abs(pa - pb) >= 0.2) return pa - pb;
    const ha = HOUSE_BRAND.test(a.name) ? 0 : 1;
    const hb = HOUSE_BRAND.test(b.name) ? 0 : 1;
    return ha - hb;
  });
  return pool[0] ?? null;
}
