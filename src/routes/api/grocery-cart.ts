import { createFileRoute } from "@tanstack/react-router";
import { pcxBannerFor } from "@/lib/grocery-pcx-banner.ts";
import { addPcxCartEntries, createPcxCart, getPcxCart, resolvePcxStoreId } from "@/lib/grocery-pcx.server";
import { isPcxCartId, pcxProductId } from "@/lib/grocery-stores.ts";

export const Route = createFileRoute("/api/grocery-cart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            brand?: string;
            storeName?: string;
            storeId?: string;
            cartId?: string;
            lat?: number;
            lon?: number;
            items?: { id?: string; packs?: number }[];
          };
          const store = {
            brand: (body.brand === "independent" || body.brand === "sobeys" || body.brand === "walmart"
              ? body.brand
              : "superstore") as "superstore" | "independent" | "sobeys" | "walmart",
            name: String(body.storeName ?? "Atlantic Superstore").slice(0, 80),
          };
          const banner = pcxBannerFor(store);
          if (!banner) return Response.json({ ok: false, error: "store" });
          let storeId = String(body.storeId ?? "").replace(/\D/g, "").slice(0, 8);
          if (!storeId) {
            storeId = await resolvePcxStoreId(banner, Number(body.lat) || undefined, Number(body.lon) || undefined);
          }
          const action = String(body.action ?? "");
          if (action === "create") {
            const cartId = await createPcxCart({ banner, storeId });
            return Response.json({ ok: Boolean(cartId), cartId, storeId });
          }
          const cartId = String(body.cartId ?? "");
          if (!isPcxCartId(cartId)) return Response.json({ ok: false, error: "cart" });
          if (action === "get") {
            const lines = await getPcxCart({ banner, cartId });
            return Response.json({ ok: Boolean(lines), cartId, lines: lines ?? [] });
          }
          if (action === "add") {
            const items = (Array.isArray(body.items) ? body.items : [])
              .map((item) => ({
                productId: pcxProductId(item.id) || "",
                quantity: Number(item.packs) || 1,
              }))
              .filter((item) => item.productId);
            const result = await addPcxCartEntries({ banner, cartId, storeId, entries: items });
            return Response.json({ ok: result.ok, cartId, count: result.count, lines: result.lines, storeId });
          }
          return Response.json({ ok: false, error: "action" });
        } catch {
          return Response.json({ ok: false });
        }
      },
    },
  },
});