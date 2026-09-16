/**
 * Wheel — twenty segments, one spin.
 *
 * Three risk tiers share a segment count but not a shape: the low wheel pays
 * something on almost every spin, the high wheel is mostly blanks around a few
 * large slices. Each tier's multipliers are scaled so all three land on the same
 * expected points, which is computed exactly — every segment is equally likely,
 * so a tier's value is just the mean of its multipliers.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const SEGMENTS = 20;

export type RiskTier = "low" | "medium" | "high";

/**
 * Segment multipliers per tier. Every segment is equally likely, so these are
 * the whole distribution: read across and you can see the shape of each tier.
 */
export const WHEELS: Readonly<Record<RiskTier, readonly number[]>> = {
  low: [0, 1.2, 1.2, 1.2, 1.5, 1.2, 1.2, 1.5, 1.2, 2, 1.2, 1.2, 1.5, 1.2, 1.2, 1.5, 1.2, 1.2, 1.5, 3],
  medium: [0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 1.5, 0, 5, 0, 1.5, 0, 10],
  high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 50],
};

export const TIERS = Object.keys(WHEELS) as RiskTier[];

export type WheelDetail = {
  tier: RiskTier;
  segment: number;
  multiplier: number;
  points: number;
};

export function isValidTier(tier: string): tier is RiskTier {
  return Object.prototype.hasOwnProperty.call(WHEELS, tier);
}

/** Mean multiplier of a tier — its expected value before scaling. */
export function meanMultiplier(tier: RiskTier): number {
  const wheel = WHEELS[tier];
  return wheel.reduce((a, b) => a + b, 0) / wheel.length;
}

/** Points per unit of multiplier, chosen so every tier pays the same. */
export function tierScale(tier: RiskTier): number {
  const mean = meanMultiplier(tier);
  return mean > 0 ? TARGET_EV / mean : 0;
}

export function segmentPoints(tier: RiskTier, segment: number): number {
  const multiplier = WHEELS[tier][segment] ?? 0;
  if (multiplier <= 0) return 0;
  return Math.max(1, Math.round(multiplier * tierScale(tier)));
}

/** Exact expected points: every segment is equally likely. */
export function expectedPoints(tier: RiskTier): number {
  const wheel = WHEELS[tier];
  let total = 0;
  for (let segment = 0; segment < wheel.length; segment += 1) {
    total += segmentPoints(tier, segment);
  }
  return total / wheel.length;
}

/** How often a tier pays anything at all. */
export function hitChance(tier: RiskTier): number {
  const wheel = WHEELS[tier];
  return wheel.filter((m) => m > 0).length / wheel.length;
}

export function play(stream: SeedStream, tier: RiskTier): GameResult {
  if (!isValidTier(tier)) throw new Error(`Unknown wheel: ${tier}`);
  const segment = stream.nextInt(WHEELS[tier].length);
  const points = segmentPoints(tier, segment);

  const detail: WheelDetail = {
    tier,
    segment,
    multiplier: WHEELS[tier][segment] ?? 0,
    points,
  };
  return { points, detail: { ...detail } };
}

export const BYTE_BUDGET = 64;
