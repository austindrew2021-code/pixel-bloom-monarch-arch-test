import { useState } from "react";
import { MAX_TARGET, MIN_TARGET, WIN_BASE } from "@/lib/arcade/games/ascent";

export type AscentResult = { target: number; bust: number; cleared: boolean; points: number } | null;

/**
 * Ascent. The target is set before the round rather than cashed out mid-flight,
 * so the payout is decided by the seed and not by the player's connection.
 */
export function AscentGame({
  onLaunch,
  busy,
  result,
  disabled,
}: {
  onLaunch: (target: number) => void;
  busy: boolean;
  result: AscentResult;
  disabled: boolean;
}) {
  const [target, setTarget] = useState(2);
  const presets = [1.5, 2, 3, 5, 10, 25];

  return (
    <div className="grid gap-3">
      <div className="grid min-h-[120px] place-items-center rounded-2xl border border-slate-800 bg-slate-950 p-5">
        {result ? (
          <div className="text-center">
            <p
              className={`font-mono text-4xl font-bold ${
                result.cleared ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {result.bust.toFixed(2)}x
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {result.cleared
                ? `Cleared your ${result.target}x — +${result.points.toLocaleString()}`
                : `Busted below ${result.target}x — +${result.points}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Set a target and launch.</p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Target</p>
          <p className="font-mono text-sm text-amber-400">{target.toFixed(2)}x</p>
        </div>
        <input
          type="range"
          min={MIN_TARGET}
          max={MAX_TARGET}
          step={0.1}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full accent-amber-500"
          aria-label="Target multiplier"
        />
        <div className="mt-1.5 grid grid-cols-6 gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTarget(p)}
              className={`rounded-md py-1.5 text-xs font-semibold transition ${
                Math.abs(target - p) < 0.001
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {p}x
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-500">
          Pays <span className="text-amber-400">+{Math.round(WIN_BASE * target).toLocaleString()}</span> at{" "}
          {(100 / target).toFixed(1)}% · every target is worth the same on average
        </p>
      </div>

      <button
        type="button"
        onClick={() => onLaunch(Number(target.toFixed(2)))}
        disabled={busy || disabled}
        className="h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
      >
        {disabled ? "Out of drops today" : busy ? "Climbing…" : `Launch at ${target.toFixed(2)}x`}
      </button>
    </div>
  );
}
