import { catalogChoices, catalogOptions, type CartNeed, type StoreOption } from "./grocery-pick.ts";
import { kitchenApi } from "./native-health.ts";
import { pcxBannerFor } from "./grocery-pcx-banner.ts";
import { shopperId } from "./grocery-cart.ts";
import type { NearbyStore } from "./grocery-stores.ts";
import type { ShieldProfile } from "./grocery-match.ts";

export type StoreOptionsResult = {
  /** Exact matches, best first. Empty when the cook has to choose. */
  options: StoreOption[];
  /** Up to 3 labelled choices; never added without a tap. */
  choices: StoreOption[];
  status: "pick" | "ask" | "unavailable";
  reason: string;
  live: boolean;
};

function catalogResult(store: NearbyStore, line: CartNeed, profile?: ShieldProfile): StoreOptionsResult {
  const options = catalogOptions(store, line, 5, profile);
  const choices = options.length ? [] : catalogChoices(store, line, profile);
  return {
    options,
    choices,
    status: options.length ? "pick" : "ask",
    reason: options.length ? options[0]!.why : choices.length ? "No exact match in the packed list. Pick one of these, or search the store." : "No exact match in the packed list. Search the store.",
    live: false,
  };
}

export async function loadStoreOptions(
  store: NearbyStore,
  line: CartNeed,
  profile?: ShieldProfile,
): Promise<StoreOptionsResult> {
  const catalog = () => catalogResult(store, line, profile);
  if (!pcxBannerFor(store)) return catalog();
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
        shopper: shopperId(),
        profile: { allergies: profile?.allergies ?? [], prefs: profile?.prefs ?? [] },
      }),
    });
    if (!res.ok) return catalog();
    const json = (await res.json()) as Partial<StoreOptionsResult>;
    const options = Array.isArray(json.options) ? json.options : [];
    const choices = Array.isArray(json.choices) ? json.choices : [];
    if (json.status === "pick" && options.length) {
      return { options, choices: [], status: "pick", reason: String(json.reason ?? ""), live: Boolean(json.live) };
    }
    if (json.status === "ask") {
      return { options: [], choices, status: "ask", reason: String(json.reason ?? ""), live: Boolean(json.live) };
    }
  } catch {
    // Store search is down — use the packed catalog (same exact-match rules).
  }
  return catalog();
}
