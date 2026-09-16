/**
 * Server functions for the card room and the two voyage games.
 *
 * Single-call games (the tables, Viking) resolve in one request. The ones with
 * decisions (video poker's draw, blackjack, Carrier Run) open a round whose
 * whole outcome is fixed from the seed and is revealed a step at a time — the
 * pattern Mines established and every interactive game here follows.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { dayKey, dropsRemaining } from "./allowance.ts";
import { randomSeed } from "./fair.ts";
import { createStream } from "./games/rng.ts";
import * as carrier from "./games/carrier.ts";
import * as viking from "./games/viking.ts";
import * as bj from "./cards/blackjack.ts";
import { cardCatalog, cardTitleById, type CardTitle } from "./cards/catalog.ts";
import * as table from "./cards/table-card.ts";
import * as vp from "./cards/video-poker.ts";
import {
  addScore, advanceRound, claimDrop, claimNonce, closeRound,
  openRound, readLiveRound, recordPlay, type RoundRow,
} from "./queries.ts";
import { ensurePlayer, ensureSeason, readServerSeed } from "./server-shared.ts";

const nid = () => crypto.randomUUID();

/** Claim a play and a nonce. Shared by everything in this module. */
async function begin(userId: string) {
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

function remaining(allowance: { used: number; bonus_granted: number }) {
  return dropsRemaining({ used: allowance.used, bonusGranted: allowance.bonus_granted });
}

function titleOr404(id: string): CardTitle {
  const title = cardTitleById(id);
  if (!title) throw new Error("No such game.");
  return title;
}

/** The catalogue, for browsing. Static — no player state involved. */
export const getCardLobby = createServerFn({ method: "GET" }).handler(async () => ({
  total: cardCatalog().length,
  games: cardCatalog(),
}));

/** Reference details a title's info panel shows. */
export const getCardInfo = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ titleId: z.string().trim() }))
  .handler(async ({ data }) => {
    const title = titleOr404(data.titleId);
    if (title.family === "video-poker") {
      const family = vp.FAMILIES.find((f) => f.id === title.variant)!;
      return { title, paytable: family.table, minPayingPair: family.minPayingPair, options: null };
    }
    if (title.family === "blackjack") {
      const rules = bj.RULE_SETS.find((r) => r.id === title.variant)!;
      return { title, paytable: null, minPayingPair: null, options: null, rules };
    }
    if (title.family === "table") {
      const game = table.tableGameById(title.variant)!;
      return {
        title,
        paytable: null,
        minPayingPair: null,
        options: game.options.map((option) => ({
          ...option,
          pays: table.winPoints(option),
        })),
      };
    }
    return { title, paytable: null, minPayingPair: null, options: null };
  });

/* ---------------------------------------------------- single-call games */

export const playTableCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ titleId: z.string().trim(), bet: z.string().trim() }))
  .handler(async ({ context, data }) => {
    const title = titleOr404(data.titleId);
    if (title.family !== "table") throw new Error("That game is not played that way.");
    const game = table.tableGameById(title.variant)!;
    if (!table.optionById(game, data.bet)) throw new Error("That is not a bet on this table.");

    const { sql, season, allowance, clientSeed, nonce, serverSeed } = await begin(context.userId);
    const stream = await createStream(serverSeed, clientSeed, nonce, table.BYTE_BUDGET);
    const result = table.play(stream, game, data.bet);

    await recordPlay(sql, {
      id: nid(), userId: context.userId, seasonId: season.id,
      game: `card:${title.id}`, nonce, clientSeed,
      points: result.points, detail: result.detail,
    });
    const scored = await addScore(sql, context.userId, season.id, result.points);
    return {
      titleId: title.id, points: result.points, detail: result.detail,
      total: scored.points, remaining: remaining(allowance),
    };
  });

export const playViking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ titleId: z.string().trim() }))
  .handler(async ({ context, data }) => {
    const title = titleOr404(data.titleId);
    if (title.family !== "viking") throw new Error("That game is not played that way.");

    const { sql, season, allowance, clientSeed, nonce, serverSeed } = await begin(context.userId);
    const stream = await createStream(serverSeed, clientSeed, nonce, viking.BYTE_BUDGET);
    const result = viking.play(stream);

    await recordPlay(sql, {
      id: nid(), userId: context.userId, seasonId: season.id,
      game: `card:${title.id}`, nonce, clientSeed,
      points: result.points, detail: result.detail,
    });
    const scored = await addScore(sql, context.userId, season.id, result.points);
    return {
      titleId: title.id, points: result.points, detail: result.detail,
      total: scored.points, remaining: remaining(allowance),
    };
  });

/* ------------------------------------------------------------ video poker */

type PokerLayout = { dealt: number[]; draws: number[][]; familyId: string; hands: number };
type PokerProgress = { held: boolean[] | null };

function pokerLayout(value: unknown): PokerLayout {
  const layout = value as PokerLayout;
  if (!layout || !Array.isArray(layout.dealt)) throw new Error("Round is corrupt.");
  return layout;
}

/**
 * The client's view: the five dealt cards and what the reference strategy would
 * keep. The replacement cards stay server-side until the draw is called.
 */
function pokerView(round: RoundRow, layout: PokerLayout) {
  const family = vp.FAMILIES.find((f) => f.id === layout.familyId)!;
  return {
    roundId: round.id,
    dealt: layout.dealt,
    hands: layout.hands,
    suggested: vp.referenceHold(family, layout.dealt),
    familyId: layout.familyId,
  };
}

export const getPokerRound = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "videopoker");
    if (!round) return null;
    return pokerView(round, pokerLayout(round.layout));
  });

export const dealPoker = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ titleId: z.string().trim() }))
  .handler(async ({ context, data }) => {
    const title = titleOr404(data.titleId);
    if (title.family !== "video-poker") throw new Error("That game is not played that way.");

    const sql = await getSql();
    const existing = await readLiveRound(sql, context.userId, "videopoker");
    if (existing) return pokerView(existing, pokerLayout(existing.layout));

    const { season, clientSeed, nonce, serverSeed } = await begin(context.userId);
    const stream = await createStream(serverSeed, clientSeed, nonce, vp.BYTE_BUDGET * title.hands);
    const dealt = vp.dealHand(stream);
    // Every hand's replacements are drawn now, so the draw itself reveals
    // rather than decides. A multi-hand title draws a set per hand.
    const draws: number[][] = [];
    for (let hand = 0; hand < title.hands; hand += 1) {
      draws.push(Array.from({ length: 5 }, () => stream.nextInt(52)));
    }

    const round = await openRound(sql, {
      id: nid(), userId: context.userId, seasonId: season.id, game: "videopoker",
      nonce, clientSeed,
      layout: { dealt, draws, familyId: title.variant, hands: title.hands } satisfies PokerLayout,
    });
    if (!round) throw new Error("You already have a hand in progress.");
    return pokerView(round, pokerLayout(round.layout));
  });

export const drawPoker = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ held: z.array(z.boolean()).length(5) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "videopoker");
    if (!round) throw new Error("No hand in progress.");

    const layout = pokerLayout(round.layout);
    const family = vp.FAMILIES.find((f) => f.id === layout.familyId)!;
    const scale = vp.scaleFor(family.id);

    // Replacements come from the cards drawn at deal time, skipping any that
    // would duplicate what is on the table.
    const finals: number[][] = [];
    let points = 0;
    for (let hand = 0; hand < layout.hands; hand += 1) {
      const used = new Set(layout.dealt.filter((_, i) => data.held[i]));
      const source = layout.draws[hand] ?? [];
      const final = [...layout.dealt];
      let cursor = 0;
      for (let i = 0; i < 5; i += 1) {
        if (data.held[i]) continue;
        let card = source[cursor] ?? 0;
        // Walk forward until an unused card turns up; the pool is large enough
        // that this terminates immediately in practice.
        let guard = 0;
        while (used.has(card) && guard < 52) {
          card = (card + 1) % 52;
          guard += 1;
        }
        used.add(card);
        final[i] = card;
        cursor += 1;
      }
      finals.push(final);
      points += vp.settle(family, scale, layout.dealt, data.held, final).points;
    }
    // A multi-hand title deals more hands off one play, so each is worth a
    // proportional share rather than a multiple.
    points = Math.round(points / layout.hands);

    const closed = await closeRound(sql, round.id, context.userId, "banked", points, {
      held: data.held,
    } satisfies PokerProgress as unknown as Record<string, unknown>);
    if (!closed) throw new Error("That hand already finished.");

    await recordPlay(sql, {
      id: nid(), userId: context.userId, seasonId: round.season_id,
      game: `card:vp-${family.id}-${layout.hands}`, nonce: round.nonce,
      clientSeed: round.client_seed, points,
      detail: { dealt: layout.dealt, held: data.held, finals, familyId: family.id },
    });
    const scored = await addScore(sql, context.userId, round.season_id, points);
    return { finals, held: data.held, points, total: scored.points };
  });

/* -------------------------------------------------------------- blackjack */

type BjLayout = { shoe: number[]; ruleId: string };
type BjProgress = { player: number[]; dealer: number[]; cursor: number; stood: boolean };

function bjLayout(value: unknown): BjLayout {
  const layout = value as BjLayout;
  if (!layout || !Array.isArray(layout.shoe)) throw new Error("Round is corrupt.");
  return layout;
}

function bjProgress(value: unknown): BjProgress {
  const progress = value as BjProgress | null;
  return {
    player: progress?.player ?? [],
    dealer: progress?.dealer ?? [],
    cursor: progress?.cursor ?? 0,
    stood: progress?.stood ?? false,
  };
}

/** The player's hand, the dealer's up card, and what basic strategy advises. */
function bjView(round: RoundRow, layout: BjLayout, progress: BjProgress) {
  const rules = bj.RULE_SETS.find((r) => r.id === layout.ruleId)!;
  const value = bj.handValue(progress.player);
  return {
    roundId: round.id,
    player: progress.player,
    playerTotal: value.total,
    playerSoft: value.soft,
    // Only the up card while the hand is live; the hole card stays down.
    dealerUp: progress.dealer[0]!,
    actions: bj.legalActions(rules, progress.player, false),
    suggested: bj.basicStrategy(rules, progress.player, progress.dealer[0]!, false),
    ruleId: rules.id,
  };
}

export const getBlackjackRound = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "blackjack");
    if (!round) return null;
    return bjView(round, bjLayout(round.layout), bjProgress(round.progress));
  });

export const dealBlackjack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ titleId: z.string().trim() }))
  .handler(async ({ context, data }) => {
    const title = titleOr404(data.titleId);
    if (title.family !== "blackjack") throw new Error("That game is not played that way.");

    const sql = await getSql();
    const existing = await readLiveRound(sql, context.userId, "blackjack");
    if (existing) return bjView(existing, bjLayout(existing.layout), bjProgress(existing.progress));

    const { season, clientSeed, nonce, serverSeed } = await begin(context.userId);
    const stream = await createStream(serverSeed, clientSeed, nonce, bj.BYTE_BUDGET);
    const shoe = bj.dealShoe(stream);
    const progress: BjProgress = {
      player: [shoe[0]!, shoe[2]!],
      dealer: [shoe[1]!, shoe[3]!],
      cursor: 4,
      stood: false,
    };

    const round = await openRound(sql, {
      id: nid(), userId: context.userId, seasonId: season.id, game: "blackjack",
      nonce, clientSeed, layout: { shoe, ruleId: title.variant } satisfies BjLayout,
    });
    if (!round) throw new Error("You already have a hand in progress.");
    const advanced = await advanceRound(sql, round.id, context.userId, progress);
    if (!advanced) throw new Error("Could not deal.");
    return bjView(advanced, bjLayout(advanced.layout), progress);
  });

export const actBlackjack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ action: z.string().trim() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "blackjack");
    if (!round) throw new Error("No hand in progress.");

    const layout = bjLayout(round.layout);
    const rules = bj.RULE_SETS.find((r) => r.id === layout.ruleId)!;
    const progress = bjProgress(round.progress);
    const action = data.action as bj.Action;
    if (!bj.legalActions(rules, progress.player, false).includes(action)) {
      throw new Error("You cannot do that with this hand.");
    }

    let stake = 1;
    if (action === "hit" || action === "double") {
      progress.player.push(layout.shoe[progress.cursor]!);
      progress.cursor += 1;
      if (action === "double") stake = 2;
    }

    const busted = bj.handValue(progress.player).busted;
    const finished = action === "stand" || action === "double" || busted;
    if (!finished) {
      const advanced = await advanceRound(sql, round.id, context.userId, progress);
      if (!advanced) throw new Error("That hand already finished.");
      return { finished: false as const, ...bjView(advanced, layout, progress) };
    }

    // The dealer only plays out a hand that is still alive.
    if (!busted) {
      progress.cursor = bj.playDealer(rules, progress.dealer, layout.shoe, progress.cursor);
    }
    const outcome = bj.outcomeOf(
      progress.player, progress.dealer, bj.isBlackjack(progress.player),
    );
    const rawReturn = bj.handReturn(rules, outcome, stake) / stake;
    const points = Math.max(0, Math.round(rawReturn * bj.scaleFor(rules.id)));

    const closed = await closeRound(sql, round.id, context.userId, "banked", points, progress);
    if (!closed) throw new Error("That hand already finished.");
    await recordPlay(sql, {
      id: nid(), userId: context.userId, seasonId: round.season_id,
      game: `card:bj-${rules.id}`, nonce: round.nonce, clientSeed: round.client_seed,
      points, detail: { player: progress.player, dealer: progress.dealer, outcome, stake },
    });
    const scored = await addScore(sql, context.userId, round.season_id, points);
    return {
      finished: true as const, player: progress.player, dealer: progress.dealer,
      outcome, points, total: scored.points,
    };
  });

/* ---------------------------------------------------------------- carrier */

type CarrierProgress = { path: number[] };

function carrierLayout(value: unknown): carrier.CarrierLayout {
  const layout = value as carrier.CarrierLayout;
  if (!layout || !Array.isArray(layout.grid)) throw new Error("Round is corrupt.");
  return layout;
}

function carrierView(round: RoundRow, path: number[]) {
  return {
    roundId: round.id,
    path,
    sectors: carrier.SECTORS,
    lanes: carrier.LANES,
    multiplier: path.length > 0 ? carrier.multiplierAfter(path.length) : 1,
    bankable: path.length > 0,
    bankPoints: carrier.pointsFor(path.length, false),
    nextPoints: carrier.pointsFor(path.length + 1, path.length + 1 >= carrier.SECTORS),
    safeChance: carrier.safeChance(path.length),
  };
}

export const getCarrierRound = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "carrier");
    if (!round) return null;
    const progress = (round.progress as CarrierProgress | null)?.path ?? [];
    return carrierView(round, progress);
  });

export const openCarrier = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await readLiveRound(sql, context.userId, "carrier");
    if (existing) {
      return carrierView(existing, (existing.progress as CarrierProgress | null)?.path ?? []);
    }
    const { season, clientSeed, nonce, serverSeed } = await begin(context.userId);
    const stream = await createStream(serverSeed, clientSeed, nonce, carrier.BYTE_BUDGET);
    const round = await openRound(sql, {
      id: nid(), userId: context.userId, seasonId: season.id, game: "carrier",
      nonce, clientSeed, layout: carrier.layout(stream),
    });
    if (!round) throw new Error("You already have a run in progress.");
    return carrierView(round, []);
  });

export const flyCarrier = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ lane: z.number().int() }))
  .handler(async ({ context, data }) => {
    if (!carrier.isValidLane(data.lane)) throw new Error("No such lane.");
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "carrier");
    if (!round) throw new Error("No run in progress.");

    const layout = carrierLayout(round.layout);
    const path = (round.progress as CarrierProgress | null)?.path ?? [];
    const sector = path.length;
    if (sector >= carrier.SECTORS) throw new Error("You are already on the deck.");
    const cell = carrier.cellAt(layout, sector, data.lane);

    if (cell === "bomb") {
      const settled = carrier.settle(layout, path, false);
      const closed = await closeRound(sql, round.id, context.userId, "bust", 0, { path });
      if (!closed) throw new Error("That run already finished.");
      await recordPlay(sql, {
        id: nid(), userId: context.userId, seasonId: round.season_id,
        game: "card:carrier", nonce: round.nonce, clientSeed: round.client_seed,
        points: 0, detail: settled.detail,
      });
      return { survived: false as const, cell, grid: layout.grid, points: 0 };
    }

    const next = [...path, data.lane];
    const advanced = await advanceRound(sql, round.id, context.userId, { path: next });
    if (!advanced) throw new Error("That run already finished.");

    if (next.length >= carrier.SECTORS) {
      // The deck banks itself; there is nowhere further to fly.
      const settled = carrier.settle(layout, next, true);
      const closed = await closeRound(
        sql, advanced.id, context.userId, "banked", settled.points, { path: next },
      );
      if (!closed) throw new Error("That run already finished.");
      await recordPlay(sql, {
        id: nid(), userId: context.userId, seasonId: advanced.season_id,
        game: "card:carrier", nonce: advanced.nonce, clientSeed: advanced.client_seed,
        points: settled.points, detail: settled.detail,
      });
      const scored = await addScore(sql, context.userId, advanced.season_id, settled.points);
      return {
        survived: true as const, cell, landed: true as const,
        grid: layout.grid, points: settled.points, total: scored.points,
      };
    }
    return { survived: true as const, cell, ...carrierView(advanced, next) };
  });

export const bankCarrier = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const round = await readLiveRound(sql, context.userId, "carrier");
    if (!round) throw new Error("No run in progress.");
    const layout = carrierLayout(round.layout);
    const path = (round.progress as CarrierProgress | null)?.path ?? [];
    if (path.length === 0) throw new Error("Fly a sector before breaking off.");

    const settled = carrier.settle(layout, path, true);
    const closed = await closeRound(sql, round.id, context.userId, "banked", settled.points, { path });
    if (!closed) throw new Error("That run already finished.");
    await recordPlay(sql, {
      id: nid(), userId: context.userId, seasonId: round.season_id,
      game: "card:carrier", nonce: round.nonce, clientSeed: round.client_seed,
      points: settled.points, detail: settled.detail,
    });
    const scored = await addScore(sql, context.userId, round.season_id, settled.points);
    return { points: settled.points, grid: layout.grid, path, total: scored.points };
  });
