import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlotFx, type Burst } from "@/components/arcade/slot-fx";
import { SlotSymbol } from "@/components/arcade/slot-symbol";
import { ambientFor } from "@/lib/arcade/slots/art";
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
  intense,
}: {
  config: SlotConfig;
  view: SlotView;
  spinning: boolean;
  /** Big-win mode: denser effects and more frequent lightning. */
  intense?: boolean;
}) {
  const { reels, rows } = config.mechanic;
  const [phase, setPhase] = useState<"idle" | "spinning" | "settling" | "done">("idle");
  const [shown, setShown] = useState(0);
  const [freeIndex, setFreeIndex] = useState(-1);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const burstId = useRef(0);

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

  /** Spray sparks from the cells that paid, positioned over the real grid. */
  const fireBursts = useCallback(
    (cells: [number, number][], power: number) => {
      const grid = gridRef.current;
      if (!grid || cells.length === 0) return;
      const box = grid.getBoundingClientRect();
      const cellWidth = box.width / reels;
      const cellHeight = box.height / rows;
      setBursts(
        cells.map(([reel, row]) => ({
          id: (burstId.current += 1),
          x: (reel + 0.5) * cellWidth,
          y: (row + 0.5) * cellHeight,
          colour: config.theme.glow,
          power,
        })),
      );
    },
    [config.theme.glow, reels, rows],
  );

  // Burst once the grid on screen has settled and its wins are visible.
  useEffect(() => {
    if (phase !== "done" || !active || active.wins.length === 0) return;
    const cells = active.wins.flatMap((win) => win.cells).slice(0, 24);
    const power = Math.min(1, active.rawPay / Math.max(1, 40 / config.scale));
    fireBursts(cells, power);
  }, [phase, active, fireBursts, config.scale]);

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
      <SlotFx
        ambient={ambientFor(config.theme.id)}
        glow={config.theme.glow}
        bursts={bursts}
        intense={intense || inFreeSpins}
      />

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
        ref={gridRef}
        className="relative grid gap-1"
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
                  offset={reel * 3 + row * 5}
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
  offset,
}: {
  config: SlotConfig;
  symbol: number | undefined;
  settled: boolean;
  lit: boolean;
  spinKey: string;
  /** Per-cell phase, so the grid does not cycle as one block. */
  offset: number;
}) {
  // While a reel is still turning, cycle through the theme's own symbols so the
  // blur is made of the artwork rather than a placeholder. Each cell starts at
  // its own offset: without one, every hook ticks on the same interval from the
  // same index and the whole grid shows one symbol at a time, which reads as a
  // broken reel rather than a spinning one.
  const blur = useReelBlur(settled, spinKey, config.symbols.length, offset);
  // An untouched machine shows a settled, varied grid rather than a blur —
  // there is nothing spinning yet to blur.
  const idle = symbol === undefined && !settled;
  const shownSymbol = settled ? symbol : idle ? (offset * 7) % config.symbols.length : blur;

  return (
    <div
      className={`grid aspect-square place-items-center rounded-md transition-all duration-200 ${
        settled || idle ? "" : "blur-[1.5px] opacity-70"
      }`}
      style={{
        background: lit ? `${config.theme.glow}22` : "rgba(2, 6, 23, 0.55)",
        boxShadow: lit
          ? `0 0 18px -2px ${config.theme.glow}, inset 0 0 0 1px ${config.theme.glow}66`
          : undefined,
      }}
    >
      {shownSymbol === undefined ? null : (
        <SlotSymbol config={config} symbol={shownSymbol} lit={lit} size={38} />
      )}
    </div>
  );
}

/** Cycles a face index while a reel is still turning. */
function useReelBlur(settled: boolean, spinKey: string, faces: number, offset = 0): number {
  const [index, setIndex] = useState(offset % Math.max(1, faces));
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (settled) {
      if (timer.current) window.clearInterval(timer.current);
      return;
    }
    timer.current = window.setInterval(() => {
      // Step by a number coprime with most symbol counts so neighbouring cells
      // stay visually out of step rather than drifting back into lockstep.
      setIndex((current) => (current + 3) % faces);
    }, 65);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [settled, spinKey, faces, offset]);

  return index;
}
