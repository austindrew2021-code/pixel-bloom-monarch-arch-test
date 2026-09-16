import assert from "node:assert/strict";
import test from "node:test";
import { createStream } from "../games/rng.ts";
import { TARGET_EV } from "../games/types.ts";
import * as bj from "./blackjack.ts";
import { cardCatalog, cardCatalogSize, cardTitleById } from "./catalog.ts";
import {
  DECK_SIZE, HAND_CATEGORIES, compareHands, deal, rankHand, rankOf, suitOf,
} from "./deck.ts";
import * as table from "./table-card.ts";
import * as vp from "./video-poker.ts";

const SEED = "cards-test";

/** Build a card from rank 0..12 and suit 0..3. */
const C = (rank: number, suit: number) => rank * 4 + suit;

/* -------------------------------------------------------------- the deck */

test("a deal is distinct cards from inside the deck", async () => {
  for (let nonce = 0; nonce < 80; nonce += 1) {
    const stream = await createStream(SEED, "deal", nonce, 512);
    const cards = deal(stream, 7);
    assert.equal(cards.length, 7);
    assert.equal(new Set(cards).size, 7, "the same card was dealt twice");
    for (const card of cards) assert.ok(card >= 0 && card < DECK_SIZE);
  }
});

test("dealing more than the deck holds is refused", async () => {
  const stream = await createStream(SEED, "over", 0, 512);
  assert.throws(() => deal(stream, 53), /more cards than/);
});

test("every card in the deck can be dealt", async () => {
  const seen = new Set<number>();
  for (let nonce = 0; nonce < 400; nonce += 1) {
    const stream = await createStream(SEED, "spread", nonce, 512);
    for (const card of deal(stream, 5)) seen.add(card);
  }
  assert.equal(seen.size, DECK_SIZE, "some cards never come out");
});

/* ------------------------------------------------------- hand evaluation */

test("each poker category is recognised", () => {
  const cases: [string, number[]][] = [
    ["royal-flush", [C(12, 0), C(11, 0), C(10, 0), C(9, 0), C(8, 0)]],
    ["straight-flush", [C(7, 1), C(6, 1), C(5, 1), C(4, 1), C(3, 1)]],
    ["four-of-a-kind", [C(5, 0), C(5, 1), C(5, 2), C(5, 3), C(9, 0)]],
    ["full-house", [C(5, 0), C(5, 1), C(5, 2), C(9, 0), C(9, 1)]],
    ["flush", [C(12, 2), C(9, 2), C(6, 2), C(3, 2), C(1, 2)]],
    ["straight", [C(7, 0), C(6, 1), C(5, 2), C(4, 3), C(3, 0)]],
    ["three-of-a-kind", [C(5, 0), C(5, 1), C(5, 2), C(9, 0), C(2, 1)]],
    ["two-pair", [C(5, 0), C(5, 1), C(9, 2), C(9, 3), C(2, 0)]],
    ["pair", [C(5, 0), C(5, 1), C(9, 2), C(7, 3), C(2, 0)]],
    ["high-card", [C(12, 0), C(9, 1), C(6, 2), C(4, 3), C(2, 0)]],
  ];
  for (const [expected, cards] of cases) {
    assert.equal(rankHand(cards).category, expected, `${expected} misread`);
  }
});

test("the wheel straight is recognised with the ace playing low", () => {
  // A-2-3-4-5 is the one straight where the ace is not the top card; a check
  // that only looks for consecutive ranks misses it entirely.
  assert.equal(rankHand([C(12, 0), C(0, 1), C(1, 2), C(2, 3), C(3, 0)]).category, "straight");
  assert.equal(rankHand([C(12, 0), C(0, 0), C(1, 0), C(2, 0), C(3, 0)]).category, "straight-flush");
  // And A-K-Q-J-10 is still the royal, not a wheel.
  assert.equal(rankHand([C(12, 0), C(11, 0), C(10, 0), C(9, 0), C(8, 0)]).category, "royal-flush");
});

test("an almost-straight is not a straight", () => {
  assert.equal(rankHand([C(7, 0), C(6, 1), C(5, 2), C(4, 3), C(2, 0)]).category, "high-card");
  // King-ace does not wrap round to two.
  assert.equal(rankHand([C(11, 0), C(12, 1), C(0, 2), C(1, 3), C(2, 0)]).category, "high-card");
});

test("categories order from weakest to strongest", () => {
  const ordered = HAND_CATEGORIES.map((category, index) => ({ category, index }));
  for (const { category, index } of ordered) {
    assert.equal(HAND_CATEGORIES.indexOf(category), index);
  }
  const pair = rankHand([C(5, 0), C(5, 1), C(9, 2), C(7, 3), C(2, 0)]);
  const trips = rankHand([C(5, 0), C(5, 1), C(5, 2), C(9, 0), C(2, 1)]);
  assert.ok(compareHands(trips, pair) > 0);
  // Higher pair beats lower pair.
  const lowPair = rankHand([C(2, 0), C(2, 1), C(9, 2), C(7, 3), C(5, 0)]);
  assert.ok(compareHands(pair, lowPair) > 0);
});

test("rankHand insists on five cards", () => {
  assert.throws(() => rankHand([C(5, 0), C(5, 1)]), /five cards/);
});

/* ---------------------------------------------------------- video poker */

test("every paytable family is calibrated to the shared value", async () => {
  // The scales are measured against the reference strategy, so this replays
  // that strategy and checks each family still lands near target. A wide band:
  // the royal flush is one hand in forty thousand and dominates the mean.
  for (const family of vp.FAMILIES) {
    const runs = 4000;
    let total = 0;
    for (let nonce = 0; nonce < runs; nonce += 1) {
      const stream = await createStream("vp-check", family.id, nonce, vp.BYTE_BUDGET);
      total += vp.playReference(stream, family).points;
    }
    const mean = total / runs;
    assert.ok(
      mean > TARGET_EV * 0.45 && mean < TARGET_EV * 1.8,
      `${family.id} sampled ${mean.toFixed(1)} against ${TARGET_EV}`,
    );
  }
});

test("every family has a scale and a full paytable", () => {
  for (const family of vp.FAMILIES) {
    assert.ok(vp.scaleFor(family.id) > 0, `${family.id} has no scale`);
    for (const category of ["three-of-a-kind", "straight", "flush", "full-house",
      "four-of-a-kind", "straight-flush", "royal-flush"] as const) {
      assert.ok((family.table[category] ?? 0) > 0, `${family.id} does not pay ${category}`);
    }
  }
});

test("a paying pair must meet the family's minimum rank", () => {
  const jacks = vp.FAMILIES.find((f) => f.id === "jacks-or-better")!;
  const pairOfJacks = [C(9, 0), C(9, 1), C(5, 2), C(3, 3), C(1, 0)];
  const pairOfTens = [C(8, 0), C(8, 1), C(5, 2), C(3, 3), C(1, 0)];
  assert.ok(vp.handPay(jacks, pairOfJacks) > 0, "jacks should pay");
  assert.equal(vp.handPay(jacks, pairOfTens), 0, "tens should not");

  const tens = vp.FAMILIES.find((f) => f.id === "tens-or-better")!;
  assert.ok(vp.handPay(tens, pairOfTens) > 0, "tens should pay in its own family");
});

test("the reference strategy holds the obvious hands", () => {
  const family = vp.FAMILIES[0]!;
  const allTrue = (hold: boolean[]) => hold.every(Boolean);
  // A made flush stands.
  assert.ok(allTrue(vp.referenceHold(family, [C(12, 2), C(9, 2), C(6, 2), C(3, 2), C(1, 2)])));
  // A made straight stands.
  assert.ok(allTrue(vp.referenceHold(family, [C(7, 0), C(6, 1), C(5, 2), C(4, 3), C(3, 0)])));
  // Trips keep the three and redraw two.
  const trips = vp.referenceHold(family, [C(5, 0), C(5, 1), C(5, 2), C(9, 0), C(2, 1)]);
  assert.deepEqual(trips, [true, true, true, false, false]);
  // Four to a flush keeps the four.
  const fourFlush = vp.referenceHold(family, [C(12, 2), C(9, 2), C(6, 2), C(3, 2), C(1, 0)]);
  assert.deepEqual(fourFlush, [true, true, true, true, false]);
  // A junk hand with no high card keeps nothing.
  const junk = vp.referenceHold(family, [C(0, 0), C(2, 1), C(4, 2), C(6, 3), C(1, 0)]);
  assert.ok(junk.every((h) => !h));
});

test("a draw never duplicates a card already on the table", async () => {
  for (let nonce = 0; nonce < 200; nonce += 1) {
    const stream = await createStream(SEED, "vp-draw", nonce, vp.BYTE_BUDGET);
    const dealt = vp.dealHand(stream);
    const held = [true, false, false, false, false];
    const final = vp.drawReplacements(stream, dealt, held);
    assert.equal(new Set(final).size, 5, `nonce ${nonce} produced a duplicate`);
    assert.equal(final[0], dealt[0], "a held card must not change");
  }
});

/* ------------------------------------------------------------ blackjack */

test("hand totals demote aces only as far as needed", () => {
  const A = C(12, 0);
  const K = C(11, 0);
  // Ace plus ten is soft 21: the ace is still counted high, which is what
  // "soft" means. It only goes hard when a card forces the ace down to one.
  assert.deepEqual(bj.handValue([A, K]), { total: 21, soft: true, busted: false });
  assert.deepEqual(bj.handValue([A, C(4, 0)]), { total: 17, soft: true, busted: false });
  // Two aces: one stays high.
  assert.deepEqual(bj.handValue([A, C(12, 1)]), { total: 12, soft: true, busted: false });
  // Soft seventeen goes hard when a ten lands.
  assert.deepEqual(bj.handValue([A, C(4, 0), K]), { total: 17, soft: false, busted: false });
  assert.equal(bj.handValue([K, C(9, 1), C(4, 2)]).busted, true);
});

test("face cards are ten and a natural is two cards", () => {
  for (const rank of [8, 9, 10, 11]) assert.equal(bj.cardValue(C(rank, 0)), 10);
  assert.equal(bj.cardValue(C(12, 0)), 11);
  assert.equal(bj.cardValue(C(0, 0)), 2);
  assert.equal(bj.isBlackjack([C(12, 0), C(11, 1)]), true);
  // Twenty-one on three cards is not a natural.
  assert.equal(bj.isBlackjack([C(5, 0), C(5, 1), C(9, 2)]), false);
});

test("legal actions follow the rule set", () => {
  const classic = bj.RULE_SETS.find((r) => r.id === "classic")!;
  const noSplit = bj.RULE_SETS.find((r) => r.id === "no-split")!;
  const pair = [C(7, 0), C(7, 1)];
  assert.ok(bj.legalActions(classic, pair, false).includes("split"));
  assert.ok(!bj.legalActions(noSplit, pair, false).includes("split"));
  // Split is offered once, not again.
  assert.ok(!bj.legalActions(classic, pair, true).includes("split"));
  // Doubling is a two-card action only.
  assert.ok(!bj.legalActions(classic, [C(2, 0), C(3, 1), C(1, 2)], false).includes("double"));
  // A busted hand has nothing left.
  assert.deepEqual(bj.legalActions(classic, [C(11, 0), C(10, 1), C(9, 2)], false), []);
});

test("restricted doubling is honoured", () => {
  const downtown = bj.RULE_SETS.find((r) => r.id === "downtown")!;
  // Downtown allows doubling on 9, 10 and 11 only.
  assert.ok(bj.legalActions(downtown, [C(3, 0), C(4, 1)], false).includes("double"), "10 may double");
  // Three plus five is eight, which is outside the allowed totals.
  assert.ok(!bj.legalActions(downtown, [C(1, 0), C(3, 1)], false).includes("double"), "8 may not");
});

test("basic strategy makes the standard calls", () => {
  const rules = bj.RULE_SETS.find((r) => r.id === "classic")!;
  const ten = C(8, 0);
  const six = C(4, 0);
  // Always split aces and eights; never split tens.
  assert.equal(bj.basicStrategy(rules, [C(12, 0), C(12, 1)], ten, false), "split");
  assert.equal(bj.basicStrategy(rules, [C(6, 0), C(6, 1)], ten, false), "split");
  assert.notEqual(bj.basicStrategy(rules, [C(8, 0), C(8, 1)], six, false), "split");
  // Hard seventeen stands, hard twelve hits against a high card.
  assert.equal(bj.basicStrategy(rules, [C(9, 0), C(5, 1)], ten, true), "stand");
  assert.equal(bj.basicStrategy(rules, [C(8, 0), C(0, 1)], ten, true), "hit");
  // Twelve stands against a dealer bust card.
  assert.equal(bj.basicStrategy(rules, [C(8, 0), C(0, 1)], six, true), "stand");
  // Eleven doubles.
  assert.equal(bj.basicStrategy(rules, [C(4, 0), C(3, 1)], six, true), "double");
  // Soft nineteen stands.
  assert.equal(bj.basicStrategy(rules, [C(12, 0), C(6, 1)], ten, true), "stand");
});

test("the dealer draws and stands by the rules", () => {
  const stands = bj.RULE_SETS.find((r) => r.id === "classic")!;
  const hits = bj.RULE_SETS.find((r) => r.id === "vegas")!;
  const softSeventeen = [C(12, 0), C(4, 1)];

  const standing = [...softSeventeen];
  bj.playDealer(stands, standing, [C(0, 2)], 0);
  assert.equal(standing.length, 2, "a stand-on-soft-17 dealer must not draw");

  const hitting = [...softSeventeen];
  bj.playDealer(hits, hitting, [C(0, 2)], 0);
  assert.equal(hitting.length, 3, "a hit-on-soft-17 dealer must draw");
});

test("the dealer draws to sixteen and stops at hard seventeen", () => {
  const rules = bj.RULE_SETS.find((r) => r.id === "classic")!;
  const hand = [C(8, 0), C(4, 1)]; // hard 16
  bj.playDealer(rules, hand, [C(0, 2), C(0, 3)], 0);
  assert.ok(hand.length > 2, "sixteen must draw");
  const made = [C(8, 0), C(5, 1)]; // hard 17
  bj.playDealer(rules, made, [C(0, 2)], 0);
  assert.equal(made.length, 2, "hard seventeen must stand");
});

test("outcomes settle the way the table would", () => {
  const twenty = [C(8, 0), C(8, 1)];
  const nineteen = [C(8, 2), C(7, 3)];
  const bust = [C(11, 0), C(10, 1), C(9, 2)];
  const natural = [C(12, 0), C(11, 1)];

  assert.equal(bj.outcomeOf(twenty, nineteen, false), "win");
  assert.equal(bj.outcomeOf(nineteen, twenty, false), "lose");
  assert.equal(bj.outcomeOf(twenty, twenty, false), "push");
  assert.equal(bj.outcomeOf(twenty, bust, false), "win");
  assert.equal(bj.outcomeOf(bust, twenty, false), "lose", "a busted player loses even to a bust");
  assert.equal(bj.outcomeOf(natural, twenty, true), "blackjack");
  // Natural against natural is a push, not a win.
  assert.equal(bj.outcomeOf(natural, [C(12, 2), C(11, 3)], true), "push");
});

test("a natural pays the rule set's premium", () => {
  const classic = bj.RULE_SETS.find((r) => r.id === "classic")!;
  const short = bj.RULE_SETS.find((r) => r.id === "short-pay")!;
  assert.equal(bj.handReturn(classic, "blackjack", 1), 2.5);
  assert.equal(bj.handReturn(short, "blackjack", 1), 2.2);
  assert.equal(bj.handReturn(classic, "win", 1), 2);
  assert.equal(bj.handReturn(classic, "push", 1), 1);
  assert.equal(bj.handReturn(classic, "lose", 1), 0);
});

test("every rule set has a scale near the shared value", () => {
  // The scales come from simulating basic strategy; a real blackjack game
  // returns 97-99.5%, so the scales should sit just above the target.
  for (const rules of bj.RULE_SETS) {
    const scale = bj.scaleFor(rules.id);
    assert.ok(scale > TARGET_EV * 0.9 && scale < TARGET_EV * 1.15, `${rules.id} scale ${scale}`);
  }
});

/* ----------------------------------------------------------- table games */

test("every table game's options form a complete distribution", () => {
  for (const game of table.TABLE_GAMES) {
    const total = game.options.reduce((sum, option) => sum + option.chance, 0);
    assert.ok(Math.abs(total - 1) < 0.01, `${game.id} options sum to ${total}`);
    assert.equal(new Set(game.options.map((o) => o.id)).size, game.options.length);
  }
});

test("every bet on every table is worth the same", () => {
  for (const game of table.TABLE_GAMES) {
    for (const option of game.options) {
      const ev = table.expectedPoints(option);
      assert.ok(
        Math.abs(ev - TARGET_EV) < TARGET_EV * 0.02,
        `${game.id}/${option.id} pays ${ev.toFixed(2)}`,
      );
    }
  }
});

test("a longer shot pays more on every table", () => {
  for (const game of table.TABLE_GAMES) {
    const sorted = [...game.options].sort((a, b) => a.chance - b.chance);
    for (let i = 1; i < sorted.length; i += 1) {
      assert.ok(
        table.winPoints(sorted[i - 1]!) >= table.winPoints(sorted[i]!),
        `${game.id}: ${sorted[i - 1]!.id} should pay at least ${sorted[i]!.id}`,
      );
    }
  }
});

test("a deal always resolves to a real option", async () => {
  for (const game of table.TABLE_GAMES) {
    for (let nonce = 0; nonce < 80; nonce += 1) {
      const stream = await createStream(SEED, game.id, nonce, table.BYTE_BUDGET);
      const cards = deal(stream, game.cards);
      const outcome = game.resolve(cards);
      assert.ok(outcome !== null, `${game.id} resolved to nothing`);
      assert.ok(
        game.options.some((option) => option.id === outcome),
        `${game.id} resolved to an option that does not exist: ${outcome}`,
      );
    }
  }
});

test("observed outcomes track the published chances", async () => {
  // If a table's stated odds drifted from what its resolver actually does, the
  // payouts would be wrong while still looking calibrated on paper.
  for (const game of table.TABLE_GAMES) {
    const runs = 4000;
    const counts = new Map<string, number>();
    for (let nonce = 0; nonce < runs; nonce += 1) {
      const stream = await createStream("table-odds", game.id, nonce, table.BYTE_BUDGET);
      const outcome = game.resolve(deal(stream, game.cards));
      if (outcome) counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
    }
    for (const option of game.options) {
      const observed = (counts.get(option.id) ?? 0) / runs;
      assert.ok(
        Math.abs(observed - option.chance) < 0.06,
        `${game.id}/${option.id}: observed ${observed.toFixed(3)} against stated ${option.chance}`,
      );
    }
  }
});

test("a table game pays only the bet that came in", async () => {
  const game = table.tableGameById("casino-war")!;
  for (let nonce = 0; nonce < 120; nonce += 1) {
    const stream = await createStream(SEED, "war", nonce, table.BYTE_BUDGET);
    const result = table.play(stream, game, "player");
    const detail = result.detail as unknown as table.TableCardDetail;
    assert.equal(detail.won, detail.outcome === "player");
    assert.equal(
      result.points,
      table.PARTICIPATION_POINTS + (detail.won ? table.winPoints(game.options[0]!) : 0),
    );
  }
});

test("an unknown bet is refused", async () => {
  const stream = await createStream(SEED, "bad-bet", 0, table.BYTE_BUDGET);
  const game = table.tableGameById("baccarat")!;
  assert.throws(() => table.play(stream, game, "dragon"), /not a bet/);
});

/* -------------------------------------------------------------- catalogue */

test("the card room holds exactly eighty titles", () => {
  assert.equal(cardCatalogSize(), 80);
  const all = cardCatalog();
  assert.equal(new Set(all.map((t) => t.id)).size, 80);
  assert.equal(new Set(all.map((t) => t.name)).size, 80);
});

test("every title points at a variant its engine knows", () => {
  for (const title of cardCatalog()) {
    if (title.family === "video-poker") {
      assert.ok(vp.FAMILIES.some((f) => f.id === title.variant), title.id);
      assert.ok([1, 3, 5].includes(title.hands), title.id);
    } else if (title.family === "blackjack") {
      assert.ok(bj.RULE_SETS.some((r) => r.id === title.variant), title.id);
    } else if (title.family === "table") {
      assert.ok(table.tableGameById(title.variant), title.id);
    } else {
      assert.ok(["standard", "storm", "night"].includes(title.variant), title.id);
    }
  }
});

test("titles can be looked up and invented ones cannot", () => {
  assert.ok(cardTitleById("vp-jacks-or-better-1"));
  assert.ok(cardTitleById("viking"));
  assert.equal(cardTitleById("vp-not-a-game-1"), null);
});

test("card helpers agree on rank and suit", () => {
  for (let card = 0; card < DECK_SIZE; card += 1) {
    assert.equal(card, rankOf(card) * 4 + suitOf(card));
  }
});
