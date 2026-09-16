import { useState } from "react";
import { MATCH_BONUS, MAX_COINS, MIN_COINS, POINTS_PER_COIN, sweepChance } from "@/lib/arcade/games/coinflip";

export type CoinResult = { faces: string; matched: boolean; points: number } | null;

/**
 * Coin Match. The odds and the bonus for each coin count are shown up front —
 * they are the entire decision, and hiding them would make the choice feel
 * meaningful when it is only a variance dial.
 */
export function CoinMatch({
  onFlip,
  busy,
  result,
  disabled,
}: {
  onFlip: (coins: number) => void;
  busy: boolean;
  result: CoinResult;
  disabled: boolean;
}) {
  const [coins, setCoins] = useState(3);
  const counts = Array.from({ length: MAX_COINS - MIN_COINS + 1 }, (_, i) => MIN_COINS + i);

  return (
    <div className="grid gap-3">
      <div className="flex min-h-[120px] items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-5">
        {result ? (
          result.faces.split("").map((face, i) => (
            <span
              key={i}
              className={`grid size-12 place-items-center rounded-full text-lg font-bold ${
                result.matched
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {face}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">Pick your coins and flip.</p>
        )}
      </div>

      {result ? (
        <p className={`text-center text-sm font-semibold ${result.matched ? "text-amber-400" : "text-slate-400"}`}>
          {result.matched ? `All ${result.faces.length} matched — +${result.points.toLocaleString()}` : `No sweep — +${result.points}`}
        </p>
      ) : null}

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Coins</p>
        <div className="grid grid-cols-4 gap-1.5">
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCoins(n)}
              className={`rounded-lg py-2.5 text-sm font-bold transition ${
                coins === n
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-500">
          {POINTS_PER_COIN * coins} guaranteed · sweep pays{" "}
          <span className="text-amber-400">+{MATCH_BONUS[coins]?.toLocaleString()}</span> at{" "}
          {(sweepChance(coins) * 100).toFixed(1)}%
        </p>
      </div>

      <button
        type="button"
        onClick={() => onFlip(coins)}
        disabled={busy || disabled}
        className="h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
      >
        {disabled ? "Out of drops today" : busy ? "Flipping…" : `Flip ${coins} coins`}
      </button>
    </div>
  );
}
