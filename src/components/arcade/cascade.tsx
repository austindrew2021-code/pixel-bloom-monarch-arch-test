import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdOffer } from "@/components/arcade/ad-offer";
import { AscentGame, type AscentResult } from "@/components/arcade/ascent-game";
import { CoinMatch, type CoinResult } from "@/components/arcade/coin-match";
import { DropBoard, type BallRun } from "@/components/arcade/drop-board";
import { MinesGame, type MinesEnd, type MinesView } from "@/components/arcade/mines-game";
import { SlotLobby } from "@/components/arcade/slot-lobby";
import { SlotPlay } from "@/components/arcade/slot-play";
import { TumbleGame, type TumbleResult } from "@/components/arcade/tumble-game";
import { WalletCard } from "@/components/arcade/wallet-card";
import type { AscentDetail } from "@/lib/arcade/games/ascent";
import type { CoinFlipDetail } from "@/lib/arcade/games/coinflip";
import { GAMES, GAME_IDS, type GameId } from "@/lib/arcade/games/index";
import type { TumbleDetail } from "@/lib/arcade/games/tumble";
import { dropBall, getArcade, getLeaderboard } from "@/lib/arcade/server";
import {
  bankMines,
  getMinesRound,
  openMines,
  playArcadeGame,
  revealMinesTile,
} from "@/lib/arcade/server-games";
import { UserButton } from "@/lib/auth/gates";

/**
 * The arcade shell.
 *
 * Five games share one daily budget and one leaderboard, so the picker is the
 * only thing that changes between them — the score, the drops left and the
 * ladder are the same numbers throughout. That is the point: the games differ
 * in feel, not in what they are worth.
 */
/** The picker holds the five standalone games plus the slot catalogue. */
type Tab = GameId | "slots";

export function Cascade() {
  const queryClient = useQueryClient();
  const [game, setGame] = useState<Tab>("plinko");
  const [slotId, setSlotId] = useState<string | null>(null);

  const [runs, setRuns] = useState<BallRun[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [coin, setCoin] = useState<CoinResult>(null);
  const [ascent, setAscent] = useState<AscentResult>(null);
  const [tumble, setTumble] = useState<TumbleResult>(null);
  const [minesEnd, setMinesEnd] = useState<MinesEnd>(null);

  const arcade = useQuery({ queryKey: ["arcade"], queryFn: () => getArcade() });
  const board = useQuery({ queryKey: ["arcade", "board"], queryFn: () => getLeaderboard() });
  const mines = useQuery({
    queryKey: ["arcade", "mines"],
    queryFn: () => getMinesRound(),
    enabled: game === "mines",
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["arcade"] });
  }, [queryClient]);

  const showFlash = useCallback((points: number) => {
    setFlash(`+${points.toLocaleString()}`);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 1100);
    return () => window.clearTimeout(timer);
  }, [flash]);

  // Clear the previous game's result when switching, so a stale board from
  // another game never sits under a new one's controls.
  useEffect(() => {
    setCoin(null);
    setAscent(null);
    setTumble(null);
    setMinesEnd(null);
    setSlotId(null);
  }, [game]);

  const drop = useMutation({
    mutationFn: () => dropBall({ data: {} }),
    onSuccess: (result) => {
      setRuns((prev) => [
        ...prev.slice(-6),
        {
          id: `${result.drop.nonce}-${result.drop.path}`,
          path: result.drop.path,
          slot: result.drop.slot,
          points: result.drop.points,
        },
      ]);
    },
    onError: (error) => toast(message(error)),
  });

  const play = useMutation({
    mutationFn: (input: { game: GameId; coins?: number; target?: number }) =>
      playArcadeGame({ data: input }),
    onSuccess: (result) => {
      // The server returns each game's replay detail as plain JSON; narrow it
      // to the shape the matching component expects.
      if (result.game === "coinflip") {
        const detail = result.detail as unknown as CoinFlipDetail;
        setCoin({ faces: detail.faces, matched: detail.matched, points: result.points });
      } else if (result.game === "ascent") {
        const detail = result.detail as unknown as AscentDetail;
        setAscent({
          target: detail.target,
          bust: detail.bust,
          cleared: detail.cleared,
          points: result.points,
        });
      } else if (result.game === "tumble") {
        const detail = result.detail as unknown as TumbleDetail;
        setTumble({
          initialGrid: detail.initialGrid,
          steps: detail.steps,
          orbTotal: detail.orbTotal,
          points: result.points,
        });
      }
      showFlash(result.points);
      refresh();
    },
    onError: (error) => toast(message(error)),
  });

  const openRound = useMutation({
    mutationFn: (mineCount: number) => openMines({ data: { mineCount } }),
    onSuccess: () => {
      setMinesEnd(null);
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
    onError: (error) => toast(message(error)),
  });

  const reveal = useMutation({
    mutationFn: (tile: number) => revealMinesTile({ data: { tile } }),
    onSuccess: (result) => {
      if (result.hit) {
        setMinesEnd({
          mines: result.mines,
          revealed: mines.data?.revealed ?? [],
          hit: result.tile,
          points: 0,
        });
        refresh();
      }
      void queryClient.invalidateQueries({ queryKey: ["arcade", "mines"] });
    },
    onError: (error) => toast(message(error)),
  });

  const bank = useMutation({
    mutationFn: () => bankMines(),
    onSuccess: (result) => {
      setMinesEnd({ mines: result.mines, revealed: result.revealed, points: result.points });
      showFlash(result.points);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["arcade", "mines"] });
    },
    onError: (error) => toast(message(error)),
  });

  if (arcade.isPending) {
    return <Shell><p className="py-24 text-center text-slate-400">Opening the arcade…</p></Shell>;
  }
  if (arcade.isError || !arcade.data) {
    return (
      <Shell>
        <p className="py-24 text-center text-slate-400">
          The arcade could not load. Refresh to try again.
        </p>
      </Shell>
    );
  }

  const { season, player, allowance, score, ladder, prizePool } = arcade.data;
  const out = allowance.remaining <= 0;
  const busy = drop.isPending || play.isPending || openRound.isPending || reveal.isPending || bank.isPending;

  return (
    <Shell>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
            Cascade · Season {season.id}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-50">
            {score.points.toLocaleString()}
            <span className="ml-1.5 text-sm font-medium text-slate-400">points</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Rank #{score.rank} · {score.dropsUsed} plays · closes {formatClose(season.closesAt)}
          </p>
        </div>
        <UserButton />
      </header>

      <nav className="mt-4 -mx-4 overflow-x-auto px-4">
        <div className="flex gap-1.5 pb-1">
          <button
            type="button"
            onClick={() => setGame("slots")}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              game === "slots"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Slots
          </button>
          {GAME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setGame(id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                game === id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {GAMES[id].name}
            </button>
          ))}
        </div>
      </nav>
      {game !== "slots" ? (
        <p className="mt-1 text-xs text-slate-500">{GAMES[game].tagline}</p>
      ) : null}

      <section className="relative mt-3">
        {flash ? (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-10 text-center">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-slate-950">
              {flash}
            </span>
          </div>
        ) : null}

        {game === "plinko" ? (
          <div className="grid gap-3">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <DropBoard runs={runs} onLanded={(run) => { showFlash(run.points); refresh(); }} />
            </div>
            <button
              type="button"
              onClick={() => drop.mutate()}
              disabled={out || busy}
              className="h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
            >
              {out ? "Out of drops today" : `Drop · ${allowance.remaining} left today`}
            </button>
          </div>
        ) : null}

        {game === "coinflip" ? (
          <CoinMatch
            onFlip={(coins) => play.mutate({ game: "coinflip", coins })}
            busy={busy}
            result={coin}
            disabled={out}
          />
        ) : null}

        {game === "ascent" ? (
          <AscentGame
            onLaunch={(target) => play.mutate({ game: "ascent", target })}
            busy={busy}
            result={ascent}
            disabled={out}
          />
        ) : null}

        {game === "tumble" ? (
          <TumbleGame
            onSpin={() => play.mutate({ game: "tumble" })}
            busy={busy}
            result={tumble}
            disabled={out}
          />
        ) : null}

        {game === "slots" ? (
          slotId ? (
            <SlotPlay
              slotId={slotId}
              onBack={() => setSlotId(null)}
              disabled={out}
              remaining={allowance.remaining}
              onScored={(points) => showFlash(points)}
            />
          ) : (
            <SlotLobby onPick={setSlotId} />
          )
        ) : null}

        {game === "mines" ? (
          <MinesGame
            round={(mines.data as MinesView) ?? null}
            ended={minesEnd}
            busy={busy}
            disabled={out}
            onOpen={(count) => openRound.mutate(count)}
            onReveal={(tile) => reveal.mutate(tile)}
            onBank={() => bank.mutate()}
          />
        ) : null}
      </section>

      <div className="mt-3 grid gap-2">
        {allowance.remaining <= 5 && !(game === "slots" && !slotId) ? (
          <AdOffer
            placement={out ? "out-of-drops" : "top-up"}
            label={`Watch a short video for +${allowance.perAd} plays`}
          />
        ) : null}
        <p className="text-center text-[11px] text-slate-500">
          {allowance.remaining} plays left today · {allowance.freePerDay} free every day at
          00:00 UTC. Plays are never for sale.
        </p>
      </div>

      <section className="mt-6">
        <WalletCard walletAddress={player.walletAddress} />
      </section>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-slate-200">This season's ladder</h2>
          <span className="text-xs text-slate-500">${prizePool.toLocaleString()} total</span>
        </div>
        <div className="mt-2 grid gap-1">
          {ladder.map((band) => (
            <div
              key={band.rankFrom}
              className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm"
            >
              <span className="text-slate-300">
                {band.rankFrom === band.rankTo
                  ? `#${band.rankFrom}`
                  : `#${band.rankFrom}–${band.rankTo}`}
                <span className="ml-2 text-[11px] uppercase tracking-wide text-slate-500">
                  {band.tier}
                </span>
              </span>
              <span className="font-semibold text-emerald-400">${band.usdc} USDC</span>
            </div>
          ))}
          <p className="mt-1 px-1 text-[11px] leading-relaxed text-slate-500">
            Fixed and published before the season opened. Every game pays the same on
            average, so play whichever you like — none of them is the better bet.
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold text-slate-200">Leaderboard</h2>
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-800">
          {board.data && board.data.rows.length > 0 ? (
            board.data.rows.slice(0, 20).map((row) => (
              <div
                key={row.rank}
                className={`flex items-center gap-3 border-b border-slate-800/60 px-3 py-2 text-sm last:border-0 ${
                  row.isMe ? "bg-amber-500/10" : ""
                }`}
              >
                <span className="w-7 shrink-0 text-xs font-semibold text-slate-500">
                  #{row.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-200">
                  {row.handle}
                  {row.isMe ? <span className="ml-1.5 text-xs text-amber-400">you</span> : null}
                </span>
                {row.prize ? (
                  <span className="shrink-0 text-xs font-semibold text-emerald-400">
                    ${row.prize}
                  </span>
                ) : null}
                <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-300">
                  {row.points.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              No plays yet this season. Go first.
            </p>
          )}
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-10 text-xs text-slate-500">
        <Link to="/cascade/rules" className="underline underline-offset-2 hover:text-slate-300">
          Official rules
        </Link>
        <Link to="/cascade/verify" className="underline underline-offset-2 hover:text-slate-300">
          Verify fairness
        </Link>
        <span className="w-full text-center text-[11px] text-slate-600">
          No purchase necessary. Free to enter and play.
        </span>
      </footer>
    </Shell>
  );
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 pt-6 text-slate-100">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </main>
  );
}

function formatClose(iso: string): string {
  const date = new Date(iso);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}
