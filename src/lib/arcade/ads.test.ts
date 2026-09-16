import assert from "node:assert/strict";
import test from "node:test";
import {
  AD_TOKEN_TTL_MS,
  PLACEMENTS,
  callbackMessage,
  isPlacement,
  readCallback,
  rewardFor,
  signPayload,
  ssvRequired,
  timingSafeEqual,
  verifySharedSecretSignature,
} from "./ads.ts";
import { DROPS_PER_REWARDED_AD } from "./allowance.ts";

const base = { token: "tok", provider: "unity", transaction_id: "txn-1", signature: "sig" };

test("placements are known and carry the standard reward", () => {
  assert.equal(isPlacement("out-of-drops"), true);
  assert.equal(isPlacement("made-up"), false);
  assert.equal(rewardFor("out-of-drops"), DROPS_PER_REWARDED_AD);
  // An unknown placement must reward nothing rather than defaulting to a grant.
  assert.equal(rewardFor("made-up"), 0);
  for (const placement of Object.values(PLACEMENTS)) {
    assert.ok(placement.reward > 0);
  }
});

test("verification is required exactly when a secret is configured", () => {
  // Keyed off the secret's presence so shipping without configuring
  // verification cannot silently leave the unverified path open.
  assert.equal(ssvRequired({ AD_SSV_SECRET: "s3cret" }), true);
  assert.equal(ssvRequired({}), false);
  assert.equal(ssvRequired({ AD_SSV_SECRET: "" }), false);
});

test("a well-formed callback is accepted", () => {
  const verdict = readCallback(base, { requireSignature: true });
  assert.equal(verdict.ok, true);
  assert.equal(verdict.ok && verdict.params.transactionId, "txn-1");
});

test("callbacks missing required fields are refused", () => {
  for (const missing of ["token", "provider", "transaction_id"] as const) {
    const query: Record<string, string | undefined> = { ...base };
    delete query[missing];
    const verdict = readCallback(query, { requireSignature: true });
    assert.equal(verdict.ok, false, `${missing} should be required`);
  }
});

test("a signature is required when verification is on and optional when off", () => {
  const unsigned = { ...base, signature: undefined };
  assert.equal(readCallback(unsigned, { requireSignature: true }).ok, false);
  assert.equal(readCallback(unsigned, { requireSignature: false }).ok, true);
});

test("either transaction id spelling is accepted", () => {
  const verdict = readCallback(
    { token: "t", provider: "admob", txn_id: "abc" },
    { requireSignature: false },
  );
  assert.equal(verdict.ok && verdict.params.transactionId, "abc");
});

test("revenue is optional but must be sane when present", () => {
  assert.equal(
    readCallback({ ...base, revenue: "0.0042" }, { requireSignature: true }).ok,
    true,
  );
  for (const bad of ["-1", "abc", "NaN", "Infinity"]) {
    const verdict = readCallback({ ...base, revenue: bad }, { requireSignature: true });
    assert.equal(verdict.ok, false, `revenue "${bad}" should be refused`);
  }
  // Absent and empty both mean "not reported", not "zero".
  assert.equal(
    readCallback({ ...base, revenue: "" }, { requireSignature: true }).ok && true,
    true,
  );
});

test("a valid shared-secret signature verifies", async () => {
  const params = {
    token: "tok",
    provider: "unity",
    transactionId: "txn-1",
    signature: await signPayload("secret", callbackMessage({
      token: "tok", provider: "unity", transactionId: "txn-1",
    })),
  };
  assert.equal(await verifySharedSecretSignature("secret", params), true);
});

test("a forged or wrong-secret signature is rejected", async () => {
  const message = callbackMessage({ token: "tok", provider: "unity", transactionId: "txn-1" });
  const params = {
    token: "tok",
    provider: "unity",
    transactionId: "txn-1",
    signature: await signPayload("the-real-secret", message),
  };
  assert.equal(await verifySharedSecretSignature("a-different-secret", params), false);
  assert.equal(
    await verifySharedSecretSignature("the-real-secret", { ...params, signature: "deadbeef" }),
    false,
  );
  assert.equal(
    await verifySharedSecretSignature("the-real-secret", { ...params, signature: undefined }),
    false,
  );
});

test("a signature for a different transaction does not transfer", async () => {
  // Otherwise one genuine impression could be replayed under fresh ids.
  const secret = "secret";
  const signature = await signPayload(secret, callbackMessage({
    token: "tok", provider: "unity", transactionId: "txn-1",
  }));
  assert.equal(
    await verifySharedSecretSignature(secret, {
      token: "tok", provider: "unity", transactionId: "txn-2", signature,
    }),
    false,
  );
});

test("the signed message binds provider, token and transaction together", () => {
  const a = callbackMessage({ token: "t", provider: "unity", transactionId: "1" });
  const b = callbackMessage({ token: "t", provider: "admob", transactionId: "1" });
  const c = callbackMessage({ token: "t", provider: "unity", transactionId: "2" });
  assert.notEqual(a, b);
  assert.notEqual(a, c);
});

test("signature comparison is length-safe and value-correct", () => {
  assert.equal(timingSafeEqual("abc", "abc"), true);
  assert.equal(timingSafeEqual("abc", "abd"), false);
  assert.equal(timingSafeEqual("abc", "abcd"), false);
  assert.equal(timingSafeEqual("", ""), true);
});

test("the token window is long enough to watch a video but not to sit on", () => {
  assert.ok(AD_TOKEN_TTL_MS >= 5 * 60_000);
  assert.ok(AD_TOKEN_TTL_MS <= 60 * 60_000);
});
