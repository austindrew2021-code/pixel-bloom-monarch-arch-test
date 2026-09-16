/**
 * Server functions for the decision-chain games — Hi-Lo and Tower.
 *
 * Both follow the shape Mines established: the whole outcome is fixed from the
 * seed when the round opens, stored server-side, and revealed one step at a
 * time. The client learns whether its last move survived and nothing more, so
 * the layout cannot be read out of a network response, and the round is still
 * fully re-derivable once the season seed is published.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { dayKey, dropsRemaining } from "./allowance.ts";
import { randomSeed } from "./fair.ts";
import { hilo, openHiLoRound, openTowerRound, tower } from "./games/index.ts";
import {
  addScore,
  advanceRound,
  claimDrop,
  claimNonce,
  closeRound,
  openRound,
  readLiveRound,
  recordPlay,
  type RoundRow,
} from "./queries.ts";
import { ensurePlayer, ensureSeason, readServerSeed } from "./server-shared.ts";

const nid = () => crypto.randomUUID();

/** Claim a drop and a nonce, then hand back what a round needs to open. */
async function beginRound(userId: string) {
  const sql = await getSql();
  const season = await ensureSeason(sql);
  if (season.status !== "open") {
    throw new Error("This season has closed. The next one opens on the 1st.");
  }
  await ensurePlayer(sql, userId);

  const allowance = await claimDrop(sql, userId, season.id, dayKey());
  if (!allowance) {
    throw new Error("You are out of plays for today. More free plays at 00:00 UTC.");
  }
  const seed = await claimNonce(sql, userId, season.id, randomSeed().slice(0, 16));
  return {
    sql,
    season,
    allowance,
    clientSeed: seed.client_seed,
    nonce: seed.nonce - 1,
    serverSeed: await readServerSeed(sql, season.id),
  };
}

function remainingFrom(allowance: { used: number; bonus_granted: number }): number {
  return dropsRemaining({ used: allowance.used, bonusGranted: allowance.bonus_granted });
}

/* ------------------------------------------------------------------ hi-lo */

type HiLoProgress = { calls: hilo.Call[] };

function hiloProgress(value: unknown): HiLoProgress {
  const calls = (value as HiLoProgress | null)?.calls;
  return { calls: Array.isArray(calls) ? calls : [] };
}

function hiloLayout(value: unknown): hilo.HiLoLayout {
  const layout = value as hilo.HiLoLayout;
  if (!layout || !Array.isArray(layout.cards)) throw new Error("Round is corrupt.");
  return layout;
}

/**
 * What the client may see: the card showing, the chain so far, and what each
 * call would be worth. Never the cards still face down.
 */
function hiloView(round: RoundRow, layout: hilo.HiLoLayout, calls: hilo.Call[]) {
  const showing = layout.cards[calls.length]!;
  const bankPoints = hilo.pointsFor(layout.cards, calls);
  const next = (call: hilo.Call) =>
    hilo.pointsFor(layout.cards, [...calls, call]);
  return {
    roundId: round.id,
    showing,
    revealed: layout.cards.slice(0, calls.length + 1),
    calls,
    multiplier: hilo.chainMultiplier(layout.cards, calls),
    bankable: calls.length > 0,
    bankPoints,
    higherChance: hilo.callChance(showing.rank, "higher"),
    lowerChance: hilo.callChance(showing.rank, "lower"),
    higherPoints: next("higher"),
    lowerPoints: next("lower"),
    maxCalls: hilo.MAX_CALLS,
  };
}

export const getHiLoRound = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "hilo");
    if (!round) return null;
    const layout = hiloLayout(round.layout);
    return hiloView(round, layout, hiloProgress(round.progress).calls);
  });

export const openHiLo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await readLiveRound(sql, context.userId, "hilo");
    if (existing) {
      // Resume rather than charging a second play for the same round.
      const layout = hiloLayout(existing.layout);
      return hiloView(existing, layout, hiloProgress(existing.progress).calls);
    }

    const { season, clientSeed, nonce, serverSeed } = await beginRound(context.userId);
    const layout = await openHiLoRound(serverSeed, clientSeed, nonce);
    const round = await openRound(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: season.id,
      game: "hilo",
      nonce,
      clientSeed,
      layout,
    });
    if (!round) throw new Error("You already have a round in progress.");
    return hiloView(round, layout, []);
  });

export const callHiLo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ call: z.string().trim() }))
  .handler(async ({ context, data }) => {
    if (!hilo.isValidCall(data.call)) throw new Error("Call higher or lower.");
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "hilo");
    if (!round) throw new Error("No round in progress.");

    const layout = hiloLayout(round.layout);
    const { calls } = hiloProgress(round.progress);
    const showing = layout.cards[calls.length];
    const next = layout.cards[calls.length + 1];
    if (!showing || !next) throw new Error("This chain has run out of cards.");

    if (!hilo.succeeds(showing.rank, next.rank, data.call)) {
      const settled = hilo.settle(layout, calls, false);
      const closed = await closeRound(sql, round.id, context.userId, "bust", 0, {
        calls,
        bustCard: next,
      });
      if (!closed) throw new Error("That round already finished.");
      await recordPlay(sql, {
        id: nid(),
        userId: context.userId,
        seasonId: round.season_id,
        game: "hilo",
        nonce: round.nonce,
        clientSeed: round.client_seed,
        points: 0,
        detail: { ...settled.detail, bustCard: next },
      });
      return { survived: false as const, card: next, points: 0 };
    }

    const nextCalls = [...calls, data.call];
    const advanced = await advanceRound(sql, round.id, context.userId, { calls: nextCalls });
    if (!advanced) throw new Error("That round already finished.");

    // The chain has a fixed length, so a player who reaches the end banks
    // automatically rather than being left on a round they cannot continue.
    if (nextCalls.length >= hilo.MAX_CALLS) {
      return await settleHiLo(context.userId, advanced, layout, nextCalls, next);
    }
    return {
      survived: true as const,
      card: next,
      ...hiloView(advanced, layout, nextCalls),
    };
  });

async function settleHiLo(
  userId: string,
  round: RoundRow,
  layout: hilo.HiLoLayout,
  calls: hilo.Call[],
  card: hilo.Card,
) {
  const sql = await getSql();
  const settled = hilo.settle(layout, calls, true);
  const closed = await closeRound(sql, round.id, userId, "banked", settled.points, { calls });
  if (!closed) throw new Error("That round already finished.");
  await recordPlay(sql, {
    id: nid(),
    userId,
    seasonId: round.season_id,
    game: "hilo",
    nonce: round.nonce,
    clientSeed: round.client_seed,
    points: settled.points,
    detail: settled.detail,
  });
  const scored = await addScore(sql, userId, round.season_id, settled.points);
  return {
    survived: true as const,
    card,
    banked: true as const,
    points: settled.points,
    total: scored.points,
  };
}

export const bankHiLo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "hilo");
    if (!round) throw new Error("No round in progress.");
    const layout = hiloLayout(round.layout);
    const { calls } = hiloProgress(round.progress);
    if (calls.length === 0) throw new Error("Make a call before banking.");

    const settled = hilo.settle(layout, calls, true);
    const closed = await closeRound(sql, round.id, context.userId, "banked", settled.points, {
      calls,
    });
    // Null means a concurrent request already settled it; awarding again would
    // pay one play twice.
    if (!closed) throw new Error("That round already finished.");

    await recordPlay(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: round.season_id,
      game: "hilo",
      nonce: round.nonce,
      clientSeed: round.client_seed,
      points: settled.points,
      detail: settled.detail,
    });
    const scored = await addScore(sql, context.userId, round.season_id, settled.points);
    return { points: settled.points, calls, total: scored.points };
  });

/* ------------------------------------------------------------------ tower */

type TowerProgress = { picks: number[] };

function towerProgress(value: unknown): TowerProgress {
  const picks = (value as TowerProgress | null)?.picks;
  return { picks: Array.isArray(picks) ? picks : [] };
}

function towerLayout(value: unknown): tower.TowerLayout {
  const layout = value as tower.TowerLayout;
  if (!layout || !Array.isArray(layout.safeTiles)) throw new Error("Round is corrupt.");
  return layout;
}

function towerView(round: RoundRow, layout: tower.TowerLayout, picks: number[]) {
  const { difficulty } = layout;
  return {
    roundId: round.id,
    difficulty,
    picks,
    floors: tower.FLOORS,
    tiles: tower.DIFFICULTIES[difficulty].tiles,
    safePerFloor: tower.DIFFICULTIES[difficulty].safe,
    multiplier: picks.length > 0 ? tower.multiplierAfter(difficulty, picks.length) : 1,
    bankable: picks.length > 0,
    bankPoints: tower.pointsFor(difficulty, picks.length),
    nextPoints: tower.pointsFor(difficulty, picks.length + 1),
  };
}

export const getTowerRound = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "tower");
    if (!round) return null;
    const layout = towerLayout(round.layout);
    return towerView(round, layout, towerProgress(round.progress).picks);
  });

export const openTower = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ difficulty: z.string().trim() }))
  .handler(async ({ context, data }) => {
    if (!tower.isValidDifficulty(data.difficulty)) {
      throw new Error(`Difficulty must be one of ${tower.LEVELS.join(", ")}.`);
    }
    const sql = await getSql();
    const existing = await readLiveRound(sql, context.userId, "tower");
    if (existing) {
      const layout = towerLayout(existing.layout);
      return towerView(existing, layout, towerProgress(existing.progress).picks);
    }

    const { season, clientSeed, nonce, serverSeed } = await beginRound(context.userId);
    const layout = await openTowerRound(serverSeed, clientSeed, nonce, data.difficulty);
    const round = await openRound(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: season.id,
      game: "tower",
      nonce,
      clientSeed,
      layout,
    });
    if (!round) throw new Error("You already have a round in progress.");
    return towerView(round, layout, []);
  });

export const climbTower = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ tile: z.number().int() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "tower");
    if (!round) throw new Error("No round in progress.");

    const layout = towerLayout(round.layout);
    const { picks } = towerProgress(round.progress);
    if (!tower.isValidTile(layout.difficulty, data.tile)) throw new Error("No such tile.");
    const floor = picks.length;
    if (floor >= tower.FLOORS) throw new Error("You are already at the top.");

    if (!tower.isSafe(layout, floor, data.tile)) {
      const settled = tower.settle(layout, picks, false);
      const closed = await closeRound(sql, round.id, context.userId, "bust", 0, {
        picks,
        hit: data.tile,
      });
      if (!closed) throw new Error("That round already finished.");
      await recordPlay(sql, {
        id: nid(),
        userId: context.userId,
        seasonId: round.season_id,
        game: "tower",
        nonce: round.nonce,
        clientSeed: round.client_seed,
        points: 0,
        detail: { ...settled.detail, hit: data.tile },
      });
      // Only now is the layout disclosed.
      return { survived: false as const, tile: data.tile, safeTiles: layout.safeTiles, points: 0 };
    }

    const nextPicks = [...picks, data.tile];
    const advanced = await advanceRound(sql, round.id, context.userId, { picks: nextPicks });
    if (!advanced) throw new Error("That round already finished.");

    if (nextPicks.length >= tower.FLOORS) {
      // The top floor banks itself; there is nothing left to climb.
      const settled = tower.settle(layout, nextPicks, true);
      const closed = await closeRound(
        sql, advanced.id, context.userId, "banked", settled.points, { picks: nextPicks },
      );
      if (!closed) throw new Error("That round already finished.");
      await recordPlay(sql, {
        id: nid(),
        userId: context.userId,
        seasonId: advanced.season_id,
        game: "tower",
        nonce: advanced.nonce,
        clientSeed: advanced.client_seed,
        points: settled.points,
        detail: settled.detail,
      });
      const scored = await addScore(sql, context.userId, advanced.season_id, settled.points);
      return {
        survived: true as const,
        tile: data.tile,
        topped: true as const,
        points: settled.points,
        safeTiles: layout.safeTiles,
        total: scored.points,
      };
    }

    return {
      survived: true as const,
      tile: data.tile,
      ...towerView(advanced, layout, nextPicks),
    };
  });

export const bankTower = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "tower");
    if (!round) throw new Error("No round in progress.");
    const layout = towerLayout(round.layout);
    const { picks } = towerProgress(round.progress);
    if (picks.length === 0) throw new Error("Climb a floor before banking.");

    const settled = tower.settle(layout, picks, true);
    const closed = await closeRound(sql, round.id, context.userId, "banked", settled.points, {
      picks,
    });
    if (!closed) throw new Error("That round already finished.");

    await recordPlay(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: round.season_id,
      game: "tower",
      nonce: round.nonce,
      clientSeed: round.client_seed,
      points: settled.points,
      detail: settled.detail,
    });
    const scored = await addScore(sql, context.userId, round.season_id, settled.points);
    return { points: settled.points, safeTiles: layout.safeTiles, picks, total: scored.points };
  });

/** Plays left today, for screens that need it without a full arcade read. */
export const getPlaysLeft = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const season = await ensureSeason(sql);
    const rows = await sql<{ used: number; bonus_granted: number }>`
      select used, bonus_granted from drop_allowance
      where user_id = ${context.userId} and day = ${dayKey()}
    `;
    void season;
    return { remaining: remainingFrom(rows[0] ?? { used: 0, bonus_granted: 0 }) };
  });
