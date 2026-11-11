import { pcxBannerFor } from "./grocery-pcx-banner.ts";
import { kitchenApi } from "./native-health.ts";
import { isPcxCartId, pcxProductId, storeSite, type NearbyStore } from "./grocery-stores.ts";

export type StoreCartLine = {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
};

type SavedCart = { cartId: string; cartToken: string };

const memory = new Map<string, SavedCart>();
let shopperMemo = "";
const SHOPPER_KEY = "spoonful-shopper-id";

function storageKey(store: NearbyStore): string {
  return `spoonful-pcx-cart:v2:${store.id}`;
}

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

/**
 * Random id for this device's shopper. It gives each user their own store search
 * identity and signs their carts; it carries no account data.
 */
export function shopperId(): string {
  if (shopperMemo) return shopperMemo;
  try {
    const saved = localStorage.getItem(SHOPPER_KEY);
    if (saved && /^[A-Za-z0-9_-]{16,80}$/.test(saved)) {
      shopperMemo = saved;
      return saved;
    }
  } catch {
    // private mode
  }
  const fresh = randomId();
  if (!fresh) return "";
  shopperMemo = fresh;
  try {
    localStorage.setItem(SHOPPER_KEY, fresh);
  } catch {
    // private mode: id lives for this page only
  }
  return fresh;
}

function savedCart(store: NearbyStore): SavedCart | null {
  const hit = memory.get(store.id);
  if (hit && isPcxCartId(hit.cartId) && hit.cartToken) return hit;
  try {
    const raw = sessionStorage.getItem(storageKey(store));
    const saved = raw ? (JSON.parse(raw) as Partial<SavedCart>) : null;
    if (saved && isPcxCartId(saved.cartId) && typeof saved.cartToken === "string" && saved.cartToken) {
      const row = { cartId: saved.cartId!, cartToken: saved.cartToken };
      memory.set(store.id, row);
      return row;
    }
  } catch {
    // private mode
  }
  return null;
}

export function rememberedCartId(store: NearbyStore): string | null {
  return savedCart(store)?.cartId ?? null;
}

function remember(store: NearbyStore, row: SavedCart) {
  memory.set(store.id, row);
  try {
    sessionStorage.setItem(storageKey(store), JSON.stringify(row));
  } catch {
    // private mode
  }
}

/**
 * c1: the server answers "cart-disabled" when it has no cart signing secret (SPOONFUL_CART_SECRET).
 * Remember that for this page load so the picker says "not available yet" instead of retrying; the list is still saved.
 */
let cartOff = false;

export function storeCartOff(): boolean {
  return cartOff;
}

export function storeCanHoldCart(store: NearbyStore): boolean {
  return Boolean(pcxBannerFor(store));
}

export async function ensureStoreCart(store: NearbyStore): Promise<string | null> {
  return (await ensureSavedCart(store))?.cartId ?? null;
}

async function ensureSavedCart(store: NearbyStore): Promise<SavedCart | null> {
  if (!storeCanHoldCart(store) || cartOff) return null;
  const existing = savedCart(store);
  if (existing) return existing;
  const shopper = shopperId();
  if (!shopper) return null;
  const json = await cartRequest({
    action: "create",
    shopper,
    brand: store.brand,
    storeName: store.name,
    storeId: store.pcStoreId,
    lat: store.lat,
    lon: store.lon,
  });
  if (json.error === "cart-disabled") {
    cartOff = true;
    return null;
  }
  const cartId = String(json.cartId ?? "");
  const cartToken = String(json.cartToken ?? "");
  if (!isPcxCartId(cartId) || !cartToken) return null;
  const row = { cartId, cartToken };
  remember(store, row);
  return row;
}

export async function addToStoreCart(
  store: NearbyStore,
  items: { id?: string; packs?: number }[],
): Promise<{ ok: boolean; cartId: string | null; count: number; lines: StoreCartLine[] }> {
  const entries = items
    .map((item) => ({ id: pcxProductId(item.id) || "", packs: item.packs || 1 }))
    .filter((item) => item.id);
  if (entries.length === 0) return { ok: false, cartId: rememberedCartId(store), count: 0, lines: [] };
  const saved = await ensureSavedCart(store);
  if (!saved) return { ok: false, cartId: null, count: 0, lines: [] };
  const cartId = saved.cartId;
  const json = await cartRequest({
    action: "add",
    shopper: shopperId(),
    cartToken: saved.cartToken,
    brand: store.brand,
    storeName: store.name,
    storeId: store.pcStoreId,
    lat: store.lat,
    lon: store.lon,
    cartId,
    items: entries,
  });
  return {
    ok: Boolean(json.ok),
    cartId,
    count: Number(json.count) || 0,
    lines: Array.isArray(json.lines) ? (json.lines as StoreCartLine[]) : [],
  };
}

export function storeCartOpenUrl(store: NearbyStore, firstProductUrl?: string): string {
  if (firstProductUrl && /^https:\/\//i.test(firstProductUrl)) return firstProductUrl;
  const site = storeSite(store);
  if (store.brand === "superstore" || store.brand === "independent") return `${site}/en`;
  if (store.brand === "other" || store.groceryUrl.includes("instacart")) return store.groceryUrl || site;
  return store.groceryUrl || `${site}/`;
}

async function cartRequest(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(kitchenApi("/api/grocery-cart"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
