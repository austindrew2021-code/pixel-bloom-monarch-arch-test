import { createFileRoute } from "@tanstack/react-router";
import { liveStoreResult } from "@/lib/grocery-pcx.server";
import type { Aisle } from "@/lib/types";
import type { StoreBrand } from "@/lib/grocery-stores.ts";

const AISLES: Aisle[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Bakery",
  "Frozen",
  "Herbs & Spices",
  "Other",
];

const ALLERGY_IDS = new Set(["gluten", "dairy", "nuts", "shellfish", "spicy", "egg", "soy", "sesame", "fish"]);
const DIET_IDS = new Set(["vegetarian", "pescatarian", "vegan", "gluten-free", "sugar-free", "dairy-free", "no-organic"]);

function cleanList(raw: unknown, allowed: Set<string>): string[] {
  return (Array.isArray(raw) ? raw : [])
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter((v) => allowed.has(v))
    .slice(0, 12);
}

export const Route = createFileRoute("/api/grocery-search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            name?: string;
            qty?: number;
            unit?: string;
            aisle?: string;
            brand?: string;
            storeName?: string;
            lat?: number;
            lon?: number;
            storeId?: string;
            shopper?: string;
            profile?: { allergies?: unknown; prefs?: unknown };
          };
          const name = String(body.name ?? "").trim().slice(0, 80);
          if (!name) return Response.json({ options: [], choices: [], status: "ask", live: false });
          const aisle = AISLES.includes(body.aisle as Aisle) ? (body.aisle as Aisle) : "Other";
          const brand: StoreBrand =
            body.brand === "independent" || body.brand === "sobeys" || body.brand === "walmart" || body.brand === "other"
              ? body.brand
              : "superstore";
          const result = await liveStoreResult({
            store: {
              brand,
              name: String(body.storeName ?? "Atlantic Superstore").slice(0, 80),
            },
            line: {
              name,
              qty: Number(body.qty) || 1,
              unit: String(body.unit ?? "").slice(0, 24),
              aisle,
            },
            lat: Number(body.lat) || undefined,
            lon: Number(body.lon) || undefined,
            storeId: body.storeId ? String(body.storeId).slice(0, 12) : undefined,
            shopper: typeof body.shopper === "string" ? body.shopper.slice(0, 80) : undefined,
            profile: {
              allergies: cleanList(body.profile?.allergies, ALLERGY_IDS),
              prefs: cleanList(body.profile?.prefs, DIET_IDS),
            },
          });
          return Response.json({
            options: result.options,
            choices: result.choices,
            status: result.status,
            reason: result.reason,
            pinnedUpc: result.pinnedUpc,
            live: result.live,
          });
        } catch {
          return Response.json({ options: [], choices: [], status: "ask", live: false });
        }
      },
    },
  },
});
