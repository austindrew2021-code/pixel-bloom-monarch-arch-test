/**
 * Partner tags on the store links the app already opens.
 *
 * Spoonful sends cooks to Superstore, Walmart, Voilà, Instacart and the rest
 * dozens of times a week, for groceries they were buying anyway. Tagging those
 * links is the one revenue line that costs the cook nothing: same store, same
 * price, same basket. It is also the only kind of money that grows when the app
 * is *useful* rather than when it nags.
 *
 * Two rules hold it honest:
 *
 *  1. Tags are added at the moment a link is handed to the browser, in one
 *     place, so there is a single thing to audit and nothing double-tags.
 *  2. Nothing is invented. With no ids configured, every URL comes back exactly
 *     as it went in — the app ships untagged rather than shipping a guess.
 */

export type Placement = "fill-cart" | "product" | "search" | "store" | "map";

/** The retailers we can hold a partner id with, keyed by hostname suffix. */
type PartnerHost = {
  /** Matched against the URL's hostname. */
  match: RegExp;
  /** Env var holding the partner/affiliate id. */
  idEnv: string;
  /** Query parameter the retailer reads the id from. */
  param: string;
};

const PARTNERS: readonly PartnerHost[] = [
  // Loblaw banners all share the Helios storefront and one PC Express program.
  {
    match: /(^|\.)(realcanadiansuperstore|atlanticsuperstore|nofrills|zehrs|fortinos|loblaws|yourindependentgrocer)\.ca$/i,
    idEnv: "VITE_PARTNER_LOBLAW",
    param: "aff",
  },
  { match: /(^|\.)walmart\.ca$/i, idEnv: "VITE_PARTNER_WALMART", param: "athcpid" },
  { match: /(^|\.)voila\.ca$/i, idEnv: "VITE_PARTNER_SOBEYS", param: "aff" },
  { match: /(^|\.)instacart\.(ca|com)$/i, idEnv: "VITE_PARTNER_INSTACART", param: "partner_id" },
];

function env(name: string): string {
  // Vite inlines import.meta.env at build time; process.env is the server path.
  const meta = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const fromMeta = meta?.[name];
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  const fromProc = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return typeof fromProc === "string" ? fromProc.trim() : "";
}

function partnerFor(hostname: string): PartnerHost | undefined {
  return PARTNERS.find((p) => p.match.test(hostname));
}

/** True when at least one retailer id is configured. Used to decide disclosure. */
export function partnersConfigured(): boolean {
  return PARTNERS.some((p) => env(p.idEnv).length > 0);
}

/**
 * Tags one outbound retailer link.
 *
 * Returns the URL untouched when it is not a retailer we partner with, when no
 * id is configured, when the URL already carries the tag (so a re-open cannot
 * stack duplicates), or when it is not a parseable absolute http(s) URL. A
 * grocery run must never break because a tag could not be added.
 */
export function tagOutbound(url: string, placement: Placement = "store"): string {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const partner = partnerFor(parsed.hostname);
  if (!partner) return url;
  const id = env(partner.idEnv);
  if (!id) return url;
  if (parsed.searchParams.get(partner.param) === id) return url;

  parsed.searchParams.set(partner.param, id);
  // Attribution for our own reporting, and for the retailer's. Harmless, and it
  // is how a placement that never converts gets found and removed.
  parsed.searchParams.set("utm_source", "spoonful");
  parsed.searchParams.set("utm_medium", "app");
  parsed.searchParams.set("utm_campaign", placement);
  return parsed.toString();
}

/** Tags a list of hops in one call, for the multi-page Fill cart flow. */
export function tagOutboundAll(urls: string[], placement: Placement = "fill-cart"): string[] {
  return urls.map((u) => tagOutbound(u, placement));
}
