import assert from "node:assert/strict";
import test from "node:test";
import {
  bytesToPath,
  commitServerSeed,
  deriveBytes,
  randomSeed,
  sha256Hex,
  verifyCommitment,
} from "./fair.ts";

test("sha256Hex matches known vectors", async () => {
  assert.equal(
    await sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("a revealed seed verifies against its published commitment", async () => {
  const seed = randomSeed();
  const published = await commitServerSeed(seed);
  assert.equal(await verifyCommitment(seed, published), true);
  // Case and stray whitespace from a copy-paste must still verify.
  assert.equal(await verifyCommitment(seed, `  ${published.toUpperCase()}  `), true);
});

test("a substituted seed fails the commitment — this is the tamper check", async () => {
  const published = await commitServerSeed("the-seed-we-committed-to");
  assert.equal(await verifyCommitment("a-different-seed", published), false);
});

test("derivation is deterministic for the same seeds and nonce", async () => {
  const a = await deriveBytes("server", "client", 7, 16);
  const b = await deriveBytes("server", "client", 7, 16);
  assert.deepEqual(a, b);
});

test("changing any input changes the derived bytes", async () => {
  const base = await deriveBytes("server", "client", 7, 16);
  assert.notDeepEqual(await deriveBytes("server2", "client", 7, 16), base);
  assert.notDeepEqual(await deriveBytes("server", "client2", 7, 16), base);
  assert.notDeepEqual(await deriveBytes("server", "client", 8, 16), base);
});

test("deriveBytes returns exactly the requested count, across HMAC block boundaries", async () => {
  for (const count of [1, 16, 32, 33, 64, 100]) {
    const bytes = await deriveBytes("s", "c", 0, count);
    assert.equal(bytes.length, count, `count ${count}`);
    assert.ok(
      bytes.every((b) => Number.isInteger(b) && b >= 0 && b <= 255),
      `count ${count} produced a non-byte`,
    );
  }
});

test("chained blocks do not repeat the first block", async () => {
  // A cursor bug would make bytes 32..63 identical to bytes 0..31.
  const bytes = await deriveBytes("s", "c", 0, 64);
  assert.notDeepEqual(bytes.slice(0, 32), bytes.slice(32, 64));
});

test("deriveBytes rejects invalid arguments rather than guessing", async () => {
  await assert.rejects(() => deriveBytes("s", "c", -1, 16), /non-negative/);
  await assert.rejects(() => deriveBytes("s", "c", 1.5, 16), /non-negative/);
  await assert.rejects(() => deriveBytes("s", "c", 0, 0), /positive/);
});

test("bytesToPath uses the low bit, giving an unbiased coin", () => {
  assert.equal(bytesToPath([0, 1, 2, 3, 254, 255]), "010101");
});

test("derived bits are close to an even split over many drops", async () => {
  // Guards against a derivation bug that skews every board toward one side.
  let ones = 0;
  let total = 0;
  for (let nonce = 0; nonce < 400; nonce += 1) {
    const path = bytesToPath(await deriveBytes("balance-seed", "player", nonce, 16));
    for (const bit of path) {
      if (bit === "1") ones += 1;
      total += 1;
    }
  }
  const ratio = ones / total;
  assert.ok(ratio > 0.45 && ratio < 0.55, `bit ratio ${ratio} is skewed`);
});

test("randomSeed returns 32 bytes of hex and does not repeat", () => {
  const seeds = new Set(Array.from({ length: 50 }, () => randomSeed()));
  assert.equal(seeds.size, 50);
  for (const seed of seeds) assert.match(seed, /^[0-9a-f]{64}$/);
});
