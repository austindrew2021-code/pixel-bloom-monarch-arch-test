import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SHAPES, shapeFor } from "@/lib/arcade/slots/art";
import type { LobbyEntry } from "@/lib/arcade/slots/catalog";
import { getSlotLobby } from "@/lib/arcade/server-slots";

/**
 * The catalogue browser.
 *
 * 280 titles is only useful if a player can find one, so this filters by
 * mechanic and volatility and searches by name, and each card is drawn from its
 * own theme so the grid reads as a shelf of different games rather than a list.
 */
export function SlotLobby({ onPick }: { onPick: (slotId: string) => void }) {
  const [query, setQuery] = useState("");
  const [mechanic, setMechanic] = useState("all");
  const [volatility, setVolatility] = useState("all");

  const lobby = useQuery({ queryKey: ["slots", "lobby"], queryFn: () => getSlotLobby() });

  const mechanics = useMemo(() => {
    const seen = new Map<string, string>();
    for (const game of lobby.data?.games ?? []) seen.set(game.mechanicId, game.mechanicName);
    return [...seen.entries()];
  }, [lobby.data]);

  const volatilities = useMemo(
    () => [...new Set((lobby.data?.games ?? []).map((g) => g.volatility))],
    [lobby.data],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (lobby.data?.games ?? []).filter((game) => {
      if (mechanic !== "all" && game.mechanicId !== mechanic) return false;
      if (volatility !== "all" && game.volatility !== volatility) return false;
      if (needle && !game.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [lobby.data, query, mechanic, volatility]);

  if (lobby.isPending) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading the catalogue…</p>;
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
          <Chip active={mechanic === "all"} onClick={() => setMechanic("all")}>
            All styles
          </Chip>
          {mechanics.map(([id, name]) => (
            <Chip key={id} active={mechanic === id} onClick={() => setMechanic(id)}>
              {name}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mt-1.5 -mx-4 overflow-x-auto px-4">
        <div className="flex gap-1.5 pb-1">
          <Chip active={volatility === "all"} onClick={() => setVolatility("all")}>
            Any volatility
          </Chip>
          {volatilities.map((v) => (
            <Chip key={v} active={volatility === v} onClick={() => setVolatility(v)}>
              {v}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        {filtered.length} of {lobby.data?.total} · every title pays the same on
        average, so pick the one you like the look of
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2 pb-4">
        {filtered.map((game) => (
          <Card key={game.id} game={game} onPick={onPick} />
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-sm text-slate-500">
            Nothing matches that.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

/** The title's top symbol, drawn, as its cover. */
function CoverArt({ game }: { game: LobbyEntry }) {
  // Index 5 is the theme's top-paying face, which is the one worth showing.
  const art = SHAPES[shapeFor(game.themeId, 5)];
  const gradientId = `cover-${game.id}`;
  return (
    <svg
      viewBox="0 0 100 100"
      width={56}
      height={56}
      className="overflow-visible transition-transform duration-200 group-hover:scale-110"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={game.glow} />
          <stop offset="100%" stopColor="#0b1120" stopOpacity="0.85" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${gradientId}-glow)`}>
        <path d={art.body} fill={`url(#${gradientId})`} stroke={game.glow} strokeWidth="2.5" strokeLinejoin="round" />
        {art.detail ? (
          <path d={art.detail} fill="none" stroke={game.glow} strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />
        ) : null}
      </g>
    </svg>
  );
}

function Card({ game, onPick }: { game: LobbyEntry; onPick: (id: string) => void }) {
  const [from, to] = game.backdrop;
  return (
    <button
      type="button"
      onClick={() => onPick(game.id)}
      className="group overflow-hidden rounded-xl border border-slate-800 text-left transition hover:border-slate-600"
      style={{ background: `linear-gradient(${game.angle}deg, ${from} 0%, ${to} 100%)` }}
    >
      <div className="relative grid h-24 place-items-center">
        <CoverArt game={game} />
        <span
          className="absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-950"
          style={{ background: game.glow }}
        >
          {game.payMode === "ways"
            ? `${game.ways} ways`
            : game.ways === 1
              ? "1 line"
              : `${game.ways} lines`}
        </span>
      </div>
      <div className="border-t border-white/5 bg-slate-950/50 px-2 py-1.5">
        <p className="truncate text-xs font-semibold text-slate-100">{game.name}</p>
        <p className="text-[10px] text-slate-400">
          {game.reels}×{game.rows} · {game.volatility}
        </p>
      </div>
    </button>
  );
}
