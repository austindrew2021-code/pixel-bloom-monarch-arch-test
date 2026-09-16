import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as bj from "@/lib/arcade/cards/blackjack";
import type { CardTitle } from "@/lib/arcade/cards/catalog";
import { RANK_LABELS, SUIT_LABELS, rankOf, suitOf } from "@/lib/arcade/cards/deck";
import * as carrier from "@/lib/arcade/games/carrier";
import { getCardLobby } from "@/lib/arcade/server-cards";

/**
 * The card room: an eighty-title lobby, and the play screens for the families
 * that are not slots.
 */

const PANEL = "rounded-2xl border border-slate-800 bg-slate-950 p-4";
const ACTION =
  "h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500";

export function PlayingCard({ card, down }: { card?: number; down?: boolean }) {
  if (down || card === undefined) {
    return (
      <div className="grid h-20 w-14 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-600">
        ✦
      </div>
    );
  }
  const red = suitOf(card) === 1 || suitOf(card) === 2;
  return (
    <div className="grid h-20 w-14 place-items-center rounded-lg border border-slate-300 bg-slate-100">
      <div className={`text-center ${red ? "text-red-600" : "text-slate-900"}`}>
        <p className="text-xl font-bold leading-none">{RANK_LABELS[rankOf(card)]}</p>
        <p className="mt-0.5 text-lg leading-none">{SUIT_LABELS[suitOf(card)]}</p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- lobby */

const FAMILY_LABELS: Record<string, string> = {
  "video-poker": "Video poker",
  blackjack: "Blackjack",
  table: "Table",
  viking: "Viking",
  carrier: "Carrier",
};

export function CardLobby({ onPick }: { onPick: (titleId: string) => void }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const lobby = useQuery({ queryKey: ["cards", "lobby"], queryFn: () => getCardLobby() });

  const families = useMemo(
    () => [...new Set((lobby.data?.games ?? []).map((g) => g.family))],
    [lobby.data],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (lobby.data?.games ?? []).filter((game) => {
      if (family !== "all" && game.family !== family) return false;
      if (needle && !game.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [lobby.data, query, family]);

  if (lobby.isPending) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading the card room…</p>;
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${lobby.data?.total ?? 0} games`}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
      />
      <div className="mt-2 -mx-4 overflow-x-auto px-4">
        <div className="flex gap-1.5 pb-1">
          <Chip active={family === "all"} onClick={() => setFamily("all")}>
            All
          </Chip>
          {families.map((id) => (
            <Chip key={id} active={family === id} onClick={() => setFamily(id)}>
              {FAMILY_LABELS[id] ?? id}
            </Chip>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {filtered.length} of {lobby.data?.total} · every title pays the same on
        average; the card games are tuned to the strategy each one shows you
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 pb-4">
        {filtered.map((game) => (
          <Card key={game.id} game={game} onPick={onPick} />
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-sm text-slate-500">Nothing matches that.</p>
        ) : null}
      </div>
    </div>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ game, onPick }: { game: CardTitle; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(game.id)}
      className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-left transition hover:border-slate-600"
    >
      <div className="grid h-20 place-items-center">
        <span
          className="text-4xl transition-transform group-hover:scale-110"
          style={{ color: game.accent, textShadow: `0 0 18px ${game.accent}` }}
        >
          {game.glyph}
        </span>
      </div>
      <div className="border-t border-white/5 bg-slate-950/50 px-2 py-1.5">
        <p className="truncate text-xs font-semibold text-slate-100">{game.name}</p>
        <p className="truncate text-[10px] text-slate-400">{game.blurb}</p>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------- video poker */

export type PokerRound = { dealt: number[]; suggested: boolean[]; hands: number } | null;
export type PokerEnd = { finals: number[][]; held: boolean[]; points: number } | null;

export function VideoPokerPlay({
  round, ended, busy, disabled, onDeal, onDraw,
}: {
  round: PokerRound;
  ended: PokerEnd;
  busy: boolean;
  disabled: boolean;
  onDeal: () => void;
  onDraw: (held: boolean[]) => void;
}) {
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const live = !!round && !ended;
  const cards = ended?.finals[0] ?? round?.dealt ?? [];

  return (
    <div className="grid gap-3">
      <div className={`${PANEL} grid place-items-center`}>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="grid gap-1">
              <PlayingCard card={cards[i]} />
              <span
                className={`h-4 rounded text-center text-[9px] font-bold leading-4 ${
                  (ended?.held ?? held)[i]
                    ? "bg-amber-500 text-slate-950"
                    : "bg-transparent text-transparent"
                }`}
              >
                HELD
              </span>
            </div>
          ))}
        </div>
        {round && round.hands > 1 && ended ? (
          <p className="mt-2 text-[11px] text-slate-400">
            {round.hands} hands drawn from that hold
          </p>
        ) : null}
      </div>

      {ended ? (
        <p
          className={`text-center text-sm font-semibold ${
            ended.points > 0 ? "text-amber-400" : "text-slate-500"
          }`}
        >
          {ended.points > 0 ? `+${ended.points.toLocaleString()}` : "No pay"}
        </p>
      ) : null}

      {live ? (
        <>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHeld((h) => h.map((v, j) => (j === i ? !v : v)))}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  held[i] ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300"
                }`}
              >
                Hold
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setHeld(round!.suggested)}
            className="h-10 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300"
          >
            Use the suggested hold
          </button>
          <button type="button" onClick={() => onDraw(held)} disabled={busy} className={ACTION}>
            {busy ? "Drawing…" : "Draw"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setHeld([false, false, false, false, false]);
            onDeal();
          }}
          disabled={busy || disabled}
          className={ACTION}
        >
          {disabled ? "Out of plays today" : busy ? "Dealing…" : "Deal"}
        </button>
      )}

      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        Payouts are tuned to the suggested hold, so following it is worth what
        every other game in the arcade is worth. No hold beats it.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- blackjack */

export type BjRound = {
  player: number[];
  playerTotal: number;
  playerSoft: boolean;
  dealerUp: number;
  actions: bj.Action[];
  suggested: bj.Action;
} | null;

export type BjEnd = {
  player: number[];
  dealer: number[];
  outcome: string;
  points: number;
} | null;

export function BlackjackPlay({
  round, ended, busy, disabled, onDeal, onAct,
}: {
  round: BjRound;
  ended: BjEnd;
  busy: boolean;
  disabled: boolean;
  onDeal: () => void;
  onAct: (action: bj.Action) => void;
}) {
  const live = !!round && !ended;
  const player = ended?.player ?? round?.player ?? [];
  const dealer = ended?.dealer ?? (round ? [round.dealerUp] : []);

  return (
    <div className="grid gap-3">
      <div className={PANEL}>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Dealer {ended ? `· ${bj.handValue(dealer).total}` : ""}
        </p>
        <div className="flex gap-1.5">
          {dealer.map((card, i) => (
            <PlayingCard key={i} card={card} />
          ))}
          {live ? <PlayingCard down /> : null}
        </div>

        <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          You {round ? `· ${round.playerSoft ? "soft " : ""}${round.playerTotal}` : ended ? `· ${bj.handValue(player).total}` : ""}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {player.map((card, i) => (
            <PlayingCard key={i} card={card} />
          ))}
          {player.length === 0 ? <p className="text-sm text-slate-500">Deal to start.</p> : null}
        </div>
      </div>

      {ended ? (
        <p
          className={`text-center text-sm font-semibold ${
            ended.points > 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {ended.outcome === "blackjack"
            ? "Blackjack"
            : ended.outcome === "win"
              ? "You win"
              : ended.outcome === "push"
                ? "Push"
                : "Dealer wins"}{" "}
          · +{ended.points.toLocaleString()}
        </p>
      ) : null}

      {live && round ? (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {round.actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onAct(action)}
                disabled={busy}
                className={`rounded-xl py-3 text-sm font-bold capitalize transition disabled:opacity-40 ${
                  action === round.suggested
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {action}
                {action === round.suggested ? (
                  <span className="ml-1 text-[10px] font-medium">suggested</span>
                ) : null}
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-500">
            The highlighted action is basic strategy, which is what the payouts
            are tuned to.
          </p>
        </>
      ) : (
        <button type="button" onClick={onDeal} disabled={busy || disabled} className={ACTION}>
          {disabled ? "Out of plays today" : busy ? "Dealing…" : "Deal"}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- table games */

export type TableOption = { id: string; label: string; chance: number; pays: number };
export type TableResult = { labels: string[]; outcome: string | null; won: boolean; points: number } | null;

export function TableCardPlay({
  options, result, busy, disabled, onPlay,
}: {
  options: TableOption[];
  result: TableResult;
  busy: boolean;
  disabled: boolean;
  onPlay: (bet: string) => void;
}) {
  const [bet, setBet] = useState(options[0]?.id ?? "");
  const chosen = options.find((o) => o.id === bet);

  return (
    <div className="grid gap-3">
      <div className={`${PANEL} grid min-h-[110px] place-items-center`}>
        {result ? (
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-1.5">
              {result.labels.map((label, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm font-bold text-slate-900"
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {options.find((o) => o.id === result.outcome)?.label ?? result.outcome} ·{" "}
              {result.won ? `+${result.points.toLocaleString()}` : `+${result.points}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Place a bet and deal.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setBet(option.id)}
            className={`rounded-lg py-2.5 text-xs font-bold transition ${
              bet === option.id ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300"
            }`}
          >
            {option.label}
            <span className="mt-0.5 block text-[10px] font-medium opacity-70">
              {(option.chance * 100).toFixed(1)}% · +{option.pays.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPlay(bet)}
        disabled={busy || disabled || !chosen}
        className={ACTION}
      >
        {disabled ? "Out of plays today" : busy ? "Dealing…" : `Deal on ${chosen?.label ?? "…"}`}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- carrier */

export type CarrierRound = {
  path: number[];
  multiplier: number;
  bankable: boolean;
  bankPoints: number;
  nextPoints: number;
  safeChance: number;
} | null;

export type CarrierEnd = { grid: string[][]; path: number[]; points: number } | null;

export function CarrierPlay({
  round, ended, busy, disabled, onOpen, onFly, onBank,
}: {
  round: CarrierRound;
  ended: CarrierEnd;
  busy: boolean;
  disabled: boolean;
  onOpen: () => void;
  onFly: (lane: number) => void;
  onBank: () => void;
}) {
  const live = !!round && !ended;
  const path = round?.path ?? ended?.path ?? [];
  const sector = path.length;

  return (
    <div className="grid gap-3">
      <div className={PANEL}>
        <div className="grid gap-1">
          {Array.from({ length: carrier.SECTORS }, (_, i) => carrier.SECTORS - 1 - i).map((s) => {
            const flown = s < sector;
            const active = live && s === sector;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-10 shrink-0 text-right text-[9px] text-slate-600">
                  {s === carrier.SECTORS - 1 ? "deck" : s + 1}
                </span>
                <div className="grid flex-1 grid-cols-3 gap-1.5">
                  {Array.from({ length: carrier.LANES }, (_, lane) => {
                    const taken = flown && path[s] === lane;
                    const cell = ended?.grid[s]?.[lane];
                    return (
                      <button
                        key={lane}
                        type="button"
                        disabled={!active || busy}
                        onClick={() => onFly(lane)}
                        className={`grid h-7 place-items-center rounded text-xs transition ${
                          taken
                            ? "bg-emerald-500/70 text-slate-950"
                            : cell === "bomb"
                              ? "bg-red-500/25 text-red-300"
                              : cell === "bubble"
                                ? "bg-sky-500/20 text-sky-300"
                                : active
                                  ? "bg-slate-700 hover:bg-slate-600"
                                  : "bg-slate-900"
                        }`}
                        aria-label={`Sector ${s + 1} lane ${lane + 1}`}
                      >
                        {taken ? "✈" : cell === "bomb" ? "✸" : cell === "bubble" ? "◦" : ""}
                      </button>
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
          {ended.points > 0 ? `Banked +${ended.points.toLocaleString()}` : "Hit a bomb — nothing banked"}
        </p>
      ) : null}

      {live && round ? (
        <>
          <p className="text-center text-sm text-slate-400">
            Sector {sector} · {round.multiplier.toFixed(2)}x ·{" "}
            {(round.safeChance * 100).toFixed(0)}% clear ahead
          </p>
          <button
            type="button"
            onClick={onBank}
            disabled={!round.bankable || busy}
            className="h-14 rounded-xl bg-emerald-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
          >
            {round.bankable ? `Break off with ${round.bankPoints.toLocaleString()}` : "Fly a sector first"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Next sector takes it to {round.nextPoints.toLocaleString()}
          </p>
        </>
      ) : (
        <button type="button" onClick={onOpen} disabled={busy || disabled} className={ACTION}>
          {disabled ? "Out of plays today" : busy ? "Launching…" : "Launch"}
        </button>
      )}
    </div>
  );
}
