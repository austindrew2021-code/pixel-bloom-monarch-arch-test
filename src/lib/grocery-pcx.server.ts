import { pcxBannerFor, pcxOriginFor, type Banner } from "./grocery-pcx-banner.ts";
import {
  catalogPick,
  choiceOption,
  matchStaple,
  optionFromRank,
  parsePackageSizing,
  searchTermFor,
  type CartNeed,
  type StoreOption,
} from "./grocery-pick.ts";
import { compare, coverNeed, normalizeUpc, pickExact, shieldBlocks, type MatchProduct, type PickResult, type ShieldProfile } from "./grocery-match.ts";
import { pcxIdentityFor, type PcxIdentity } from "./grocery-owner.server.ts";
import { kmBetween, productPageUrl, isPcxCartId, type StoreBrand } from "./grocery-stores.ts";

const PCX = "https://api.pcexpress.ca";
const FALLBACK_RASS = "0357";
/** PC Express returns 48 tiles a page; read further than the old 3 pages, within reason. */
const MAX_PAGES = 5;
/** Product-detail reads (barcode, ingredients, aisle, tray weight) per line. */
const DETAIL_BUDGET = 6;

/** Key comes from the environment only. No key, no call (fail closed). Never logged. */
function pcxKey(): string | null {
  const key = (process.env.SPOONFUL_PCX_API_KEY ?? "").trim();
  return key ? key : null;
}

export function pcxConfigured(): boolean {
  return pcxKey() !== null;
}

type Tile = {
  productId?: string;
  brand?: string | null;
  title?: string;
  packageSizing?: string;
  productImage?: { smallUrl?: string; thumbnailUrl?: string; imageUrl?: string }[];
  pricing?: { price?: string };
  pricingUnits?: { type?: string; weighted?: boolean } | null;
  inventoryIndicator?: string | null;
  link?: string;
  articleNumber?: string;
};

type SearchJson = {
  layout?: {
    sections?: {
      mainContentCollection?: {
        components?: { componentId?: string; data?: { productTiles?: Tile[]; pagination?: { pageSize?: number; totalResults?: number } } }[];
      };
    };
  };
};

type DetailJson = {
  gtin?: string | null;
  ingredients?: string | null;
  averageWeight?: string | number | null;
  breadcrumbs?: { name?: string }[] | null;
  offers?: { stockStatus?: string | null }[] | null;
};

const locatorCache = new Map<string, { at: number; storeId: string }>();
const detailCache = new Map<string, { at: number; detail: DetailJson | null }>();
const CACHE_MS = 10 * 60 * 1000;

export type LiveInput = {
  store: { brand: StoreBrand; name: string };
  line: CartNeed;
  lat?: number;
  lon?: number;
  storeId?: string;
  profile?: ShieldProfile;
  /** Random per-device shopper id from the client; gives each user their own PC Express identity. */
  shopper?: string;
};

export type LiveResult = {
  status: "pick" | "ask" | "unavailable";
  /** Exact matches only, best first. Empty unless status is "pick". */
  options: StoreOption[];
  /** Up to 3 labelled choices when status is "ask". Never auto-added. */
  choices: StoreOption[];
  reason: string;
  live: boolean;
  pinnedUpc?: string;
};

/** Exact-match options only (empty when the cook has to choose). */
export async function liveStoreOptions(input: LiveInput): Promise<StoreOption[]> {
  return (await liveStoreResult(input)).options;
}

export async function liveStoreResult(input: LiveInput): Promise<LiveResult> {
  const banner = pcxBannerFor(input.store);
  if (!banner || !pcxKey()) return catalogResult(input, "unavailable");
  const storeId =
    input.storeId ||
    (await nearestStoreId(banner, input.lat, input.lon)) ||
    (banner === "rass" ? FALLBACK_RASS : "");
  if (!storeId) return catalogResult(input, "unavailable");
  const identity = pcxIdentityFor(input.shopper);
  const tiles = await searchTiles(banner, storeId, input.line.name, identity);
  if (tiles.length === 0) return catalogResult(input, "unavailable");
  const products = tiles
    .map((tile) => tileToProduct(input.store, tile))
    .filter((p): p is MatchProduct => Boolean(p));
  const staple = matchStaple(input.line.name);
  const gramsPerCup = staple?.gramsPerCup ?? gramsPerCupGuess(input.line.name);

  // Read product detail (barcode, ingredients, aisle, tray weight) for the leading
  // exact matches before deciding, so shields and aisle checks see the real label.
  const enriched = new Set<string>();
  let budget = DETAIL_BUDGET;
  const enrich = async (list: MatchProduct[]) => {
    const todo = list.filter((p) => p.productId && !enriched.has(p.productId)).slice(0, budget);
    budget -= todo.length;
    await Promise.all(
      todo.map(async (p) => {
        enriched.add(p.productId!);
        const detail = await productDetail(banner, storeId, p.productId!);
        if (detail) applyDetail(p, detail);
      }),
    );
  };
  const leading = products
    // Exact matches whose title already clears the shields; their labels get read next.
    .filter((p) => p.inStock !== false && compare(input.line.name, p, input.line.aisle).ok && shieldBlocks(p, input.profile, { ignoreDoubt: true }).length === 0)
    .map((p) => ({ p, cover: coverNeed(p, input.line, gramsPerCup) }))
    .filter((row) => row.cover)
    .sort((a, b) => a.cover!.totalCad - b.cover!.totalCad)
    .map((row) => row.p);
  await enrich(leading.slice(0, 3));
  let result = pickExact({ line: input.line, products, profile: input.profile, gramsPerCup });
  for (let round = 0; round < 3 && result.pick && budget > 0; round++) {
    const top = result.pick.product;
    if (!top.productId || enriched.has(top.productId)) break;
    await enrich([top, ...result.ranked.slice(1, 2).map((r) => r.product)]);
    result = pickExact({ line: input.line, products, profile: input.profile, gramsPerCup });
  }
  if (result.pick && result.pick.product.productId && !enriched.has(result.pick.product.productId) && input.profile && hasShields(input.profile)) {
    // Out of detail budget and the cook has shields: don't pick an unread label.
    result = { ...result, status: "ask", pick: null, ranked: [], reason: "Couldn't read this product's label to check your allergy settings. Nothing was picked." };
  }
  return toLive(input, result, true);
}

function hasShields(profile: ShieldProfile): boolean {
  return Boolean(profile.allergies?.length || profile.prefs?.some((p) => p !== "quick" && p !== "budget" && p !== "no-organic"));
}

/** Store search is off or empty: the packed catalog, through the same exact-match rules. */
function catalogResult(input: LiveInput, status: "unavailable"): LiveResult {
  const result = catalogPick(input.store, input.line, input.profile);
  const live = toLive(input, result, false);
  return { ...live, status: result.status === "pick" ? "pick" : status === "unavailable" && !result.choices.length ? "unavailable" : "ask" };
}

function toLive(input: LiveInput, result: PickResult, live: boolean): LiveResult {
  if (result.status === "pick") {
    const options = result.ranked.slice(0, 5).map((row, index) => {
      const opt = optionFromRank(input.store, input.line, row, index, live, index === 0 ? result.reason : undefined);
      return { ...opt, pinnedUpc: normalizeUpc(row.product.gtin) };
    });
    return { status: "pick", options, choices: [], reason: result.reason, live, pinnedUpc: result.pinnedUpc };
  }
  const choices = result.choices.map((c, index) => ({
    ...choiceOption(input.store, input.line, c, index, live),
    pinnedUpc: normalizeUpc(c.product.gtin),
  }));
  return { status: "ask", options: [], choices, reason: result.reason, live };
}

export async function resolvePcxStoreId(banner: Banner, lat?: number, lon?: number): Promise<string> {
  return nearestStoreId(banner, lat, lon);
}

async function nearestStoreId(banner: Banner, lat?: number, lon?: number): Promise<string> {
  if (lat == null || lon == null) return banner === "rass" ? FALLBACK_RASS : "";
  const headers = pcxHeaders(banner);
  if (!headers) return "";
  const key = `${banner}:v2:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = locatorCache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.storeId;
  try {
    const res = await fetch(
      `${PCX}/pcx-bff/api/v1/pickup-locations?bannerIds=${banner}&latitude=${lat}&longitude=${lon}`,
      { headers, signal: AbortSignal.timeout(8000) },
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

async function searchTiles(banner: Banner, storeId: string, query: string, identity: PcxIdentity): Promise<Tile[]> {
  const term = searchTermFor(query);
  const first = await searchPage(banner, storeId, term, 1, identity);
  const pageSize = first.pageSize || 48;
  const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil((first.total || 0) / pageSize)));
  const rest = pages > 1
    ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => searchPage(banner, storeId, term, i + 2, identity)))
    : [];
  const seen = new Set<string>();
  const tiles: Tile[] = [];
  for (const tile of [first, ...rest].flatMap((p) => p.tiles)) {
    const id = tile.productId || tile.articleNumber || `${tile.brand}:${tile.title}:${tile.packageSizing}`;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    tiles.push(tile);
  }
  return tiles;
}

async function searchPage(
  banner: Banner,
  storeId: string,
  term: string,
  page: number,
  identity: PcxIdentity,
): Promise<{ tiles: Tile[]; total: number; pageSize: number }> {
  const empty = { tiles: [], total: 0, pageSize: 48 };
  const headers = pcxHeaders(banner);
  if (!headers) return empty;
  const body = {
    cart: { cartId: identity.cartId },
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
      // v2 pagination.from is a page number (1-based, 48 a page), checked Nov 7 2026.
      pagination: { from: page },
      includeFiltersInResponse: false,
    },
    banner,
    userData: { domainUserId: identity.domainUserId, sessionId: identity.sessionId },
    device: { screenSize: 390 },
    searchRelatedInfo: { term, options: [] },
  };
  try {
    const res = await fetch(`${PCX}/pcx-bff/api/v2/products/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return empty;
    const json = (await res.json()) as SearchJson;
    // Page 1 splits its tiles across several grid components (around a video); read them all.
    const grids = (json.layout?.sections?.mainContentCollection?.components ?? []).filter((c) => Array.isArray(c.data?.productTiles));
    const tiles = grids.flatMap((c) => c.data!.productTiles!);
    const pagination = grids.find((c) => c.data?.pagination)?.data?.pagination;
    // Not cached: prices and stock are read fresh for every pick.
    return { tiles, total: Number(pagination?.totalResults) || tiles.length, pageSize: Number(pagination?.pageSize) || 48 };
  } catch {
    return empty;
  }
}

async function productDetail(banner: Banner, storeId: string, productId: string): Promise<DetailJson | null> {
  if (!/^\d{5,14}_[A-Za-z]{2}$/.test(productId)) return null;
  const headers = pcxHeaders(banner);
  if (!headers) return null;
  const cacheKey = `${banner}:${storeId}:${productId}`;
  const hit = detailCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.detail;
  try {
    const url = `${PCX}/pcx-bff/api/v1/products/${productId}?lang=en&date=${pcxDate()}&pickupType=STORE&storeId=${encodeURIComponent(storeId)}&banner=${banner}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    const detail = res.ok ? ((await res.json()) as DetailJson) : null;
    if (detailCache.size > 1000) detailCache.clear();
    detailCache.set(cacheKey, { at: Date.now(), detail });
    return detail;
  } catch {
    return null;
  }
}

function applyDetail(p: MatchProduct, d: DetailJson) {
  if (d.gtin) p.gtin = String(d.gtin);
  if (typeof d.ingredients === "string" && d.ingredients.trim()) p.ingredients = d.ingredients.trim();
  const crumbs = (d.breadcrumbs ?? []).map((b) => b?.name ?? "").filter(Boolean);
  if (crumbs.length) p.breadcrumbs = crumbs;
  const avgKg = Number(d.averageWeight);
  if (p.perKgCad && Number.isFinite(avgKg) && avgKg > 0) p.estGrams = avgKg * 1000;
  const stock = (d.offers?.[0]?.stockStatus ?? "").toUpperCase();
  if (stock.includes("OUT")) p.inStock = false;
}

function tileToProduct(store: { brand: StoreBrand; name: string }, tile: Tile): MatchProduct | null {
  const title = `${tile.brand ?? ""} ${tile.title ?? ""}`.replace(/\s+/g, " ").trim();
  const priceCad = Number(tile.pricing?.price);
  if (!title || !Number.isFinite(priceCad) || priceCad <= 0) return null;
  const sizing = parsePackageSizing(tile.packageSizing || "");
  const img = tile.productImage?.[0];
  const imageUrl = img?.smallUrl || img?.thumbnailUrl || img?.imageUrl || "";
  const id = tile.productId || tile.articleNumber;
  const path = tile.link || (tile.productId ? `/p/${tile.productId}` : "");
  const stock = (tile.inventoryIndicator || "").toString().toUpperCase();
  const type = tile.pricingUnits?.type ?? "";
  return {
    brand: store.brand,
    name: title,
    sizeLabel: sizing.sizeLabel || "1 ea",
    priceCad,
    grams: sizing.grams,
    ml: sizing.ml,
    each: sizing.each,
    perKgCad: sizing.perKgCad,
    // SOLD_BY_WEIGHT = weighed to order; SOLD_BY_EACH_PRICED_BY_WEIGHT = a tray, price is an estimate.
    soldByWeight: type === "SOLD_BY_WEIGHT" || tile.pricingUnits?.weighted === true,
    unitPrice: sizing.unitPrice,
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

function pcxHeaders(banner: Banner): Record<string, string> | null {
  const key = pcxKey();
  if (!key) return null;
  const origin = pcxOriginFor(banner);
  return {
    "X-Application-Type": "Web",
    "X-Apikey": key,
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
  const headers = pcxHeaders(banner);
  if (!headers) return null;
  try {
    const res = await fetch(`${PCX}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as CartJson;
  } catch {
    return null;
  }
}
