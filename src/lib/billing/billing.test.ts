import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { ADDONS } from "../recipes.ts";
import { BILLABLE, billableFor, isBillable } from "./catalog.ts";

function sign(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

async function withSecret<T>(secret: string, run: () => Promise<T> | T): Promise<T> {
  const prev = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    return await run();
  } finally {
    if (prev === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = prev;
  }
}

test("every priced extra can actually be bought", () => {
  const unsellable = ADDONS.filter((a) => a.price > 0 && !isBillable(a.id)).map((a) => `${a.name} (${a.id})`);
  assert.deepEqual(unsellable, [], `priced but no way to pay:\n${unsellable.join("\n")}`);
});

test("nothing free is wired to a till", () => {
  const freeButBillable = BILLABLE.filter((b) => {
    const addon = ADDONS.find((a) => a.id === b.id);
    return addon ? addon.price === 0 : false;
  }).map((b) => b.id);
  assert.deepEqual(freeButBillable, []);
});

test("plate packs are consumables carrying the plates they advertise", () => {
  assert.equal(billableFor("plates-15")?.plates, 15);
  assert.equal(billableFor("plates-40")?.plates, 40);
  assert.equal(billableFor("sos-3")?.plates, 3);
  for (const id of ["plates-15", "plates-40", "sos-3"]) {
    assert.equal(billableFor(id)?.kind, "consumable", id);
  }
});

test("the monthly kitchens are subscriptions, the lifetime ones are not", () => {
  for (const id of ["kitchen-table", "chef-plus", "family", "trainer"]) {
    assert.equal(billableFor(id)?.kind, "subscription", id);
  }
  for (const id of ["founder", "table-year", "team-kitchen"]) {
    assert.equal(billableFor(id)?.kind, "once", id);
  }
});

test("each billable extra has its own price env var", () => {
  const seen = new Set<string>();
  for (const b of BILLABLE) {
    assert.match(b.priceEnv, /^STRIPE_PRICE_[A-Z0-9_]+$/, b.id);
    assert.equal(seen.has(b.priceEnv), false, `${b.priceEnv} is used twice`);
    seen.add(b.priceEnv);
  }
});

test("a real Stripe signature verifies", async () => {
  const { verifyWebhook } = await import("./stripe.server.ts");
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  await withSecret("whsec_test", () => {
    assert.equal(verifyWebhook(body, sign(body, "whsec_test")).ok, true);
  });
});

test("a forged or tampered delivery is refused", async () => {
  const { verifyWebhook } = await import("./stripe.server.ts");
  const body = JSON.stringify({ id: "evt_2", type: "checkout.session.completed" });
  await withSecret("whsec_test", () => {
    // Signed with the wrong secret.
    assert.equal(verifyWebhook(body, sign(body, "whsec_other")).ok, false);
    // Signed correctly, then the body was edited.
    const header = sign(body, "whsec_test");
    assert.equal(verifyWebhook(`${body} `, header).ok, false);
    // No signature at all.
    assert.equal(verifyWebhook(body, "").ok, false);
    assert.equal(verifyWebhook(body, "t=1,v1=notevenhex").ok, false);
  });
});

test("a captured delivery cannot be replayed later", async () => {
  const { verifyWebhook } = await import("./stripe.server.ts");
  const body = JSON.stringify({ id: "evt_3", type: "checkout.session.completed" });
  await withSecret("whsec_test", () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    assert.equal(verifyWebhook(body, sign(body, "whsec_test", old)).ok, false);
  });
});

test("no secret configured means no delivery is ever trusted", async () => {
  const { verifyWebhook } = await import("./stripe.server.ts");
  const body = "{}";
  const prev = process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  try {
    assert.equal(verifyWebhook(body, sign(body, "whsec_test")).ok, false);
  } finally {
    if (prev !== undefined) process.env.STRIPE_WEBHOOK_SECRET = prev;
  }
});

test("card payments stay off until a key is present", async () => {
  const { stripeConfigured } = await import("./stripe.server.ts");
  const prev = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  try {
    assert.equal(stripeConfigured(), false);
    process.env.STRIPE_SECRET_KEY = "   ";
    assert.equal(stripeConfigured(), false, "whitespace is not a key");
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    assert.equal(stripeConfigured(), true);
  } finally {
    if (prev === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = prev;
  }
});

test("a junk payload parses to nothing rather than throwing", async () => {
  const { parseEvent } = await import("./stripe.server.ts");
  assert.equal(parseEvent("not json"), null);
  assert.equal(parseEvent("{}"), null);
  assert.equal(parseEvent(JSON.stringify({ id: "evt_9", type: "x", data: { object: {} } }))?.id, "evt_9");
});
