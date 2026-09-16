/**
 * The card-room catalogue: 80 titles across five engines.
 *
 * Built the same way the slot catalogue is — one engine per family, with the
 * titles as data — and the axes are honest about which of them change the game
 * and which only change the label:
 *
 *   * Video poker — 12 paytable families × 3 hand counts. Both are mechanical.
 *     The paytable is the game in a real cabinet, and playing three or five
 *     hands off one hold genuinely changes the shape of a session.
 *   * Blackjack — 8 rule sets × 3 tables. The rule sets are mechanical: soft 17,
 *     what a natural pays, where doubling is allowed, whether pairs split. The
 *     table name is presentation.
 *   * Table games — 8 games × 2 rooms. The games are distinct; the room is
 *     presentation.
 *   * Viking Longships and Carrier Run — 1 standard and 1 hard run each, which
 *     changes the track.
 *
 * Everything lands on the arcade's shared value, whichever way it was reached.
 */

import { RULE_SETS } from "./blackjack.ts";
import { TABLE_GAMES } from "./table-card.ts";
import { FAMILIES } from "./video-poker.ts";

export type CardFamily = "video-poker" | "blackjack" | "table" | "viking" | "carrier";

export type CardTitle = {
  id: string;
  name: string;
  family: CardFamily;
  /** The engine-level variant this title runs: a paytable, rule set or game id. */
  variant: string;
  /** Hands dealt at once, for multi-hand video poker. */
  hands: number;
  /** Harder variant of a bespoke game. */
  hard: boolean;
  blurb: string;
  accent: string;
  glyph: string;
};

const HAND_COUNTS = [
  { hands: 1, suffix: "", blurb: "Single hand" },
  { hands: 3, suffix: " Triple", blurb: "Three hands off one hold" },
  { hands: 5, suffix: " Five", blurb: "Five hands off one hold" },
];

const BLACKJACK_TABLES = [
  { suffix: "", accent: "#34d399" },
  { suffix: " Gold", accent: "#fbbf24" },
  { suffix: " Noir", accent: "#a78bfa" },
];

const TABLE_ROOMS = [
  { suffix: "", accent: "#38bdf8" },
  { suffix: " Parlour", accent: "#f472b6" },
];

let cache: CardTitle[] | null = null;

export function cardCatalog(): CardTitle[] {
  if (cache) return cache;
  const titles: CardTitle[] = [];

  for (const family of FAMILIES) {
    for (const count of HAND_COUNTS) {
      titles.push({
        id: `vp-${family.id}-${count.hands}`,
        name: `${family.name}${count.suffix}`,
        family: "video-poker",
        variant: family.id,
        hands: count.hands,
        hard: false,
        blurb: count.blurb,
        accent: "#fbbf24",
        glyph: "♠",
      });
    }
  }

  for (const rules of RULE_SETS) {
    for (const table of BLACKJACK_TABLES) {
      titles.push({
        id: `bj-${rules.id}${table.suffix ? `-${table.suffix.trim().toLowerCase()}` : ""}`,
        name: `Blackjack ${rules.name}${table.suffix}`,
        family: "blackjack",
        variant: rules.id,
        hands: 1,
        hard: false,
        blurb: `${rules.hitsSoft17 ? "Hits" : "Stands"} soft 17 · pays ${rules.blackjackPays}:1`,
        accent: table.accent,
        glyph: "♦",
      });
    }
  }

  for (const game of TABLE_GAMES) {
    for (const room of TABLE_ROOMS) {
      titles.push({
        id: `tc-${game.id}${room.suffix ? `-${room.suffix.trim().toLowerCase()}` : ""}`,
        name: `${game.name}${room.suffix}`,
        family: "table",
        variant: game.id,
        hands: 1,
        hard: false,
        blurb: game.blurb,
        accent: room.accent,
        glyph: "♣",
      });
    }
  }

  for (const hard of [false, true]) {
    titles.push({
      id: hard ? "viking-storm" : "viking",
      name: hard ? "Viking Longships: Storm" : "Viking Longships",
      family: "viking",
      variant: hard ? "storm" : "standard",
      hands: 1,
      hard,
      blurb: hard ? "Longer river, bigger hoard" : "Six crews race the river",
      accent: "#f87171",
      glyph: "⚓",
    });
    titles.push({
      id: hard ? "carrier-night" : "carrier",
      name: hard ? "Carrier Run: Night Ops" : "Carrier Run",
      family: "carrier",
      variant: hard ? "night" : "standard",
      hands: 1,
      hard,
      blurb: hard ? "Tighter airspace, richer deck" : "Fly the approach, land the deck",
      accent: "#22d3ee",
      glyph: "✈",
    });
  }

  cache = titles;
  return titles;
}

export function cardTitleById(id: string): CardTitle | null {
  return cardCatalog().find((title) => title.id === id) ?? null;
}

export function cardCatalogSize(): number {
  return cardCatalog().length;
}
