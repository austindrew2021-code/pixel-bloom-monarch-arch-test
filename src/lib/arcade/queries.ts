/**
 * The write paths that must not race.
 *
 * These live apart from `server.ts` so they can be exercised against a real
 * Postgres in `queries.test.ts`. Concurrency bugs here are the expensive kind —
 * a player who can spend the same drop twice can out-score an honest field, and
 * an ad callback that stacks turns a free game into a paid advantage — so the
 * atomicity is a property of the SQL itself, not of the order the caller
 * happens to do things in.
 */

import type { Sql } from "@/lib/db";
import { DROPS_PER_REWARDED_AD, FREE_DROPS_PER_DAY, MAX_BONUS_DROPS_PER_DAY } from "./allowance.ts";

export type AllowanceRow = { used: number; bonus_granted: number };

/**
 * Spend one drop from today's budget.
 *
 * A single conditional UPDATE: Postgres takes a row lock for the duration, so
 * two concurrent requests serialise and the second sees the first's increment.
 * Returns null when the budget is spent — the caller must treat that as refusal,
 * never as a zero-cost drop.
 */
export async function claimDrop(
  sql: Sql,
  userId: string,
  seasonId: string,
  day: string,
): Promise<AllowanceRow | null> {
  const rows = await sql<AllowanceRow>`
    insert into drop_allowance (user_id, season_id, day, used, bonus_granted)
    values (${userId}, ${seasonId}, ${day}, 1, 0)
    on conflict (user_id, day) do update
      set used = drop_allowance.used + 1
      where drop_allowance.used
            < ${FREE_DROPS_PER_DAY} + least(drop_allowance.bonus_granted, ${MAX_BONUS_DROPS_PER_DAY})
    returning used, bonus_granted
  `;
  return rows[0] ?? null;
}

/**
 * Credit one rewarded video, clamped at the daily ceiling.
 * Returns null when the ceiling is already reached, so a retried ad callback is
 * a no-op rather than free drops.
 */
export async function claimAdBonus(
  sql: Sql,
  userId: string,
  seasonId: string,
  day: string,
): Promise<AllowanceRow | null> {
  const rows = await sql<AllowanceRow>`
    insert into drop_allowance (user_id, season_id, day, used, bonus_granted)
    values (${userId}, ${seasonId}, ${day}, 0, ${DROPS_PER_REWARDED_AD})
    on conflict (user_id, day) do update
      set bonus_granted = least(
        drop_allowance.bonus_granted + ${DROPS_PER_REWARDED_AD}, ${MAX_BONUS_DROPS_PER_DAY})
      where drop_allowance.bonus_granted < ${MAX_BONUS_DROPS_PER_DAY}
    returning used, bonus_granted
  `;
  return rows[0] ?? null;
}

/**
 * Take the next nonce for this player and season, seeding a client seed on the
 * first call. The returned nonce is post-increment, so the caller derives at
 * `nonce - 1`; that keeps the counter and the derivation index in lockstep even
 * under concurrent drops.
 */
export async function claimNonce(
  sql: Sql,
  userId: string,
  seasonId: string,
  fallbackSeed: string,
): Promise<{ client_seed: string; nonce: number }> {
  const rows = await sql<{ client_seed: string; nonce: number }>`
    insert into player_seeds (user_id, season_id, client_seed, nonce)
    values (${userId}, ${seasonId}, ${fallbackSeed}, 1)
    on conflict (user_id, season_id) do update set nonce = player_seeds.nonce + 1
    returning client_seed, nonce
  `;
  const row = rows[0];
  if (!row) throw new Error("Could not claim a drop.");
  return row;
}

/** Append a drop to the audit trail. Idempotent on (player, season, nonce). */
export async function recordDrop(
  sql: Sql,
  drop: {
    id: string;
    userId: string;
    seasonId: string;
    nonce: number;
    clientSeed: string;
    rows: number;
    slot: number;
    path: string;
    points: number;
  },
): Promise<void> {
  await sql`
    insert into drops (id, user_id, season_id, nonce, client_seed, rows, slot, path, points)
    values (${drop.id}, ${drop.userId}, ${drop.seasonId}, ${drop.nonce}, ${drop.clientSeed},
            ${drop.rows}, ${drop.slot}, ${drop.path}, ${drop.points})
    on conflict (user_id, season_id, nonce) do nothing
  `;
}

/**
 * Add a drop's points to the season total.
 *
 * `reached_at` is stamped on every scoring drop, so it ends the season holding
 * the moment the player last improved — which is exactly the value the
 * published tie-break compares.
 */
export async function addScore(
  sql: Sql,
  userId: string,
  seasonId: string,
  points: number,
): Promise<{ points: number; drops_used: number }> {
  const rows = await sql<{ points: number; drops_used: number }>`
    insert into season_scores (user_id, season_id, points, drops_used, reached_at)
    values (${userId}, ${seasonId}, ${points}, 1, now())
    on conflict (user_id, season_id) do update
      set points = season_scores.points + ${points},
          drops_used = season_scores.drops_used + 1,
          reached_at = now()
    returning points, drops_used
  `;
  const row = rows[0];
  if (!row) throw new Error("Could not record score.");
  return row;
}

/**
 * Consume a wallet-linking challenge.
 *
 * Read and consume in one statement so a captured signature cannot be replayed:
 * the second attempt finds `consumed_at` already set and gets nothing back.
 */
export async function consumeChallenge(
  sql: Sql,
  nonce: string,
  userId: string,
): Promise<{ user_id: string; address: string; issued_at: string } | null> {
  const rows = await sql<{ user_id: string; address: string; issued_at: string }>`
    update wallet_challenges
    set consumed_at = now()
    where nonce = ${nonce}
      and consumed_at is null
      and expires_at > now()
      and user_id = ${userId}
    returning user_id, address, issued_at
  `;
  return rows[0] ?? null;
}

/* ------------------------------------------------------------- multi-game */

/** Append a play of any game. Idempotent on (player, season, nonce). */
export async function recordPlay(
  sql: Sql,
  play: {
    id: string;
    userId: string;
    seasonId: string;
    game: string;
    nonce: number;
    clientSeed: string;
    points: number;
    detail: unknown;
  },
): Promise<void> {
  await sql`
    insert into drops (id, user_id, season_id, game, nonce, client_seed, points, detail)
    values (${play.id}, ${play.userId}, ${play.seasonId}, ${play.game}, ${play.nonce},
            ${play.clientSeed}, ${play.points}, ${JSON.stringify(play.detail)}::jsonb)
    on conflict (user_id, season_id, nonce) do nothing
  `;
}

export type RoundRow = {
  id: string;
  season_id: string;
  game: string;
  nonce: number;
  client_seed: string;
  layout: unknown;
  progress: unknown;
  status: string;
  points: number;
};

/**
 * Open an interactive round.
 *
 * The partial unique index on (user_id, game) where status = 'live' is what
 * makes this safe: without it a player could open many rounds against one
 * drop each, play them all, and bank only the ones that went well.
 */
export async function openRound(
  sql: Sql,
  round: {
    id: string;
    userId: string;
    seasonId: string;
    game: string;
    nonce: number;
    clientSeed: string;
    layout: unknown;
  },
): Promise<RoundRow | null> {
  const rows = await sql<RoundRow>`
    insert into game_rounds (id, user_id, season_id, game, nonce, client_seed, layout, progress)
    values (${round.id}, ${round.userId}, ${round.seasonId}, ${round.game}, ${round.nonce},
            ${round.clientSeed}, ${JSON.stringify(round.layout)}::jsonb, '{}'::jsonb)
    on conflict do nothing
    returning id, season_id, game, nonce, client_seed, layout, progress, status, points
  `;
  return rows[0] ?? null;
}

export async function readLiveRound(
  sql: Sql,
  userId: string,
  game: string,
): Promise<RoundRow | null> {
  const rows = await sql<RoundRow>`
    select id, season_id, game, nonce, client_seed, layout, progress, status, points
    from game_rounds
    where user_id = ${userId} and game = ${game} and status = 'live'
  `;
  return rows[0] ?? null;
}

/**
 * Advance a live round's progress.
 *
 * Guarded on `status = 'live'` so a reveal racing a bank cannot resurrect a
 * finished round; a null return means the round already closed.
 */
export async function advanceRound(
  sql: Sql,
  roundId: string,
  userId: string,
  progress: unknown,
): Promise<RoundRow | null> {
  const rows = await sql<RoundRow>`
    update game_rounds
    set progress = ${JSON.stringify(progress)}::jsonb
    where id = ${roundId} and user_id = ${userId} and status = 'live'
    returning id, season_id, game, nonce, client_seed, layout, progress, status, points
  `;
  return rows[0] ?? null;
}

/**
 * Close a round exactly once.
 *
 * Also guarded on `status = 'live'`, so two concurrent bank requests cannot
 * both settle and award points twice.
 */
export async function closeRound(
  sql: Sql,
  roundId: string,
  userId: string,
  status: "banked" | "bust",
  points: number,
  progress: unknown,
): Promise<RoundRow | null> {
  const rows = await sql<RoundRow>`
    update game_rounds
    set status = ${status}, points = ${points}, closed_at = now(),
        progress = ${JSON.stringify(progress)}::jsonb
    where id = ${roundId} and user_id = ${userId} and status = 'live'
    returning id, season_id, game, nonce, client_seed, layout, progress, status, points
  `;
  return rows[0] ?? null;
}

/* ---------------------------------------------------------------- ad flow */

export async function mintAdToken(
  sql: Sql,
  token: string,
  userId: string,
  seasonId: string,
  placement: string,
  expiresAt: Date,
): Promise<void> {
  await sql`
    insert into ad_tokens (token, user_id, season_id, placement, expires_at)
    values (${token}, ${userId}, ${seasonId}, ${placement}, ${expiresAt.toISOString()})
  `;
}

/** Consume an ad token exactly once, in the same statement that reads it. */
export async function consumeAdToken(
  sql: Sql,
  token: string,
): Promise<{ user_id: string; season_id: string; placement: string } | null> {
  const rows = await sql<{ user_id: string; season_id: string; placement: string }>`
    update ad_tokens
    set consumed_at = now()
    where token = ${token} and consumed_at is null and expires_at > now()
    returning user_id, season_id, placement
  `;
  return rows[0] ?? null;
}

/**
 * Record a confirmed ad view.
 *
 * Returns null when this provider/transaction pair has already been recorded.
 * Ad networks retry callbacks as a matter of course, so this insert is the
 * idempotency gate and must happen *before* any drops are credited.
 */
export async function recordAdView(
  sql: Sql,
  view: {
    id: string;
    userId: string;
    seasonId: string;
    day: string;
    placement: string;
    provider: string;
    networkTxnId: string;
    dropsGranted: number;
    revenueUsd?: number;
  },
): Promise<{ id: string } | null> {
  const rows = await sql<{ id: string }>`
    insert into ad_views (id, user_id, season_id, day, placement, provider,
                          network_txn_id, drops_granted, revenue_usd)
    values (${view.id}, ${view.userId}, ${view.seasonId}, ${view.day}, ${view.placement},
            ${view.provider}, ${view.networkTxnId}, ${view.dropsGranted},
            ${view.revenueUsd ?? null})
    on conflict (provider, network_txn_id) do nothing
    returning id
  `;
  return rows[0] ?? null;
}
