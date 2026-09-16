/**
 * Viking Longships — six crews race their ships up a river.
 *
 * A round is a fixed number of wheel spins taken in rotation: row one spins,
 * its ship advances, then row two, and so on back around. The wheel carries
 * distances, power-ups and lightning. Milestones along the track pay, and pay
 * far more the further up they sit, so the last one is the thing the whole
 * round is chasing.
 *
 * Three power-ups open the shield bonus — an axe thrown at a spinning wheel of
 * rewards. Three lightning bolts open the rune bonus — runes turned one at a
 * time until one of them ends it. A single lightning bolt on its own sends that
 * row back to the start, which is what makes a ship near the top feel fragile.
 *
 * The whole voyage is derived from the seed in one pass and then replayed by
 * the client. Nothing the player does during the animation changes it: the axe
 * lands where the seed said before the first frame was drawn. That is stated on
 * the game itself rather than dressed up as aim, because a round that pretended
 * otherwise would not be the provably fair game the rest of the arcade is.
 */

import type { SeedStream } from "./rng.ts";
import { type GameResult } from "./types.ts";

export const ROWS = 6;

/** Spaces from the shore to the final milestone. */
export const TRACK = 24;

/**
 * Spins each row gets before extras are won.
 *
 * Tuned against the wheel and the track together: at three spins a row no ship
 * ever came close to the last milestone, which made the biggest prize on the
 * board decoration rather than the thing the round is chasing. Eight puts it
 * within reach of a lucky crew without making it routine.
 */
export const SPINS_PER_ROW = 7;
export const BASE_SPINS = ROWS * SPINS_PER_ROW;

/** Hard ceiling on a round, so entropy use stays bounded. */
export const MAX_SPINS = 96;

export type WheelSlot =
  | { kind: "move"; spaces: number }
  | { kind: "power" }
  | { kind: "lightning" };

/**
 * The wheel. Distances dominate; power-ups and lightning are the seasoning that
 * makes a round swing.
 */
export const WHEEL: readonly WheelSlot[] = [
  { kind: "move", spaces: 1 },
  { kind: "move", spaces: 2 },
  { kind: "move", spaces: 2 },
  { kind: "move", spaces: 3 },
  { kind: "move", spaces: 2 },
  { kind: "power" },
  { kind: "move", spaces: 4 },
  { kind: "move", spaces: 1 },
  { kind: "lightning" },
  { kind: "move", spaces: 3 },
  { kind: "move", spaces: 5 },
  { kind: "power" },
  { kind: "move", spaces: 3 },
  { kind: "move", spaces: 2 },
  { kind: "lightning" },
  { kind: "move", spaces: 2 },
];

/** Milestone spaces and what reaching them is worth, in raw units. */
export const MILESTONES: readonly { space: number; reward: number }[] = [
  { space: 6, reward: 3 },
  { space: 12, reward: 10 },
  { space: 18, reward: 30 },
  { space: 24, reward: 120 },
];

/** Power-ups needed to open the shield bonus. */
export const POWER_TRIGGER = 3;
/** Lightning bolts needed to open the rune bonus. */
export const LIGHTNING_TRIGGER = 3;

/* --------------------------------------------------------- shield bonus */

export type ShieldSlice =
  | { kind: "points"; reward: number }
  | { kind: "spins"; spins: number }
  | { kind: "power"; power: number }
  | { kind: "clearLightning" };

/**
 * The shield's pie chart. Slices are equally likely, so the wedge sizes drawn
 * on screen are the honest odds.
 */
export const SHIELD: readonly ShieldSlice[] = [
  { kind: "points", reward: 8 },
  { kind: "spins", spins: 2 },
  { kind: "power", power: 1 },
  { kind: "points", reward: 18 },
  { kind: "spins", spins: 4 },
  { kind: "clearLightning" },
  { kind: "points", reward: 40 },
  { kind: "spins", spins: 6 },
  { kind: "power", power: 2 },
  { kind: "points", reward: 12 },
  { kind: "spins", spins: 3 },
  { kind: "points", reward: 70 },
];

/* ----------------------------------------------------------- rune bonus */

export type Rune =
  | { kind: "points"; reward: number }
  | { kind: "spins"; spins: number }
  | { kind: "end" };

/**
 * The rune pool, shuffled and turned one at a time until an ending rune comes
 * up. Three of them end it, so a long run of runes is rare and worth watching.
 */
export const RUNES: readonly Rune[] = [
  { kind: "points", reward: 6 },
  { kind: "points", reward: 10 },
  { kind: "points", reward: 16 },
  { kind: "points", reward: 26 },
  { kind: "points", reward: 44 },
  { kind: "spins", spins: 2 },
  { kind: "spins", spins: 3 },
  { kind: "points", reward: 8 },
  { kind: "points", reward: 14 },
  { kind: "end" },
  { kind: "end" },
  { kind: "end" },
];

/**
 * Points per raw unit, so a round lands on the arcade's shared value.
 * Measured rather than derived — the six rows share the power-up and lightning
 * counters, so a round has no closed form — and re-measured by `viking.test.ts`.
 */
export const PAY_SCALE = 0.6301;

/* ------------------------------------------------------------- round log */

export type SpinEvent = {
  spin: number;
  row: number;
  slot: WheelSlot;
  /** Space the row's ship occupies after this spin. */
  position: number;
  /** Milestone rewards banked on this spin. */
  milestones: number[];
  powerUps: number;
  lightning: number;
};

export type ShieldEvent = { afterSpin: number; slice: number; reward: ShieldSlice };
export type RuneEvent = { afterSpin: number; order: number[]; turned: number[]; reward: number };

export type VikingDetail = {
  spins: SpinEvent[];
  shields: ShieldEvent[];
  runes: RuneEvent[];
  positions: number[];
  rawReward: number;
  extraSpins: number;
  points: number;
};

/** Milestones between two positions, in order. */
function milestonesCrossed(from: number, to: number): number[] {
  return MILESTONES.filter((m) => m.space > from && m.space <= to).map((m) => m.reward);
}

function shuffleRunes(stream: SeedStream): number[] {
  const order = RUNES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = stream.nextInt(i + 1);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

export function play(stream: SeedStream): GameResult {
  const positions = new Array<number>(ROWS).fill(0);
  const spins: SpinEvent[] = [];
  const shields: ShieldEvent[] = [];
  const runes: RuneEvent[] = [];

  let totalSpins = BASE_SPINS;
  let extraSpins = 0;
  let powerUps = 0;
  let lightning = 0;
  let rawReward = 0;

  for (let spin = 0; spin < totalSpins && spin < MAX_SPINS; spin += 1) {
    const row = spin % ROWS;
    const slot = WHEEL[stream.nextInt(WHEEL.length)]!;
    const milestones: number[] = [];

    if (slot.kind === "move") {
      const from = positions[row]!;
      // A ship stops at the final milestone rather than sailing past it.
      const to = Math.min(TRACK, from + slot.spaces);
      positions[row] = to;
      milestones.push(...milestonesCrossed(from, to));
      for (const reward of milestones) rawReward += reward;
    } else if (slot.kind === "power") {
      powerUps += 1;
    } else {
      // Lightning sends this row back to the shore, whatever it had reached.
      positions[row] = 0;
      lightning += 1;
    }

    spins.push({ spin, row, slot, position: positions[row]!, milestones, powerUps, lightning });

    if (powerUps >= POWER_TRIGGER) {
      powerUps -= POWER_TRIGGER;
      const sliceIndex = stream.nextInt(SHIELD.length);
      const slice = SHIELD[sliceIndex]!;
      shields.push({ afterSpin: spin, slice: sliceIndex, reward: slice });
      if (slice.kind === "points") rawReward += slice.reward;
      else if (slice.kind === "spins") {
        extraSpins += slice.spins;
        totalSpins += slice.spins;
      } else if (slice.kind === "power") powerUps += slice.power;
      else lightning = 0;
    }

    if (lightning >= LIGHTNING_TRIGGER) {
      lightning -= LIGHTNING_TRIGGER;
      const order = shuffleRunes(stream);
      const turned: number[] = [];
      let reward = 0;
      for (const index of order) {
        turned.push(index);
        const rune = RUNES[index]!;
        if (rune.kind === "end") break;
        if (rune.kind === "points") reward += rune.reward;
        else {
          extraSpins += rune.spins;
          totalSpins += rune.spins;
        }
      }
      rawReward += reward;
      runes.push({ afterSpin: spin, order, turned, reward });
    }
  }

  const points = Math.max(1, Math.round(rawReward * PAY_SCALE));
  const detail: VikingDetail = {
    spins,
    shields,
    runes,
    positions,
    rawReward,
    extraSpins,
    points,
  };
  return { points, detail: { ...detail } };
}

/** One draw per spin, plus a shuffle and a slice draw for each bonus. */
export const BYTE_BUDGET = MAX_SPINS * 4 + MAX_SPINS * (RUNES.length + 2) * 4 + 512;
