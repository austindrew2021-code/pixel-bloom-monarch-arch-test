import assert from "node:assert/strict";
import test from "node:test";
import {
  LAST_PAID_RANK,
  PARTICIPATION_MIN_DROPS,
  PRIZE_LADDER,
  REGISTRATION_THRESHOLD_USDC,
  type ScoreEntry,
  assignPrizes,
  compareEntries,
  isPrizeEligible,
  participationBonusRecipients,
  prizeForRank,
  rankBoard,
  seasonBounds,
  seasonId,
  totalPrizePool,
} from "./season.ts";

function entry(over: Partial<ScoreEntry> & { userId: string }): ScoreEntry {
  return {
    handle: over.userId,
    points: 0,
    dropsUsed: 0,
    reachedAt: "2026-09-10T00:00:00.000Z",
    walletAddress: "0xabc",
    prizeBlocked: false,
    ...over,
  };
}

test("the ladder covers ranks 1..20 with no gap or overlap", () => {
  const covered = new Set<number>();
  for (const band of PRIZE_LADDER) {
    for (let r = band.rankFrom; r <= band.rankTo; r += 1) {
      assert.equal(covered.has(r), false, `rank ${r} is covered twice`);
      covered.add(r);
    }
  }
  for (let r = 1; r <= LAST_PAID_RANK; r += 1) {
    assert.equal(covered.has(r), true, `rank ${r} has no prize`);
  }
  assert.equal(covered.size, LAST_PAID_RANK);
});

test("prize value never increases as rank worsens", () => {
  for (let r = 2; r <= LAST_PAID_RANK; r += 1) {
    assert.ok(prizeForRank(r)!.usdc <= prizeForRank(r - 1)!.usdc, `rank ${r} pays more than ${r - 1}`);
  }
});

test("ranks outside the ladder win no cash", () => {
  assert.equal(prizeForRank(LAST_PAID_RANK + 1), null);
  assert.equal(prizeForRank(0), null);
});

test("top ten are headline, eleven to twenty are residual", () => {
  for (let r = 1; r <= 10; r += 1) assert.equal(prizeForRank(r)!.tier, "headline");
  for (let r = 11; r <= 20; r += 1) assert.equal(prizeForRank(r)!.tier, "residual");
});

test("the season pool stays under the registration and bonding threshold", () => {
  // Crossing $5,000 in total prize value means registering the promotion and
  // posting a surety bond in NY and FL before the season opens. Keep it under
  // or do that paperwork deliberately — never by accident.
  const pool = totalPrizePool();
  assert.equal(pool, 1600);
  assert.ok(pool < REGISTRATION_THRESHOLD_USDC, `pool ${pool} now requires registration`);
});

test("more points ranks higher", () => {
  const board = rankBoard([
    entry({ userId: "b", points: 500 }),
    entry({ userId: "a", points: 900 }),
  ]);
  assert.deepEqual(board.map((e) => e.userId), ["a", "b"]);
  assert.deepEqual(board.map((e) => e.rank), [1, 2]);
});

test("on equal points, fewer drops used ranks higher", () => {
  const board = rankBoard([
    entry({ userId: "spender", points: 900, dropsUsed: 700 }),
    entry({ userId: "sharp", points: 900, dropsUsed: 100 }),
  ]);
  assert.equal(board[0]!.userId, "sharp");
});

test("on equal points and drops, reaching the score first ranks higher", () => {
  const board = rankBoard([
    entry({ userId: "late", points: 900, dropsUsed: 10, reachedAt: "2026-09-20T00:00:00.000Z" }),
    entry({ userId: "early", points: 900, dropsUsed: 10, reachedAt: "2026-09-02T00:00:00.000Z" }),
  ]);
  assert.equal(board[0]!.userId, "early");
});

test("the ordering is total, so the board is fully determined by the data", () => {
  const identical = [
    entry({ userId: "zeta", points: 100, dropsUsed: 5 }),
    entry({ userId: "alpha", points: 100, dropsUsed: 5 }),
  ];
  assert.equal(compareEntries(identical[0]!, identical[1]!) > 0, true);
  // Same input in any order produces the same board — no hidden coin flip.
  assert.deepEqual(
    rankBoard(identical).map((e) => e.userId),
    rankBoard([...identical].reverse()).map((e) => e.userId),
  );
});

test("rankBoard does not mutate the entries it is given", () => {
  const entries = [entry({ userId: "b", points: 1 }), entry({ userId: "a", points: 2 })];
  rankBoard(entries);
  assert.deepEqual(entries.map((e) => e.userId), ["b", "a"]);
});

test("prizes go down the board in rank order", () => {
  const board = rankBoard(
    Array.from({ length: 25 }, (_, i) => entry({ userId: `p${i}`, points: 10_000 - i })),
  );
  const awards = assignPrizes(board);
  assert.equal(awards.length, LAST_PAID_RANK);
  assert.equal(awards[0]!.usdc, 500);
  assert.equal(awards[0]!.userId, "p0");
  assert.equal(awards[19]!.usdc, 25);
  assert.equal(awards.reduce((sum, a) => sum + a.usdc, 0), totalPrizePool());
});

test("entrants without a payout wallet are skipped and everyone below moves up", () => {
  const board = rankBoard([
    entry({ userId: "nowallet", points: 900, walletAddress: null }),
    entry({ userId: "second", points: 800 }),
  ]);
  const awards = assignPrizes(board);
  // Top of the board, but unpayable — so the ladder's first place goes to the
  // next eligible entrant rather than going unclaimed.
  assert.equal(awards.length, 1);
  assert.equal(awards[0]!.userId, "second");
  assert.equal(awards[0]!.rank, 1);
  assert.equal(awards[0]!.usdc, 500);
});

test("accounts excluded from prizes are skipped too", () => {
  const board = rankBoard([
    entry({ userId: "dupe", points: 900, prizeBlocked: true }),
    entry({ userId: "clean", points: 800 }),
  ]);
  const awards = assignPrizes(board);
  assert.deepEqual(awards.map((a) => a.userId), ["clean"]);
  assert.equal(isPrizeEligible(entry({ userId: "x", prizeBlocked: true })), false);
  assert.equal(isPrizeEligible(entry({ userId: "x", walletAddress: null })), false);
});

test("a short field simply pays fewer places — prizes are never inflated", () => {
  const board = rankBoard([entry({ userId: "only", points: 10 })]);
  const awards = assignPrizes(board);
  assert.equal(awards.length, 1);
  // The lone entrant wins first place at its published value, not the pool.
  assert.equal(awards[0]!.usdc, 500);
});

test("an empty season awards nothing", () => {
  assert.deepEqual(assignPrizes(rankBoard([])), []);
});

test("the participation bonus reaches active players outside the ladder", () => {
  const board = rankBoard([
    ...Array.from({ length: 20 }, (_, i) => entry({ userId: `top${i}`, points: 9000 - i, dropsUsed: 100 })),
    entry({ userId: "grinder", points: 500, dropsUsed: PARTICIPATION_MIN_DROPS }),
    entry({ userId: "tourist", points: 400, dropsUsed: PARTICIPATION_MIN_DROPS - 1 }),
    entry({ userId: "banned", points: 450, dropsUsed: 900, prizeBlocked: true }),
  ]);
  const recipients = participationBonusRecipients(board, assignPrizes(board));
  const ids = recipients.map((r) => r.userId);
  assert.ok(ids.includes("grinder"), "an active player outside the top 20 gets the bonus");
  assert.ok(!ids.includes("tourist"), "below the activity threshold");
  assert.ok(!ids.includes("banned"), "excluded accounts get nothing");
  assert.ok(!ids.includes("top0"), "cash winners are not double-paid");
});

test("a player with no wallet still earns the non-cash participation bonus", () => {
  // The bonus is bonus drops, not money, so it needs no payout address.
  const board = rankBoard([
    entry({ userId: "anon", points: 10, dropsUsed: PARTICIPATION_MIN_DROPS, walletAddress: null }),
  ]);
  const recipients = participationBonusRecipients(board, assignPrizes(board));
  assert.deepEqual(recipients.map((r) => r.userId), ["anon"]);
});

test("season ids and bounds line up with UTC calendar months", () => {
  assert.equal(seasonId(new Date("2026-09-16T12:00:00Z")), "2026-09");
  const { opensAt, closesAt } = seasonBounds("2026-09");
  assert.equal(opensAt.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(closesAt.toISOString(), "2026-10-01T00:00:00.000Z");
  // December must roll into the next year, not month 13.
  assert.equal(seasonBounds("2026-12").closesAt.toISOString(), "2027-01-01T00:00:00.000Z");
});

test("seasonBounds rejects a malformed id", () => {
  assert.throws(() => seasonBounds("2026-13"), /invalid season month/);
  assert.throws(() => seasonBounds("nope"), /invalid season id/);
});
