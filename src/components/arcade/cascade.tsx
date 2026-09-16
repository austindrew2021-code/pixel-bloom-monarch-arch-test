import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DropBoard, type BallRun } from "@/components/arcade/drop-board";
import { WalletCard } from "@/components/arcade/wallet-card";
import { dropBall, getArcade, getLeaderboard, grantAdDrops } from "@/lib/arcade/server";
import { UserButton } from "@/lib/auth/gates";

export function Cascade() {
  const queryClient = useQueryClient();
  const [runs, setRuns] = useState<BallRun[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const arcade = useQuery({ queryKey: ["arcade"], queryFn: () => getArcade() });
  const board = useQuery({ queryKey: ["arcade", "board"], queryFn: () => getLeaderboard() });

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
    onError: (error) => toast(error instanceof Error ? error.message : "Could not drop."),
  });

  const watchAd = useMutation({
    mutationFn: () => grantAdDrops(),
    onSuccess: (result) => {
      toast(
        result.granted > 0
          ? `+${result.granted} drops added.`
          : "You have taken every bonus available today.",
      );
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
  });

  // Refresh score and board only once the ball has actually landed, so the
  // numbers on screen never move before the animation that explains them.
  const onLanded = useCallback(
    (run: BallRun) => {
      setFlash(`+${run.points.toLocaleString()}`);
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 1100);
    return () => window.clearTimeout(timer);
  }, [flash]);

  if (arcade.isPending) {
    return <Shell><p className="py-24 text-center text-slate-400">Opening the board…</p></Shell>;
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
  const canDrop = allowance.remaining > 0 && !drop.isPending;

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
            Rank #{score.rank} · {score.dropsUsed} drops · closes {formatClose(season.closesAt)}
          </p>
        </div>
        <UserButton />
      </header>

      <section className="relative mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <DropBoard runs={runs} onLanded={onLanded} />
        {flash ? (
          <div className="pointer-events-none absolute inset-x-0 top-6 text-center">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-slate-950">
              {flash}
            </span>
          </div>
        ) : null}
      </section>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={() => drop.mutate()}
          disabled={!canDrop}
          className="h-14 rounded-xl bg-amber-500 text-base font-bold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
        >
          {allowance.remaining > 0 ? `Drop · ${allowance.remaining} left today` : "Out of drops today"}
        </button>
        {allowance.remaining <= 5 ? (
          <button
            type="button"
            onClick={() => watchAd.mutate()}
            disabled={watchAd.isPending}
            className="h-11 rounded-xl border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:opacity-50"
          >
            Watch a short video for +{allowance.perAd} drops
          </button>
        ) : null}
        <p className="text-center text-[11px] text-slate-500">
          {allowance.freePerDay} free drops every day at 00:00 UTC. Drops are never
          for sale.
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
            Fixed and published before the season opened. Prize values never change
            with how many people enter. Everyone who plays{" "}
            {arcade.data.participationMinDrops}+ drops and finishes outside the top
            20 gets bonus drops next season.
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
              No drops yet this season. Go first.
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
