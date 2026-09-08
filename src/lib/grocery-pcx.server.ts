import { pcxBannerFor, pcxOriginFor, type Banner } from "./grocery-pcx-banner.ts";
import {
  catalogOptions,
  isRelevantProduct,
  matchStaple,
  normalizeKey,
  optionFromRank,
  parsePackageSizing,
  rankEnough,
  searchTermFor,
  type CartNeed,
  type StoreOption,
} from "./grocery-pick.ts";
import { kmBetween, productPageUrl, isPcxCartId, type StoreBrand } from "./grocery-stores.ts";
import type { StapleProduct } from "./grocery-staples.ts";

const PCX = "https://api.pcexpress.ca";
const KEY = "C1xujSegT5j3ap3yexJjqhOfELwGKYvz";
const FALLBACK_RASS = "0357";

type Tile = {
  productId?: string;
  brand?: string;
  title?: string;
  packageSizing?: string;
  productImage?: { smallUrl?: string; thumbnailUrl?: string; imageUrl?: string }[];
  pricing?: { price?: string };
  inventoryIndicator?: string | null;
  link?: string;
  articleNumber?: string;
};

const locatorCache = new Map<string, { at: number; storeId: string }>();

export async function liveStoreOptions(input: {
  store: { brand: StoreBrand; name: string };
  line: CartNeed;
  lat?: number;
  lon?: number;
  storeId?: string;
}): Promise<StoreOption[]> {
  const banner = pcxBannerFor(input.store);
  if (!banner) return [];
  const storeId =
    input.storeId ||
    (await nearestStoreId(banner, input.lat, input.lon)) ||
    (banner === "rass" ? FALLBACK_RASS : "");
  if (!storeId) return [];
  const tiles = await searchTiles(banner, storeId, input.line.name);
  const products = tiles
    .map((tile) => tileToProduct(input.store, tile))
    .filter((p): p is StapleProduct => Boolean(p));
  const relevant = products.filter(
    (p) => p.inStock !== false && isRelevantProduct(p.name, input.line.name),
  );
  const staple = matchStaple(input.line.name);
  const gramsPerCup = staple?.gramsPerCup ?? gramsPerCupGuess(input.line.name);
  const liveRanked = rankEnough(input.line, relevant, gramsPerCup, 5);
  if (liveRanked.length >= 5) {
    return liveRanked.map((row, index) => optionFromRank(input.store, input.line, row, index, true));
  }
  const catalogProducts = staple?.products.filter((p) => p.brand === input.store.brand) ?? [];
  const seen = new Set(liveRanked.map((row) => normalizeKey(row.product.name)));
  const catalogFill = rankEnough(input.line, catalogProducts, gramsPerCup, 5).filter(
    (row) => !seen.has(normalizeKey(row.product.name)),
  );
  const ranked = [...liveRanked, ...catalogFill].slice(0, 5);
  if (ranked.length === 0) return catalogOptions(input.store, input.line, 5);
  const liveNames = new Set(liveRanked.map((row) => normalizeKey(row.product.name)));
  return ranked.map((row, index) =>
    optionFromRank(input.store, input.line, row, index, liveNames.has(normalizeKey(row.product.name))),
  );
}

export async function resolvePcxStoreId(banner: Banner, lat?: number, lon?: number): Promise<string> {
  return nearestStoreId(banner, lat, lon);
}

async function nearestStoreId(banner: Banner, lat?: number, lon?: number): Promise<string> {
  if (lat == null || lon == null) return banner === "rass" ? FALLBACK_RASS : "";
  const key = `${banner}:v2:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = locatorCache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.storeId;
  try {
    const res = await fetch(
      `${PCX}/pcx-bff/api/v1/pickup-locations?bannerIds=${banner}&latitude=${lat}&longitude=${lon}`,
      { headers: pcxHeaders(banner), signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return banner === "rass" ? FALLBACK_RASS : "";
    const rows = (await res.json()) as {
      storeId?: string;
      isShoppable?: boolean;
      geoPoint?: { latitude: number; longitude: number };
    }[];
    const here = { lat, lon };
    const nearby = (Array.isArray(rows) ? rows : [])
      .filter((s) => s.storeId && s.geoPoint)
      .map((s) => ({
        storeId: String(s.storeId),
        shoppable: s.isShoppable !== false,
        km: kmBetween(here, { lat: s.geoPoint!.latitude, lon: s.geoPoint!.longitude }),
      }))
      .filter((s) => s.km <= 40)
      .sort((a, b) => a.km - b.km || Number(b.shoppable) - Number(a.shoppable));
    const id =
      nearby.find((s) => s.shoppable)?.storeId || nearby[0]?.storeId || (banner === "rass" ? FALLBACK_RASS : "");
    if (id) locatorCache.set(key, { at: Date.now(), storeId: id });
    return id;
  } catch {
    return banner === "rass" ? FALLBACK_RASS : "";
  }
}

async function searchTiles(banner: Banner, storeId: string, query: string): Promise<Tile[]> {
  const term = searchTermFor(query);
  const pages = await Promise.all([1, 2, 3].map((from) => searchPage(banner, storeId, term, from)));
  const seen = new Set<string>();
  const tiles: Tile[] = [];
  for (const tile of pages.flat()) {
    const id = tile.productId || tile.articleNumber || `${tile.brand}:${tile.title}`;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    tiles.push(tile);
  }
  return tiles;
}

async function searchPage(banner: Banner, storeId: string, term: string, from: number): Promise<Tile[]> {
  const origin = pcxOriginFor(banner);
  const body = {
    cart: { cartId: "00000000-0000-0000-0000-000000000001" },
    fulfillmentInfo: {
      storeId,
      pickupType: "STORE",
      offerType: "OG",
      date: pcxDate(),
      timeSlot: null,
    },
    listingInfo: {
      filters: { "search-bar": [term] },
      sort: { code: "recommended" },
      pagination: { from },
      includeFiltersInResponse: false,
    },
    banner,
    userData: {
      domainUserId: "00000000-0000-0000-0000-000000000002",
      sessionId: "00000000-0000-0000-0000-000000000003",
    },
    device: { screenSize: 390 },
    searchRelatedInfo: { term, options: [] },
  };
  try {
    const res = await fetch(`${PCX}/pcx-bff/api/v2/products/search`, {
      method: "POST",
      headers: { ...pcxHeaders(banner), Origin: origin, Referer: `${origin}/` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      layout?: { sections?: { mainContentCollection?: { components?: { data?: { productTiles?: Tile[] } }[] } } };
    };
    return json.layout?.sections?.mainContentCollection?.components?.[0]?.data?.productTiles ?? [];
  } catch {
    return [];
  }
}

function tileToProduct(store: { brand: StoreBrand; name: string }, tile: Tile): StapleProduct | null {
  const title = `${tile.brand ?? ""} ${tile.title ?? ""}`.replace(/\s+/g, " ").trim();
  const priceCad = Number(tile.pricing?.price);
  if (!title || !Number.isFinite(priceCad) || priceCad <= 0) return null;
  const sizing = parsePackageSizing(tile.packageSizing || "");
  const img = tile.productImage?.[0];
  const imageUrl = img?.smallUrl || img?.thumbnailUrl || img?.imageUrl || "";
  const id = tile.productId || tile.articleNumber;
  const path = tile.link || (tile.productId ? `/p/${tile.productId}` : "");
  const stock = (tile.inventoryIndicator || "").toString().toUpperCase();
  return {
    brand: store.brand,
    name: title,
    sizeLabel: sizing.sizeLabel || "1 ea",
    priceCad,
    grams: sizing.grams,
    ml: sizing.ml,
    each: sizing.each,
    url: productPageUrl(store, id) || productPageUrl(store, path),
    imageUrl,
    productId: id,
    unitHint: sizing.unitHint,
    inStock: !stock || (!stock.includes("OUT") && stock !== "OOS"),
  };
}

function gramsPerCupGuess(name: string): number | undefined {
  const n = name.toLowerCase();
  if (n.includes("panko")) return 50;
  if (n.includes("crumb")) return 100;
  if (n.includes("flour") || n.includes("sugar")) return 120;
  if (n.includes("rice")) return 185;
  if (n.includes("butter")) return 227;
  if (n.includes("milk") || n.includes("cream")) return 240;
  return undefined;
}

function pcxHeaders(banner: Banner): Record<string, string> {
  const origin = pcxOriginFor(banner);
  return {
    "X-Application-Type": "Web",
    "X-Apikey": KEY,
    "Accept-Language": "en",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 13; Pixel) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    "X-Channel": "web",
    "Content-Type": "application/json",
    "X-Loblaw-Tenant-Id": "ONLINE_GROCERIES",
    "Business-User-Agent": "PCXWEB",
    "Site-Banner": banner,
    Accept: "application/json",
    Origin: origin,
    Referer: `${origin}/`,
  };
}

function pcxDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Halifax",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.day}${map.month}${map.year}`;
}

export type PcxCartLine = {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
};

type CartJson = {
  id?: string;
  cart?: CartJson;
  orders?: {
    entries?: {
      quantity?: number;
      offer?: { id?: string; product?: { id?: string; name?: string; primaryImage?: string } };
    }[];
  }[];
};

export async function createPcxCart(input: { banner: Banner; storeId: string }): Promise<string | null> {
  const storeId = input.storeId.replace(/\D/g, "").slice(0, 8);
  if (!storeId) return null;
  const json = await pcxJson("POST", "/pcx-bff/api/v1/carts", input.banner, {
    bannerId: input.banner,
    language: "en",
    storeId,
  });
  const id = json?.id || json?.cart?.id;
  return isPcxCartId(id) ? id! : null;
}

export async function addPcxCartEntries(input: {
  banner: Banner;
  cartId: string;
  storeId: string;
  entries: { productId: string; quantity: number }[];
}): Promise<{ ok: boolean; count: number; lines: PcxCartLine[] }> {
  if (!isPcxCartId(input.cartId) || input.entries.length === 0) return { ok: false, count: 0, lines: [] };
  const storeId = input.storeId.replace(/\D/g, "").slice(0, 8);
  const entries: Record<string, { quantity: number; fulfillmentMethod: string; sellerId: string }> = {};
  for (const row of input.entries.slice(0, 40)) {
    const id = row.productId.trim();
    if (!/^\d{5,14}_[A-Za-z]{2}$/.test(id)) continue;
    entries[id] = {
      quantity: Math.max(1, Math.min(99, Math.round(row.quantity) || 1)),
      fulfillmentMethod: "pickup",
      sellerId: storeId,
    };
  }
  if (Object.keys(entries).length === 0) return { ok: false, count: 0, lines: [] };
  const json = await pcxJson("POST", `/pcx-bff/api/v1/carts/${input.cartId}`, input.banner, { entries });
  if (!json) return { ok: false, count: 0, lines: [] };
  const lines = cartLines(json);
  return { ok: lines.length > 0, count: lines.reduce((n, l) => n + l.quantity, 0), lines };
}

export async function getPcxCart(input: { banner: Banner; cartId: string }): Promise<PcxCartLine[] | null> {
  if (!isPcxCartId(input.cartId)) return null;
  const json = await pcxJson("GET", `/pcx-bff/api/v1/carts/${input.cartId}`, input.banner);
  return json ? cartLines(json) : null;
}

function cartLines(json: CartJson): PcxCartLine[] {
  const root = json.cart?.orders ? json.cart : json;
  const lines: PcxCartLine[] = [];
  for (const order of root.orders ?? []) {
    for (const entry of order.entries ?? []) {
      const product = entry.offer?.product;
      const id = entry.offer?.id || product?.id || "";
      const name = product?.name || id;
      const quantity = Math.max(0, Math.round(Number(entry.quantity) || 0));
      if (!id || quantity <= 0) continue;
      lines.push({ id, name, quantity, imageUrl: product?.primaryImage || undefined });
    }
  }
  return lines;
}

async function pcxJson(
  method: "GET" | "POST",
  path: string,
  banner: Banner,
  body?: unknown,
): Promise<CartJson | null> {
  try {
    const res = await fetch(`${PCX}${path}`, {
      method,
      headers: pcxHeaders(banner),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as CartJson;
  } catch {
    return null;
  }
}
