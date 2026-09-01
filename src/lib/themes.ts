/**
 * Kitchen skins. Each id has a matching `[data-theme="…"]` token block in
 * src/styles.css — the whole app is painted from those CSS variables, so a
 * theme is a palette swap and nothing else. `swatch` is the three colours
 * the picker previews: background, the surface cards sit on, and the accent.
 */

export type ThemeId = "paper" | "midnight" | "brass" | "neon" | "nebula" | "terminal";

export type Theme = {
  id: ThemeId;
  label: string;
  hint: string;
  /** [background, card, accent] — preview only, kept in step with styles.css. */
  swatch: [string, string, string];
};

export const THEMES: Theme[] = [
  {
    id: "paper",
    label: "Paper",
    hint: "Warm daylight kitchen",
    swatch: ["#f3e0c8", "#fff6ea", "#e24a12"],
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Lights down, ember on",
    swatch: ["#0f0d0b", "#1a1612", "#ff6a2a"],
  },
  {
    id: "brass",
    label: "Brass Works",
    hint: "Steampunk copper and oiled leather",
    swatch: ["#1c1410", "#2a1f17", "#d99a3c"],
  },
  {
    id: "neon",
    label: "Neon Grid",
    hint: "Electric cyan on wet asphalt",
    swatch: ["#07080f", "#0e1220", "#22e0ff"],
  },
  {
    id: "nebula",
    label: "Nebula",
    hint: "Deep violet, far from the sun",
    swatch: ["#0c0718", "#160e28", "#c77dff"],
  },
  {
    id: "terminal",
    label: "Terminal",
    hint: "Phosphor green, cursor blinking",
    swatch: ["#04120a", "#082014", "#3dff9a"],
  },
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

/** Themes that paint light-on-dark, for the few spots that need to know. */
export function isDarkTheme(id: ThemeId): boolean {
  return id !== "paper";
}
