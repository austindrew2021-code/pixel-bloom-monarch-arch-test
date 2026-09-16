import { useEffect, useState } from "react";
import type { BonusKind } from "@/lib/arcade/slots/bonus";
import type { Theme } from "@/lib/arcade/slots/types";

/**
 * The bonus takeover.
 *
 * Fires when free spins trigger, and again on a big win. It is deliberately the
 * loudest thing in the app: rotating rays, a sweeping shine across the banner,
 * and a counter that runs the total up rather than printing it, because a
 * number that climbs reads as a win and a number that appears reads as a label.
 *
 * It is dismissable and it times out on its own — a celebration that traps
 * someone mid-session stops being a celebration.
 */

export type BonusEvent = {
  /** New id fires a fresh takeover. */
  id: number;
  kind: BonusKind;
  /** Points to count up to. */
  points: number;
  /** Free spins awarded, for the free-spins banner. */
  spins?: number;
  multiplier?: number;
} | null;

const TITLES: Record<BonusKind, string> = {
  "free-spins": "FREE SPINS",
  "big-win": "BIG WIN",
  "mega-win": "MEGA WIN",
};

export function BonusPopup({
  event,
  theme,
  onClose,
}: {
  event: BonusEvent;
  theme: Theme;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);

  // Run the counter up, then hold. Short enough that it never feels like a wall.
  useEffect(() => {
    if (!event) return;
    setShown(0);
    const target = event.points;
    const started = performance.now();
    const duration = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Ease out, so the count sprints then settles on the figure.
      setShown(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timer = window.setTimeout(onClose, duration + 2600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [event, onClose]);

  if (!event) return null;
  const accent = theme.glow;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-6 backdrop-blur-sm"
      role="dialog"
      aria-live="polite"
      aria-label={TITLES[event.kind]}
      onClick={onClose}
    >
      <div className="bonus-card relative w-full max-w-sm">
        {/*
          Rays behind the card, turning slowly. Positioned from the centre
          explicitly rather than by grid centring: an item larger than its
          container gets safe-aligned to the start edge, which pinned the whole
          fan below the card instead of behind it.
        */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="bonus-rays size-[460px] rounded-full opacity-20"
            style={{
              background: `conic-gradient(from 0deg, ${accent} 0deg 8deg, transparent 8deg 24deg, ${accent} 24deg 32deg, transparent 32deg 48deg, ${accent} 48deg 56deg, transparent 56deg 72deg, ${accent} 72deg 80deg, transparent 80deg 96deg, ${accent} 96deg 104deg, transparent 104deg 120deg, ${accent} 120deg 128deg, transparent 128deg 144deg, ${accent} 144deg 152deg, transparent 152deg 168deg, ${accent} 168deg 176deg, transparent 176deg 192deg, ${accent} 192deg 200deg, transparent 200deg 216deg, ${accent} 216deg 224deg, transparent 224deg 240deg, ${accent} 240deg 248deg, transparent 248deg 264deg, ${accent} 264deg 272deg, transparent 272deg 288deg, ${accent} 288deg 296deg, transparent 296deg 312deg, ${accent} 312deg 320deg, transparent 320deg 336deg, ${accent} 336deg 344deg, transparent 344deg 360deg)`,
            }}
          />
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border-2 p-6 text-center shadow-2xl"
          style={{
            borderColor: accent,
            background: `radial-gradient(120% 90% at 50% 0%, ${theme.backdrop[0]} 0%, ${theme.backdrop[1]} 100%)`,
            boxShadow: `0 0 60px -10px ${accent}`,
          }}
        >
          <div className="relative">
            <h2
              className="text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: accent, textShadow: `0 0 24px ${accent}` }}
            >
              {TITLES[event.kind]}
            </h2>
            {/* The shine sweeps across the title. */}
            <div className="bonus-shine pointer-events-none absolute inset-0 mix-blend-overlay" />
          </div>

          {event.kind === "free-spins" && event.spins ? (
            <p className="mt-1.5 text-sm font-semibold text-slate-200">
              {event.spins} spins
              {event.multiplier && event.multiplier > 1 ? ` at ×${event.multiplier}` : ""}
            </p>
          ) : null}

          <p className="mt-4 font-mono text-5xl font-black text-white tabular-nums sm:text-6xl">
            {shown.toLocaleString()}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">points</p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-11 w-full rounded-xl text-sm font-bold text-slate-950"
            style={{ background: accent }}
          >
            Collect
          </button>
        </div>
      </div>
    </div>
  );
}
