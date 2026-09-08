import { catalogOptions, type CartNeed, type StoreOption } from "./grocery-pick.ts";
import { kitchenApi } from "./native-health.ts";
import { pcxBannerFor } from "./grocery-pcx-banner.ts";
import type { NearbyStore } from "./grocery-stores.ts";

export async function loadStoreOptions(
  store: NearbyStore,
  line: CartNeed,
): Promise<{ options: StoreOption[]; live: boolean }> {
  const catalog = catalogOptions(store, line, 5);
  if (!pcxBannerFor(store)) return { options: catalog, live: false };
  try {
    const res = await fetch(kitchenApi("/api/grocery-search"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: line.name,
        qty: line.qty,
        unit: line.unit,
        aisle: line.aisle,
        brand: store.brand,
        storeName: store.name,
        lat: store.lat,
        lon: store.lon,
        storeId: store.pcStoreId,
      }),
    });
    if (!res.ok) return { options: catalog, live: false };
    const json = (await res.json()) as { options?: StoreOption[]; live?: boolean };
    if (json.options && json.options.length > 0) return { options: json.options, live: Boolean(json.live) };
  } catch {
    // Store search is down — use the packed catalog.
  }
  return { options: catalog, live: false };
}
