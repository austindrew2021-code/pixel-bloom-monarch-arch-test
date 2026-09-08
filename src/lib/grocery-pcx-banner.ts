import type { StoreBrand } from "./grocery-stores.ts";

export type Banner = "rass" | "superstore" | "independent" | "nofrills" | "zehrs" | "loblaw";

export function pcxBannerFor(store: { brand: StoreBrand; name: string }): Banner | null {
  const n = store.name.toLowerCase();
  if (n.includes("atlantic")) return "rass";
  if (n.includes("no frills") || n.includes("nofrills")) return "nofrills";
  if (n.includes("zehrs")) return "zehrs";
  if (n.includes("loblaw") && !n.includes("superstore")) return "loblaw";
  if (store.brand === "independent" || n.includes("independent") || n.includes("city market")) return "independent";
  if (store.brand === "superstore" || n.includes("superstore") || n.includes("fortinos") || n.includes("provigo") || n.includes("maxi")) {
    return "superstore";
  }
  return null;
}

export function pcxOriginFor(banner: Banner): string {
  if (banner === "rass") return "https://www.atlanticsuperstore.ca";
  if (banner === "independent") return "https://www.yourindependentgrocer.ca";
  if (banner === "nofrills") return "https://www.nofrills.ca";
  if (banner === "zehrs") return "https://www.zehrs.ca";
  if (banner === "loblaw") return "https://www.loblaws.ca";
  return "https://www.realcanadiansuperstore.ca";
}