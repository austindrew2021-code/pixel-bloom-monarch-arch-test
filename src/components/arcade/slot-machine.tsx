import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundResult, SlotConfig, SpinResult } from "@/lib/arcade/slots/types";

/**
 * The reel display.
 *
 * The outcome arrives already resolved from the server; everything here is
 * presentation. Reels blur and cycle for a moment, settle left to right, and
 * then the winning cells are lit — the sequence a player reads as "spinning",
 * even though the grid was decided before the first frame.
 *
 * All colour comes from the game's theme, so 280 titles share one component
 * and still look like 280 games.
 */

const SETTLE_MS = 420;
const STAGGER_MS = 170;

export type SlotView = {
  config: SlotConfig;
  round: RoundResult;
  /** Bumped per spin so a repeat of the same grid still replays. */
  key: number;
} | null;

export function SlotMachine({
  config,
  view,
  spinning,
}: {
  config: SlotConfig;
  view: SlotView;
  spinning: boolean;
}) {
  const { reels, rows } = config.mechanic;
  const [phase, setPhase] = useState<"idle" | "spinning" | "settling" | "done">("idle");
  const [shown, setShown] = useState(0);
  const [freeIndex, setFreeIndex] = useState(-1);

  // Reel-by-reel settle, then step through any free spins.
  useEffect(() => {
    if (!view) return;
    setPhase("settling");
    setShown(0);
    setFreeIndex(-1);
    const timers: number[] = [];
    for (let reel = 1; reel <= reels; reel += 1) {
      timers.push(
        window.setTimeout(() => setShown(reel), SETTLE_MS + reel * STAGGER_MS),
      );
    }
    const settled = SETTLE_MS + reels * STAGGER_MS;
    timers.push(window.setTimeout(() => setPhase("done"), settled));

    if (view.round.featureTriggered) {
      view.round.freeSpins.forEach((_, index) => {
        timers.push(
          window.setTimeout(() => setFreeIndex(index), settled + 700 + index * 520),
        );
      });
    }
    return () => timers.forEach(window.clearTimeout);
  }, [view, reels]);

  useEffect(() => {
    if (spinning) setPhase("spinning");
  }, [spinning]);

  const active: SpinResult | null = useMemo(() => {
    if (!view) return null;
    if (freeIndex >= 0) return view.round.freeSpins[freeIndex] ?? view.round.base;
    return view.round.base;
  }, [view, freeIndex]);

  // Cells that are part of a win on the grid currently shown.
  const lit = useMemo(() => {
    const set = new Set<string>();
    if (!active || phase === "spinning") return set;
    for (const win of active.wins) {
      for (const [reel, row] of win.cells) set.add(`${reel}:${row}`);
    }
    return set;
  }, [active, phase]);

  const inFreeSpins = freeIndex >= 0;
  const [from, to] = config.theme.backdrop;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-3 transition-colors"
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${from} 0%, ${to} 100%)`,
        borderColor: inFreeSpins ? config.theme.glow : "rgb(30 41 59)",
        boxShadow: inFreeSpins ? `0 0 28px -8px ${config.theme.glow}` : undefined,
      }}
    >
      {inFreeSpins ? (
        <div className="absolute inset-x-0 top-2 z-10 text-center">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-slate-950"
            style={{ background: config.theme.glow }}
          >
            Free spin {freeIndex + 1} / {view?.round.freeSpins.length} · ×
            {view?.round.multiplier}
          </span>
        </div>
      ) : null}

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${reels}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: reels }, (_, reel) => {
          const settled = phase === "done" || reel < shown;
          return (
            <div key={reel} className="grid gap-1">
              {Array.from({ length: rows }, (_, row) => (
                <Cell
                  key={row}
                  config={config}
                  symbol={active?.grid[reel]?.[row]}
                  settled={settled && phase !== "spinning"}
                  lit={lit.has(`${reel}:${row}`)}
                  spinKey={`${view?.key ?? 0}-${freeIndex}-${reel}-${row}`}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cell({
  config,
  symbol,
  settled,
  lit,
  spinKey,
}: {
  config: SlotConfig;
  symbol: number | undefined;
  settled: boolean;
  lit: boolean;
  spinKey: string;
}) {
  const definition = symbol === undefined ? null : config.symbols[symbol];
  const glyph = definition?.glyph ?? "◆";
  const isSpecial = definition?.kind !== "pay";
  const color = isSpecial
    ? config.theme.glow
    : config.theme.palette[Math.min(symbol ?? 0, config.theme.palette.length - 1)];

  // While a reel is still turning, cycle faces so it reads as motion rather
  // than a frozen grid that suddenly changes.
  const blur = useReelBlur(settled, spinKey, config.theme.glyphs.length);
  const face = settled ? glyph : (config.theme.glyphs[blur] ?? glyph);

  return (
    <div
      className={`grid aspect-square place-items-center rounded-md text-2xl transition-all duration-200 sm:text-3xl ${
        settled ? "" : "blur-[1.5px] opacity-70"
      } ${lit ? "scale-105" : ""}`}
      style={{
        background: lit ? `${config.theme.glow}22` : "rgba(2, 6, 23, 0.55)",
        color: lit ? config.theme.glow : color,
        boxShadow: lit ? `0 0 16px -2px ${config.theme.glow}, inset 0 0 0 1px ${config.theme.glow}66` : undefined,
        textShadow: lit || isSpecial ? `0 0 12px ${config.theme.glow}` : undefined,
      }}
    >
      {face}
    </div>
  );
}

/** Cycles a face index while a reel is still turning. */
function useReelBlur(settled: boolean, spinKey: string, faces: number): number {
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (settled) {
      if (timer.current) window.clearInterval(timer.current);
      return;
    }
    timer.current = window.setInterval(() => {
      setIndex((current) => (current + 1) % faces);
    }, 65);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [settled, spinKey, faces]);

  return index;
}
