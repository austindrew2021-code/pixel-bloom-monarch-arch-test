import { createFileRoute } from "@tanstack/react-router";
import { liveStoreOptions } from "@/lib/grocery-pcx.server";
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
          };
          const name = String(body.name ?? "").trim().slice(0, 80);
          if (!name) return Response.json({ options: [], live: false });
          const aisle = AISLES.includes(body.aisle as Aisle) ? (body.aisle as Aisle) : "Other";
          const brand: StoreBrand =
            body.brand === "independent" || body.brand === "sobeys" || body.brand === "walmart" || body.brand === "other"
              ? body.brand
              : "superstore";
          const options = await liveStoreOptions({
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
          });
          return Response.json({ options, live: options.some((option) => option.live) });
        } catch {
          return Response.json({ options: [], live: false });
        }
      },
    },
  },
});
