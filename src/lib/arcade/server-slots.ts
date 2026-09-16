/**
 * Server functions for the slot catalogue.
 *
 * A slot costs one drop from the same daily budget as every other game and
 * writes to the same ledger, so the leaderboard does not care which of the 280
 * titles a player chose — by construction they are all worth the same.
 *
 * Configs are served to the client in full, paytables and reel weights
 * included. That is deliberate: the arcade's fairness claim is that any round
 * can be recomputed from the revealed season seed, and a player cannot check
 * that against a paytable they are not allowed to see.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { dayKey, dropsRemaining } from "./allowance.ts";
import { randomSeed } from "./fair.ts";
import { createStream } from "./games/rng.ts";
import { addScore, claimDrop, claimNonce, recordPlay } from "./queries.ts";
import { ensurePlayer, ensureSeason, readServerSeed } from "./server-shared.ts";
import { catalog, lobby, slotById } from "./slots/catalog.ts";
import { byteBudget, playRound } from "./slots/engine.ts";
import { advertisedWays, triggerChance } from "./slots/ev.ts";

const nid = () => crypto.randomUUID();

/** Ledger prefix, so slot plays are distinguishable from the standalone games. */
export const SLOT_GAME_PREFIX = "slot:";

/** The full catalogue, for browsing. Static data — no player state involved. */
export const getSlotLobby = createServerFn({ method: "GET" }).handler(async () => {
  return {
    total: catalog().length,
    games: lobby(),
  };
});

/** One game's config, plus the figures its info panel shows. */
export const getSlot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ slotId: z.string().trim() }))
  .handler(async ({ data }) => {
    const entry = slotById(data.slotId);
    if (!entry) throw new Error("No such game.");
    return {
      config: {
        id: entry.id,
        name: entry.name,
        theme: entry.theme,
        mechanic: entry.mechanic,
        symbols: entry.symbols,
        weights: entry.weights,
        scale: entry.scale,
      },
      info: {
        volatility: entry.volatility.name,
        ways: advertisedWays(entry),
        featureChance: triggerChance(entry),
        freeSpins: entry.mechanic.feature.spins,
        featureMultiplier: entry.mechanic.feature.multiplier,
      },
    };
  });

/** Play one round of a slot. */
export const playSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slotId: z.string().trim() }))
  .handler(async ({ context, data }) => {
    const entry = slotById(data.slotId);
    if (!entry) throw new Error("No such game.");

    const sql = await getSql();
    const season = await ensureSeason(sql);
    if (season.status !== "open") {
      throw new Error("This season has closed. The next one opens on the 1st.");
    }
    await ensurePlayer(sql, context.userId);
    const day = dayKey();

    const allowance = await claimDrop(sql, context.userId, season.id, day);
    if (!allowance) {
      throw new Error("You are out of plays for today. More free plays at 00:00 UTC.");
    }
    const seed = await claimNonce(sql, context.userId, season.id, randomSeed().slice(0, 16));
    const nonce = seed.nonce - 1;

    const serverSeed = await readServerSeed(sql, season.id);
    const stream = await createStream(serverSeed, seed.client_seed, nonce, byteBudget(entry));
    const round = playRound(stream, entry);

    await recordPlay(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: season.id,
      game: `${SLOT_GAME_PREFIX}${entry.id}`,
      nonce,
      clientSeed: seed.client_seed,
      points: round.points,
      // The grids replay the round; the win list is derived from them, so only
      // the grids and the feature outcome need storing.
      detail: {
        slotId: entry.id,
        baseGrid: round.base.grid,
        freeGrids: round.freeSpins.map((s) => s.grid),
        featureTriggered: round.featureTriggered,
        rawPay: round.rawPay,
      },
    });
    const scored = await addScore(sql, context.userId, season.id, round.points);

    return {
      slotId: entry.id,
      nonce,
      round,
      total: scored.points,
      dropsUsed: scored.drops_used,
      remaining: dropsRemaining({
        used: allowance.used,
        bonusGranted: allowance.bonus_granted,
      }),
    };
  });
