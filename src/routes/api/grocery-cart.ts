import { createFileRoute } from "@tanstack/react-router";
import { pcxBannerFor } from "@/lib/grocery-pcx-banner.ts";
import { addPcxCartEntries, createPcxCart, getPcxCart, resolvePcxStoreId } from "@/lib/grocery-pcx.server";
import { cartOwnerToken, cartSigningReady, isShopperId, ownsCart } from "@/lib/grocery-owner.server";
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
            cartToken?: string;
            shopper?: string;
            lat?: number;
            lon?: number;
            items?: { id?: string; packs?: number }[];
          };
          // Every cart belongs to one shopper: no shopper id, no cart.
          const shopper = body.shopper;
          if (!isShopperId(shopper)) return Response.json({ ok: false, error: "shopper" });
          // No cart signing secret on the server: no carts at all (fail closed).
          if (!cartSigningReady()) return Response.json({ ok: false, error: "cart-disabled" });
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
            const cartToken = cartId ? cartOwnerToken(shopper, cartId) : null;
            if (!cartId || !cartToken) return Response.json({ ok: false, error: "cart" });
            return Response.json({ ok: true, cartId, cartToken, storeId });
          }
          const cartId = String(body.cartId ?? "");
          if (!isPcxCartId(cartId)) return Response.json({ ok: false, error: "cart" });
          // Owner check: the cart id alone is not enough to read or add.
          if (!ownsCart(shopper, cartId, body.cartToken)) return Response.json({ ok: false, error: "owner" });
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
