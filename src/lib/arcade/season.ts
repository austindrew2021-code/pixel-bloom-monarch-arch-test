/**
 * Season ranking and the published prize ladder.
 *
 * Two rules govern everything here, and both come straight from what keeps a
 * prize promotion lawful:
 *
 *   1. **Prizes are fixed in advance.** The ladder below is written into
 *      `season_prizes` when a season opens and never varies with how many
 *      people enter or how much they play. A prize pool that grew with
 *      participation would be funded by entrants, which is the line between a
 *      sweepstakes and a pooled wager.
 *   2. **Ties are broken by a published, deterministic rule**, never by a
 *      coin flip behind the scenes — so any entrant can recompute the final
 *      board themselves from the season's own data.
 */

export type PrizeTier = "headline" | "residual";

export type PrizeBand = {
  rankFrom: number;
  rankTo: number;
  tier: PrizeTier;
  usdc: number;
};

/**
 * The monthly ladder: ten headline places, ten residual places beneath them.
 *
 * Total is deliberately held at $1,600 — comfortably under the $5,000 total
 * prize value that triggers sweepstakes registration and surety bonding in New
 * York and Florida. Raising any band above that line means registering and
 * bonding the promotion before the season opens, so the total is asserted in
 * the tests to stop it drifting over by accident.
 */
export const PRIZE_LADDER: readonly PrizeBand[] = [
  { rankFrom: 1, rankTo: 1, tier: "headline", usdc: 500 },
  { rankFrom: 2, rankTo: 2, tier: "headline", usdc: 250 },
  { rankFrom: 3, rankTo: 3, tier: "headline", usdc: 150 },
  { rankFrom: 4, rankTo: 5, tier: "headline", usdc: 100 },
  { rankFrom: 6, rankTo: 10, tier: "headline", usdc: 50 },
  { rankFrom: 11, rankTo: 20, tier: "residual", usdc: 25 },
];

/** The value above which NY and FL require registration and a surety bond. */
export const REGISTRATION_THRESHOLD_USDC = 5000;

/** Lowest rank that receives a cash prize. */
export const LAST_PAID_RANK = 20;

/**
 * Drops needed in a season to qualify for the non-cash participation bonus.
 * Reachable in two days of the free baseline alone, so it gates out inactive
 * accounts without asking anyone to spend anything.
 */
export const PARTICIPATION_MIN_DROPS = 50;

/** Bonus drops granted next season to everyone who qualifies. */
export const PARTICIPATION_BONUS_DROPS = 50;

export function prizeForRank(rank: number): PrizeBand | null {
  return PRIZE_LADDER.find((b) => rank >= b.rankFrom && rank <= b.rankTo) ?? null;
}

/** Total cash committed for one season. */
export function totalPrizePool(): number {
  return PRIZE_LADDER.reduce(
    (sum, b) => sum + b.usdc * (b.rankTo - b.rankFrom + 1),
    0,
  );
}

export type ScoreEntry = {
  userId: string;
  handle: string;
  points: number;
  dropsUsed: number;
  /** When the player first reached their current total. ISO timestamp. */
  reachedAt: string;
  /** Prizes are paid on-chain, so a verified payout address is required. */
  walletAddress: string | null;
  /** Set when an account is excluded from prizes (duplicate, automation). */
  prizeBlocked: boolean;
};

export type RankedEntry = ScoreEntry & { rank: number };

/**
 * The published tie-break, applied in order:
 *
 *   1. More points.
 *   2. Fewer drops used — reaching the same score on less of your budget
 *      ranks higher.
 *   3. Reached the score earlier.
 *   4. Account id, ascending.
 *
 * Step 4 is never a judgement call, only a guarantee: it makes the ordering
 * total, so the board is fully determined by the data and two observers always
 * compute the same result.
 */
export function compareEntries(a: ScoreEntry, b: ScoreEntry): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.dropsUsed !== b.dropsUsed) return a.dropsUsed - b.dropsUsed;
  if (a.reachedAt !== b.reachedAt) return a.reachedAt < b.reachedAt ? -1 : 1;
  return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
}

/** Order the board for display. Every entrant appears, ranked 1..n. */
export function rankBoard(entries: readonly ScoreEntry[]): RankedEntry[] {
  return [...entries]
    .sort(compareEntries)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function isPrizeEligible(entry: ScoreEntry): boolean {
  return !entry.prizeBlocked && !!entry.walletAddress;
}

export type PrizeAward = {
  userId: string;
  handle: string;
  /** Position on the paid ladder, 1..20. Not the same as board rank. */
  rank: number;
  tier: PrizeTier;
  usdc: number;
  walletAddress: string;
};

/**
 * Walk the ranked board and assign the ladder to eligible entrants.
 *
 * Entrants without a verified payout wallet, and accounts excluded from prizes,
 * are skipped and everyone below them moves up — the standard promotional rule,
 * and the one stated in the official rules. An award's `rank` is therefore its
 * position on the ladder, which can differ from its position on the board.
 */
export function assignPrizes(ranked: readonly RankedEntry[]): PrizeAward[] {
  const awards: PrizeAward[] = [];
  let ladderRank = 1;
  for (const entry of ranked) {
    if (ladderRank > LAST_PAID_RANK) break;
    if (!isPrizeEligible(entry)) continue;
    const band = prizeForRank(ladderRank);
    if (!band) break;
    awards.push({
      userId: entry.userId,
      handle: entry.handle,
      rank: ladderRank,
      tier: band.tier,
      usdc: band.usdc,
      walletAddress: entry.walletAddress!,
    });
    ladderRank += 1;
  }
  return awards;
}

/** Everyone who played enough to earn the non-cash bonus but placed outside the ladder. */
export function participationBonusRecipients(
  ranked: readonly RankedEntry[],
  awards: readonly PrizeAward[],
): RankedEntry[] {
  const paid = new Set(awards.map((a) => a.userId));
  return ranked.filter(
    (e) => !paid.has(e.userId) && !e.prizeBlocked && e.dropsUsed >= PARTICIPATION_MIN_DROPS,
  );
}

/** The season id for a date, 'YYYY-MM' in UTC. */
export function seasonId(at: Date = new Date()): string {
  return at.toISOString().slice(0, 7);
}

/** UTC open/close bounds for a 'YYYY-MM' season. */
export function seasonBounds(id: string): { opensAt: Date; closesAt: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(id);
  if (!match) throw new Error(`invalid season id: ${id}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error(`invalid season month: ${id}`);
  return {
    opensAt: new Date(Date.UTC(year, month - 1, 1)),
    closesAt: new Date(Date.UTC(year, month, 1)),
  };
}
