/**
 * Kitchen skins. Each id has a matching `[data-theme="…"]` token block in
 * src/styles.css. `swatch` is the three colours the picker previews:
 * background, the surface cards sit on, and the accent.
 */

export type ThemeGroup = "kitchen" | "world" | "season";

export type ThemeId =
  | "paper"
  | "midnight"
  | "brass"
  | "neon"
  | "nebula"
  | "aether"
  | "terminal"
  | "pharaoh"
  | "sparta"
  | "athens"
  | "rome"
  | "west"
  | "anime"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export type Theme = {
  id: ThemeId;
  label: string;
  hint: string;
  group: ThemeGroup;
  /** [background, card, accent] — preview only, kept in step with styles.css. */
  swatch: [string, string, string];
  dark: boolean;
  art?: string;
};

export const THEMES: Theme[] = [
  {
    id: "paper",
    label: "Paper",
    hint: "Warm daylight kitchen",
    group: "kitchen",
    swatch: ["#f3e0c8", "#fff6ea", "#e24a12"],
    dark: false,
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Lights down, ember on",
    group: "kitchen",
    swatch: ["#0f0d0b", "#1a1612", "#ff6a2a"],
    dark: true,
  },
  {
    id: "brass",
    label: "Brass Works",
    hint: "Steampunk copper and oiled leather",
    group: "kitchen",
    swatch: ["#1c1410", "#2a1f17", "#d99a3c"],
    dark: true,
  },
  {
    id: "neon",
    label: "Neon Grid",
    hint: "Electric cyan on wet asphalt",
    group: "kitchen",
    swatch: ["#07080f", "#0e1220", "#22e0ff"],
    dark: true,
  },
  {
    id: "nebula",
    label: "Nebula",
    hint: "A real galaxy, close enough to touch",
    group: "kitchen",
    swatch: ["#070510", "#120c22", "#c77dff"],
    dark: true,
    art: "/themes/nebula.jpg",
  },
  {
    id: "aether",
    label: "Aether",
    hint: "Orbital kitchen. HUD from the future.",
    group: "kitchen",
    swatch: ["#03060c", "#07141c", "#3dffd0"],
    dark: true,
    art: "/themes/aether.jpg",
  },
  {
    id: "terminal",
    label: "Terminal",
    hint: "Phosphor green, cursor blinking",
    group: "kitchen",
    swatch: ["#04120a", "#082014", "#3dff9a"],
    dark: true,
  },
  {
    id: "pharaoh",
    label: "Pharaoh",
    hint: "Gold, lapis, and temple dust",
    group: "world",
    swatch: ["#1a140c", "#2a2114", "#e0b24a"],
    dark: true,
    art: "/themes/pharaoh.jpg",
  },
  {
    id: "sparta",
    label: "Sparta",
    hint: "Bronze, crimson, a round shield",
    group: "world",
    swatch: ["#1a100c", "#2a1610", "#c43c28"],
    dark: true,
    art: "/themes/sparta.jpg",
  },
  {
    id: "athens",
    label: "Athens",
    hint: "Terracotta pottery and olive light",
    group: "world",
    swatch: ["#f0e2c8", "#f7ecda", "#c45c2a"],
    dark: false,
    art: "/themes/athens.jpg",
  },
  {
    id: "rome",
    label: "Rome",
    hint: "Travertine, laurel, golden hour",
    group: "world",
    swatch: ["#2a2420", "#3a322c", "#c9a227"],
    dark: true,
    art: "/themes/rome.jpg",
  },
  {
    id: "west",
    label: "Wild West",
    hint: "Dust, sunset, rolling tumbleweed",
    group: "world",
    swatch: ["#1c120c", "#2a1a12", "#e07a3d"],
    dark: true,
    art: "/themes/west.jpg",
  },
  {
    id: "anime",
    label: "Anime",
    hint: "Evening sky through a kitchen window",
    group: "world",
    swatch: ["#0e1428", "#182040", "#ff8a6b"],
    dark: true,
    art: "/themes/anime.jpg",
  },
  {
    id: "spring",
    label: "Spring",
    hint: "Blossom, new green, morning",
    group: "season",
    swatch: ["#f4efe6", "#fffaf4", "#6fbf73"],
    dark: false,
    art: "/themes/spring.jpg",
  },
  {
    id: "summer",
    label: "Summer",
    hint: "Noon field, hydrangea, heat",
    group: "season",
    swatch: ["#fff6d8", "#fffceb", "#e8a020"],
    dark: false,
    art: "/themes/summer.jpg",
  },
  {
    id: "autumn",
    label: "Autumn",
    hint: "Maple light and woodsmoke",
    group: "season",
    swatch: ["#2a160c", "#3a2014", "#c44b1a"],
    dark: true,
    art: "/themes/autumn.jpg",
  },
  {
    id: "winter",
    label: "Winter",
    hint: "Frost on the pane, pine dark",
    group: "season",
    swatch: ["#0e1a24", "#162430", "#d7e8f5"],
    dark: true,
    art: "/themes/winter.jpg",
  },
];

export const THEME_GROUPS: { id: ThemeGroup; label: string; hint: string }[] = [
  { id: "kitchen", label: "Kitchen", hint: "The everyday looks" },
  { id: "world", label: "Worlds", hint: "Egypt, Greece, Rome, West, anime" },
  { id: "season", label: "Seasons", hint: "Spring through winter" },
];

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.has(value);
}

export function normalizeTheme(value: unknown): ThemeId {
  return isThemeId(value) ? value : "paper";
}

export function themeById(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function themesIn(group: ThemeGroup): Theme[] {
  return THEMES.filter((t) => t.group === group);
}

/** Themes that paint light-on-dark, for the few spots that need to know. */
export function isDarkTheme(id: ThemeId): boolean {
  return themeById(id).dark;
}
