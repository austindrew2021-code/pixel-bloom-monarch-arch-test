import { GRID_SIZE, MINE_CHOICES } from "@/lib/arcade/games/mines";

export type MinesView = {
  roundId: string;
  mineCount: number;
  revealed: number[];
  multiplier: number;
  bankable: boolean;
  bankPoints: number;
  nextPoints: number;
} | null;

export type MinesEnd = { mines: number[]; revealed: number[]; hit?: number; points: number } | null;

/**
 * Mines. The board the player sees is only ever what the server has told them:
 * revealed tiles, and — once the round is over — where the mines were. The
 * layout is not in this component's props while a round is live, so it cannot
 * leak through the page source or a network response.
 */
export function MinesGame({
  round,
  ended,
  busy,
  disabled,
  onOpen,
  onReveal,
  onBank,
}: {
  round: MinesView;
  ended: MinesEnd;
  busy: boolean;
  disabled: boolean;
  onOpen: (mineCount: number) => void;
  onReveal: (tile: number) => void;
  onBank: () => void;
}) {
  const revealed = new Set(round?.revealed ?? ended?.revealed ?? []);
  const mines = new Set(ended?.mines ?? []);
  const live = !!round && !ended;

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: GRID_SIZE }, (_, tile) => {
            const isRevealed = revealed.has(tile);
            const isMine = mines.has(tile);
            const isHit = ended?.hit === tile;
            return (
              <button
                key={tile}
                type="button"
                disabled={!live || isRevealed || busy}
                onClick={() => onReveal(tile)}
                className={`aspect-square rounded-lg text-lg transition ${
                  isHit
                    ? "bg-red-500 text-slate-950"
                    : isMine
                      ? "bg-red-500/25 text-red-300"
                      : isRevealed
                        ? "bg-emerald-500/20 text-emerald-300"
                        : live
                          ? "bg-slate-800 hover:bg-slate-700"
                          : "bg-slate-900"
                }`}
                aria-label={`Tile ${tile + 1}`}
              >
                {isMine ? "✦" : isRevealed ? "◆" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {ended ? (
        <p
          className={`text-center text-sm font-semibold ${
            ended.points > 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {ended.points > 0
            ? `Banked +${ended.points.toLocaleString()}`
            : "Hit a mine — the round paid nothing"}
        </p>
      ) : null}

      {live && round ? (
        <>
          <p className="text-center text-sm text-slate-400">
            {round.revealed.length} safe · {round.multiplier.toFixed(2)}x
            {round.bankable ? (
              <>
                {" · "}
                <span className="text-emerald-400">bank +{round.bankPoints.toLocaleString()}</span>
              </>
            ) : (
              " · reveal one tile to bank"
            )}
          </p>
          <button
            type="button"
            onClick={onBank}
            disabled={!round.bankable || busy}
            className="h-14 rounded-xl bg-emerald-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
          >
            {round.bankable ? `Bank ${round.bankPoints.toLocaleString()} points` : "Reveal a tile first"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Next safe tile takes it to {round.nextPoints.toLocaleString()}
          </p>
        </>
      ) : (
        <>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Mines
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {MINE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onOpen(n)}
                  disabled={busy || disabled}
                  className="rounded-lg bg-slate-900 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-500">
            {disabled
              ? "Out of drops today"
              : "More mines, steeper multiplier. Every choice is worth the same on average."}
          </p>
        </>
      )}
    </div>
  );
}
