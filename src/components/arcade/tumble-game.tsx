import { useEffect, useState } from "react";
import { COLUMNS, ROWS, type TumbleStep } from "@/lib/arcade/games/tumble";

export type TumbleResult = {
  initialGrid: number[];
  steps: TumbleStep[];
  orbTotal: number;
  points: number;
} | null;

/** Symbol faces. Frequency is uniform; only what they pay differs. */
const FACES = ["◆", "●", "▲", "■", "◇", "✚", "★", "♛"];
const FACE_COLORS = [
  "text-sky-300", "text-teal-300", "text-lime-300", "text-slate-300",
  "text-violet-300", "text-rose-300", "text-amber-300", "text-yellow-200",
];

/**
 * Tumble. Steps the player through each cascade the server already resolved —
 * the grid, what cleared, and any orb — so a long chain reads as the sequence
 * it was rather than a single final number.
 */
export function TumbleGame({
  onSpin,
  busy,
  result,
  disabled,
}: {
  onSpin: () => void;
  busy: boolean;
  result: TumbleResult;
  disabled: boolean;
}) {
  const [step, setStep] = useState(0);

  // Walk the cascades as they land, then hold on the last one.
  useEffect(() => {
    if (!result || result.steps.length === 0) return;
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= result.steps.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [result]);

  const active = result?.steps[Math.min(step, (result?.steps.length ?? 1) - 1)] ?? null;
  const cleared = new Set(active?.cleared ?? []);
  // Fall back to the dealt grid so a round that never clustered still shows the
  // board it was dealt rather than an empty frame.
  const grid = active?.grid ?? result?.initialGrid ?? null;

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <div className="grid grid-flow-col grid-rows-5 gap-1">
          {Array.from({ length: COLUMNS * ROWS }, (_, index) => {
            const symbol = grid?.[index];
            const isCleared = cleared.has(index);
            return (
              <div
                key={index}
                className={`grid aspect-square place-items-center rounded-md text-lg transition ${
                  isCleared ? "bg-amber-400/25 ring-1 ring-amber-400" : "bg-slate-900"
                } ${symbol === undefined ? "text-slate-700" : FACE_COLORS[symbol]}`}
              >
                {symbol === undefined ? "·" : FACES[symbol]}
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-[38px] text-center">
        {result ? (
          result.steps.length === 0 ? (
            <p className="text-sm text-slate-400">No cluster — +{result.points}</p>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                Cascade {Math.min(step + 1, result.steps.length)} of {result.steps.length}
                {active?.orb ? (
                  <span className="ml-2 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-bold text-white">
                    orb ×{active.orb}
                  </span>
                ) : null}
              </p>
              {step >= result.steps.length - 1 ? (
                <p className="mt-0.5 text-sm font-semibold text-amber-400">
                  +{result.points.toLocaleString()}
                  {result.orbTotal > 0 ? ` · orbs ×${result.orbTotal}` : ""}
                </p>
              ) : null}
            </>
          )
        ) : (
          <p className="text-sm text-slate-500">Eight of a kind pays anywhere on the grid.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onSpin}
        disabled={busy || disabled}
        className="h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
      >
        {disabled ? "Out of drops today" : busy ? "Tumbling…" : "Tumble"}
      </button>
    </div>
  );
}
