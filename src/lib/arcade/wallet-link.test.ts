import assert from "node:assert/strict";
import test from "node:test";
import {
  CHALLENGE_TTL_MS,
  isAddressShaped,
  isChallengeFresh,
  linkMessage,
  normalizeAddress,
  sameAddress,
} from "./wallet-link.ts";

const ADDR = "0x52908400098527886E0F7030069857D2E4169EE7";

test("address shape check accepts real addresses and rejects near-misses", () => {
  assert.equal(isAddressShaped(ADDR), true);
  assert.equal(isAddressShaped(ADDR.toLowerCase()), true);
  assert.equal(isAddressShaped("0x123"), false, "too short");
  assert.equal(isAddressShaped(ADDR.slice(2)), false, "missing 0x");
  assert.equal(isAddressShaped(`${ADDR}00`), false, "too long");
  assert.equal(isAddressShaped("0xZZ908400098527886E0F7030069857D2E4169EE7"), false, "non-hex");
});

test("addresses compare case-insensitively, since case is only the checksum", () => {
  assert.equal(sameAddress(ADDR, ADDR.toLowerCase()), true);
  assert.equal(normalizeAddress(`  ${ADDR}  `), ADDR.toLowerCase());
  assert.equal(sameAddress(ADDR, "0x0000000000000000000000000000000000000000"), false);
});

test("a missing address never compares equal", () => {
  assert.equal(sameAddress(null, null), false);
  assert.equal(sameAddress(ADDR, null), false);
});

test("the signed message states plainly that it moves no funds", () => {
  const message = linkMessage({
    userId: "user-1",
    address: ADDR,
    nonce: "abc123",
    issuedAt: "2026-09-16T00:00:00.000Z",
  });
  // A player must be able to read the prompt and tell it apart from an approval.
  assert.match(message, /not a transaction/);
  assert.match(message, /grants no\s*\n?\s*spending permission/);
  assert.match(message, /moves no funds/);
});

test("the message binds account, wallet, nonce and time", () => {
  const message = linkMessage({
    userId: "user-1",
    address: ADDR,
    nonce: "abc123",
    issuedAt: "2026-09-16T00:00:00.000Z",
  });
  assert.match(message, /Account:\s+user-1/);
  assert.match(message, new RegExp(`Wallet:\\s+${ADDR.toLowerCase()}`));
  assert.match(message, /Nonce:\s+abc123/);
  assert.match(message, /Issued:\s+2026-09-16T00:00:00\.000Z/);
});

test("the message is byte-identical for identical input", () => {
  // Client and server format it independently; any drift changes the recovered
  // address and breaks every link.
  const challenge = { userId: "u", address: ADDR, nonce: "n", issuedAt: "2026-09-16T00:00:00.000Z" };
  assert.equal(linkMessage(challenge), linkMessage({ ...challenge }));
  // Address casing must not change the signed bytes.
  assert.equal(linkMessage(challenge), linkMessage({ ...challenge, address: ADDR.toLowerCase() }));
});

test("a malformed address is refused before anything is signed", () => {
  assert.throws(
    () => linkMessage({ userId: "u", address: "0xnope", nonce: "n", issuedAt: "2026-09-16T00:00:00.000Z" }),
    /not an address/,
  );
});

test("challenges expire, and a future-dated one is refused", () => {
  const now = new Date("2026-09-16T12:00:00.000Z");
  const at = (ms: number) => ({ issuedAt: new Date(now.getTime() + ms).toISOString() });
  assert.equal(isChallengeFresh(at(0), now), true);
  assert.equal(isChallengeFresh(at(-CHALLENGE_TTL_MS + 1000), now), true);
  assert.equal(isChallengeFresh(at(-CHALLENGE_TTL_MS - 1000), now), false, "expired");
  assert.equal(isChallengeFresh(at(60_000), now), false, "issued in the future");
  assert.equal(isChallengeFresh({ issuedAt: "not a date" }, now), false);
});
