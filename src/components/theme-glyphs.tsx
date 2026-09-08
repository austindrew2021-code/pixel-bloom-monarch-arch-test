import type { ReactNode } from "react";
import type { ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export type GlyphId = "plan" | "recipes" | "snap" | "train" | "shop" | "fuel" | "people" | "sauces" | "desserts" | "extras" | "theme";

/** Per-theme mark drawn behind every nav/control icon so the chrome isn't a row of identical pills. */
export function GlyphFrame({ theme, children, className, on }: { theme: ThemeId; children: ReactNode; className?: string; on?: boolean }) {
  return (
    <span className={cn("hud-glyph", `hud-glyph-${theme}`, on && "is-on", className)} data-theme-glyph={theme}>
      {theme === "nebula" ? <NebulaRing /> : null}
      {theme === "aether" ? <AetherMark /> : null}
      {theme === "brass" ? <BrassRing /> : null}
      {theme === "neon" ? <NeonTicks /> : null}
      {theme === "terminal" ? <CrtBezel /> : null}
      {theme === "midnight" ? <EmberCut /> : null}
      {theme === "paper" ? <PaperPlate /> : null}
      {theme === "pharaoh" ? <PyramidMark /> : null}
      {theme === "sparta" ? <ShieldMark /> : null}
      {theme === "athens" ? <MeanderMark /> : null}
      {theme === "rome" ? <LaurelMark /> : null}
      {theme === "west" ? <StarMark /> : null}
      {theme === "anime" ? <SparkMark /> : null}
      {theme === "spring" ? <BlossomMark /> : null}
      {theme === "summer" ? <SunMark /> : null}
      {theme === "autumn" ? <LeafMark /> : null}
      {theme === "winter" ? <FrostMark /> : null}
      <span className="hud-glyph-core">{children}</span>
    </span>
  );
}

function NebulaRing() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <ellipse cx="22" cy="22" rx="19" ry="7.5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.75" transform="rotate(-22 22 22)" />
      <ellipse cx="22" cy="22" rx="19" ry="7.5" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" transform="rotate(18 22 22)" />
      <circle cx="22" cy="22" r="8.2" fill="currentColor" opacity="0.22" />
      <circle cx="22" cy="22" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="19.5" cy="20" r="2.1" fill="currentColor" opacity="0.45" />
      <circle cx="7" cy="10" r="2.6" fill="currentColor" opacity="0.95" />
      <circle cx="37" cy="31" r="1.8" fill="currentColor" opacity="0.8" />
      <circle cx="34" cy="8" r="1.2" fill="currentColor" opacity="0.85" />
      <circle cx="10" cy="34" r="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function AetherMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <rect x="6" y="6" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 12 H2 M12 6 V2 M38 12 H42 M32 6 V2 M6 32 H2 M12 38 V42 M38 32 H42 M32 38 V42" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="22" cy="22" r="7" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="22" cy="22" r="2" fill="currentColor" />
    </svg>
  );
}

function BrassRing() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 3" />
      <circle cx="22" cy="4" r="2" fill="currentColor" />
      <circle cx="40" cy="22" r="2" fill="currentColor" />
      <circle cx="22" cy="40" r="2" fill="currentColor" />
      <circle cx="4" cy="22" r="2" fill="currentColor" />
    </svg>
  );
}

function NeonTicks() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M4 22 H12 M32 22 H40 M22 4 V12 M22 32 V40" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CrtBezel() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <rect x="5" y="5" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="8" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

function EmberCut() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M8 6 L36 6 L38 14 L36 38 L8 38 Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function PaperPlate() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="16" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="22" cy="22" r="11" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
    </svg>
  );
}

function PyramidMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M22 6 L38 36 H6 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M22 14 L30 32 H14 Z" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function ShieldMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M22 6 L36 12 V24 C36 32 22 38 22 38 C22 38 8 32 8 24 V12 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M22 12 V30 M16 20 H28" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MeanderMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path
        d="M8 14 H36 V18 H14 V26 H30 V30 H8 V26 H24 V22 H8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function LaurelMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M22 36 C12 28 10 16 16 10 M22 36 C32 28 34 16 28 10" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" />
      <circle cx="28" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

function StarMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M22 7 L25 18 H36 L27 24 L30 36 L22 29 L14 36 L17 24 L8 18 H19 Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SparkMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M22 6 L24 20 L38 22 L24 24 L22 38 L20 24 L6 22 L20 20 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function BlossomMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="14" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="14" cy="22" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="30" cy="22" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="18" cy="30" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="26" cy="30" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="22" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}

function SunMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M22 6 V12 M22 32 V38 M6 22 H12 M32 22 H38 M11 11 L15 15 M29 29 L33 33 M33 11 L29 15 M15 29 L11 33" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function LeafMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M12 32 C12 16 22 8 34 10 C32 24 24 32 12 32 Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M16 28 C22 22 26 16 30 12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function FrostMark() {
  return (
    <svg className="hud-glyph-art" viewBox="0 0 44 44" aria-hidden>
      <path d="M22 6 V38 M8 22 H36 M12 12 L32 32 M32 12 L12 32" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
