import assert from "node:assert/strict";
import test from "node:test";
import { liveStoreResult } from "./grocery-pcx.server.ts";
import { cartOwnerToken, cartSigningReady } from "./grocery-owner.server.ts";
import { addToStoreCart, storeCartOff } from "./grocery-cart.ts";

// c1: the picker with no host settings at all. Nothing crashes, nothing calls PC Express, carts stay off.
const ENV = ["SPOONFUL_PCX_API_KEY", "SPOONFUL_CART_SECRET"] as const;

async function withNoEnv<T>(respond: (url: string, body: any) => unknown, run: (calls: { url: string; body: any }[]) => Promise<T>) {
  const saved = ENV.map((k) => process.env[k]);
  const realFetch = globalThis.fetch;
  const calls: { url: string; body: any }[] = [];
  for (const k of ENV) delete process.env[k];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url: String(url), body });
    return new Response(JSON.stringify(respond(String(url), body)), { status: 200 });
  }) as typeof fetch;
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = realFetch;
    ENV.forEach((k, i) => {
      if (saved[i] === undefined) delete process.env[k];
      else process.env[k] = saved[i];
    });
  }
}

test("no SPOONFUL_PCX_API_KEY: live search never calls the store, falls back to the packed list (not live)", async () => {
  await withNoEnv(
    () => ({}),
    async (calls) => {
      const r = await liveStoreResult({
        store: { brand: "superstore", name: "Atlantic Superstore" },
        line: { name: "milk", qty: 1, unit: "L", aisle: "Dairy & Eggs" },
      });
      assert.equal(calls.length, 0);
      assert.equal(r.live, false);
      assert.ok(["pick", "ask", "unavailable"].includes(r.status));
      assert.ok(Array.isArray(r.options) && Array.isArray(r.choices));
    },
  );
});

test("no SPOONFUL_CART_SECRET: no cart token is ever signed (no fallback to the store key)", async () => {
  await withNoEnv(
    () => ({}),
    async () => {
      assert.equal(cartSigningReady(), false);
      assert.equal(cartOwnerToken("shopper-aaaaaaaaaaaaaaaa", "c0ffee00-0000-4000-8000-000000000001"), null);
      process.env.SPOONFUL_PCX_API_KEY = "unit-test-placeholder-key-0123456789abcdef";
      assert.equal(cartSigningReady(), false);
      assert.equal(cartOwnerToken("shopper-aaaaaaaaaaaaaaaa", "c0ffee00-0000-4000-8000-000000000001"), null);
    },
  );
});

test("client: a cart-disabled server turns the store cart off for the page (says not available, stops retrying)", async () => {
  const store = {
    id: "t-superstore",
    brand: "superstore",
    name: "Atlantic Superstore",
    groceryUrl: "https://www.atlanticsuperstore.ca",
    lat: 44.65,
    lon: -63.57,
  } as any;
  await withNoEnv(
    (url, body) => (url.endsWith("/api/grocery-cart") && body?.action === "create" ? { ok: false, error: "cart-disabled" } : {}),
    async (calls) => {
      assert.equal(storeCartOff(), false);
      const first = await addToStoreCart(store, [{ id: "20132621001_EA", packs: 1 }]);
      assert.equal(first.ok, false);
      assert.equal(first.cartId, null);
      assert.equal(storeCartOff(), true);
      const creates = calls.filter((c) => c.body?.action === "create").length;
      assert.ok(creates <= 1);
      const second = await addToStoreCart(store, [{ id: "20132621001_EA", packs: 1 }]);
      assert.equal(second.ok, false);
      assert.equal(calls.filter((c) => c.body?.action === "create").length, creates);
      assert.equal(calls.filter((c) => c.body?.action === "add").length, 0);
    },
  );
});
