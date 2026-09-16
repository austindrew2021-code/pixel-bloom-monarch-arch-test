import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdOffer } from "@/components/arcade/ad-offer";
import { AscentGame, type AscentResult } from "@/components/arcade/ascent-game";
import { CoinMatch, type CoinResult } from "@/components/arcade/coin-match";
import { DropBoard, type BallRun } from "@/components/arcade/drop-board";
import { MinesGame, type MinesEnd, type MinesView } from "@/components/arcade/mines-game";
import {
  HiLoGame, TowerGame,
  type HiLoEnd, type HiLoView, type TowerEnd, type TowerView,
} from "@/components/arcade/chain-games";
import {
  BlackjackPlay, CardLobby, CarrierPlay, TableCardPlay, VideoPokerPlay,
  type BjEnd, type BjRound, type CarrierEnd, type CarrierRound,
  type PokerEnd, type PokerRound, type TableOption, type TableResult,
} from "@/components/arcade/card-room";
import { SlotLobby } from "@/components/arcade/slot-lobby";
import { VikingPlay, type VikingResult } from "@/components/arcade/viking-play";
import {
  DiceGame, KenoGame, RouletteGame, ScratchGame, WheelGame,
  type DiceResult, type KenoResult, type RouletteResult,
  type ScratchResult, type WheelResult,
} from "@/components/arcade/table-games";
import { SlotPlay } from "@/components/arcade/slot-play";
import { TumbleGame, type TumbleResult } from "@/components/arcade/tumble-game";
import { WalletCard } from "@/components/arcade/wallet-card";
import type { AscentDetail } from "@/lib/arcade/games/ascent";
import type { CoinFlipDetail } from "@/lib/arcade/games/coinflip";
import type { DiceDetail, Direction } from "@/lib/arcade/games/dice";
import type { Call } from "@/lib/arcade/games/hilo";
import type { KenoDetail } from "@/lib/arcade/games/keno";
import type { Bet, RouletteDetail } from "@/lib/arcade/games/roulette";
import type { ScratchDetail } from "@/lib/arcade/games/scratch";
import type { Difficulty } from "@/lib/arcade/games/tower";
import type { RiskTier, WheelDetail } from "@/lib/arcade/games/wheel";
import type { Action } from "@/lib/arcade/cards/blackjack";
import type { VikingDetail } from "@/lib/arcade/games/viking";
import type { TableCardDetail } from "@/lib/arcade/cards/table-card";
import {
  actBlackjack, bankCarrier, dealBlackjack, dealPoker, drawPoker, flyCarrier,
  getBlackjackRound, getCardInfo, getCarrierRound, getPokerRound,
  openCarrier, playTableCard, playViking,
} from "@/lib/arcade/server-cards";
import { GAMES, GAME_IDS, type GameId } from "@/lib/arcade/games/index";
import type { TumbleDetail } from "@/lib/arcade/games/tumble";
import { dropBall, getArcade, getLeaderboard } from "@/lib/arcade/server";
import {
  bankHiLo, bankTower, callHiLo, climbTower,
  getHiLoRound, getTowerRound, openHiLo, openTower,
} from "@/lib/arcade/server-chain";
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
type Tab = GameId | "slots" | "cards";

export function Cascade() {
  const queryClient = useQueryClient();
  const [game, setGame] = useState<Tab>("plinko");
  const [slotId, setSlotId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [pokerEnd, setPokerEnd] = useState<PokerEnd>(null);
  const [bjEnd, setBjEnd] = useState<BjEnd>(null);
  const [tableResult, setTableResult] = useState<TableResult>(null);
  const [vikingResult, setVikingResult] = useState<VikingResult>(null);
  const [carrierEnd, setCarrierEnd] = useState<CarrierEnd>(null);

  const [runs, setRuns] = useState<BallRun[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [coin, setCoin] = useState<CoinResult>(null);
  const [ascent, setAscent] = useState<AscentResult>(null);
  const [tumble, setTumble] = useState<TumbleResult>(null);
  const [minesEnd, setMinesEnd] = useState<MinesEnd>(null);
  const [diceResult, setDiceResult] = useState<DiceResult>(null);
  const [wheelResult, setWheelResult] = useState<WheelResult>(null);
  const [rouletteResult, setRouletteResult] = useState<RouletteResult>(null);
  const [kenoResult, setKenoResult] = useState<KenoResult>(null);
  const [scratchResult, setScratchResult] = useState<ScratchResult>(null);
  const [hiloEnd, setHiloEnd] = useState<HiLoEnd>(null);
  const [towerEnd, setTowerEnd] = useState<TowerEnd>(null);

  const arcade = useQuery({ queryKey: ["arcade"], queryFn: () => getArcade() });
  const board = useQuery({ queryKey: ["arcade", "board"], queryFn: () => getLeaderboard() });
  const mines = useQuery({
    queryKey: ["arcade", "mines"],
    queryFn: () => getMinesRound(),
    enabled: game === "mines",
  });
  const hiloRound = useQuery({
    queryKey: ["arcade", "hilo"],
    queryFn: () => getHiLoRound(),
    enabled: game === "hilo",
  });
  const towerRound = useQuery({
    queryKey: ["arcade", "tower"],
    queryFn: () => getTowerRound(),
    enabled: game === "tower",
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
    setCardId(null);
    setPokerEnd(null);
    setBjEnd(null);
    setTableResult(null);
    setVikingResult(null);
    setCarrierEnd(null);
    setDiceResult(null);
    setWheelResult(null);
    setRouletteResult(null);
    setKenoResult(null);
    setScratchResult(null);
    setHiloEnd(null);
    setTowerEnd(null);
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
    mutationFn: (input: {
      game: GameId;
      coins?: number;
      target?: number;
      direction?: Direction;
      tier?: RiskTier;
      bet?: Bet;
      picks?: number[];
    }) => playArcadeGame({ data: input }),
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
      } else if (result.game === "dice") {
        const detail = result.detail as unknown as DiceDetail;
        setDiceResult({ roll: detail.roll, won: detail.won, points: result.points });
      } else if (result.game === "wheel") {
        const detail = result.detail as unknown as WheelDetail;
        setWheelResult({
          segment: detail.segment,
          multiplier: detail.multiplier,
          points: result.points,
        });
      } else if (result.game === "roulette") {
        const detail = result.detail as unknown as RouletteDetail;
        setRouletteResult({ pocket: detail.pocket, won: detail.won, points: result.points });
      } else if (result.game === "keno") {
        const detail = result.detail as unknown as KenoDetail;
        setKenoResult({
          drawn: detail.drawn,
          matched: detail.matched,
          points: result.points,
        });
      } else if (result.game === "scratch") {
        const detail = result.detail as unknown as ScratchDetail;
        setScratchResult({ cells: detail.cells, wins: detail.wins, points: result.points });
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

  const cardInfo = useQuery({
    queryKey: ["cards", "info", cardId],
    queryFn: () => getCardInfo({ data: { titleId: cardId! } }),
    enabled: game === "cards" && !!cardId,
  });
  const pokerRound = useQuery({
    queryKey: ["cards", "poker"],
    queryFn: () => getPokerRound(),
    enabled: game === "cards" && cardInfo.data?.title.family === "video-poker",
  });
  const bjRound = useQuery({
    queryKey: ["cards", "blackjack"],
    queryFn: () => getBlackjackRound(),
    enabled: game === "cards" && cardInfo.data?.title.family === "blackjack",
  });
  const carrierRound = useQuery({
    queryKey: ["cards", "carrier"],
    queryFn: () => getCarrierRound(),
    enabled: game === "cards" && cardInfo.data?.title.family === "carrier",
  });

  const deal = useMutation({
    mutationFn: () => dealPoker({ data: { titleId: cardId! } }),
    onSuccess: () => {
      setPokerEnd(null);
      void queryClient.invalidateQueries({ queryKey: ["cards", "poker"] });
      refresh();
    },
    onError: (error) => toast(message(error)),
  });

  const draw = useMutation({
    mutationFn: (held: boolean[]) => drawPoker({ data: { held } }),
    onSuccess: (result) => {
      setPokerEnd({ finals: result.finals, held: result.held, points: result.points });
      showFlash(result.points);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["cards", "poker"] });
    },
    onError: (error) => toast(message(error)),
  });

  const dealBj = useMutation({
    mutationFn: () => dealBlackjack({ data: { titleId: cardId! } }),
    onSuccess: () => {
      setBjEnd(null);
      void queryClient.invalidateQueries({ queryKey: ["cards", "blackjack"] });
      refresh();
    },
    onError: (error) => toast(message(error)),
  });

  const actBj = useMutation({
    mutationFn: (action: Action) => actBlackjack({ data: { action } }),
    onSuccess: (result) => {
      if (result.finished) {
        setBjEnd({
          player: result.player, dealer: result.dealer,
          outcome: result.outcome, points: result.points,
        });
        showFlash(result.points);
        refresh();
      }
      void queryClient.invalidateQueries({ queryKey: ["cards", "blackjack"] });
    },
    onError: (error) => toast(message(error)),
  });

  const dealTable = useMutation({
    mutationFn: (bet: string) => playTableCard({ data: { titleId: cardId!, bet } }),
    onSuccess: (result) => {
      const detail = result.detail as unknown as TableCardDetail;
      setTableResult({
        labels: detail.labels, outcome: detail.outcome,
        won: detail.won, points: result.points,
      });
      showFlash(result.points);
      refresh();
    },
    onError: (error) => toast(message(error)),
  });

  const sail = useMutation({
    mutationFn: () => playViking({ data: { titleId: cardId! } }),
    onSuccess: (result) => {
      setVikingResult({
        detail: result.detail as unknown as VikingDetail,
        points: result.points,
      });
      showFlash(result.points);
      refresh();
    },
    onError: (error) => toast(message(error)),
  });

  const launch = useMutation({
    mutationFn: () => openCarrier(),
    onSuccess: () => {
      setCarrierEnd(null);
      void queryClient.invalidateQueries({ queryKey: ["cards", "carrier"] });
      refresh();
    },
    onError: (error) => toast(message(error)),
  });

  const fly = useMutation({
    mutationFn: (lane: number) => flyCarrier({ data: { lane } }),
    onSuccess: (result) => {
      if (!result.survived) {
        setCarrierEnd({
          grid: result.grid, path: carrierRound.data?.path ?? [], points: 0,
        });
        refresh();
      } else if ("landed" in result && result.landed) {
        setCarrierEnd({
          grid: result.grid,
          path: [...(carrierRound.data?.path ?? []), 0],
          points: result.points,
        });
        showFlash(result.points);
        refresh();
      }
      void queryClient.invalidateQueries({ queryKey: ["cards", "carrier"] });
    },
    onError: (error) => toast(message(error)),
  });

  const breakOff = useMutation({
    mutationFn: () => bankCarrier(),
    onSuccess: (result) => {
      setCarrierEnd({ grid: result.grid, path: result.path, points: result.points });
      showFlash(result.points);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["cards", "carrier"] });
    },
    onError: (error) => toast(message(error)),
  });

  const dealHiLo = useMutation({
    mutationFn: () => openHiLo(),
    onSuccess: () => {
      setHiloEnd(null);
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
    onError: (error) => toast(message(error)),
  });

  const makeCall = useMutation({
    mutationFn: (call: Call) => callHiLo({ data: { call } }),
    onSuccess: (result) => {
      if (!result.survived) {
        setHiloEnd({ card: result.card, points: 0, busted: true });
        refresh();
      } else if ("banked" in result && result.banked) {
        // The chain hit its length limit and settled itself.
        setHiloEnd({ card: result.card, points: result.points, busted: false });
        showFlash(result.points);
        refresh();
      }
      void queryClient.invalidateQueries({ queryKey: ["arcade", "hilo"] });
    },
    onError: (error) => toast(message(error)),
  });

  const cashHiLo = useMutation({
    mutationFn: () => bankHiLo(),
    onSuccess: (result) => {
      setHiloEnd({ points: result.points, busted: false });
      showFlash(result.points);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["arcade", "hilo"] });
    },
    onError: (error) => toast(message(error)),
  });

  const startTower = useMutation({
    mutationFn: (difficulty: Difficulty) => openTower({ data: { difficulty } }),
    onSuccess: () => {
      setTowerEnd(null);
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
    onError: (error) => toast(message(error)),
  });

  const climb = useMutation({
    mutationFn: (tile: number) => climbTower({ data: { tile } }),
    onSuccess: (result) => {
      if (!result.survived) {
        setTowerEnd({
          safeTiles: result.safeTiles,
          picks: towerRound.data?.picks ?? [],
          hit: result.tile,
          points: 0,
        });
        refresh();
      } else if ("topped" in result && result.topped) {
        setTowerEnd({
          safeTiles: result.safeTiles,
          picks: [...(towerRound.data?.picks ?? []), result.tile],
          points: result.points,
        });
        showFlash(result.points);
        refresh();
      }
      void queryClient.invalidateQueries({ queryKey: ["arcade", "tower"] });
    },
    onError: (error) => toast(message(error)),
  });

  const cashTower = useMutation({
    mutationFn: () => bankTower(),
    onSuccess: (result) => {
      setTowerEnd({ safeTiles: result.safeTiles, picks: result.picks, points: result.points });
      showFlash(result.points);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["arcade", "tower"] });
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
  const busy =
    drop.isPending || play.isPending || openRound.isPending || reveal.isPending ||
    bank.isPending || dealHiLo.isPending || makeCall.isPending || cashHiLo.isPending ||
    startTower.isPending || climb.isPending || cashTower.isPending ||
    deal.isPending || draw.isPending || dealBj.isPending || actBj.isPending ||
    dealTable.isPending || sail.isPending || launch.isPending || fly.isPending ||
    breakOff.isPending;

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
            onClick={() => setGame("cards")}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              game === "cards"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Card Room
          </button>
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
      {game !== "slots" && game !== "cards" ? (
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

        {game === "cards" ? (
          cardId && cardInfo.data ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCardId(null)}
                  className="text-xs text-amber-400 underline underline-offset-2"
                >
                  ← All games
                </button>
                <p className="truncate text-sm font-bold text-slate-100">
                  {cardInfo.data.title.name}
                </p>
              </div>
              {cardInfo.data.title.family === "video-poker" ? (
                <VideoPokerPlay
                  round={(pokerRound.data as PokerRound) ?? null}
                  ended={pokerEnd}
                  busy={busy}
                  disabled={out}
                  onDeal={() => deal.mutate()}
                  onDraw={(held) => draw.mutate(held)}
                />
              ) : null}
              {cardInfo.data.title.family === "blackjack" ? (
                <BlackjackPlay
                  round={(bjRound.data as BjRound) ?? null}
                  ended={bjEnd}
                  busy={busy}
                  disabled={out}
                  onDeal={() => dealBj.mutate()}
                  onAct={(action) => actBj.mutate(action)}
                />
              ) : null}
              {cardInfo.data.title.family === "table" ? (
                <TableCardPlay
                  options={(cardInfo.data.options ?? []) as TableOption[]}
                  result={tableResult}
                  busy={busy}
                  disabled={out}
                  onPlay={(bet) => dealTable.mutate(bet)}
                />
              ) : null}
              {cardInfo.data.title.family === "viking" ? (
                <VikingPlay
                  onSail={() => sail.mutate()}
                  busy={busy}
                  result={vikingResult}
                  disabled={out}
                  hard={cardInfo.data.title.hard}
                />
              ) : null}
              {cardInfo.data.title.family === "carrier" ? (
                <CarrierPlay
                  round={(carrierRound.data as CarrierRound) ?? null}
                  ended={carrierEnd}
                  busy={busy}
                  disabled={out}
                  onOpen={() => launch.mutate()}
                  onFly={(lane) => fly.mutate(lane)}
                  onBank={() => breakOff.mutate()}
                />
              ) : null}
            </div>
          ) : (
            <CardLobby onPick={setCardId} />
          )
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

        {game === "dice" ? (
          <DiceGame
            onRoll={(target, direction) =>
              play.mutate({ game: "dice", target, direction })}
            busy={busy}
            result={diceResult}
            disabled={out}
          />
        ) : null}

        {game === "wheel" ? (
          <WheelGame
            onSpin={(tier) => play.mutate({ game: "wheel", tier })}
            busy={busy}
            result={wheelResult}
            disabled={out}
          />
        ) : null}

        {game === "roulette" ? (
          <RouletteGame
            onSpin={(bet) => play.mutate({ game: "roulette", bet })}
            busy={busy}
            result={rouletteResult}
            disabled={out}
          />
        ) : null}

        {game === "keno" ? (
          <KenoGame
            onPlay={(picks) => play.mutate({ game: "keno", picks })}
            busy={busy}
            result={kenoResult}
            disabled={out}
          />
        ) : null}

        {game === "scratch" ? (
          <ScratchGame
            onPlay={() => play.mutate({ game: "scratch" })}
            busy={busy}
            result={scratchResult}
            disabled={out}
          />
        ) : null}

        {game === "hilo" ? (
          <HiLoGame
            round={(hiloRound.data as HiLoView) ?? null}
            ended={hiloEnd}
            busy={busy}
            disabled={out}
            onOpen={() => dealHiLo.mutate()}
            onCall={(call) => makeCall.mutate(call)}
            onBank={() => cashHiLo.mutate()}
          />
        ) : null}

        {game === "tower" ? (
          <TowerGame
            round={(towerRound.data as TowerView) ?? null}
            ended={towerEnd}
            busy={busy}
            disabled={out}
            onOpen={(difficulty) => startTower.mutate(difficulty)}
            onClimb={(tile) => climb.mutate(tile)}
            onBank={() => cashTower.mutate()}
          />
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
        {allowance.remaining <= 5 &&
        !(game === "slots" && !slotId) &&
        !(game === "cards" && !cardId) ? (
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
