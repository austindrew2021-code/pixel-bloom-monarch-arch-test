import { pcxBannerFor } from "./grocery-pcx-banner.ts";
import { kitchenApi } from "./native-health.ts";
import { isPcxCartId, pcxProductId, storeSite, type NearbyStore } from "./grocery-stores.ts";

export type StoreCartLine = {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
};

const memory = new Map<string, string>();

function storageKey(store: NearbyStore): string {
  return `spoonful-pcx-cart:${store.id}`;
}

export function rememberedCartId(store: NearbyStore): string | null {
  const hit = memory.get(store.id);
  if (isPcxCartId(hit)) return hit!;
  try {
    const saved = sessionStorage.getItem(storageKey(store));
    if (isPcxCartId(saved)) {
      memory.set(store.id, saved!);
      return saved!;
    }
  } catch {
    // private mode
  }
  return null;
}

function remember(store: NearbyStore, cartId: string) {
  memory.set(store.id, cartId);
  try {
    sessionStorage.setItem(storageKey(store), cartId);
  } catch {
    // private mode
  }
}

export function storeCanHoldCart(store: NearbyStore): boolean {
  return Boolean(pcxBannerFor(store));
}

export async function ensureStoreCart(store: NearbyStore): Promise<string | null> {
  if (!storeCanHoldCart(store)) return null;
  const existing = rememberedCartId(store);
  if (existing) return existing;
  const json = await cartRequest({
    action: "create",
    brand: store.brand,
    storeName: store.name,
    storeId: store.pcStoreId,
    lat: store.lat,
    lon: store.lon,
  });
  const cartId = String(json.cartId ?? "");
  if (!isPcxCartId(cartId)) return null;
  remember(store, cartId);
  return cartId;
}

export async function addToStoreCart(
  store: NearbyStore,
  items: { id?: string; packs?: number }[],
): Promise<{ ok: boolean; cartId: string | null; count: number; lines: StoreCartLine[] }> {
  const entries = items
    .map((item) => ({ id: pcxProductId(item.id) || "", packs: item.packs || 1 }))
    .filter((item) => item.id);
  if (entries.length === 0) return { ok: false, cartId: rememberedCartId(store), count: 0, lines: [] };
  const cartId = await ensureStoreCart(store);
  if (!cartId) return { ok: false, cartId: null, count: 0, lines: [] };
  const json = await cartRequest({
    action: "add",
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
