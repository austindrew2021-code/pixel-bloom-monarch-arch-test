import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SlotMachine, type SlotView } from "@/components/arcade/slot-machine";
import { getSlot, playSlot } from "@/lib/arcade/server-slots";

/** One slot, opened from the lobby. */
export function SlotPlay({
  slotId,
  onBack,
  disabled,
  remaining,
  onScored,
}: {
  slotId: string;
  onBack: () => void;
  disabled: boolean;
  remaining: number;
  onScored: (points: number) => void;
}) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<SlotView>(null);
  const [spins, setSpins] = useState(0);

  const game = useQuery({
    queryKey: ["slots", "game", slotId],
    queryFn: () => getSlot({ data: { slotId } }),
  });

  const spin = useMutation({
    mutationFn: () => playSlot({ data: { slotId } }),
    onSuccess: (result) => {
      if (!game.data) return;
      setSpins((n) => n + 1);
      setView({ config: game.data.config, round: result.round, key: result.nonce });
      onScored(result.round.points);
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : "That spin could not be played."),
  });

  if (game.isPending) {
    return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>;
  }
  if (game.isError || !game.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-400">That game could not be loaded.</p>
        <button type="button" onClick={onBack} className="mt-3 text-sm text-amber-400 underline">
          Back to the lobby
        </button>
      </div>
    );
  }

  const { config, info } = game.data;
  const last = view?.round;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-amber-400 underline underline-offset-2"
        >
          ← All games
        </button>
        <p className="truncate text-sm font-bold text-slate-100">{config.name}</p>
      </div>

      <p className="mt-0.5 text-right text-[11px] text-slate-500">
        {config.mechanic.reels}×{config.mechanic.rows} ·{" "}
        {info.ways > 999 ? `${info.ways} ways` : `${info.ways} line${info.ways === 1 ? "" : "s"}`} ·{" "}
        {info.volatility} · feature 1 in {Math.round(1 / info.featureChance)}
      </p>

      <div className="mt-2">
        <SlotMachine config={config} view={view} spinning={spin.isPending} />
      </div>

      <div className="mt-2 min-h-[24px] text-center">
        {last ? (
          <p
            className={`text-sm font-semibold ${
              last.points > 0 ? "text-amber-400" : "text-slate-500"
            }`}
          >
            {last.featureTriggered
              ? `${config.mechanic.feature.spins} free spins at ×${config.mechanic.feature.multiplier} — +${last.points.toLocaleString()}`
              : last.points > 0
                ? `+${last.points.toLocaleString()}`
                : "No win"}
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            {spins === 0 ? "Spin to play. One spin costs one play." : ""}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => spin.mutate()}
        disabled={disabled || spin.isPending}
        className="mt-1 h-14 w-full rounded-xl text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
        style={disabled || spin.isPending ? undefined : { background: config.theme.glow }}
      >
        {disabled
          ? "Out of plays today"
          : spin.isPending
            ? "Spinning…"
            : `Spin · ${remaining} left today`}
      </button>

      <details className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-slate-300">
          Paytable
        </summary>
        <div className="mt-2 grid gap-1">
          {config.symbols.map((symbol, index) => (
            <div key={symbol.id} className="flex items-center gap-2 text-xs">
              <span
                className="w-6 text-center text-base"
                style={{
                  color:
                    symbol.kind === "pay"
                      ? config.theme.palette[Math.min(index, config.theme.palette.length - 1)]
                      : config.theme.glow,
                }}
              >
                {symbol.glyph}
              </span>
              <span className="w-14 shrink-0 text-slate-500">
                {symbol.kind === "pay" ? "" : symbol.kind}
              </span>
              <span className="flex-1 text-right font-mono text-slate-400">
                {Object.entries(symbol.pays).length === 0
                  ? symbol.kind === "wild"
                    ? "substitutes"
                    : `${config.mechanic.feature.trigger}+ triggers free spins`
                  : Object.entries(symbol.pays)
                      .map(([run, pay]) => `${run}→${pay}`)
                      .join("  ")}
              </span>
            </div>
          ))}
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            Every game in the catalogue is calibrated to the same average payout.
            Volatility changes how wins are shaped, never what they are worth.
          </p>
        </div>
      </details>
    </div>
  );
}
