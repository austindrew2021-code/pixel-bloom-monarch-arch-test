/**
 * Drawn artwork for the reels.
 *
 * Symbols are SVG paths on a 100×100 box rather than text glyphs, so they take
 * gradients, strokes, inner detail and glow the way a drawn asset does. There
 * are far fewer shapes than there are titles — 40 themes would need 320 unique
 * drawings — so instead each theme picks a *lineup* of eight shapes and paints
 * them in its own palette. Shape choice and colour together are what make one
 * theme's reels look nothing like another's.
 *
 * Every theme also declares an ambient effect: the weather of the machine.
 * Storm themes flash lightning behind the reels, frost themes drift snow,
 * ember themes rise sparks. It is the moving part that makes a cabinet feel
 * alive when nothing is being played.
 */

export type ShapeId =
  | "bolt" | "crown" | "trident" | "gem" | "orb" | "star" | "rune" | "flame"
  | "snowflake" | "anchor" | "skull" | "eye" | "coin" | "shield" | "axe"
  | "leaf" | "moon" | "sun" | "feather" | "key" | "chalice" | "scarab"
  | "droplet" | "circuit";

/**
 * Path data on a 100×100 box, centred. Each is drawn as one filled path with an
 * optional detail path laid over it, which is what keeps a symbol readable at
 * reel size while still carrying some interior line work.
 */
export const SHAPES: Readonly<Record<ShapeId, { body: string; detail?: string }>> = {
  bolt: {
    body: "M58 8 L24 54 H46 L38 92 L76 42 H52 Z",
    detail: "M52 22 L38 48 H48 L44 70",
  },
  crown: {
    body: "M14 70 L20 30 L36 48 L50 20 L64 48 L80 30 L86 70 Z M14 70 H86 V82 H14 Z",
    detail: "M34 62 h8 M58 62 h8 M48 58 h4",
  },
  trident: {
    body: "M46 18 h8 v64 h-8 Z M22 24 h8 v26 a20 20 0 0 0 40 0 V24 h8 v26 a28 28 0 0 1-56 0 Z M34 86 h32 v8 H34 Z",
    detail: "M50 30 v40",
  },
  gem: {
    body: "M50 10 L84 38 L50 92 L16 38 Z",
    detail: "M16 38 H84 M50 10 L36 38 L50 92 M50 10 L64 38 L50 92",
  },
  orb: {
    body: "M50 12 a38 38 0 1 1-0.1 0 Z",
    detail: "M34 30 a20 16 0 0 1 22-8 M30 58 a24 20 0 0 0 34 14",
  },
  star: {
    body: "M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z",
    detail: "M50 26 L56 42 L50 52 L44 42 Z",
  },
  rune: {
    body: "M22 12 h56 a6 6 0 0 1 6 6 v64 a6 6 0 0 1-6 6 H22 a6 6 0 0 1-6-6 V18 a6 6 0 0 1 6-6 Z",
    detail: "M34 26 L34 74 M34 42 L64 26 M34 54 L64 74",
  },
  flame: {
    body: "M50 6 C64 28 82 38 82 58 a32 32 0 0 1-64 0 C18 40 34 32 50 6 Z",
    detail: "M50 40 C58 52 62 58 62 66 a12 12 0 0 1-24 0 C38 58 44 52 50 40 Z",
  },
  snowflake: {
    body: "M46 6 h8 v88 h-8 Z M8 46 h84 v8 H8 Z M18 20 l6-6 l62 62 l-6 6 Z M80 14 l6 6 l-62 62 l-6-6 Z",
    detail: "M50 20 l-12 12 M50 20 l12 12 M50 80 l-12-12 M50 80 l12-12",
  },
  anchor: {
    body: "M46 20 h8 v62 h-8 Z M30 34 h40 v8 H30 Z M18 56 a34 34 0 0 0 64 0 h-10 a24 24 0 0 1-44 0 Z",
    detail: "M50 8 a10 10 0 1 1-0.1 0 Z",
  },
  skull: {
    body: "M50 10 a34 34 0 0 1 34 34 v14 a14 14 0 0 1-8 12 v12 H24 V70 a14 14 0 0 1-8-12V44 A34 34 0 0 1 50 10 Z",
    detail: "M34 44 a8 9 0 1 0 0.1 0 M66 44 a8 9 0 1 0 0.1 0 M44 66 h12 l-6 10 Z",
  },
  eye: {
    body: "M6 50 C24 24 76 24 94 50 C76 76 24 76 6 50 Z",
    detail: "M50 32 a18 18 0 1 1-0.1 0 M50 42 a8 8 0 1 1-0.1 0",
  },
  coin: {
    body: "M50 8 a42 42 0 1 1-0.1 0 Z",
    detail: "M50 20 a30 30 0 1 1-0.1 0 M42 40 h16 M42 52 h16 M50 34 v32",
  },
  shield: {
    body: "M50 6 L88 20 v34 C88 76 70 90 50 96 30 90 12 76 12 54 V20 Z",
    detail: "M50 20 v58 M26 34 h48",
  },
  axe: {
    body: "M44 16 h12 v76 h-12 Z M56 20 C78 22 90 34 90 48 90 62 78 72 56 74 Z M44 20 C22 22 10 34 10 48 10 62 22 72 44 74 Z",
    detail: "M50 28 v40",
  },
  leaf: {
    body: "M50 6 C80 24 88 52 62 82 46 96 30 88 22 74 12 56 22 24 50 6 Z",
    detail: "M50 14 C46 40 42 62 38 84",
  },
  moon: {
    body: "M62 8 A42 42 0 1 0 62 92 A34 34 0 1 1 62 8 Z",
    detail: "M40 32 a6 6 0 1 1-0.1 0 M34 58 a5 5 0 1 1-0.1 0",
  },
  sun: {
    body: "M50 26 a24 24 0 1 1-0.1 0 Z M46 2 h8 v14 h-8 Z M46 84 h8 v14 h-8 Z M2 46 h14 v8 H2 Z M84 46 h14 v8 H84 Z M16 12 l6-6 l10 10 l-6 6 Z M78 6 l6 6 l-10 10 l-6-6 Z M16 88 l-6-6 l10-10 l6 6 Z M84 82 l-6 6 l-10-10 l6-6 Z",
  },
  feather: {
    body: "M78 10 C44 16 20 42 16 78 l-6 12 12-6 C58 80 84 56 90 22 Z",
    detail: "M78 22 L28 76 M60 26 L46 40 M70 40 L52 58",
  },
  key: {
    body: "M34 10 a24 24 0 1 1-0.1 0 Z M46 50 h10 v42 h-10 Z M56 70 h14 v8 H56 Z M56 84 h12 v8 H56 Z",
    detail: "M34 22 a12 12 0 1 1-0.1 0 Z",
  },
  chalice: {
    body: "M22 14 h56 l-6 30 a22 22 0 0 1-44 0 Z M46 66 h8 v16 h-8 Z M28 84 h44 v8 H28 Z",
    detail: "M32 24 h36",
  },
  scarab: {
    body: "M50 8 a18 18 0 0 1 18 18 v6 H32v-6 A18 18 0 0 1 50 8 Z M28 38 h44 a22 30 0 0 1-44 0 Z M26 44 a24 34 0 0 0 48 0 v6 a24 34 0 0 1-48 0 Z",
    detail: "M50 40 v46 M12 44 L26 52 M88 44 L74 52",
  },
  droplet: {
    body: "M50 6 C68 34 82 48 82 64 a32 32 0 0 1-64 0 C18 48 32 34 50 6 Z",
    detail: "M38 62 a12 12 0 0 0 10 16",
  },
  circuit: {
    body: "M50 10 L84 30 v40 L50 90 L16 70 V30 Z",
    detail: "M50 30 a12 12 0 1 1-0.1 0 M50 10 v20 M50 66 v24 M62 44 L84 30 M38 44 L16 30 M38 56 L16 70 M62 56 L84 70",
  },
};

export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];

/** Ambient weather behind the reels. */
export type Ambient = "storm" | "snow" | "embers" | "bubbles" | "stars" | "motes" | "sparks";

/**
 * A lineup is the eight shapes a theme uses, low-pay to high-pay, then wild,
 * then scatter. The last two carry the most presence on the reels, so lineups
 * put their strongest shapes there.
 */
export type Lineup = { id: string; ambient: Ambient; shapes: readonly ShapeId[] };

export const LINEUPS: readonly Lineup[] = [
  { id: "storm", ambient: "storm", shapes: ["gem", "orb", "coin", "trident", "shield", "crown", "bolt", "sun"] },
  { id: "frost", ambient: "snow", shapes: ["gem", "orb", "droplet", "snowflake", "shield", "moon", "star", "sun"] },
  { id: "ember", ambient: "embers", shapes: ["coin", "orb", "gem", "flame", "skull", "crown", "star", "sun"] },
  { id: "deep", ambient: "bubbles", shapes: ["orb", "droplet", "gem", "anchor", "scarab", "trident", "star", "moon"] },
  { id: "void", ambient: "stars", shapes: ["orb", "gem", "coin", "moon", "eye", "star", "sun", "circuit"] },
  { id: "wild", ambient: "motes", shapes: ["gem", "orb", "leaf", "feather", "eye", "moon", "star", "sun"] },
  { id: "hoard", ambient: "sparks", shapes: ["coin", "gem", "key", "chalice", "shield", "crown", "star", "sun"] },
  { id: "dark", ambient: "motes", shapes: ["orb", "gem", "coin", "skull", "rune", "moon", "eye", "star"] },
  { id: "forge", ambient: "sparks", shapes: ["coin", "orb", "gem", "axe", "shield", "crown", "flame", "sun"] },
  { id: "relic", ambient: "motes", shapes: ["gem", "orb", "coin", "rune", "scarab", "key", "eye", "sun"] },
];

const LINEUP_BY_ID = new Map(LINEUPS.map((lineup) => [lineup.id, lineup]));

/**
 * Which lineup each theme wears.
 *
 * Assigned by hand rather than round-robin so a theme's shapes match its name
 * and palette — Olympus gets the storm lineup and its lightning, Frost Vault
 * gets snowflakes and drifting snow.
 */
const THEME_LINEUPS: Readonly<Record<string, string>> = {
  olympus: "storm", valhalla: "forge", nile: "relic", "jade-temple": "relic",
  "neon-bazaar": "void", "deep-trench": "deep", "ember-peak": "ember",
  "frost-vault": "frost", verdant: "wild", "dune-road": "relic",
  nebula: "void", "circuit-city": "void", "arcade-88": "void",
  "brass-works": "forge", ravenholm: "dark", thornwood: "wild",
  "sugar-rush": "wild", orchard: "wild", "gem-cut": "hoard",
  "high-roller": "hoard", frontier: "forge", "blade-court": "forge",
  wyrmhoard: "hoard", saltwind: "deep", "big-top": "hoard",
  "after-hours": "dark", hothouse: "wild", zodiac: "void",
  abyssal: "deep", aurora: "frost", "crystal-hollow": "frost",
  clockspring: "forge", "paper-crane": "wild", "sunset-drive": "void",
  savannah: "relic", alkahest: "relic", runestone: "dark",
  ashwing: "ember", "lantern-night": "ember", helio: "ember",
};

/** The lineup a theme uses. Falls back to the storm set rather than throwing. */
export function lineupFor(themeId: string): Lineup {
  return LINEUP_BY_ID.get(THEME_LINEUPS[themeId] ?? "storm") ?? LINEUPS[0]!;
}

/** The shape at a symbol index for a theme. */
export function shapeFor(themeId: string, symbolIndex: number): ShapeId {
  const lineup = lineupFor(themeId);
  return lineup.shapes[Math.min(Math.max(symbolIndex, 0), lineup.shapes.length - 1)]!;
}

export function ambientFor(themeId: string): Ambient {
  return lineupFor(themeId).ambient;
}

/** Every theme id that has been given a lineup, for the tests to check. */
export const THEMED_LINEUP_IDS = Object.keys(THEME_LINEUPS);
