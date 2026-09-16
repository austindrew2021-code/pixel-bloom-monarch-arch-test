/**
 * Server functions for the wider arcade: any game on one drop budget, the
 * interactive Mines round, and the rewarded-ad flow.
 *
 * Invariants, all enforced here rather than in the UI:
 *   * Every play costs exactly one drop from the free daily budget, claimed
 *     atomically before any outcome is derived.
 *   * A Mines board is never sent to the client while the round is live. The
 *     server answers one tile at a time.
 *   * Drops are credited for an ad only by a verified network callback once a
 *     provider is configured. The browser cannot grant itself anything.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { AD_TOKEN_TTL_MS, PLACEMENTS, isPlacement, ssvRequired } from "./ads.ts";
import { dayKey, dropsRemaining } from "./allowance.ts";
import { randomSeed } from "./fair.ts";
import {
  GAMES,
  ascent,
  coinflip,
  dice,
  isGameId,
  keno,
  mines,
  openMinesRound,
  playGame,
  roulette,
  wheel,
  type GameId,
} from "./games/index.ts";
import {
  advanceRound,
  claimDrop,
  claimNonce,
  closeRound,
  addScore,
  mintAdToken,
  openRound,
  readLiveRound,
  recordPlay,
} from "./queries.ts";
import { ensurePlayer, ensureSeason, readAllowance, readServerSeed } from "./server-shared.ts";

const nid = () => crypto.randomUUID();

/** Claim a drop and the next nonce. Shared by every game's entry point. */
async function beginPlay(userId: string) {
  const sql = await getSql();
  const season = await ensureSeason(sql);
  if (season.status !== "open") {
    throw new Error("This season has closed. The next one opens on the 1st.");
  }
  await ensurePlayer(sql, userId);
  const day = dayKey();

  const allowance = await claimDrop(sql, userId, season.id, day);
  if (!allowance) {
    throw new Error("You are out of drops for today. More free drops at 00:00 UTC.");
  }
  const seed = await claimNonce(sql, userId, season.id, randomSeed().slice(0, 16));
  return {
    sql,
    season,
    allowance,
    clientSeed: seed.client_seed,
    // Post-increment, so the first play of a season derives at nonce 0.
    nonce: seed.nonce - 1,
  };
}

const playSchema = z.object({
  game: z.string().trim(),
  coins: z.number().int().optional(),
  target: z.number().optional(),
  direction: z.string().trim().optional(),
  tier: z.string().trim().optional(),
  bet: z.object({ kind: z.string().trim(), selection: z.number().int() }).optional(),
  picks: z.array(z.number().int()).optional(),
});

/** Play any single-call game. */
export const playArcadeGame = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(playSchema)
  .handler(async ({ context, data }) => {
    if (!isGameId(data.game)) throw new Error(`Unknown game: ${data.game}`);
    const gameId: GameId = data.game;
    if (GAMES[gameId].interactive) {
      throw new Error(`${GAMES[gameId].name} is played as a round.`);
    }

    // Every choice is validated before a play is spent on it, so a malformed
    // request costs the player nothing.
    if (gameId === "coinflip" && !coinflip.isValidCoinCount(data.coins ?? coinflip.MIN_COINS)) {
      throw new Error(`Pick between ${coinflip.MIN_COINS} and ${coinflip.MAX_COINS} coins.`);
    }
    if (gameId === "ascent" && !ascent.isValidTarget(data.target ?? ascent.MIN_TARGET)) {
      throw new Error(`Target must be ${ascent.MIN_TARGET}x to ${ascent.MAX_TARGET}x.`);
    }
    if (gameId === "dice") {
      if (!dice.isValidTarget(data.target ?? 50)) {
        throw new Error(`Line must be ${dice.MIN_TARGET} to ${dice.MAX_TARGET}.`);
      }
      if (data.direction && data.direction !== "under" && data.direction !== "over") {
        throw new Error("Call it under or over.");
      }
    }
    if (gameId === "wheel" && !wheel.isValidTier(data.tier ?? "medium")) {
      throw new Error(`Wheel must be one of ${wheel.TIERS.join(", ")}.`);
    }
    if (gameId === "roulette") {
      const bet = data.bet as roulette.Bet | undefined;
      if (bet && !roulette.isValidBet(bet)) throw new Error("That is not a bet on this wheel.");
    }
    if (gameId === "keno") {
      const picks = data.picks ?? [];
      if (!keno.isValidPickCount(picks.length)) {
        throw new Error(`Pick between 1 and ${keno.MAX_PICKS} numbers.`);
      }
      if (new Set(picks).size !== picks.length) throw new Error("Pick each number once.");
      if (picks.some((n) => n < 1 || n > keno.POOL)) {
        throw new Error(`Numbers run from 1 to ${keno.POOL}.`);
      }
    }

    const { sql, season, allowance, clientSeed, nonce } = await beginPlay(context.userId);
    const serverSeed = await readServerSeed(sql, season.id);
    const result = await playGame(gameId, serverSeed, clientSeed, nonce, {
      coins: data.coins,
      target: data.target,
      direction: data.direction as dice.Direction | undefined,
      tier: data.tier as wheel.RiskTier | undefined,
      bet: data.bet as roulette.Bet | undefined,
      picks: data.picks,
    });

    await recordPlay(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: season.id,
      game: gameId,
      nonce,
      clientSeed,
      points: result.points,
      detail: result.detail,
    });
    const scored = await addScore(sql, context.userId, season.id, result.points);

    return {
      game: gameId,
      nonce,
      points: result.points,
      detail: result.detail,
      total: scored.points,
      dropsUsed: scored.drops_used,
      remaining: dropsRemaining({
        used: allowance.used,
        bonusGranted: allowance.bonus_granted,
      }),
    };
  });

/* ------------------------------------------------------------------ mines */

type MinesProgress = { revealed: number[] };

function readProgress(value: unknown): MinesProgress {
  const revealed = (value as MinesProgress | null)?.revealed;
  return { revealed: Array.isArray(revealed) ? revealed : [] };
}

function readLayout(value: unknown): mines.MinesLayout {
  const layout = value as mines.MinesLayout;
  if (!layout || !Array.isArray(layout.mines)) throw new Error("Round is corrupt.");
  return layout;
}

/**
 * The client's view of a live round: what has been revealed and what banking is
 * worth right now. Never the mine positions.
 */
function liveView(layout: mines.MinesLayout, revealed: number[]) {
  return {
    mineCount: layout.mineCount,
    revealed,
    gridSize: mines.GRID_SIZE,
    multiplier: revealed.length > 0 ? mines.multiplierAfter(layout.mineCount, revealed.length) : 1,
    bankable: revealed.length > 0,
    bankPoints: mines.pointsFor(layout.mineCount, revealed.length),
    nextPoints: mines.pointsFor(layout.mineCount, revealed.length + 1),
  };
}

export const openMines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ mineCount: z.number().int() }))
  .handler(async ({ context, data }) => {
    if (!mines.isValidMineCount(data.mineCount)) {
      throw new Error(`Mines must be one of ${mines.MINE_CHOICES.join(", ")}.`);
    }
    const sql = await getSql();
    const existing = await readLiveRound(sql, context.userId, "mines");
    if (existing) {
      // Hand back the round in progress rather than charging another drop.
      const layout = readLayout(existing.layout);
      return { roundId: existing.id, ...liveView(layout, readProgress(existing.progress).revealed) };
    }

    const { season, clientSeed, nonce } = await beginPlay(context.userId);
    const serverSeed = await readServerSeed(sql, season.id);
    const layout = await openMinesRound(serverSeed, clientSeed, nonce, data.mineCount);

    const round = await openRound(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: season.id,
      game: "mines",
      nonce,
      clientSeed,
      layout,
    });
    if (!round) throw new Error("You already have a round in progress.");
    return { roundId: round.id, ...liveView(layout, []) };
  });

export const revealMinesTile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ tile: z.number().int() }))
  .handler(async ({ context, data }) => {
    if (!mines.isValidTile(data.tile)) throw new Error("No such tile.");
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "mines");
    if (!round) throw new Error("No round in progress.");

    const layout = readLayout(round.layout);
    const { revealed } = readProgress(round.progress);
    if (revealed.includes(data.tile)) throw new Error("Already revealed.");

    if (mines.isMine(layout, data.tile)) {
      const settled = mines.settle(layout, revealed, false);
      const closed = await closeRound(
        sql,
        round.id,
        context.userId,
        "bust",
        0,
        { revealed, hit: data.tile },
      );
      if (!closed) throw new Error("That round already finished.");
      await recordPlay(sql, {
        id: nid(),
        userId: context.userId,
        seasonId: round.season_id,
        game: "mines",
        nonce: round.nonce,
        clientSeed: round.client_seed,
        points: 0,
        detail: { ...settled.detail, hit: data.tile },
      });
      // The board is only disclosed now that the round is over.
      return { hit: true, tile: data.tile, mines: layout.mines, points: 0 };
    }

    const next = [...revealed, data.tile];
    const advanced = await advanceRound(sql, round.id, context.userId, { revealed: next });
    if (!advanced) throw new Error("That round already finished.");
    return { hit: false, tile: data.tile, ...liveView(layout, next) };
  });

export const bankMines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "mines");
    if (!round) throw new Error("No round in progress.");

    const layout = readLayout(round.layout);
    const { revealed } = readProgress(round.progress);
    if (revealed.length === 0) throw new Error("Reveal at least one tile before banking.");

    const settled = mines.settle(layout, revealed, true);
    const closed = await closeRound(
      sql,
      round.id,
      context.userId,
      "banked",
      settled.points,
      { revealed },
    );
    // A null here means a concurrent request already settled this round —
    // awarding again would pay the same drop twice.
    if (!closed) throw new Error("That round already finished.");

    await recordPlay(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: round.season_id,
      game: "mines",
      nonce: round.nonce,
      clientSeed: round.client_seed,
      points: settled.points,
      detail: settled.detail,
    });
    const scored = await addScore(sql, context.userId, round.season_id, settled.points);

    return {
      points: settled.points,
      mines: layout.mines,
      revealed,
      total: scored.points,
      dropsUsed: scored.drops_used,
    };
  });

/** Resume a round left open by a refresh or a closed tab. */
export const getMinesRound = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "mines");
    if (!round) return null;
    const layout = readLayout(round.layout);
    return { roundId: round.id, ...liveView(layout, readProgress(round.progress).revealed) };
  });

/* --------------------------------------------------------------- ad flow */

/**
 * Mint a single-use token for one ad impression.
 *
 * The token is what the network's callback quotes back to us, and is the only
 * link between an anonymous impression and this account.
 */
export const requestAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ placement: z.string().trim() }))
  .handler(async ({ context, data }) => {
    if (!isPlacement(data.placement)) throw new Error("Unknown ad placement.");
    const sql = await getSql();
    const season = await ensureSeason(sql);
    await ensurePlayer(sql, context.userId);

    const token = randomSeed();
    await mintAdToken(
      sql,
      token,
      context.userId,
      season.id,
      data.placement,
      new Date(Date.now() + AD_TOKEN_TTL_MS),
    );
    const allowance = await readAllowance(sql, context.userId, dayKey());
    return {
      token,
      placement: data.placement,
      reward: PLACEMENTS[data.placement]!.reward,
      // When true the client must play a real ad; drops arrive via the
      // network's callback, not from this request.
      verified: ssvRequired(process.env),
      remaining: dropsRemaining({
        used: allowance.used,
        bonusGranted: allowance.bonus_granted,
      }),
    };
  });
