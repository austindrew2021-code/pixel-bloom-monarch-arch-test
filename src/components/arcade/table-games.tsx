import { useState } from "react";
import * as dice from "@/lib/arcade/games/dice";
import * as keno from "@/lib/arcade/games/keno";
import * as roulette from "@/lib/arcade/games/roulette";
import * as scratch from "@/lib/arcade/games/scratch";
import * as wheel from "@/lib/arcade/games/wheel";

/**
 * The instant-bet games: Dice, Wheel, Roulette, Keno and Scratch.
 *
 * Each shows the odds and the payout of the choice being made before it is
 * made. That is not decoration — every one of these is built so all its options
 * are worth the same, and the only way a player can see that is if the numbers
 * are on screen.
 */

const PANEL = "rounded-2xl border border-slate-800 bg-slate-950 p-4";
const ACTION =
  "h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500";

/* ------------------------------------------------------------------- dice */

export type DiceResult = { roll: number; won: boolean; points: number } | null;

export function DiceGame({
  onRoll,
  busy,
  result,
  disabled,
}: {
  onRoll: (target: number, direction: dice.Direction) => void;
  busy: boolean;
  result: DiceResult;
  disabled: boolean;
}) {
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<dice.Direction>("under");
  const chance = dice.winChance(target, direction);

  return (
    <div className="grid gap-3">
      <div className={`${PANEL} grid min-h-[116px] place-items-center`}>
        {result ? (
          <div className="text-center">
            <p
              className={`font-mono text-4xl font-bold ${
                result.won ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {result.roll.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {result.won ? `Paid +${result.points.toLocaleString()}` : `+${result.points}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Set the line and call it.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {(["under", "over"] as dice.Direction[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={`rounded-lg py-2.5 text-sm font-bold capitalize transition ${
              direction === d ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300"
            }`}
          >
            Roll {d}
          </button>
        ))}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line</span>
          <span className="font-mono text-sm text-amber-400">{target}.00</span>
        </div>
        <input
          type="range"
          min={dice.MIN_TARGET}
          max={dice.MAX_TARGET}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full accent-amber-500"
          aria-label="Line"
        />
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {(chance * 100).toFixed(1)}% chance ·{" "}
          <span className="text-amber-400">
            +{dice.winPoints(target, direction).toLocaleString()}
          </span>{" "}
          on a win
        </p>
      </div>

      <button type="button" onClick={() => onRoll(target, direction)} disabled={busy || disabled} className={ACTION}>
        {disabled ? "Out of plays today" : busy ? "Rolling…" : `Roll ${direction} ${target}`}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ wheel */

export type WheelResult = { segment: number; multiplier: number; points: number } | null;

export function WheelGame({
  onSpin,
  busy,
  result,
  disabled,
}: {
  onSpin: (tier: wheel.RiskTier) => void;
  busy: boolean;
  result: WheelResult;
  disabled: boolean;
}) {
  const [tier, setTier] = useState<wheel.RiskTier>("medium");
  const segments = wheel.WHEELS[tier];

  return (
    <div className="grid gap-3">
      <div className={PANEL}>
        <div className="flex flex-wrap justify-center gap-1">
          {segments.map((multiplier, index) => (
            <span
              key={index}
              className={`grid h-8 min-w-9 place-items-center rounded px-1 text-[11px] font-bold transition ${
                result?.segment === index
                  ? "scale-110 bg-amber-400 text-slate-950"
                  : multiplier > 0
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-900 text-slate-600"
              }`}
            >
              {multiplier > 0 ? `${multiplier}x` : "—"}
            </span>
          ))}
        </div>
        <p className="mt-3 text-center text-sm">
          {result ? (
            <span className={result.points > 0 ? "font-semibold text-amber-400" : "text-slate-500"}>
              {result.multiplier > 0
                ? `${result.multiplier}x — +${result.points.toLocaleString()}`
                : "Blank"}
            </span>
          ) : (
            <span className="text-slate-500">Pick a wheel and spin.</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {wheel.TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(t)}
            className={`rounded-lg py-2.5 text-sm font-bold capitalize transition ${
              tier === t ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Pays on {(wheel.hitChance(tier) * 100).toFixed(0)}% of spins · top segment{" "}
        {Math.max(...segments)}x
      </p>

      <button type="button" onClick={() => onSpin(tier)} disabled={busy || disabled} className={ACTION}>
        {disabled ? "Out of plays today" : busy ? "Spinning…" : "Spin the wheel"}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- roulette */

export type RouletteResult = { pocket: number; won: boolean; points: number } | null;

const OUTSIDE: { kind: roulette.BetKind; label: string; selection: number }[] = [
  { kind: "red", label: "Red", selection: 0 },
  { kind: "black", label: "Black", selection: 0 },
  { kind: "odd", label: "Odd", selection: 0 },
  { kind: "even", label: "Even", selection: 0 },
  { kind: "low", label: "1–18", selection: 0 },
  { kind: "high", label: "19–36", selection: 0 },
  { kind: "dozen", label: "1st 12", selection: 0 },
  { kind: "dozen", label: "2nd 12", selection: 1 },
  { kind: "dozen", label: "3rd 12", selection: 2 },
];

export function RouletteGame({
  onSpin,
  busy,
  result,
  disabled,
}: {
  onSpin: (bet: roulette.Bet) => void;
  busy: boolean;
  result: RouletteResult;
  disabled: boolean;
}) {
  const [bet, setBet] = useState<roulette.Bet>({ kind: "red", selection: 0 });
  const label =
    bet.kind === "straight"
      ? `Straight ${bet.selection}`
      : (OUTSIDE.find((o) => o.kind === bet.kind && o.selection === bet.selection)?.label ?? bet.kind);

  return (
    <div className="grid gap-3">
      <div className={`${PANEL} grid min-h-[104px] place-items-center`}>
        {result ? (
          <div className="text-center">
            <span
              className={`grid size-16 place-items-center rounded-full text-2xl font-bold ${
                result.pocket === 0
                  ? "bg-emerald-600 text-white"
                  : roulette.RED.has(result.pocket)
                    ? "bg-red-600 text-white"
                    : "bg-slate-800 text-white"
              }`}
            >
              {result.pocket}
            </span>
            <p className="mt-2 text-sm text-slate-400">
              {result.won ? `Paid +${result.points.toLocaleString()}` : `+${result.points}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Place a bet and spin.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {OUTSIDE.map((option) => {
          const active = bet.kind === option.kind && bet.selection === option.selection;
          return (
            <button
              key={`${option.kind}-${option.selection}`}
              type="button"
              onClick={() => setBet({ kind: option.kind, selection: option.selection })}
              className={`rounded-lg py-2 text-xs font-bold transition ${
                active ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <details className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-slate-300">
          Straight up on a number
        </summary>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {Array.from({ length: roulette.POCKETS }, (_, pocket) => {
            const active = bet.kind === "straight" && bet.selection === pocket;
            return (
              <button
                key={pocket}
                type="button"
                onClick={() => setBet({ kind: "straight", selection: pocket })}
                className={`rounded py-1.5 text-[11px] font-bold transition ${
                  active
                    ? "bg-amber-500 text-slate-950"
                    : pocket === 0
                      ? "bg-emerald-800 text-emerald-100"
                      : roulette.RED.has(pocket)
                        ? "bg-red-900 text-red-100"
                        : "bg-slate-800 text-slate-200"
                }`}
              >
                {pocket}
              </button>
            );
          })}
        </div>
      </details>

      <p className="text-center text-[11px] text-slate-500">
        {label} · {(roulette.winChance(bet) * 100).toFixed(1)}% ·{" "}
        <span className="text-amber-400">+{roulette.winPoints(bet).toLocaleString()}</span> on a win
      </p>

      <button type="button" onClick={() => onSpin(bet)} disabled={busy || disabled} className={ACTION}>
        {disabled ? "Out of plays today" : busy ? "Spinning…" : `Spin on ${label}`}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------- keno */

export type KenoResult = { drawn: number[]; matched: number[]; points: number } | null;

export function KenoGame({
  onPlay,
  busy,
  result,
  disabled,
}: {
  onPlay: (picks: number[]) => void;
  busy: boolean;
  result: KenoResult;
  disabled: boolean;
}) {
  const [picks, setPicks] = useState<number[]>([]);
  const drawn = new Set(result?.drawn ?? []);
  const matched = new Set(result?.matched ?? []);

  const toggle = (n: number) => {
    setPicks((current) =>
      current.includes(n)
        ? current.filter((p) => p !== n)
        : current.length >= keno.MAX_PICKS
          ? current
          : [...current, n],
    );
  };

  return (
    <div className="grid gap-3">
      <div className={PANEL}>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: keno.POOL }, (_, i) => i + 1).map((n) => {
            const picked = picks.includes(n);
            const isDrawn = drawn.has(n);
            const hit = matched.has(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                disabled={busy}
                className={`grid aspect-square place-items-center rounded text-[11px] font-bold transition ${
                  hit
                    ? "bg-emerald-500 text-slate-950"
                    : isDrawn
                      ? "bg-sky-900 text-sky-200"
                      : picked
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-sm">
        {result ? (
          <span className={result.points > 0 ? "font-semibold text-amber-400" : "text-slate-500"}>
            {result.matched.length} of {picks.length} matched ·{" "}
            {result.points > 0 ? `+${result.points.toLocaleString()}` : "no win"}
          </span>
        ) : picks.length > 0 ? (
          <span className="text-slate-400">
            {picks.length} picked · needs {keno.THRESHOLDS[picks.length]} to pay ·{" "}
            {(keno.hitChance(picks.length) * 100).toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-500">Pick 1 to {keno.MAX_PICKS} numbers.</span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setPicks([])}
          disabled={busy || picks.length === 0}
          className="h-11 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            // A quick pick keeps the game playable without forty taps.
            const pool = Array.from({ length: keno.POOL }, (_, i) => i + 1);
            const chosen: number[] = [];
            while (chosen.length < 5) {
              const index = Math.floor(Math.random() * pool.length);
              chosen.push(pool.splice(index, 1)[0]!);
            }
            setPicks(chosen.sort((a, b) => a - b));
          }}
          disabled={busy}
          className="h-11 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 disabled:opacity-40"
        >
          Quick pick 5
        </button>
      </div>

      <button
        type="button"
        onClick={() => onPlay(picks)}
        disabled={busy || disabled || picks.length === 0}
        className={ACTION}
      >
        {disabled
          ? "Out of plays today"
          : busy
            ? "Drawing…"
            : picks.length === 0
              ? "Pick some numbers"
              : `Draw with ${picks.length}`}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- scratch */

export type ScratchResult = {
  cells: number[];
  wins: { symbol: number; count: number; points: number }[];
  points: number;
} | null;

const SCRATCH_COLORS = [
  "text-slate-400", "text-sky-300", "text-teal-300",
  "text-violet-300", "text-amber-300", "text-yellow-200",
];

export function ScratchGame({
  onPlay,
  busy,
  result,
  disabled,
}: {
  onPlay: () => void;
  busy: boolean;
  result: ScratchResult;
  disabled: boolean;
}) {
  const winning = new Set(result?.wins.map((w) => w.symbol) ?? []);

  return (
    <div className="grid gap-3">
      <div className={PANEL}>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: scratch.CELLS }, (_, i) => {
            const symbol = result?.cells[i];
            const isWinner = symbol !== undefined && winning.has(symbol);
            return (
              <div
                key={i}
                className={`grid aspect-square place-items-center rounded-lg text-3xl transition ${
                  isWinner ? "bg-amber-500/20 ring-1 ring-amber-400" : "bg-slate-900"
                } ${symbol === undefined ? "text-slate-700" : SCRATCH_COLORS[symbol]}`}
              >
                {symbol === undefined ? "?" : scratch.FACES[symbol]}
              </div>
            );
          })}
        </div>
      </div>

      <p className="min-h-[20px] text-center text-sm">
        {result ? (
          result.points > 0 ? (
            <span className="font-semibold text-amber-400">
              {result.wins.map((w) => `${w.count}× ${scratch.FACES[w.symbol]}`).join("  ")} · +
              {result.points.toLocaleString()}
            </span>
          ) : (
            <span className="text-slate-500">No three of a kind</span>
          )
        ) : (
          <span className="text-slate-500">Three of a kind anywhere pays.</span>
        )}
      </p>

      <button type="button" onClick={onPlay} disabled={busy || disabled} className={ACTION}>
        {disabled ? "Out of plays today" : busy ? "Scratching…" : "New card"}
      </button>
    </div>
  );
}
