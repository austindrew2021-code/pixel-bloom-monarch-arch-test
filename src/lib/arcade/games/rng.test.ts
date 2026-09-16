import assert from "node:assert/strict";
import test from "node:test";
import { SeedStream, createStream } from "./rng.ts";

const bytes = (n: number) => Array.from({ length: n }, (_, i) => (i * 37 + 11) % 256);

test("the stream reads bytes in order and tracks its position", () => {
  const s = new SeedStream([1, 2, 3]);
  assert.equal(s.used, 0);
  assert.equal(s.nextByte(), 1);
  assert.equal(s.nextByte(), 2);
  assert.equal(s.used, 2);
  assert.equal(s.remaining, 1);
});

test("running out of bytes throws rather than silently reusing them", () => {
  // A stream that wrapped around would produce outcomes nobody could verify.
  const s = new SeedStream([1]);
  s.nextByte();
  assert.throws(() => s.nextByte(), /exhausted/);
});

test("nextUint32 packs four bytes big-endian", () => {
  assert.equal(new SeedStream([0, 0, 0, 0]).nextUint32(), 0);
  assert.equal(new SeedStream([255, 255, 255, 255]).nextUint32(), 4294967295);
  assert.equal(new SeedStream([0, 0, 1, 0]).nextUint32(), 256);
});

test("nextFloat stays in [0, 1)", () => {
  assert.equal(new SeedStream([0, 0, 0, 0]).nextFloat(), 0);
  const max = new SeedStream([255, 255, 255, 255]).nextFloat();
  assert.ok(max < 1 && max > 0.9999999);
});

test("nextInt rejects invalid bounds and handles the single-value case", () => {
  const s = new SeedStream(bytes(64));
  assert.equal(s.nextInt(1), 0);
  assert.equal(s.used, 0, "a one-value range should not consume entropy");
  assert.throws(() => s.nextInt(0), /positive integer/);
  assert.throws(() => s.nextInt(2.5), /positive integer/);
});

test("nextInt is unbiased across a range that does not divide 2^32", () => {
  // Modulo over a raw draw would skew toward low values; rejection sampling
  // must not. Three is the classic case that exposes it.
  const counts = [0, 0, 0];
  const s = new SeedStream(bytes(200_000));
  for (let i = 0; i < 40_000; i += 1) counts[s.nextInt(3)] += 1;
  for (const count of counts) {
    const share = count / 40_000;
    assert.ok(share > 0.31 && share < 0.355, `share ${share} is skewed`);
  }
});

test("nextInt never returns a value outside its range", () => {
  const s = new SeedStream(bytes(80_000));
  for (let i = 0; i < 10_000; i += 1) {
    const v = s.nextInt(7);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 7, `out of range: ${v}`);
  }
});

test("nextWeighted follows its weights", () => {
  const s = new SeedStream(bytes(200_000));
  const counts = [0, 0, 0];
  for (let i = 0; i < 30_000; i += 1) counts[s.nextWeighted([70, 20, 10])] += 1;
  assert.ok(Math.abs(counts[0]! / 30_000 - 0.7) < 0.02);
  assert.ok(Math.abs(counts[1]! / 30_000 - 0.2) < 0.02);
  assert.ok(Math.abs(counts[2]! / 30_000 - 0.1) < 0.02);
});

test("nextWeighted rejects a degenerate weight set", () => {
  assert.throws(() => new SeedStream(bytes(8)).nextWeighted([0, 0]), /positive/);
});

test("a stream is reproducible from the same seeds and nonce", async () => {
  const a = await createStream("server", "client", 3, 64);
  const b = await createStream("server", "client", 3, 64);
  const drawA = Array.from({ length: 10 }, () => a.nextInt(1000));
  const drawB = Array.from({ length: 10 }, () => b.nextInt(1000));
  assert.deepEqual(drawA, drawB);
});

test("changing the nonce changes the stream", async () => {
  const a = await createStream("server", "client", 3, 64);
  const b = await createStream("server", "client", 4, 64);
  assert.notDeepEqual(
    Array.from({ length: 8 }, () => a.nextInt(1000)),
    Array.from({ length: 8 }, () => b.nextInt(1000)),
  );
});
