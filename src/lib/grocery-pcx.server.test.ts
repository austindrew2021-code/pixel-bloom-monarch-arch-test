import assert from "node:assert/strict";
import test from "node:test";
import { liveStoreOptions, liveStoreResult } from "./grocery-pcx.server.ts";
import { cartOwnerToken, cartSigningReady, ownsCart, pcxIdentityFor } from "./grocery-owner.server.ts";
import { createHmac } from "node:crypto";

const store = { brand: "superstore" as const, name: "Atlantic Superstore" };
const TEST_KEY = "unit-test-placeholder-key";

type Call = { url: string; body: any; headers: Record<string, string> };

function tile(title: string, size: string, price: number, brand = "") {
  return { productId: `${Math.abs(hash(title + size))}_EA`, brand, title, packageSizing: size, pricing: { price: String(price) } };
}
function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (h % 9_000_000) + 10_000_000;
}

async function withFetch<T>(
  respond: (call: Call) => unknown,
  run: (calls: Call[]) => Promise<T>,
  key: string | null = TEST_KEY,
): Promise<T> {
  const calls: Call[] = [];
  const realFetch = globalThis.fetch;
  const realKey = process.env.SPOONFUL_PCX_API_KEY;
  if (key === null) delete process.env.SPOONFUL_PCX_API_KEY;
  else process.env.SPOONFUL_PCX_API_KEY = key;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const call = { url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null, headers: (init?.headers ?? {}) as Record<string, string> };
    calls.push(call);
    const out = respond(call);
    if (out === null) return new Response("no", { status: 404 });
    return new Response(JSON.stringify(out), { status: 200 });
  }) as typeof fetch;
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = realFetch;
    if (realKey === undefined) delete process.env.SPOONFUL_PCX_API_KEY;
    else process.env.SPOONFUL_PCX_API_KEY = realKey;
  }
}

const grid = (tiles: unknown[], pagination?: unknown) => ({ data: { productTiles: tiles, ...(pagination ? { pagination } : {}) } });
const page = (...components: unknown[]) => ({ layout: { sections: { mainContentCollection: { components } } } });

test("no SPOONFUL_PCX_API_KEY: no store call is made (fail closed), catalog answers through the same rules", async () => {
  await withFetch(
    () => {
      throw new Error("must not be called");
    },
    async (calls) => {
      const r = await liveStoreResult({ store, line: { name: "stewing beef", qty: 1, unit: "kg", aisle: "Meat & Seafood" }, storeId: "0357" });
      assert.deepEqual(calls.map((c) => c.url), []);
      assert.equal(r.live, false);
      assert.notEqual(r.status, "pick");
      // The catalog's "Lean Ground Beef" is not an option for stewing beef.
      assert.ok(r.options.every((o) => !/ground/i.test(o.name)));
      assert.ok(r.choices.every((c) => (c.choiceLabel ?? "").length > 0));
    },
    null,
  );
});

test("the key is read from the environment and only sent as the request header", async () => {
  await withFetch(
    () => page(grid([tile("Unsalted Butter", "454 g", 7.29, "Gay Lea")])),
    async (calls) => {
      await liveStoreOptions({ store, line: { name: "unsalted butter", qty: 1, unit: "cup", aisle: "Dairy & Eggs" }, storeId: "0357" });
      assert.ok(calls.length >= 1);
      for (const c of calls) {
        assert.equal(c.headers["X-Apikey"], TEST_KEY);
        assert.doesNotMatch(c.url, new RegExp(TEST_KEY));
        assert.doesNotMatch(JSON.stringify(c.body ?? {}), new RegExp(TEST_KEY));
      }
    },
  );
});

test("each shopper gets their own PC Express cart/user/session ids, stable per shopper, never the shared fixed ids", async () => {
  const seen: Call[] = [];
  await withFetch(
    (call) => {
      if (call.url.includes("/products/search")) seen.push(call);
      return page(grid([]));
    },
    async () => {
      const line = { name: "unsalted butter", qty: 1, unit: "cup", aisle: "Dairy & Eggs" as const };
      await liveStoreResult({ store, line, storeId: "0357", shopper: "shopper-aaaaaaaaaaaaaaaa" });
      await liveStoreResult({ store, line, storeId: "0357", shopper: "shopper-bbbbbbbbbbbbbbbb" });
      await liveStoreResult({ store, line, storeId: "0357", shopper: "shopper-aaaaaaaaaaaaaaaa" });
    },
  );
  const ids = seen.map((c) => [c.body.cart.cartId, c.body.userData.domainUserId, c.body.userData.sessionId].join("|"));
  assert.equal(ids.length, 3);
  assert.notEqual(ids[0], ids[1]);
  assert.equal(ids[0], ids[2]);
  for (const id of ids) assert.doesNotMatch(id, /00000000-0000-0000-0000-00000000000[123]/);
  const anon1 = pcxIdentityFor(undefined);
  const anon2 = pcxIdentityFor(undefined);
  assert.notEqual(anon1.domainUserId, anon2.domainUserId);
});

test("reads every product grid on a page and pages past the old 3-page limit, within a cap", async () => {
  await withFetch(
    (call) => {
      if (!call.url.includes("/products/search")) return null;
      const p = call.body.listingInfo.pagination.from;
      if (p === 1) {
        // Page 1: the cheap exact match sits in the second grid (after a video component).
        return page(grid([tile("Spicy Chicken Burgers", "600 g", 13, "Mina")], { pageSize: 48, totalResults: 400 }), { data: {} }, grid([tile("Stewing Beef Value Pack", "1 kg", 14.99)]));
      }
      if (p === 5) return page(grid([tile("Stewing Beef Cubes", "1 kg", 12.99)]));
      return page(grid([tile(`Filler ${p}`, "100 g", 1)]));
    },
    async (calls) => {
      const r = await liveStoreResult({ store, line: { name: "stewing beef", qty: 1, unit: "kg", aisle: "Meat & Seafood" }, storeId: "0357" });
      const pages = calls.filter((c) => c.url.includes("/products/search")).map((c) => c.body.listingInfo.pagination.from);
      assert.deepEqual(pages.sort(), [1, 2, 3, 4, 5]);
      assert.equal(r.status, "pick");
      assert.equal(r.options[0]!.name, "Stewing Beef Cubes");
      assert.ok(r.options.some((o) => o.name === "Stewing Beef Value Pack"));
    },
  );
});

test("the cook's allergy and diet profile reaches the live picker", async () => {
  const tiles = [tile("Soy Sauce", "591 ml", 5.5, "Kikkoman"), tile("Light Soy Sauce", "450 ml", 2.5, "No Name")];
  await withFetch(
    (call) => (call.url.includes("/products/search") ? page(grid(tiles)) : null),
    async () => {
      const line = { name: "soy sauce", qty: 2, unit: "tbsp", aisle: "Pantry" as const };
      const plain = await liveStoreResult({ store, line, storeId: "0357" });
      assert.equal(plain.status, "pick");
      const gf = await liveStoreResult({ store, line, storeId: "0357", profile: { prefs: ["gluten-free"] } });
      assert.equal(gf.status, "ask");
      assert.equal(gf.options.length, 0);
      assert.equal(gf.choices.length, 0);
      const veg = await liveStoreResult({
        store,
        line: { name: "boneless skinless chicken thighs", qty: 600, unit: "g", aisle: "Meat & Seafood" },
        storeId: "0357",
        profile: { prefs: ["vegetarian"] },
      });
      assert.equal(veg.status, "ask");
    },
  );
});

test("product detail adds the barcode (pinnedUpc), ingredients and tray weight to the pick", async () => {
  const t = { ...tile("Chicken Thigh Boneless Skinless Club Pack", "$15.41/1kg $6.99/1lb", 15.46), productId: "20162170_KG" };
  await withFetch(
    (call) => {
      if (call.url.includes("/products/search")) return page(grid([t]));
      if (call.url.includes("/products/20162170_KG")) {
        return { gtin: "00000020731007", ingredients: "Skinless Boneless Chicken Thigh.", averageWeight: "1.003", breadcrumbs: [{ name: "Food" }, { name: "Meat" }, { name: "Chicken & Turkey" }], offers: [{ stockStatus: "OK" }] };
      }
      return null;
    },
    async () => {
      const r = await liveStoreResult({
        store,
        line: { name: "boneless skinless chicken thighs", qty: 600, unit: "g", aisle: "Meat & Seafood" },
        storeId: "0357",
        profile: { allergies: ["gluten"] },
      });
      assert.equal(r.status, "pick");
      assert.equal(r.pinnedUpc, "000020731007");
      assert.equal(r.options[0]!.pinnedUpc, "000020731007");
      assert.equal(r.options[0]!.packs, 1);
      assert.match(r.options[0]!.unitPrice ?? "", /\$15\.41\/kg/);
    },
  );
});

test("cart owner check: only the shopper who created a cart can read or add to it", () => {
  const realKey = process.env.SPOONFUL_PCX_API_KEY;
  const realSecret = process.env.SPOONFUL_CART_SECRET;
  const shopper = "shopper-aaaaaaaaaaaaaaaa";
  const cart = "c0ffee00-0000-4000-8000-000000000001";
  try {
    delete process.env.SPOONFUL_CART_SECRET;
    delete process.env.SPOONFUL_PCX_API_KEY;
    assert.equal(cartSigningReady(), false);
    assert.equal(cartOwnerToken(shopper, cart), null);
    assert.equal(ownsCart(shopper, cart, "x"), false);

    // The PC Express key alone never signs carts: it is public, so a token derived from it is forgeable.
    process.env.SPOONFUL_PCX_API_KEY = TEST_KEY;
    assert.equal(cartSigningReady(), false);
    assert.equal(cartOwnerToken(shopper, cart), null);
    const forgedSecret = createHmac("sha256", TEST_KEY).update("spoonful-cart-owner-v1").digest();
    const forged = createHmac("sha256", forgedSecret).update(`${shopper}:${cart}`).digest("base64url");
    assert.equal(ownsCart(shopper, cart, forged), false);
    const forgedRaw = createHmac("sha256", TEST_KEY).update(`${shopper}:${cart}`).digest("base64url");
    assert.equal(ownsCart(shopper, cart, forgedRaw), false);

    // Too short, or the same value as the PC Express key: still off.
    process.env.SPOONFUL_CART_SECRET = "short-secret-1234";
    assert.equal(cartSigningReady(), false);
    process.env.SPOONFUL_CART_SECRET = TEST_KEY;
    assert.equal(cartSigningReady(), false);

    process.env.SPOONFUL_CART_SECRET = "test-only-cart-secret-0123456789abcdef";
    assert.equal(cartSigningReady(), true);
    const token = cartOwnerToken(shopper, cart)!;
    assert.ok(token && !token.includes(TEST_KEY));
    assert.equal(ownsCart(shopper, cart, token), true);
    assert.equal(ownsCart(shopper, cart, forged), false);
    assert.equal(ownsCart("shopper-bbbbbbbbbbbbbbbb", cart, token), false);
    assert.equal(ownsCart(shopper, "c0ffee00-0000-4000-8000-000000000002", token), false);
    assert.equal(ownsCart(shopper, cart, `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`), false);
    assert.equal(ownsCart("short", cart, token), false);
  } finally {
    if (realKey === undefined) delete process.env.SPOONFUL_PCX_API_KEY;
    else process.env.SPOONFUL_PCX_API_KEY = realKey;
    if (realSecret === undefined) delete process.env.SPOONFUL_CART_SECRET;
    else process.env.SPOONFUL_CART_SECRET = realSecret;
  }
});

test("r2 live path: bare cheese asks, printed can size is covered, no-organic profile and may-contain reach the picker", async () => {
  const tilesBy: Record<string, unknown[]> = {
    cheese: [tile("Old Cheddar Cheese", "400 g", 6.49, "Black Diamond"), tile("Mozzarella Cheese", "340 g", 5.49)],
    tomatoes: [tile("Diced Tomatoes", "398 ml", 1.29, "No Name")],
    carrots: [tile("Organic Carrots", "1.36 kg", 2.29, "PC Organics"), tile("Carrots", "1.36 kg", 2.49)],
    granola: [tile("Original Granola", "500 g", 4.99), tile("Honey Granola", "650 g", 6.49)],
  };
  const panels: Record<string, string> = {
    "Original Granola": "Whole grain oats, sugar, canola oil. May contain traces of tree nuts.",
    "Honey Granola": "Oats, honey, sunflower oil.",
  };
  let current: unknown[] = [];
  await withFetch(
    (call) => {
      if (call.url.includes("/products/search")) return page(grid(current));
      const m = call.url.match(/\/products\/(\d+_EA)\?/);
      const t = (current as { productId: string; title: string }[]).find((x) => m && x.productId === m[1]);
      return t && panels[t.title] ? { ingredients: panels[t.title], breadcrumbs: [{ name: "Food" }] } : null;
    },
    async () => {
      const run = (key: string, name: string, qty: number, unit: string, profile?: { allergies?: string[]; prefs?: string[] }) => {
        current = tilesBy[key]!;
        return liveStoreResult({ store, line: { name, qty, unit, aisle: "Other" }, storeId: "0357", profile });
      };
      const cheese = await run("cheese", "cheese", 200, "g");
      assert.equal(cheese.status, "ask");
      assert.deepEqual(cheese.options, []);
      assert.equal(cheese.choices.length, 2);

      const cans = await run("tomatoes", "canned diced tomatoes (796 ml)", 2, "can");
      assert.equal(cans.status, "pick");
      assert.equal(cans.options[0]!.packs, 4);

      const organicOk = await run("carrots", "carrots", 1, "kg");
      assert.match(organicOk.options[0]!.name, /Organic/);
      const noOrganic = await run("carrots", "carrots", 1, "kg", { prefs: ["no-organic"] });
      assert.equal(noOrganic.options[0]!.name, "Carrots");

      const granola = await run("granola", "granola", 500, "g", { allergies: ["nuts"] });
      assert.equal(granola.status, "pick");
      assert.equal(granola.options[0]!.name, "Honey Granola");
    },
  );
});
