import * as hilo from "@/lib/arcade/games/hilo";
import * as tower from "@/lib/arcade/games/tower";

/**
 * The decision-chain games: Hi-Lo and Tower.
 *
 * Both show what the next step is worth and what stopping now is worth, because
 * in both the multiplier is exactly one over the risk being taken — pushing on
 * is never a mistake and banking is never leaving value behind. A player can
 * only see that if both numbers are on screen at once.
 */

const PANEL = "rounded-2xl border border-slate-800 bg-slate-950 p-4";
const BANK =
  "h-14 rounded-xl bg-emerald-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500";
const START =
  "h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500";

/* ------------------------------------------------------------------ hi-lo */

export type HiLoView = {
  showing: hilo.Card;
  calls: hilo.Call[];
  multiplier: number;
  bankable: boolean;
  bankPoints: number;
  higherChance: number;
  lowerChance: number;
  higherPoints: number;
  lowerPoints: number;
  maxCalls: number;
} | null;

export type HiLoEnd = { card?: hilo.Card; points: number; busted: boolean } | null;

const RANK_LABEL = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function CardFace({ card, muted }: { card: hilo.Card; muted?: boolean }) {
  const red = card.suit === 1 || card.suit === 2;
  return (
    <div
      className={`grid h-24 w-18 place-items-center rounded-xl border px-4 ${
        muted ? "border-slate-800 bg-slate-900/60" : "border-slate-700 bg-slate-100"
      }`}
    >
      <div className={`text-center ${muted ? "text-slate-500" : red ? "text-red-600" : "text-slate-900"}`}>
        <p className="text-3xl font-bold leading-none">{RANK_LABEL[card.rank]}</p>
        <p className="mt-0.5 text-xl leading-none">{hilo.SUITS[card.suit]}</p>
      </div>
    </div>
  );
}

export function HiLoGame({
  round,
  ended,
  busy,
  disabled,
  onOpen,
  onCall,
  onBank,
}: {
  round: HiLoView;
  ended: HiLoEnd;
  busy: boolean;
  disabled: boolean;
  onOpen: () => void;
  onCall: (call: hilo.Call) => void;
  onBank: () => void;
}) {
  const live = !!round && !ended;

  return (
    <div className="grid gap-3">
      <div className={`${PANEL} grid place-items-center`}>
        <div className="flex items-center gap-3">
          {round ? <CardFace card={round.showing} /> : null}
          {ended?.card ? <CardFace card={ended.card} muted={ended.busted} /> : null}
          {!round && !ended ? (
            <p className="py-8 text-sm text-slate-500">Deal a card to start.</p>
          ) : null}
        </div>
        {round && live ? (
          <p className="mt-3 text-xs text-slate-400">
            {round.calls.length} of {round.maxCalls} calls · {round.multiplier.toFixed(2)}x
          </p>
        ) : null}
      </div>

      {ended ? (
        <p
          className={`text-center text-sm font-semibold ${
            ended.points > 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {ended.points > 0
            ? `Banked +${ended.points.toLocaleString()}`
            : "Wrong call — the chain paid nothing"}
        </p>
      ) : null}

      {live && round ? (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onCall("higher")}
              disabled={busy}
              className="rounded-xl bg-slate-900 py-3 text-sm font-bold text-slate-100 transition hover:bg-slate-800 disabled:opacity-40"
            >
              Higher or same
              <span className="mt-0.5 block text-[11px] font-medium text-slate-400">
                {(round.higherChance * 100).toFixed(0)}% · +{round.higherPoints.toLocaleString()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onCall("lower")}
              disabled={busy}
              className="rounded-xl bg-slate-900 py-3 text-sm font-bold text-slate-100 transition hover:bg-slate-800 disabled:opacity-40"
            >
              Lower or same
              <span className="mt-0.5 block text-[11px] font-medium text-slate-400">
                {(round.lowerChance * 100).toFixed(0)}% · +{round.lowerPoints.toLocaleString()}
              </span>
            </button>
          </div>
          <button type="button" onClick={onBank} disabled={!round.bankable || busy} className={BANK}>
            {round.bankable
              ? `Bank ${round.bankPoints.toLocaleString()} points`
              : "Make a call first"}
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={onOpen} disabled={busy || disabled} className={START}>
            {disabled ? "Out of plays today" : busy ? "Dealing…" : "Deal"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            A tie counts for both calls — which is why the safe call pays least.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ tower */

export type TowerView = {
  difficulty: tower.Difficulty;
  picks: number[];
  floors: number;
  tiles: number;
  multiplier: number;
  bankable: boolean;
  bankPoints: number;
  nextPoints: number;
} | null;

export type TowerEnd = {
  safeTiles: number[][];
  picks: number[];
  hit?: number;
  points: number;
} | null;

export function TowerGame({
  round,
  ended,
  busy,
  disabled,
  onOpen,
  onClimb,
  onBank,
}: {
  round: TowerView;
  ended: TowerEnd;
  busy: boolean;
  disabled: boolean;
  onOpen: (difficulty: tower.Difficulty) => void;
  onClimb: (tile: number) => void;
  onBank: () => void;
}) {
  const live = !!round && !ended;
  const picks = round?.picks ?? ended?.picks ?? [];
  const tiles = round?.tiles ?? (ended ? (ended.safeTiles[0]?.length ?? 0) + 1 : 3);
  const currentFloor = picks.length;

  return (
    <div className="grid gap-3">
      <div className={PANEL}>
        <div className="grid gap-1.5">
          {/* Top floor first, so the tower reads upward. */}
          {Array.from({ length: tower.FLOORS }, (_, i) => tower.FLOORS - 1 - i).map((floor) => {
            const climbed = floor < currentFloor;
            const active = live && floor === currentFloor;
            return (
              <div key={floor} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-right text-[10px] text-slate-600">
                  {floor + 1}
                </span>
                <div
                  className="grid flex-1 gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${tiles}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: tiles }, (_, tile) => {
                    const picked = climbed && picks[floor] === tile;
                    const revealed = ended?.safeTiles[floor];
                    const wasSafe = revealed?.includes(tile) ?? false;
                    const isHit = ended?.hit === tile && floor === currentFloor;
                    return (
                      <button
                        key={tile}
                        type="button"
                        disabled={!active || busy}
                        onClick={() => onClimb(tile)}
                        className={`h-8 rounded transition ${
                          isHit
                            ? "bg-red-500"
                            : picked
                              ? "bg-emerald-500/70"
                              : revealed
                                ? wasSafe
                                  ? "bg-emerald-500/20"
                                  : "bg-red-500/15"
                                : active
                                  ? "bg-slate-700 hover:bg-slate-600"
                                  : "bg-slate-900"
                        }`}
                        aria-label={`Floor ${floor + 1} tile ${tile + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
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
            : "Hit a trap — the climb paid nothing"}
        </p>
      ) : null}

      {live && round ? (
        <>
          <p className="text-center text-sm text-slate-400">
            Floor {currentFloor} of {round.floors} · {round.multiplier.toFixed(2)}x
            {round.bankable ? (
              <>
                {" · "}
                <span className="text-emerald-400">bank +{round.bankPoints.toLocaleString()}</span>
              </>
            ) : null}
          </p>
          <button type="button" onClick={onBank} disabled={!round.bankable || busy} className={BANK}>
            {round.bankable
              ? `Bank ${round.bankPoints.toLocaleString()} points`
              : "Climb a floor first"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Next floor takes it to {round.nextPoints.toLocaleString()}
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {tower.LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onOpen(level)}
                disabled={busy || disabled}
                className="rounded-lg bg-slate-900 py-3 text-sm font-bold capitalize text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
              >
                {level}
                <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
                  {tower.DIFFICULTIES[level].safe}/{tower.DIFFICULTIES[level].tiles} safe
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-500">
            {disabled
              ? "Out of plays today"
              : "A steeper climb pays more per floor. All three are worth the same."}
          </p>
        </>
      )}
    </div>
  );
}
