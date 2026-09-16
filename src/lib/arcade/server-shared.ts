/**
 * Helpers shared by every arcade server module.
 *
 * Extracted so the game surface and the original board can open the same
 * season, resolve the same player row and read the same budget without either
 * importing the other's server functions.
 */

import type { Sql } from "@/lib/db";
import type { AllowanceRow } from "./queries.ts";
import { commitServerSeed, randomSeed } from "./fair.ts";
import { PRIZE_LADDER, seasonBounds, seasonId } from "./season.ts";

const HANDLE_WORDS = [
  "amber", "basalt", "cobalt", "dusk", "ember", "flint", "glacier", "harbor",
  "indigo", "juniper", "kestrel", "lumen", "marble", "nimbus", "onyx", "prism",
  "quartz", "ripple", "slate", "tundra", "umber", "vellum", "willow", "zephyr",
];

export function suggestHandle(): string {
  const word = HANDLE_WORDS[Math.floor(Math.random() * HANDLE_WORDS.length)]!;
  return `${word}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export type PlayerRow = {
  user_id: string;
  handle: string;
  wallet_address: string | null;
  prize_blocked: boolean;
};

/** Fetch the caller's player row, creating it on first visit. */
export async function ensurePlayer(sql: Sql, userId: string): Promise<PlayerRow> {
  const existing = await sql<PlayerRow>`
    select user_id, handle, wallet_address, prize_blocked from players where user_id = ${userId}
  `;
  if (existing[0]) return existing[0];

  // Handle collisions are rare but must not hard-fail a first visit.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const handle = suggestHandle();
    const inserted = await sql<PlayerRow>`
      insert into players (user_id, handle) values (${userId}, ${handle})
      on conflict do nothing
      returning user_id, handle, wallet_address, prize_blocked
    `;
    if (inserted[0]) return inserted[0];
    // Either the handle was taken or the player was created concurrently.
    const now = await sql<PlayerRow>`
      select user_id, handle, wallet_address, prize_blocked from players where user_id = ${userId}
    `;
    if (now[0]) return now[0];
  }
  throw new Error("Could not create a player profile. Try again.");
}

export type SeasonRow = {
  id: string;
  opens_at: string;
  closes_at: string;
  server_seed_hash: string;
  status: string;
};

/**
 * Get the current season, opening it if this is the first request of the month.
 *
 * The commitment is written at creation time, before any drop can be played
 * against it — that ordering is the whole point of commit-reveal.
 */
export async function ensureSeason(sql: Sql, now = new Date()): Promise<SeasonRow> {
  const id = seasonId(now);
  const existing = await sql<SeasonRow>`
    select id, opens_at, closes_at, server_seed_hash, status from seasons where id = ${id}
  `;
  if (existing[0]) return existing[0];

  const { opensAt, closesAt } = seasonBounds(id);
  const seed = randomSeed();
  const hash = await commitServerSeed(seed);
  await sql`
    insert into seasons (id, opens_at, closes_at, server_seed_hash, server_seed, status)
    values (${id}, ${opensAt.toISOString()}, ${closesAt.toISOString()}, ${hash}, ${seed}, 'open')
    on conflict (id) do nothing
  `;
  for (const band of PRIZE_LADDER) {
    await sql`
      insert into season_prizes (season_id, rank_from, rank_to, tier, amount_usdc)
      values (${id}, ${band.rankFrom}, ${band.rankTo}, ${band.tier}, ${band.usdc})
      on conflict (season_id, rank_from) do nothing
    `;
  }
  const created = await sql<SeasonRow>`
    select id, opens_at, closes_at, server_seed_hash, status from seasons where id = ${id}
  `;
  if (!created[0]) throw new Error("Could not open the current season.");
  return created[0];
}

/** Read the season's secret seed. Server-only — never widen this to a response. */
export async function readServerSeed(sql: Sql, seasonId: string): Promise<string> {
  const rows = await sql<{ server_seed: string | null }>`
    select server_seed from seasons where id = ${seasonId}
  `;
  const seed = rows[0]?.server_seed;
  if (!seed) throw new Error("Season seed is missing.");
  return seed;
}

export async function readAllowance(sql: Sql, userId: string, day: string): Promise<AllowanceRow> {
  const rows = await sql<AllowanceRow>`
    select used, bonus_granted from drop_allowance where user_id = ${userId} and day = ${day}
  `;
  return rows[0] ?? { used: 0, bonus_granted: 0 };
}

export async function readSeed(sql: Sql, userId: string, season: string) {
  const rows = await sql<{ client_seed: string; nonce: number }>`
    select client_seed, nonce from player_seeds where user_id = ${userId} and season_id = ${season}
  `;
  return rows[0] ?? null;
}

export async function readScore(sql: Sql, userId: string, season: string) {
  const rows = await sql<{ points: number; drops_used: number }>`
    select points, drops_used from season_scores where user_id = ${userId} and season_id = ${season}
  `;
  return rows[0] ?? { points: 0, drops_used: 0 };
}

