import { useEffect, useMemo, useState } from "react";
import * as viking from "@/lib/arcade/games/viking";

/**
 * Viking Longships.
 *
 * Replays a voyage the server already resolved: the wheel turns, a ship moves,
 * milestones light as they are passed, and the two bonuses play out where they
 * fell. The axe and the runes are shown landing where the seed put them, and
 * the game says so — dressing a predetermined result up as aim would make this
 * the one game in the arcade that is not what it claims to be.
 */

export type VikingResult = { detail: viking.VikingDetail; points: number } | null;

const SLOT_FACE = (slot: viking.WheelSlot) =>
  slot.kind === "move" ? String(slot.spaces) : slot.kind === "power" ? "⚡︎" : "🗲";

const ROW_COLORS = ["#f87171", "#fbbf24", "#4ade80", "#22d3ee", "#a78bfa", "#f472b6"];

export function VikingPlay({
  onSail,
  busy,
  result,
  disabled,
  hard,
}: {
  onSail: () => void;
  busy: boolean;
  result: VikingResult;
  disabled: boolean;
  hard: boolean;
}) {
  const [step, setStep] = useState(0);

  // Walk the voyage spin by spin once a result lands.
  useEffect(() => {
    if (!result) return;
    setStep(0);
    const total = result.detail.spins.length;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= total) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 260);
    return () => window.clearInterval(timer);
  }, [result]);

  const spins = result?.detail.spins ?? [];
  const shown = spins.slice(0, step);
  const current = shown[shown.length - 1] ?? null;
  const done = !!result && step >= spins.length;

  // Ship positions as of the spins played so far.
  const positions = useMemo(() => {
    const at = new Array<number>(viking.ROWS).fill(0);
    for (const spin of shown) at[spin.row] = spin.position;
    return at;
  }, [shown]);

  const bonusNow = useMemo(() => {
    if (!result || !current) return null;
    const shield = result.detail.shields.find((s) => s.afterSpin === current.spin);
    if (shield) return { kind: "shield" as const, shield };
    const rune = result.detail.runes.find((r) => r.afterSpin === current.spin);
    if (rune) return { kind: "rune" as const, rune };
    return null;
  }, [result, current]);

  const powerUps = current?.powerUps ?? 0;
  const lightning = current?.lightning ?? 0;

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0b1a2b] to-[#040a12] p-3">
        {/* Milestones along the top, as a legend for the track below. */}
        <div className="relative mb-1.5 h-4">
          {viking.MILESTONES.map((milestone) => (
            <span
              key={milestone.space}
              className="absolute -translate-x-1/2 text-[9px] font-bold text-amber-400/70"
              style={{ left: `${(milestone.space / viking.TRACK) * 100}%` }}
            >
              {milestone.reward}
            </span>
          ))}
        </div>

        <div className="grid gap-1.5">
          {Array.from({ length: viking.ROWS }, (_, row) => (
            <div key={row} className="relative h-6 rounded bg-slate-950/60">
              {viking.MILESTONES.map((milestone) => (
                <span
                  key={milestone.space}
                  className="absolute top-0 h-full w-px bg-amber-400/25"
                  style={{ left: `${(milestone.space / viking.TRACK) * 100}%` }}
                />
              ))}
              <span
                className={`absolute top-1/2 -translate-y-1/2 text-base transition-all duration-200 ${
                  current?.row === row ? "scale-125" : ""
                }`}
                style={{
                  left: `calc(${(positions[row]! / viking.TRACK) * 100}% - 8px)`,
                  color: ROW_COLORS[row],
                  filter: current?.row === row ? `drop-shadow(0 0 6px ${ROW_COLORS[row]})` : undefined,
                }}
              >
                ⛵
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`grid size-10 place-items-center rounded-full text-lg font-bold transition ${
              current?.slot.kind === "lightning"
                ? "bg-sky-400 text-slate-950"
                : current?.slot.kind === "power"
                  ? "bg-violet-400 text-slate-950"
                  : "bg-slate-800 text-slate-100"
            }`}
          >
            {current ? SLOT_FACE(current.slot) : "—"}
          </span>
          <span className="text-xs text-slate-400">
            {current ? `Crew ${current.row + 1}` : "Wheel"}
            {result ? ` · ${Math.min(step, spins.length)}/${spins.length}` : ""}
          </span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-violet-300">
            {"⚡︎".repeat(powerUps)}
            <span className="text-slate-600">{"·".repeat(Math.max(0, viking.POWER_TRIGGER - powerUps))}</span>
          </span>
          <span className="text-sky-300">
            {"🗲".repeat(lightning)}
            <span className="text-slate-600">{"·".repeat(Math.max(0, viking.LIGHTNING_TRIGGER - lightning))}</span>
          </span>
        </div>
      </div>

      {bonusNow?.kind === "shield" ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-400">Shield bonus</p>
          <p className="mt-1 text-sm text-slate-200">
            The axe lands on{" "}
            <b>
              {bonusNow.shield.reward.kind === "points"
                ? `${bonusNow.shield.reward.reward} treasure`
                : bonusNow.shield.reward.kind === "spins"
                  ? `${bonusNow.shield.reward.spins} more spins`
                  : bonusNow.shield.reward.kind === "power"
                    ? `${bonusNow.shield.reward.power} power-up${bonusNow.shield.reward.power > 1 ? "s" : ""}`
                    : "a lightning reset"}
            </b>
          </p>
        </div>
      ) : null}

      {bonusNow?.kind === "rune" ? (
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-400">Rune bonus</p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-1">
            {bonusNow.rune.turned.map((index, i) => {
              const rune = viking.RUNES[index]!;
              return (
                <span
                  key={i}
                  className={`grid size-8 place-items-center rounded text-xs font-bold ${
                    rune.kind === "end" ? "bg-red-500 text-slate-950" : "bg-sky-400 text-slate-950"
                  }`}
                >
                  {rune.kind === "end" ? "✕" : rune.kind === "spins" ? `+${rune.spins}` : rune.reward}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="min-h-[24px] text-center">
        {done && result ? (
          <p className="text-sm font-semibold text-amber-400">
            +{result.points.toLocaleString()}
            {result.detail.extraSpins > 0 ? ` · ${result.detail.extraSpins} extra spins won` : ""}
            {result.detail.positions.some((p) => p >= viking.TRACK) ? " · a ship made it home" : ""}
          </p>
        ) : result ? (
          <p className="text-sm text-slate-500">Sailing…</p>
        ) : (
          <p className="text-xs text-slate-500">
            Six crews, {viking.SPINS_PER_ROW} spins each. Three ⚡︎ opens the shield, three 🗲 opens
            the runes.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onSail}
        disabled={busy || disabled || (!!result && !done)}
        className="h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
      >
        {disabled ? "Out of plays today" : busy ? "Casting off…" : hard ? "Sail the storm" : "Sail"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        The whole voyage — the wheel, the axe, the runes — is decided by this
        round's seed before the first frame draws. Nothing you tap changes it,
        and you can recompute all of it once the season's seed is published.
      </p>
    </div>
  );
}
