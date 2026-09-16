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
