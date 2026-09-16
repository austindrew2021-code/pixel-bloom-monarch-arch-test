/**
 * Theme content: palette, symbol faces and name for each title.
 *
 * Themes carry no maths. A theme decides what a game looks like and nothing
 * about what it pays, which is why any theme can be paired with any mechanic
 * and the catalogue stays exactly calibrated.
 *
 * Every name and motif here is generic or original — weather, minerals, myth,
 * places. Nothing borrows a published title, character or trade dress.
 *
 * Glyph order is low-pay to high-pay, then wild, then scatter.
 */

import type { Theme } from "./types.ts";

type ThemeSpec = readonly [
  id: string,
  name: string,
  backdropFrom: string,
  backdropTo: string,
  glow: string,
  palette: string,
  glyphs: string,
];

/** Palettes are six accents, low-pay to high-pay, space separated. */
const SPECS: readonly ThemeSpec[] = [
  ["olympus", "Olympus", "#1a1035", "#0b0720", "#fbbf24", "#64748b #38bdf8 #a78bfa #f472b6 #fb923c #fbbf24", "◆ ● ▲ ⚡ ♆ ♛ ★ ☼"],
  ["valhalla", "Valhalla", "#12202e", "#070d14", "#7dd3fc", "#94a3b8 #60a5fa #22d3ee #34d399 #fbbf24 #f87171", "◆ ● ▲ ⚔ ⚒ ♜ ✶ ☀"],
  ["nile", "Nile", "#2b1e08", "#120c03", "#fcd34d", "#a8a29e #fbbf24 #22d3ee #4ade80 #f472b6 #fcd34d", "◆ ● ▲ ☥ ◬ ♁ ✦ ☀"],
  ["jade-temple", "Jade Temple", "#0a2420", "#04110f", "#34d399", "#94a3b8 #34d399 #22d3ee #a3e635 #fbbf24 #f472b6", "◆ ● ▲ ☯ ⛩ ♕ ✧ ☼"],
  ["neon-bazaar", "Neon Bazaar", "#1b0b2e", "#0a0416", "#f0abfc", "#64748b #22d3ee #a78bfa #f0abfc #fb923c #fde047", "◆ ● ▲ ◉ ⬢ ⬣ ✸ ✺"],
  ["deep-trench", "Deep Trench", "#04202e", "#010c13", "#22d3ee", "#475569 #0ea5e9 #22d3ee #2dd4bf #a3e635 #fde047", "◆ ● ▲ ⚓ ⬲ ☾ ✵ ✹"],
  ["ember-peak", "Ember Peak", "#2a0d06", "#120503", "#fb923c", "#78716c #f87171 #fb923c #fbbf24 #fde047 #fef08a", "◆ ● ▲ ▰ ♨ ✷ ✦ ☀"],
  ["frost-vault", "Frost Vault", "#0b1a2b", "#040a12", "#7dd3fc", "#64748b #7dd3fc #22d3ee #a5f3fc #e0f2fe #ffffff", "◆ ● ▲ ❅ ❄ ✧ ✦ ☼"],
  ["verdant", "Verdant", "#0c2114", "#040d07", "#4ade80", "#78716c #4ade80 #a3e635 #22d3ee #fbbf24 #f472b6", "◆ ● ▲ ✿ ❦ ☘ ✵ ☀"],
  ["dune-road", "Dune Road", "#2a1c09", "#120c04", "#fbbf24", "#a8a29e #fbbf24 #fb923c #f87171 #22d3ee #fde047", "◆ ● ▲ ☽ ⌘ ✤ ✶ ☀"],
  ["nebula", "Nebula", "#160c2e", "#070417", "#a78bfa", "#475569 #818cf8 #a78bfa #d8b4fe #f0abfc #fde047", "◆ ● ▲ ✧ ☄ ✵ ✷ ✺"],
  ["circuit-city", "Circuit City", "#04161a", "#010a0c", "#2dd4bf", "#475569 #2dd4bf #22d3ee #a3e635 #fde047 #f0abfc", "◆ ● ▲ ⬡ ⬢ ⌬ ✦ ✺"],
  ["arcade-88", "Arcade 88", "#1b0a20", "#0a0410", "#f0abfc", "#64748b #f472b6 #a78bfa #22d3ee #fde047 #fb923c", "◆ ● ▲ ■ ◍ ✖ ✦ ★"],
  ["brass-works", "Brass Works", "#231607", "#0f0903", "#fbbf24", "#a8a29e #d6d3d1 #fbbf24 #fb923c #22d3ee #fde047", "◆ ● ▲ ⚙ ⚗ ⌚ ✦ ☀"],
  ["ravenholm", "Ravenholm", "#141019", "#08060b", "#f472b6", "#64748b #94a3b8 #a78bfa #f472b6 #f87171 #fde047", "◆ ● ▲ ♠ ☾ ✝ ✦ ★"],
  ["thornwood", "Thornwood", "#0f1a12", "#060c08", "#a3e635", "#64748b #4ade80 #a3e635 #22d3ee #f0abfc #fde047", "◆ ● ▲ ❧ ✾ ☘ ✧ ☼"],
  ["sugar-rush", "Sugar Drift", "#2a0c22", "#120410", "#f0abfc", "#94a3b8 #f0abfc #f472b6 #fb923c #a3e635 #fde047", "◆ ● ▲ ❤ ✿ ✸ ✦ ★"],
  ["orchard", "Orchard", "#1a2109", "#0a0d04", "#a3e635", "#94a3b8 #f87171 #fb923c #fde047 #a3e635 #f472b6", "◆ ● ▲ ✿ ❦ ✤ ✦ ☀"],
  ["gem-cut", "Gem Cut", "#0d1424", "#05080f", "#22d3ee", "#64748b #4ade80 #f87171 #a78bfa #22d3ee #fde047", "◆ ● ▲ ◈ ◇ ❖ ✦ ✺"],
  ["high-roller", "High Roller", "#1a0b10", "#0b0407", "#fbbf24", "#94a3b8 #f87171 #fbbf24 #22d3ee #a78bfa #fde047", "◆ ● ▲ ♠ ♥ ♦ ✦ ★"],
  ["frontier", "Frontier", "#241a0c", "#0f0b05", "#fbbf24", "#a8a29e #fbbf24 #fb923c #f87171 #4ade80 #fde047", "◆ ● ▲ ☆ ✪ ✵ ✦ ☀"],
  ["blade-court", "Blade Court", "#1b0d12", "#0c0508", "#f87171", "#64748b #f87171 #fb923c #fde047 #22d3ee #f0abfc", "◆ ● ▲ ⚔ ⛩ ✺ ✦ ☀"],
  ["wyrmhoard", "Wyrmhoard", "#1f0f06", "#0d0603", "#fb923c", "#78716c #4ade80 #fb923c #f87171 #fbbf24 #fde047", "◆ ● ▲ ✹ ☗ ♞ ✦ ☀"],
  ["saltwind", "Saltwind", "#0a1c26", "#040b10", "#22d3ee", "#64748b #22d3ee #2dd4bf #fbbf24 #f87171 #fde047", "◆ ● ▲ ⚓ ☠ ⛵ ✦ ★"],
  ["big-top", "Big Top", "#220b16", "#0f050a", "#f472b6", "#94a3b8 #f87171 #f472b6 #a78bfa #fde047 #fb923c", "◆ ● ▲ ★ ✪ ❋ ✦ ☀"],
  ["after-hours", "After Hours", "#101318", "#07090c", "#7dd3fc", "#475569 #94a3b8 #7dd3fc #a78bfa #fde047 #f87171", "◆ ● ▲ ♪ ☂ ☾ ✦ ★"],
  ["hothouse", "Hothouse", "#0d1e18", "#050c0a", "#2dd4bf", "#64748b #4ade80 #2dd4bf #a3e635 #f0abfc #fde047", "◆ ● ▲ ✾ ❀ ☘ ✧ ☀"],
  ["zodiac", "Zodiac", "#111033", "#07061a", "#a78bfa", "#475569 #818cf8 #a78bfa #22d3ee #fbbf24 #fde047", "◆ ● ▲ ♈ ♒ ♓ ✦ ☀"],
  ["abyssal", "Abyssal", "#061418", "#02080a", "#2dd4bf", "#334155 #0ea5e9 #2dd4bf #a3e635 #f0abfc #fde047", "◆ ● ▲ ✹ ❋ ☾ ✧ ✺"],
  ["aurora", "Aurora", "#08192b", "#030a12", "#4ade80", "#475569 #22d3ee #4ade80 #a78bfa #f0abfc #fde047", "◆ ● ▲ ✧ ❄ ✵ ✦ ☼"],
  ["crystal-hollow", "Crystal Hollow", "#131025", "#080612", "#a78bfa", "#64748b #22d3ee #a78bfa #f0abfc #fde047 #ffffff", "◆ ● ▲ ◈ ❖ ✧ ✦ ✺"],
  ["clockspring", "Clockspring", "#1d1808", "#0c0a04", "#fde047", "#a8a29e #fbbf24 #fde047 #22d3ee #fb923c #f472b6", "◆ ● ▲ ⚙ ⌛ ⌚ ✦ ☀"],
  ["paper-crane", "Paper Crane", "#1a1220", "#0b0710", "#f0abfc", "#94a3b8 #7dd3fc #f0abfc #fde047 #4ade80 #fb923c", "◆ ● ▲ ✈ ❋ ✿ ✦ ☀"],
  ["sunset-drive", "Sunset Drive", "#210a26", "#0e0411", "#f472b6", "#64748b #22d3ee #a78bfa #f472b6 #fb923c #fde047", "◆ ● ▲ ▞ ◫ ☼ ✦ ★"],
  ["savannah", "Savannah", "#231a08", "#0f0b04", "#fbbf24", "#a8a29e #fbbf24 #fb923c #a3e635 #22d3ee #fde047", "◆ ● ▲ ☀ ❂ ✤ ✦ ★"],
  ["alkahest", "Alkahest", "#141024", "#080611", "#a3e635", "#64748b #4ade80 #a3e635 #22d3ee #f0abfc #fde047", "◆ ● ▲ ⚗ ☤ ⚱ ✦ ✺"],
  ["runestone", "Runestone", "#151a1c", "#0a0d0e", "#7dd3fc", "#64748b #7dd3fc #22d3ee #a3e635 #fbbf24 #f0abfc", "◆ ● ▲ ᛏ ᛞ ᛉ ✦ ☀"],
  ["ashwing", "Ashwing", "#260d08", "#100503", "#fb923c", "#78716c #f87171 #fb923c #fbbf24 #fde047 #ffffff", "◆ ● ▲ ✹ ❋ ☄ ✦ ☀"],
  ["lantern-night", "Lantern Night", "#230d12", "#0f0508", "#fbbf24", "#64748b #f87171 #fbbf24 #fde047 #4ade80 #f0abfc", "◆ ● ▲ ☄ ❂ ✺ ✦ ☀"],
  ["helio", "Helio", "#2a1a04", "#120b02", "#fde047", "#a8a29e #fb923c #fbbf24 #fde047 #22d3ee #ffffff", "◆ ● ▲ ☀ ❂ ✸ ✦ ✺"],
];

export const THEMES: readonly Theme[] = SPECS.map(
  ([id, name, backdropFrom, backdropTo, glow, palette, glyphs]) => ({
    id,
    name,
    backdrop: [backdropFrom, backdropTo] as const,
    palette: palette.split(" "),
    glyphs: glyphs.split(" "),
    glow,
  }),
);

export const THEME_COUNT = THEMES.length;
