/**
 * The daily drop budget.
 *
 * This module is the reason Cascade is a sweepstakes and not a casino. Drops
 * are never sold, never traded and never bought — every drop a player gets
 * comes from the free daily baseline or from a rewarded video, both of which
 * cost the player nothing. The cap also keeps the season a contest of equal
 * opportunity: nobody can out-grind the field, because everyone has the same
 * ceiling.
 *
 * If a "buy more drops" path is ever added above this layer, the prize ladder
 * stops being a sweepstakes and becomes a wager. Do not add one.
 */

/** Given to every player, every day, with no ad and no action required. */
export const FREE_DROPS_PER_DAY = 25;

/** Extra drops for watching one rewarded video. */
export const DROPS_PER_REWARDED_AD = 5;

/** Most rewarded videos that can be redeemed in a single day. */
export const MAX_ADS_PER_DAY = 5;

/** Ceiling on ad-earned drops per day. */
export const MAX_BONUS_DROPS_PER_DAY = DROPS_PER_REWARDED_AD * MAX_ADS_PER_DAY;

/** Hard ceiling on any one player's drops in a day. */
export const MAX_DROPS_PER_DAY = FREE_DROPS_PER_DAY + MAX_BONUS_DROPS_PER_DAY;

export type Allowance = {
  /** Drops already played today. */
  used: number;
  /** Ad-earned drops credited today. */
  bonusGranted: number;
};

export const EMPTY_ALLOWANCE: Allowance = { used: 0, bonusGranted: 0 };

/** Total drops a player is entitled to today. */
export function dropsAllowed(allowance: Allowance): number {
  const bonus = Math.min(allowance.bonusGranted, MAX_BONUS_DROPS_PER_DAY);
  return FREE_DROPS_PER_DAY + bonus;
}

/** Drops still available today. Never negative. */
export function dropsRemaining(allowance: Allowance): number {
  return Math.max(0, dropsAllowed(allowance) - allowance.used);
}

export function canDrop(allowance: Allowance): boolean {
  return dropsRemaining(allowance) > 0;
}

/** Rewarded videos still redeemable today. */
export function adsRemaining(allowance: Allowance): number {
  const earned = Math.min(allowance.bonusGranted, MAX_BONUS_DROPS_PER_DAY);
  return Math.max(0, MAX_ADS_PER_DAY - Math.floor(earned / DROPS_PER_REWARDED_AD));
}

export function canWatchAd(allowance: Allowance): boolean {
  return adsRemaining(allowance) > 0;
}

/**
 * Credit one rewarded video. Clamped at the daily ceiling so a replayed or
 * duplicated ad callback can never inflate a player's budget.
 */
export function grantAdBonus(allowance: Allowance): Allowance {
  if (!canWatchAd(allowance)) return allowance;
  return {
    ...allowance,
    bonusGranted: Math.min(
      allowance.bonusGranted + DROPS_PER_REWARDED_AD,
      MAX_BONUS_DROPS_PER_DAY,
    ),
  };
}

/** Spend one drop. Throws rather than silently overdrawing the budget. */
export function spendDrop(allowance: Allowance): Allowance {
  if (!canDrop(allowance)) {
    throw new Error("no drops remaining today");
  }
  return { ...allowance, used: allowance.used + 1 };
}

/** UTC calendar day key. The reset boundary is UTC so it is the same for everyone. */
export function dayKey(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}
