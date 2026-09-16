import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  DROPS_PER_REWARDED_AD,
  FREE_DROPS_PER_DAY,
  MAX_BONUS_DROPS_PER_DAY,
  MAX_DROPS_PER_DAY,
} from "./allowance.ts";
import {
  addScore,
  claimAdBonus,
  claimDrop,
  claimNonce,
  consumeChallenge,
  recordDrop,
} from "./queries.ts";
import type { Sql } from "@/lib/db";

/**
 * These run against a real embedded Postgres, not a mock, because the
 * behaviour under test *is* Postgres behaviour: conditional ON CONFLICT
 * updates, row locking, and the constraints in the migration. A mock would
 * happily agree with a broken query.
 */

let pg: PGlite;
let sql: Sql;

const SEASON = "2026-09";
const DAY = "2026-09-16";

before(async () => {
  pg = new PGlite();
  await pg.waitReady;
  await pg.exec(readFileSync("migrations/0003_arcade.sql", "utf8"));
  await pg.query(
    `insert into seasons (id, opens_at, closes_at, server_seed_hash)
     values ($1, '2026-09-01', '2026-10-01', 'deadbeef')`,
    [SEASON],
  );

  const run = async <T>(text: string, params: unknown[]) => {
    const res = await pg.query<T>(text, params);
    return res.rows;
  };
  const tagged = (async <T>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  tagged.query = <T>(text: string, params: unknown[] = []) => run<T>(text, params);
  sql = tagged;
});

after(async () => {
  await pg.close();
});

let seq = 0;
const freshUser = () => `user-${(seq += 1)}`;

async function player(userId: string, wallet: string | null = null) {
  await sql`
    insert into players (user_id, handle, wallet_address)
    values (${userId}, ${`h-${userId}`}, ${wallet})
  `;
}

test("the first drop of the day opens the budget at one used", async () => {
  const user = freshUser();
  const claimed = await claimDrop(sql, user, SEASON, DAY);
  assert.deepEqual(claimed, { used: 1, bonus_granted: 0 });
});

test("the free budget runs out after exactly the daily allowance", async () => {
  const user = freshUser();
  for (let i = 1; i <= FREE_DROPS_PER_DAY; i += 1) {
    const claimed = await claimDrop(sql, user, SEASON, DAY);
    assert.equal(claimed?.used, i, `drop ${i} should have been allowed`);
  }
  assert.equal(
    await claimDrop(sql, user, SEASON, DAY),
    null,
    "the budget must refuse the drop past the daily allowance",
  );
});

test("concurrent drops cannot both spend the last drop of the day", async () => {
  // The whole point of the conditional UPDATE. If this ever returns two
  // non-null claims, a player can double-spend their budget.
  const user = freshUser();
  for (let i = 0; i < FREE_DROPS_PER_DAY - 1; i += 1) await claimDrop(sql, user, SEASON, DAY);

  const results = await Promise.all([
    claimDrop(sql, user, SEASON, DAY),
    claimDrop(sql, user, SEASON, DAY),
    claimDrop(sql, user, SEASON, DAY),
  ]);
  const granted = results.filter((r) => r !== null);
  assert.equal(granted.length, 1, "exactly one of three racing claims may win");

  const rows = await sql<{ used: number }>`
    select used from drop_allowance where user_id = ${user} and day = ${DAY}
  `;
  assert.equal(rows[0]?.used, FREE_DROPS_PER_DAY);
});

test("a rewarded video extends the budget and play resumes", async () => {
  const user = freshUser();
  for (let i = 0; i < FREE_DROPS_PER_DAY; i += 1) await claimDrop(sql, user, SEASON, DAY);
  assert.equal(await claimDrop(sql, user, SEASON, DAY), null);

  const bonus = await claimAdBonus(sql, user, SEASON, DAY);
  assert.equal(bonus?.bonus_granted, DROPS_PER_REWARDED_AD);

  for (let i = 0; i < DROPS_PER_REWARDED_AD; i += 1) {
    assert.ok(await claimDrop(sql, user, SEASON, DAY), `bonus drop ${i} should be allowed`);
  }
  assert.equal(await claimDrop(sql, user, SEASON, DAY), null, "bonus is spent");
});

test("repeated ad callbacks clamp at the ceiling instead of stacking", async () => {
  const user = freshUser();
  for (let i = 0; i < 40; i += 1) await claimAdBonus(sql, user, SEASON, DAY);
  const rows = await sql<{ bonus_granted: number }>`
    select bonus_granted from drop_allowance where user_id = ${user} and day = ${DAY}
  `;
  assert.equal(rows[0]?.bonus_granted, MAX_BONUS_DROPS_PER_DAY);
  assert.equal(await claimAdBonus(sql, user, SEASON, DAY), null, "past the ceiling is a no-op");
});

test("a fully boosted day still caps total drops", async () => {
  const user = freshUser();
  for (let i = 0; i < 10; i += 1) await claimAdBonus(sql, user, SEASON, DAY);
  let allowed = 0;
  while (await claimDrop(sql, user, SEASON, DAY)) allowed += 1;
  assert.equal(allowed, MAX_DROPS_PER_DAY);
});

test("the budget is per day, so a new day starts fresh", async () => {
  const user = freshUser();
  for (let i = 0; i < FREE_DROPS_PER_DAY; i += 1) await claimDrop(sql, user, SEASON, DAY);
  assert.equal(await claimDrop(sql, user, SEASON, DAY), null);
  assert.ok(await claimDrop(sql, user, SEASON, "2026-09-17"), "the next day is a clean budget");
});

test("nonces start at zero and never repeat, even when claimed concurrently", async () => {
  const user = freshUser();
  const first = await claimNonce(sql, user, SEASON, "seed-a");
  assert.equal(first.nonce - 1, 0, "the first drop of a season derives at nonce 0");
  // The seed is set once and not overwritten by later drops.
  assert.equal(first.client_seed, "seed-a");

  const claimed = await Promise.all(
    Array.from({ length: 12 }, () => claimNonce(sql, user, SEASON, "ignored")),
  );
  const nonces = claimed.map((c) => c.nonce);
  assert.equal(new Set(nonces).size, nonces.length, "a repeated nonce would replay a drop");
  assert.equal(Math.max(...nonces), 13);
  assert.ok(claimed.every((c) => c.client_seed === "seed-a"));
});

test("drops accumulate into the season score", async () => {
  const user = freshUser();
  const first = await addScore(sql, user, SEASON, 100);
  assert.deepEqual(first, { points: 100, drops_used: 1 });
  const second = await addScore(sql, user, SEASON, 4100);
  assert.deepEqual(second, { points: 4200, drops_used: 2 });
});

test("concurrent scoring drops all land — no lost update", async () => {
  const user = freshUser();
  await Promise.all(Array.from({ length: 25 }, () => addScore(sql, user, SEASON, 30)));
  const rows = await sql<{ points: number; drops_used: number }>`
    select points, drops_used from season_scores where user_id = ${user} and season_id = ${SEASON}
  `;
  assert.equal(rows[0]?.points, 750);
  assert.equal(rows[0]?.drops_used, 25);
});

test("the drop ledger rejects a duplicate nonce rather than double-recording", async () => {
  const user = freshUser();
  const drop = {
    id: "drop-a",
    userId: user,
    seasonId: SEASON,
    nonce: 0,
    clientSeed: "cs",
    rows: 16,
    slot: 8,
    path: "1".repeat(8) + "0".repeat(8),
    points: 30,
  };
  await recordDrop(sql, drop);
  await recordDrop(sql, { ...drop, id: "drop-b", points: 10000 });
  const rows = await sql<{ points: number }>`
    select points from drops where user_id = ${user} and season_id = ${SEASON}
  `;
  assert.equal(rows.length, 1, "the same nonce must not produce two ledger rows");
  assert.equal(rows[0]?.points, 30, "the original result stands");
});

test("the ledger refuses a slot outside the board", async () => {
  await assert.rejects(
    () =>
      recordDrop(sql, {
        id: "bad", userId: freshUser(), seasonId: SEASON, nonce: 0, clientSeed: "cs",
        rows: 16, slot: 99, path: "0".repeat(16), points: 30,
      }),
    /violates check constraint/,
  );
});

test("one wallet cannot back two accounts", async () => {
  const wallet = "0x1111111111111111111111111111111111111111";
  await player(freshUser(), wallet);
  await assert.rejects(
    () => player(freshUser(), wallet),
    /duplicate key|unique/i,
    "wallet uniqueness is the primary anti-sybil control",
  );
});

test("accounts without a wallet do not collide with each other", async () => {
  // A unique index over a nullable column must still allow many NULLs.
  await player(freshUser(), null);
  await player(freshUser(), null);
});

test("a signing challenge is single-use, so a signature cannot be replayed", async () => {
  const user = freshUser();
  await sql`
    insert into wallet_challenges (nonce, user_id, address, expires_at)
    values ('nonce-1', ${user}, '0xabc', now() + interval '10 minutes')
  `;
  const first = await consumeChallenge(sql, "nonce-1", user);
  assert.equal(first?.address, "0xabc");
  assert.equal(
    await consumeChallenge(sql, "nonce-1", user),
    null,
    "a replayed signature must find the challenge already spent",
  );
});

test("an expired challenge is refused", async () => {
  const user = freshUser();
  await sql`
    insert into wallet_challenges (nonce, user_id, address, expires_at)
    values ('nonce-old', ${user}, '0xabc', now() - interval '1 minute')
  `;
  assert.equal(await consumeChallenge(sql, "nonce-old", user), null);
});

test("a challenge cannot be consumed by a different account", async () => {
  const owner = freshUser();
  await sql`
    insert into wallet_challenges (nonce, user_id, address, expires_at)
    values ('nonce-2', ${owner}, '0xabc', now() + interval '10 minutes')
  `;
  assert.equal(await consumeChallenge(sql, "nonce-2", freshUser()), null);
  assert.ok(await consumeChallenge(sql, "nonce-2", owner), "the owner can still use it");
});

test("an open season stores its seed but cannot be marked revealed", async () => {
  // Storing is required — drops derive from the seed while the season runs.
  await sql`update seasons set server_seed = 'secret' where id = ${SEASON}`;
  // Disclosing is not, until the season stops accepting drops. The schema
  // enforces that, not just the code that reads it.
  await assert.rejects(
    () => sql`update seasons set revealed_at = now() where id = ${SEASON}`,
    /violates check constraint/,
  );
  await sql`update seasons set status = 'closed', revealed_at = now() where id = ${SEASON}`;
  const rows = await sql<{ revealed_at: string | null }>`
    select revealed_at from seasons where id = ${SEASON}
  `;
  assert.ok(rows[0]?.revealed_at, "a closed season may be revealed");
});

test("opening a season stores the seed alongside its commitment", async () => {
  // Regression: an earlier constraint forbade storing the seed on an open
  // season, which made it impossible to open one at all.
  await sql`
    insert into seasons (id, opens_at, closes_at, server_seed_hash, server_seed, status)
    values ('2026-10', '2026-10-01', '2026-11-01', 'hash-abc', 'seed-abc', 'open')
  `;
  const rows = await sql<{ server_seed: string; status: string }>`
    select server_seed, status from seasons where id = '2026-10'
  `;
  assert.equal(rows[0]?.server_seed, 'seed-abc');
  assert.equal(rows[0]?.status, 'open');
});
