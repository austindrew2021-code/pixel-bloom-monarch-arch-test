import assert from "node:assert/strict";
import test from "node:test";
import {
  FALLBACK_STORES,
  brandFromName,
  cartForStore,
  cartFromShop,
  cartUrlFor,
  checkoutHopsFor,
  checkoutUrlFor,
  estimateLineCad,
  formatCartList,
  groceryUrlFor,
  instacartSlugFor,
  isHeliosStore,
  isPcxCartId,
  kmBetween,
  pcxProductId,
  productPageUrl,
  productSearchUrl,
  searchQuery,
} from "./grocery-stores.ts";
import { pcxBannerFor } from "./grocery-pcx-banner.ts";
import { storeCanHoldCart, storeCartOpenUrl } from "./grocery-cart.ts";

test("store names map to a grocery site, not a blank cart", () => {
  assert.equal(brandFromName("Atlantic Superstore"), "superstore");
  assert.equal(brandFromName("Sobeys Bathurst"), "sobeys");
  assert.match(groceryUrlFor("walmart"), /walmart/);
  assert.match(groceryUrlFor("superstore", "Atlantic Superstore"), /atlanticsuperstore/);
});

test("Bathurst to a nearby aisle is a few kilometres, not hundreds", () => {
  const km = kmBetween({ lat: 47.618, lon: -65.652 }, { lat: 47.635, lon: -65.672 });
  assert.ok(km > 0 && km < 8, String(km));
});

test("tonight's pasta list stays an ordinary cart, not $800", () => {
  const cart = cartFromShop([
    { name: "pasta", qty: 12, unit: "oz", aisle: "Pantry" },
    { name: "tomato sauce", qty: 1, unit: "jar", aisle: "Pantry" },
    { name: "milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
  ]);
  assert.equal(cart.items.length, 3);
  assert.ok(cart.totalCad < 40, String(cart.totalCad));
  assert.ok(cart.totalCad > 5);
  const text = formatCartList("Sobeys", cart.items);
  assert.match(text, /pasta/);
  assert.match(text, /Sobeys/);
});

test("pantry items stay off the order", () => {
  const cart = cartFromShop([
    { name: "onion", qty: 1, unit: "", aisle: "Produce", fromPantry: true },
    { name: "milk", qty: 1, unit: "L", aisle: "Dairy & Eggs" },
  ]);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0]?.name, "milk");
});

test("qty does not explode a spice into a warehouse pallet", () => {
  const n = estimateLineCad({ qty: 40, aisle: "Herbs & Spices" });
  assert.ok(n <= 8);
});

test("Bathurst fallback stores open a real grocery site, not a blank cart", () => {
  assert.ok(FALLBACK_STORES.length >= 3);
  for (const store of FALLBACK_STORES) {
    assert.match(store.groceryUrl, /^https:\/\//);
    assert.match(store.mapsUrl, /google\.com\/maps/);
  }
  const atlantic = FALLBACK_STORES.find((s) => s.name.includes("Atlantic"));
  assert.match(atlantic?.groceryUrl ?? "", /atlanticsuperstore/);
  const coop = FALLBACK_STORES.find((s) => /co-op/i.test(s.name));
  assert.match(coop?.groceryUrl ?? "", /instacart\.ca\/store\/co-op-food/);
});

test("store search opens the food, not the store homepage", () => {
  const superstore = { brand: "superstore" as const, name: "Atlantic Superstore" };
  const walmart = { brand: "walmart" as const, name: "Walmart Supercentre" };
  const sobeys = { brand: "sobeys" as const, name: "Sobeys" };
  assert.match(productSearchUrl(superstore, "pasta"), /atlanticsuperstore\.ca\/en\/search.*pasta/i);
  assert.match(productSearchUrl(walmart, "2% milk"), /walmart\.ca\/en\/search\?q=/);
  assert.match(productSearchUrl(sobeys, "eggs"), /voila\.ca\/search\?q=/);
  assert.match(cartUrlFor(superstore), /atlanticsuperstore/);
  assert.doesNotMatch(cartUrlFor(superstore), /\/cart/);
  assert.match(cartUrlFor(walmart), /walmart\.ca\/cart/);
  assert.equal(cartUrlFor(sobeys), "https://www.voila.ca/");
});

test("Co-op opens an Instacart storefront search, not a blank marketplace hop", () => {
  const coop = { brand: "other" as const, name: "Co-op Food" };
  const calgary = { brand: "other" as const, name: "Calgary Co-op" };
  assert.equal(instacartSlugFor(coop), "co-op-food");
  assert.equal(instacartSlugFor(calgary), "calgary-co-op");
  assert.match(groceryUrlFor("other", "Co-op Food"), /instacart\.ca\/store\/co-op-food\/storefront/);
  assert.match(productSearchUrl(coop, "salted butter"), /instacart\.ca\/store\/co-op-food\/s\?k=/);
  assert.match(productSearchUrl(calgary, "milk"), /calgary-co-op\/s\?k=/);
  assert.match(cartUrlFor(coop), /instacart\.ca/);
});

test("checkout opens real Superstore product pages, not a fake cart URL", () => {
  const superstore = { brand: "superstore" as const, name: "Atlantic Superstore" };
  assert.equal(pcxProductId("21340952_EA"), "21340952_EA");
  assert.equal(pcxProductId("/extra-lean-chicken-breasts/p/21340952_EA"), "21340952_EA");
  assert.equal(pcxProductId("No Name Panko:227 g:0"), undefined);
  assert.equal(
    productPageUrl(superstore, "21340952_EA"),
    "https://www.atlanticsuperstore.ca/en/p/21340952_EA",
  );
  const checkout = checkoutUrlFor(superstore, [
    { id: "21340952_EA", packs: 1 },
    { id: "20812144001_EA", packs: 2 },
  ]);
  assert.equal(checkout, "https://www.atlanticsuperstore.ca/en/p/21340952_EA");
  assert.doesNotMatch(checkout, /\/cart/);
  assert.doesNotMatch(checkout, /[?&]add=/);
  const hops = checkoutHopsFor(superstore, [
    { id: "21340952_EA", packs: 1 },
    { id: "20812144001_EA", packs: 2 },
  ]);
  assert.deepEqual(hops, [
    "https://www.atlanticsuperstore.ca/en/p/21340952_EA",
    "https://www.atlanticsuperstore.ca/en/p/20812144001_EA",
  ]);
  const catalogHop = checkoutUrlFor(superstore, [
    { id: "No Name Panko:227 g:0", packs: 1, name: "panko breadcrumbs" },
  ]);
  assert.match(catalogHop, /atlanticsuperstore\.ca\/en\/search/);
  assert.match(catalogHop, /panko/i);
  assert.doesNotMatch(catalogHop, /\/cart/);
  const mixed = checkoutHopsFor(superstore, [
    { id: "No Name Panko:227 g:0", packs: 1, name: "panko breadcrumbs" },
    { id: "21340952_EA", packs: 1, name: "chicken breasts" },
  ]);
  assert.equal(mixed[0], "https://www.atlanticsuperstore.ca/en/p/21340952_EA");
  assert.match(mixed[1] ?? "", /\/en\/search/);
});

test("recipe chatter is stripped so the store finds onion, not diced onion", () => {
  assert.equal(searchQuery("yellow onion, diced"), "yellow onion");
  assert.equal(searchQuery("fresh basil (optional)"), "basil");
});

test("each cart line gets an add URL on that store", () => {
  const cart = cartForStore(
    { brand: "superstore", name: "Atlantic Superstore" },
    [{ name: "pasta", qty: 12, unit: "oz", aisle: "Pantry" }],
  );
  assert.equal(cart.items.length, 1);
  assert.match(cart.items[0]!.addUrl, /\/en\/search\?search-bar=pasta/);
});

test("guest Superstore carts are UUIDs, not SKUs", () => {
  assert.equal(isPcxCartId("3a7478a5-4a33-4d1c-b5ba-048a4d61120a"), true);
  assert.equal(isPcxCartId("21340952_EA"), false);
  assert.equal(isPcxCartId("No Name Panko"), false);
});

test("Independent is a Helios banner; Sobeys and Walmart are not", () => {
  const independent = {
    id: "ind",
    name: "Your Independent Grocer",
    brand: "independent" as const,
    lat: 47.7,
    lon: -65.7,
    km: 9,
    address: "Beresford",
    groceryUrl: groceryUrlFor("independent", "Your Independent Grocer"),
    mapsUrl: "https://maps.example",
  };
  const sobeys = FALLBACK_STORES.find((s) => s.brand === "sobeys")!;
  const walmart = FALLBACK_STORES.find((s) => s.brand === "walmart")!;
  const atlantic = FALLBACK_STORES.find((s) => s.name.includes("Atlantic"))!;
  assert.equal(pcxBannerFor(independent), "independent");
  assert.equal(pcxBannerFor(sobeys), null);
  assert.equal(pcxBannerFor(walmart), null);
  assert.equal(pcxBannerFor(atlantic), "rass");
  assert.equal(isHeliosStore(independent), true);
  assert.equal(isHeliosStore(sobeys), false);
  assert.equal(isHeliosStore(walmart), false);
  assert.equal(storeCanHoldCart(independent), true);
  assert.equal(storeCanHoldCart(sobeys), false);
  assert.equal(storeCanHoldCart(walmart), false);
  assert.match(storeCartOpenUrl(independent), /yourindependentgrocer/);
  assert.match(productSearchUrl(sobeys, "eggs"), /voila\.ca/);
  assert.match(productSearchUrl(walmart, "milk"), /walmart\.ca/);
});
