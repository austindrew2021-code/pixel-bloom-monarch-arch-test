/**
 * Server functions for Cascade.
 *
 * Invariants enforced here, not in the UI:
 *   * `server_seed` is never returned to a client while a season is open. Only
 *     its hash is public until the season closes and the seed is revealed.
 *   * A drop costs one unit of the free daily budget, claimed atomically. There
 *     is no code path anywhere that sells, grants or transfers a drop for value.
 *   * A wallet is linked only after a signature is recovered to that exact
 *     address, and one wallet backs at most one account.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  FREE_DROPS_PER_DAY,
  MAX_ADS_PER_DAY,
  MAX_BONUS_DROPS_PER_DAY,
  DROPS_PER_REWARDED_AD,
  dayKey,
  dropsRemaining,
} from "./allowance.ts";
import { randomSeed } from "./fair.ts";
import {
  addScore,
  claimAdBonus,
  claimDrop,
  claimNonce,
  consumeChallenge,
  recordDrop,
} from "./queries.ts";
import { BOARD_ROWS, SLOT_POINTS, playDrop, slotOdds } from "./plinko.ts";
import {
  PARTICIPATION_MIN_DROPS,
  PRIZE_LADDER,
  type ScoreEntry,
  assignPrizes,
  rankBoard,
  totalPrizePool,
} from "./season.ts";
import {
  ensurePlayer,
  ensureSeason,
  readAllowance,
  readScore,
  readSeed,
  readServerSeed,
} from "./server-shared.ts";
import {
  CHALLENGE_TTL_MS,
  isAddressShaped,
  linkMessage,
  normalizeAddress,
} from "./wallet-link.ts";

const nid = () => crypto.randomUUID();

/** Everything the play screen needs in one round trip. */
export const getArcade = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const season = await ensureSeason(sql);
    const player = await ensurePlayer(sql, context.userId);
    const day = dayKey();
    const allowance = await readAllowance(sql, context.userId, day);
    const score = await readScore(sql, context.userId, season.id);
    const seed = await readSeed(sql, context.userId, season.id);

    const rankRows = await sql<{ ahead: number }>`
      select count(*)::int as ahead from season_scores
      where season_id = ${season.id} and points > ${score.points}
    `;

    return {
      season: {
        id: season.id,
        opensAt: season.opens_at,
        closesAt: season.closes_at,
        serverSeedHash: season.server_seed_hash,
        status: season.status,
      },
      player: {
        handle: player.handle,
        walletAddress: player.wallet_address,
        prizeBlocked: player.prize_blocked,
      },
      allowance: {
        used: allowance.used,
        bonusGranted: allowance.bonus_granted,
        remaining: dropsRemaining({ used: allowance.used, bonusGranted: allowance.bonus_granted }),
        freePerDay: FREE_DROPS_PER_DAY,
        maxBonus: MAX_BONUS_DROPS_PER_DAY,
        perAd: DROPS_PER_REWARDED_AD,
        maxAds: MAX_ADS_PER_DAY,
      },
      score: { points: score.points, dropsUsed: score.drops_used, rank: (rankRows[0]?.ahead ?? 0) + 1 },
      clientSeed: seed?.client_seed ?? null,
      nextNonce: seed?.nonce ?? 0,
      board: { rows: BOARD_ROWS, slotPoints: [...SLOT_POINTS], odds: slotOdds() },
      ladder: PRIZE_LADDER.map((b) => ({ ...b })),
      prizePool: totalPrizePool(),
      participationMinDrops: PARTICIPATION_MIN_DROPS,
    };
  });

/**
 * Play one drop.
 *
 * Budget first, then nonce, then outcome: the allowance claim is the gate, and
 * it is a single conditional UPDATE so two concurrent requests cannot both
 * spend the last drop of the day.
 */
export const dropBall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ clientSeed: z.string().trim().min(1).max(64).optional() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const season = await ensureSeason(sql);
    if (season.status !== "open") {
      throw new Error("This season has closed. The next one opens on the 1st.");
    }
    await ensurePlayer(sql, context.userId);
    const day = dayKey();

    const allowance = await claimDrop(sql, context.userId, season.id, day);
    if (!allowance) {
      throw new Error("You are out of drops for today. More free drops at 00:00 UTC.");
    }

    // Claim the next nonce for this player/season, seeding a client seed on the
    // first drop. The nonce is what makes each drop a distinct derivation.
    const fallbackSeed = data.clientSeed ?? randomSeed().slice(0, 16);
    const seed = await claimNonce(sql, context.userId, season.id, fallbackSeed);

    const serverSeed = await readServerSeed(sql, season.id);
    // Nonce is post-increment, so the first drop of a season derives at nonce 0.
    const nonce = seed.nonce - 1;
    const drop = await playDrop(serverSeed, seed.client_seed, nonce);

    await recordDrop(sql, {
      id: nid(),
      userId: context.userId,
      seasonId: season.id,
      nonce,
      clientSeed: seed.client_seed,
      rows: BOARD_ROWS,
      slot: drop.slot,
      path: drop.path,
      points: drop.points,
    });

    const scored = await addScore(sql, context.userId, season.id, drop.points);

    return {
      drop: { ...drop, nonce, clientSeed: seed.client_seed },
      total: scored.points,
      dropsUsed: scored.drops_used,
      remaining: dropsRemaining({ used: allowance.used, bonusGranted: allowance.bonus_granted }),
    };
  });

/** Credit one rewarded video. Clamped at the daily ceiling, so replays are no-ops. */
export const grantAdDrops = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const season = await ensureSeason(sql);
    await ensurePlayer(sql, context.userId);
    const day = dayKey();

    const row = await claimAdBonus(sql, context.userId, season.id, day);
    if (!row) {
      const current = await readAllowance(sql, context.userId, day);
      return {
        granted: 0,
        remaining: dropsRemaining({ used: current.used, bonusGranted: current.bonus_granted }),
      };
    }
    return {
      granted: DROPS_PER_REWARDED_AD,
      remaining: dropsRemaining({ used: row.used, bonusGranted: row.bonus_granted }),
    };
  });

type BoardRow = {
  user_id: string;
  handle: string;
  points: number;
  drops_used: number;
  reached_at: string;
  wallet_address: string | null;
  prize_blocked: boolean;
};

/** The season leaderboard, ranked and with the prize ladder already applied. */
export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const season = await ensureSeason(sql);
    const rows = await sql<BoardRow>`
      select s.user_id, p.handle, s.points, s.drops_used, s.reached_at,
             p.wallet_address, p.prize_blocked
      from season_scores s
      join players p on p.user_id = s.user_id
      where s.season_id = ${season.id}
      order by s.points desc, s.drops_used asc, s.reached_at asc
      limit 250
    `;
    const entries: ScoreEntry[] = rows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      points: r.points,
      dropsUsed: r.drops_used,
      reachedAt: new Date(r.reached_at).toISOString(),
      walletAddress: r.wallet_address,
      prizeBlocked: r.prize_blocked,
    }));
    const ranked = rankBoard(entries);
    const awards = assignPrizes(ranked);
    const prizeByUser = new Map(awards.map((a) => [a.userId, a]));

    return {
      seasonId: season.id,
      closesAt: season.closes_at,
      // Wallet addresses stay server-side; the board only says whether a player
      // is payable, never where they would be paid.
      rows: ranked.map((e) => ({
        rank: e.rank,
        handle: e.handle,
        points: e.points,
        dropsUsed: e.dropsUsed,
        isMe: e.userId === context.userId,
        payable: !!e.walletAddress && !e.prizeBlocked,
        prize: prizeByUser.get(e.userId)?.usdc ?? null,
        tier: prizeByUser.get(e.userId)?.tier ?? null,
      })),
    };
  });

/** Issue a one-shot challenge for the player to sign. */
export const beginWalletLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ address: z.string().trim() }))
  .handler(async ({ context, data }) => {
    if (!isAddressShaped(data.address)) throw new Error("That is not a wallet address.");
    const address = normalizeAddress(data.address);
    const sql = await getSql();
    await ensurePlayer(sql, context.userId);

    const taken = await sql<{ user_id: string }>`
      select user_id from players where lower(wallet_address) = ${address}
    `;
    if (taken[0] && taken[0].user_id !== context.userId) {
      throw new Error("That wallet is already linked to another Cascade account.");
    }

    const nonce = randomSeed().slice(0, 24);
    const issuedAt = new Date();
    await sql`
      insert into wallet_challenges (nonce, user_id, address, issued_at, expires_at)
      values (${nonce}, ${context.userId}, ${address}, ${issuedAt.toISOString()},
              ${new Date(issuedAt.getTime() + CHALLENGE_TTL_MS).toISOString()})
    `;
    return {
      message: linkMessage({
        userId: context.userId,
        address,
        nonce,
        issuedAt: issuedAt.toISOString(),
      }),
      nonce,
    };
  });

/** Verify the signature and link the wallet. */
export const completeWalletLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ nonce: z.string().trim().min(1), signature: z.string().trim().min(1) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();

    // Consume the challenge in the same statement that reads it, so a captured
    // signature cannot be replayed against a second request.
    const challenge = await consumeChallenge(sql, data.nonce, context.userId);
    if (!challenge) throw new Error("That signing request expired. Start again.");

    const message = linkMessage({
      userId: challenge.user_id,
      address: challenge.address,
      nonce: data.nonce,
      issuedAt: new Date(challenge.issued_at).toISOString(),
    });

    // Imported here so viem stays out of the client bundle.
    const { verifyMessage } = await import("viem");
    const valid = await verifyMessage({
      address: challenge.address as `0x${string}`,
      message,
      signature: data.signature as `0x${string}`,
    });
    if (!valid) throw new Error("That signature did not match the wallet.");

    const linked = await sql<{ wallet_address: string }>`
      update players
      set wallet_address = ${challenge.address}, wallet_linked_at = now()
      where user_id = ${context.userId}
      returning wallet_address
    `;
    if (!linked[0]) throw new Error("Could not link that wallet.");
    return { walletAddress: linked[0].wallet_address };
  });

/**
 * Public fairness data for a season.
 *
 * The seed is included only once the season has closed and been revealed; while
 * a season is open this returns the commitment alone.
 */
export const getSeasonProof = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ seasonId: z.string().trim().regex(/^\d{4}-\d{2}$/) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      status: string;
      server_seed_hash: string;
      server_seed: string | null;
      revealed_at: string | null;
    }>`
      select id, status, server_seed_hash, server_seed, revealed_at
      from seasons where id = ${data.seasonId}
    `;
    const season = rows[0];
    if (!season) throw new Error("No such season.");

    const revealed = season.status !== "open" && !!season.revealed_at;
    const drops = await sql<{
      nonce: number; client_seed: string; rows: number; slot: number; path: string; points: number;
    }>`
      select nonce, client_seed, rows, slot, path, points from drops
      where user_id = ${context.userId} and season_id = ${data.seasonId}
      order by nonce asc limit 500
    `;
    return {
      seasonId: season.id,
      status: season.status,
      serverSeedHash: season.server_seed_hash,
      // Withheld until the season closes — revealing early would let a player
      // predict every remaining drop.
      serverSeed: revealed ? season.server_seed : null,
      revealedAt: season.revealed_at,
      drops,
    };
  });
