import type { Aisle } from "./types.ts";
import { pcxBannerFor } from "./grocery-pcx-banner.ts";

export type StoreBrand = "superstore" | "sobeys" | "walmart" | "independent" | "other";

export type NearbyStore = {
  id: string;
  name: string;
  brand: StoreBrand;
  lat: number;
  lon: number;
  km: number;
  address: string;
  groceryUrl: string;
  mapsUrl: string;
  pcStoreId?: string;
};

export type CartLine = {
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
  estCad: number;
};

export type StoreCartItem = CartLine & { addUrl: string };

const AISLE_PRICE: Record<Aisle, number> = {
  Produce: 3.5,
  "Meat & Seafood": 8.5,
  "Dairy & Eggs": 4.25,
  Pantry: 2.75,
  Bakery: 3.75,
  Frozen: 4.5,
  "Herbs & Spices": 2.25,
  Other: 3,
};

/** Bathurst, NB — used when location is off so the kitchen still has real stores. */
export const FALLBACK_COORDS = { lat: 47.6181, lon: -65.6517 };

export const FALLBACK_STORES: NearbyStore[] = [
  {
    id: "fallback-superstore",
    name: "Atlantic Superstore",
    brand: "superstore",
    lat: 47.6354,
    lon: -65.6719,
    km: 2.4,
    address: "850 St Peter Ave, Bathurst",
    groceryUrl: groceryUrlFor("superstore", "Atlantic Superstore"),
    mapsUrl: mapsUrl(47.6354, -65.6719, "Atlantic Superstore Bathurst"),
    pcStoreId: "0357",
  },
  {
    id: "fallback-sobeys",
    name: "Sobeys",
    brand: "sobeys",
    lat: 47.6189,
    lon: -65.6512,
    km: 0.4,
    address: "St Peter Ave, Bathurst",
    groceryUrl: groceryUrlFor("sobeys", "Sobeys"),
    mapsUrl: mapsUrl(47.6189, -65.6512, "Sobeys Bathurst"),
  },
  {
    id: "fallback-walmart",
    name: "Walmart Supercentre",
    brand: "walmart",
    lat: 47.6412,
    lon: -65.6881,
    km: 3.6,
    address: "Bathurst",
    groceryUrl: groceryUrlFor("walmart", "Walmart Supercentre"),
    mapsUrl: mapsUrl(47.6412, -65.6881, "Walmart Bathurst"),
  },
  {
    id: "fallback-coop",
    name: "Co-op Food",
    brand: "other",
    lat: 47.62,
    lon: -65.655,
    km: 1.2,
    address: "Bathurst",
    groceryUrl: groceryUrlFor("other", "Co-op Food"),
    mapsUrl: mapsUrl(47.62, -65.655, "Co-op Bathurst"),
  },
];

export function groceryUrlFor(brand: StoreBrand, name = ""): string {
  const n = name.toLowerCase();
  if (n.includes("atlantic")) return "https://www.atlanticsuperstore.ca/";
  if (n.includes("no frills") || n.includes("nofrills")) return "https://www.nofrills.ca/";
  if (n.includes("zehrs")) return "https://www.zehrs.ca/";
  if (n.includes("fortinos")) return "https://www.fortinos.ca/";
  if (n.includes("loblaw")) return "https://www.loblaws.ca/";
  if (isCoopName(n)) return instacartStoreUrl(instacartSlugFor({ brand, name }));
  if (brand === "superstore") return "https://www.realcanadiansuperstore.ca/";
  if (brand === "sobeys") return "https://www.voila.ca/";
  if (brand === "walmart") return "https://www.walmart.ca/en/grocery";
  if (brand === "independent") return "https://www.yourindependentgrocer.ca/";
  return "https://www.instacart.ca/";
}

export function storeSite(store: { brand: StoreBrand; name: string }): string {
  return groceryUrlFor(store.brand, store.name).replace(/\/$/, "");
}

export function storeLoginUrl(store: { brand: StoreBrand; name: string }): string {
  const site = storeSite(store);
  if (store.brand === "superstore" || store.brand === "independent") return `${site}/en/account`;
  if (store.brand === "walmart") return "https://www.walmart.ca/sign-in";
  if (store.brand === "sobeys") return "https://www.voila.ca/login";
  if (isCoopName(store.name) || store.brand === "other") return "https://www.instacart.ca/login";
  return site;
}

/** Grocery search that lands on the store's own Add to cart button. */
export function productSearchUrl(store: { brand: StoreBrand; name: string }, query: string): string {
  const q = encodeURIComponent(searchQuery(query));
  if (!q) return groceryUrlFor(store.brand, store.name);
  if (store.brand === "walmart") return `https://www.walmart.ca/en/search?q=${q}`;
  if (store.brand === "sobeys") return `https://www.voila.ca/search?q=${q}`;
  if (isCoopName(store.name) || store.brand === "other") {
    return `https://www.instacart.ca/store/${instacartSlugFor(store)}/s?k=${q}`;
  }
  return `${storeSite(store)}/en/search?search-bar=${q}`;
}

export function cartUrlFor(store: { brand: StoreBrand; name: string }): string {
  if (store.brand === "walmart") return "https://www.walmart.ca/cart";
  if (store.brand === "sobeys") return "https://www.voila.ca/";
  if (isCoopName(store.name) || store.brand === "other") return "https://www.instacart.ca/store/checkout";
  return `${storeSite(store)}/`;
}

export function isCoopName(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("co-op") || n.includes("coop") || /\bco op\b/.test(n);
}

/** Instacart retailer slug so Co-op opens a real storefront, not a blank marketplace hop. */
export function instacartSlugFor(store: { brand: StoreBrand; name: string }): string {
  const n = store.name.toLowerCase();
  if (n.includes("calgary")) return "calgary-co-op";
  if (isCoopName(n)) return "co-op-food";
  if (n.includes("costco")) return "costco";
  if (n.includes("walmart")) return "walmart-canada";
  if (n.includes("sobeys")) return "sobeys";
  return "co-op-food";
}

export function instacartStoreUrl(slug: string): string {
  const clean = slug.replace(/[^a-z0-9-]/g, "") || "co-op-food";
  return `https://www.instacart.ca/store/${clean}/storefront`;
}

/** PC Express SKU from a product id or a /p/{id} path. Catalog names are not SKUs. */
export function pcxProductId(raw?: string): string | undefined {
  if (!raw) return undefined;
  const fromPath = raw.match(/\/p\/(\d{5,14}_[A-Za-z]{2})\b/i)?.[1];
  const token = (fromPath || raw.trim()).split(/[/?#]/)[0] ?? "";
  return /^\d{5,14}_[A-Za-z]{2}$/.test(token) ? token : undefined;
}

/** PC Express guest cart UUID. */
export function isPcxCartId(raw?: string | null): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw || "");
}

/** Helios banners (Superstore, Independent, No Frills, …) can hold a PC Express guest cart when the store is shoppable. */
export function isHeliosStore(store: { brand: StoreBrand; name?: string }): boolean {
  return Boolean(pcxBannerFor({ brand: store.brand, name: store.name ?? "" }));
}

/** Canonical Helios product page. Slug URLs without /en/ 404 in the store app. */
export function productPageUrl(
  store: { brand: StoreBrand; name: string },
  productId?: string,
): string | undefined {
  const id = pcxProductId(productId);
  if (!id || !isHeliosStore(store)) return undefined;
  return `${storeSite(store)}/en/p/${id}`;
}

export type CheckoutItem = {
  id?: string;
  packs?: number;
  addUrl?: string;
  name?: string;
};

/**
 * Real store pages for Checkout — never /cart?add=, which Superstore does not support.
 * Helios: each pack's /en/p/{sku}. Otherwise the store search for that name.
 */
export function checkoutHopsFor(
  store: { brand: StoreBrand; name: string },
  items: CheckoutItem[],
): string[] {
  const pages: string[] = [];
  const searches: string[] = [];
  const seen = new Set<string>();
  const push = (list: string[], url?: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    list.push(url);
  };
  for (const item of items) {
    const page = productPageUrl(store, item.id) || productPageUrl(store, item.addUrl);
    if (page) {
      push(pages, page);
      continue;
    }
    if (item.name) push(searches, productSearchUrl(store, item.name));
    else if (item.addUrl && /^https:\/\//i.test(item.addUrl) && !/\/cart/i.test(item.addUrl)) {
      push(searches, item.addUrl);
    }
  }
  return [...pages, ...searches].slice(0, 20);
}

/** First hop for the Checkout <a href>. Empty list falls back to the store homepage. */
export function checkoutUrlFor(
  store: { brand: StoreBrand; name: string },
  items: CheckoutItem[],
): string {
  return checkoutHopsFor(store, items)[0] || cartUrlFor(store);
}

/** Strip recipe chatter so the store search finds the food, not "diced onion". */
export function searchQuery(name: string): string {
  return name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(chopped|diced|minced|sliced|fresh|optional|crushed|grated|ground|to taste)\b/gi, " ")
    .replace(/[^a-zA-Z0-9+.\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function mapsUrl(lat: number, lon: number, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${lat},${lon}`)}`;
}

export function brandFromName(name: string): StoreBrand {
  const n = name.toLowerCase();
  if (
    n.includes("superstore") ||
    n.includes("loblaw") ||
    n.includes("zehrs") ||
    n.includes("fortinos") ||
    n.includes("no frills") ||
    n.includes("nofrills") ||
    n.includes("provigo") ||
    n.includes("maxi") ||
    n.includes("dominion") ||
    n.includes("valu-mart") ||
    n.includes("wholesale club")
  ) {
    return "superstore";
  }
  if (n.includes("sobeys") || n.includes("foodland") || n.includes("voila") || n.includes("freshco") || n.includes("safeway")) {
    return "sobeys";
  }
  if (n.includes("walmart")) return "walmart";
  if (n.includes("independent") || n.includes("iga") || n.includes("city market")) return "independent";
  if (n.includes("co-op") || n.includes("coop") || /\bco op\b/.test(n)) return "other";
  return "other";
}

export function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(r * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

export function estimateLineCad(line: { qty: number; aisle: Aisle }): number {
  const packs = Math.max(1, Math.min(3, Math.ceil(Math.abs(line.qty) || 1)));
  return Math.round(AISLE_PRICE[line.aisle] * packs * 100) / 100;
}

export function cartFromShop(
  lines: { name: string; qty: number; unit: string; aisle: Aisle; fromPantry?: boolean }[],
): { items: CartLine[]; totalCad: number } {
  const items = lines
    .filter((l) => !l.fromPantry)
    .map((l) => ({
      name: l.name,
      qty: l.qty,
      unit: l.unit,
      aisle: l.aisle,
      estCad: estimateLineCad(l),
    }));
  const totalCad = Math.round(items.reduce((sum, i) => sum + i.estCad, 0) * 100) / 100;
  return { items, totalCad };
}

export function cartForStore(
  store: { brand: StoreBrand; name: string },
  lines: { name: string; qty: number; unit: string; aisle: Aisle; fromPantry?: boolean }[],
): { items: StoreCartItem[]; totalCad: number } {
  const cart = cartFromShop(lines);
  return {
    items: cart.items.map((item) => ({ ...item, addUrl: productSearchUrl(store, item.name) })),
    totalCad: cart.totalCad,
  };
}

export function formatCartList(storeName: string, items: CartLine[]): string {
  const lines = items.map((i) => `- ${i.name}${i.unit || i.qty ? ` (${i.qty} ${i.unit})`.trim() : ""}`);
  return [`Spoonful shop list for ${storeName}`, ...lines].join("\n");
}

type OverpassEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; "addr:street"?: string; "addr:housenumber"?: string; shop?: string };
};

export async function fetchNearbyStores(
  coords: { lat: number; lon: number },
  fetchImpl: typeof fetch = fetch,
): Promise<NearbyStore[]> {
  const q = `[out:json][timeout:12];(node["shop"~"supermarket|grocery"](around:8000,${coords.lat},${coords.lon});way["shop"~"supermarket|grocery"](around:8000,${coords.lat},${coords.lon}););out center 20;`;
  try {
    const res = await fetchImpl("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `data=${encodeURIComponent(q)}`,
    });
    if (!res.ok) return withDistance(FALLBACK_STORES, coords);
    const json = (await res.json()) as { elements?: OverpassEl[] };
    const stores = (json.elements ?? [])
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        const name = el.tags?.name?.trim();
        if (lat == null || lon == null || !name) return null;
        const brand = brandFromName(name);
        const house = el.tags?.["addr:housenumber"] ?? "";
        const street = el.tags?.["addr:street"] ?? "";
        const address = `${house} ${street}`.trim();
        return {
          id: `${el.type}-${el.id}`,
          name,
          brand,
          lat,
          lon,
          km: kmBetween(coords, { lat, lon }),
          address,
          groceryUrl: groceryUrlFor(brand, name),
          mapsUrl: mapsUrl(lat, lon, name),
        } satisfies NearbyStore;
      })
      .filter((s): s is NearbyStore => Boolean(s));
    const unique = new Map<string, NearbyStore>();
    for (const s of stores.sort((a, b) => a.km - b.km)) {
      const key = `${s.name.toLowerCase()}::${s.km.toFixed(1)}`;
      if (!unique.has(key)) unique.set(key, s);
    }
    const list = [...unique.values()].slice(0, 8);
    return list.length > 0 ? list : withDistance(FALLBACK_STORES, coords);
  } catch {
    return withDistance(FALLBACK_STORES, coords);
  }
}

function withDistance(stores: NearbyStore[], coords: { lat: number; lon: number }): NearbyStore[] {
  return stores
    .map((s) => ({ ...s, km: kmBetween(coords, s) }))
    .sort((a, b) => a.km - b.km);
}

export function readCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is off on this phone."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error("Location was not allowed. Nearby stores still work from a local list.")),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  });
}
