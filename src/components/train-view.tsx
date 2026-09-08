import { ArrowLeftRight, Dumbbell, Footprints, Library, Play, SkipForward, Undo2, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { CoachCard } from "@/components/coach-card";
import { ExerciseLibrary } from "@/components/exercise-library";
import { ExerciseSheet } from "@/components/exercise-sheet";
import { LiftSheet, type LiftSeed } from "@/components/lift-sheet";
import { MealPhoto } from "@/components/meal-photo";
import { MuscleMap } from "@/components/muscle-map";
import { TrainingAnalytics } from "@/components/training-analytics";
import { Button } from "@/components/ui/button";
import { goalLabel, lbFromKg } from "@/lib/body";
import { exerciseById, substituteMoves, EXERCISES, muscleReadiness, MUSCLE_LABEL, type Exercise, type MuscleId } from "@/lib/exercises";
import { isoDate } from "@/lib/fuel";
import { nextWorkingKg, previousLine, previousSessionForMove } from "@/lib/lift";
import {
  dinnerFollowsCopy,
  programHint,
  programSummary,
  programTitle,
  resolveStatus,
  sessionFuelDelta,
  sessionMuscles,
  weekVolume,
  type ProgramSession,
  type SessionStatus,
} from "@/lib/program";
import { resolveMeal, useSpoonful } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";
import { dayLabel } from "@/lib/week";

function HudClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="hud-clock tabular-nums">
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  );
}

export function TrainView({ onOpenStore }: { onOpenStore?: () => void }) {
  const body = useSpoonful((s) => s.body);
  const programWeek = useSpoonful((s) => s.programWeek);
  const ensureProgram = useSpoonful((s) => s.ensureProgram);
  const markSession = useSpoonful((s) => s.markSession);
  const setBody = useSpoonful((s) => s.setBody);
  const restoreSession = useSpoonful((s) => s.restoreSession);
  const swapSessionMove = useSpoonful((s) => s.swapSessionMove);
  const favMoves = useSpoonful((s) => s.favMoves);
  const meals = useSpoonful((s) => s.meals);
  const lifts = useSpoonful((s) => s.liftSessions);
  const coach = useSpoonful((s) => s.coach);
  const setCoach = useSpoonful((s) => s.setCoach);
  const trainHud = useSpoonful((s) => s.trainHud);
  const setTrainHud = useSpoonful((s) => s.setTrainHud);
  const setTab = useSpoonful((s) => s.setTab);
  const theme = useSpoonful((s) => s.theme);
  const locale = useSpoonful((s) => s.locale);
  const [selectedDate, setSelectedDate] = useState(isoDate());
  const [library, setLibrary] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [liftOpen, setLiftOpen] = useState(false);
  const [liftSeed, setLiftSeed] = useState<LiftSeed | undefined>();
  const [swapOf, setSwapOf] = useState<string | null>(null);
  const today = isoDate();

  useEffect(() => {
    ensureProgram();
  }, [ensureProgram, body.goalKind]);

  const week = programWeek;
  const sessions = week?.sessions ?? [];
  const selected = sessions.find((s) => s.date === selectedDate) ?? sessions.find((s) => s.date === today) ?? sessions[0];
  const summary = week ? programSummary(week, today) : null;
  const nextLift = sessions.find((s) => s.date >= today && s.kind !== "rest" && resolveStatus(s, today) === "planned");
  const dinner = selected ? meals.find((m) => m.date === selected.date && m.slot === "dinner") : undefined;
  const plated = dinner && !dinner.skip ? resolveMeal(dinner) : undefined;
  const delta = selected ? sessionFuelDelta(selected, body.weightKg) : null;
  const sets = week ? weekVolume(week) : 0;
  const ready = muscleReadiness(lifts, today);
  const advanced = trainHud !== "basic";

  function onStatus(session: ProgramSession, status: SessionStatus) {
    const name = markSession(session.id, status);
    if (status === "done") toast(name ? `Logged · dinner is ${name}` : "Logged · Fuel updated");
    else if (status === "skipped") toast(name ? `Skipped · plated ${name}` : "Skipped · dinner dropped the training carbs");
  }

  function onRestore(session: ProgramSession) {
    const name = restoreSession(session.id);
    toast(name ? `Back on the plan · dinner is ${name}` : "Session back on the plan");
  }

  function startLift(session: ProgramSession) {
    setLiftSeed({
      name: session.name,
      date: session.date,
      moveIds: session.moves.map((m) => m.moveId),
      plan: session.moves.map((m) => ({ moveId: m.moveId, sets: m.sets, reps: m.reps })),
    });
    setLiftOpen(true);
  }

  const future = theme === "aether";

  return (
    <div className={cn("train-hud mx-auto max-w-2xl overflow-x-clip px-4 pb-10 pt-2", advanced && "train-hud--advanced", future && "train-hud--future")} data-tour="train-hud">
      <header className="hud-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="hud-kicker">
            {future ? (advanced ? "Command deck · live" : "Crew deck · live") : advanced ? "Training HUD · Advanced" : "Training HUD"}
          </p>
          <div className="flex items-center gap-2">
            {future ? <HudClock /> : null}
            <button type="button" className="hud-btn hud-btn-icon" aria-label="Close training" onClick={() => setTab("plan")}>
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-tight">{programTitle(body.goalKind)}</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{programHint(body.goalKind)}</p>
          </div>
          <button type="button" className="hud-btn hud-btn-icon" aria-label="Exercise library" data-tour="library" onClick={() => setLibrary(true)}>
            <Library className="size-5" />
          </button>
        </div>
        {summary ? (
          <p className="mt-3 text-xs tabular-nums text-muted-foreground">
            {goalLabel(body.goalKind)} · {sets} working sets · {summary.done} done · {summary.left} left
            {summary.skipped ? ` · ${summary.skipped} skipped` : ""}
            {summary.missed ? ` · ${summary.missed} missed` : ""}
          </p>
        ) : null}
        <div className="hud-mode" role="tablist" aria-label="Training detail">
          <button
            type="button"
            role="tab"
            aria-selected={!advanced}
            className={cn("hud-mode__btn", !advanced && "is-on")}
            onClick={() => setTrainHud("basic")}
          >
            {future ? "Crew" : "Basic"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={advanced}
            className={cn("hud-mode__btn", advanced && "is-on")}
            onClick={() => setTrainHud("advanced")}
          >
            {future ? "Command" : "Advanced"}
          </button>
        </div>
        {advanced ? (
          <div className="hud-telemetry">
            <div className="hud-gauge hud-gauge--dial" style={{ "--pct": Math.min(100, sets) } as CSSProperties}>
              <span className="hud-gauge__lab">Volume</span>
              <span className="hud-gauge__val">{sets}</span>
              <span className="hud-gauge__hint">working sets</span>
            </div>
            <div className="hud-gauge hud-gauge--dial" style={{ "--pct": Math.round(((summary?.done ?? 0) / Math.max(1, sessions.length)) * 100) } as CSSProperties}>
              <span className="hud-gauge__lab">Closed</span>
              <span className="hud-gauge__val">{summary?.done ?? 0}</span>
              <span className="hud-gauge__hint">of {sessions.length} days</span>
            </div>
            <div className="hud-gauge hud-gauge--dial" style={{ "--pct": Math.round((ready.ready.length / 8) * 100) } as CSSProperties}>
              <span className="hud-gauge__lab">Ready</span>
              <span className="hud-gauge__val">{ready.ready.length}</span>
              <span className="hud-gauge__hint">muscle groups</span>
            </div>
            <div className="hud-gauge hud-gauge--dial" style={{ "--pct": Math.min(100, ready.sore.length * 18) } as CSSProperties}>
              <span className="hud-gauge__lab">Load</span>
              <span className="hud-gauge__val">{ready.sore.length}</span>
              <span className="hud-gauge__hint">still working</span>
            </div>
            <div className="hud-gauge hud-gauge--dial" style={{ "--pct": plated ? 100 : 8 } as CSSProperties}>
              <span className="hud-gauge__lab">Dinner</span>
              <span className="hud-gauge__val">{plated ? "On" : "—"}</span>
              <span className="hud-gauge__hint">{plated ? "follows lift" : "not plated"}</span>
            </div>
            <div className="hud-gauge hud-gauge--dial" style={{ "--pct": Math.round(((summary?.done ?? 0) / Math.max(1, (summary?.done ?? 0) + (summary?.left ?? 0) + (summary?.skipped ?? 0))) * 100) } as CSSProperties}>
              <span className="hud-gauge__lab">Week</span>
              <span className="hud-gauge__val">{Math.round(((summary?.done ?? 0) / Math.max(1, sessions.length)) * 100)}</span>
              <span className="hud-gauge__hint">percent closed</span>
            </div>
          </div>
        ) : null}
        {future && plated ? (
          <p className="hud-uplink mt-3 text-xs tabular-nums">
            Dinner uplink · {plated.title}
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button type="button" className="hud-btn hud-btn-on h-11 flex-1 px-4 text-sm" onClick={() => setTab("fit")}>
            Open Fuel
          </button>
          <button type="button" className="hud-btn h-11 flex-1 px-4 text-sm" onClick={() => setLibrary(true)}>
            Move library
          </button>
        </div>
      </header>

      <div className="train-deck mt-4">

      <div className="mt-3 flex gap-1.5">
        {(
          [
            { id: "full" as const, label: "Full gym" },
            { id: "bodyweight" as const, label: "No equipment" },
          ]
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setBody({ equipmentAccess: opt.id })}
            className={cn(
              "hud-chip h-11 flex-1 text-sm",
              (body.equipmentAccess ?? "full") === opt.id && "hud-chip-on",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {(body.equipmentAccess ?? "full") === "bodyweight"
          ? "This week only picks moves that need no gear at all."
          : "This week can pull any equipment from the full exercise library."}
      </p>

      {ready.sore.length || ready.ready.length ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {ready.sore.length ? (
            <>
              Still working {ready.sore.slice(0, 3).map((id) => MUSCLE_LABEL[id].toLowerCase()).join(", ")}
              {ready.ready.length ? " · " : ""}
            </>
          ) : null}
          {ready.ready.length ? <>Ready {ready.ready.slice(0, 3).map((id) => MUSCLE_LABEL[id].toLowerCase()).join(", ")}</> : null}
        </p>
      ) : null}

      <ol className={cn("hud-week mt-4", `hud-week-${theme}`)} data-tour="week">
        {sessions.map((raw) => {
          const status = resolveStatus(raw, today);
          const meta = dayLabel(raw.date);
          const active = selected?.date === raw.date;
          return (
            <li key={raw.id}>
              <button
                type="button"
                onClick={() => setSelectedDate(raw.date)}
                className={cn("hud-day", active && "is-on", status === "done" && "is-done", status === "missed" && "is-miss")}
              >
                <span className="text-[10px] uppercase tracking-wide opacity-80">{meta.weekday.slice(0, 2)}</span>
                <span className="mt-1 text-sm font-medium tabular-nums">{meta.monthDay.split(" ")[1]}</span>
                <span
                  className={cn(
                    "mt-1 size-1.5 rounded-full",
                    raw.kind === "rest"
                      ? active
                        ? "bg-spark-foreground/50"
                        : "bg-muted-foreground/30"
                      : status === "done"
                        ? active
                          ? "bg-spark-foreground"
                          : "bg-primary"
                        : status === "skipped"
                          ? "bg-muted-foreground"
                          : status === "missed"
                            ? "bg-destructive"
                            : active
                              ? "bg-spark-foreground"
                              : "bg-spark",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>

      {selected ? (
        <SessionCard
          session={selected}
          today={today}
          plated={plated}
          delta={delta}
          nextLift={selected.kind === "rest" ? nextLift : undefined}
          swapOf={swapOf}
          onSwapOf={setSwapOf}
          onSwap={(fromId, toId) => {
            swapSessionMove(selected.id, fromId, toId);
            setSwapOf(null);
            toast("Swapped · dinner still follows this workout");
          }}
          onPickDate={(date) => setSelectedDate(date)}
          onStart={() => {
            if (selected.kind === "lift") startLift(selected);
            else onStatus(selected, "done");
          }}
          onSkip={() => onStatus(selected, "skipped")}
          onRestore={() => onRestore(selected)}
          onOpenMove={(id) => {
            const ex = exerciseById(id);
            if (ex) setDetail(ex);
          }}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setLibrary(true)}
        className="hud-panel mt-3 flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <div>
          <p className="font-medium">Exercise library</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{EXERCISES.length} moves · tap a muscle to filter</p>
        </div>
        <Library className="size-5 text-spark" />
      </button>

      {library ? (
        <ExerciseLibrary
          favMoves={favMoves}
          onClose={() => setLibrary(false)}
          onOpen={(ex) => setDetail(ex)}
        />
      ) : null}

      {detail ? (
        <ExerciseSheet
          exercise={detail}
          onClose={() => setDetail(null)}
          onStart={(id) => {
            const session = selected;
            setDetail(null);
            setLibrary(false);
            if (session && session.kind === "lift") {
              const ids = session.moves.some((m) => m.moveId === id)
                ? session.moves.map((m) => m.moveId)
                : [...session.moves.map((m) => m.moveId), id];
              setLiftSeed({
                name: session.name,
                date: session.date,
                moveIds: ids,
                plan: session.moves.map((m) => ({ moveId: m.moveId, sets: m.sets, reps: m.reps })),
              });
              setLiftOpen(true);
            } else {
              setLiftSeed({ name: exerciseById(id)?.name ?? "Lift", date: today, moveIds: [id] });
              setLiftOpen(true);
            }
          }}
        />
      ) : null}

      <LiftSheet open={liftOpen} onClose={() => setLiftOpen(false)} seed={liftSeed} />
      </div>

      <CoachCard coach={coach} onChange={setCoach} locale={locale} />
      <TrainingAnalytics onOpenStore={() => onOpenStore?.()} />
    </div>
  );
}

function SessionCard({
  session,
  today,
  plated,
  delta,
  nextLift,
  swapOf,
  onSwapOf,
  onSwap,
  onPickDate,
  onStart,
  onSkip,
  onRestore,
  onOpenMove,
}: {
  session: ProgramSession;
  today: string;
  plated?: { title: string; recipe?: { id: string; name: string; plate: "roast" | "pasta" | "bowl" | "fish" | "soup" | "taco" | "green" | "skillet" | "curry" | "toast" | "dessert"; tags: string[]; photo?: string }; minutes: number };
  delta: { burn: number; protein: number; carbs: number } | null;
  nextLift?: ProgramSession;
  swapOf: string | null;
  onSwapOf: (id: string | null) => void;
  onSwap: (fromId: string, toId: string) => void;
  onPickDate: (date: string) => void;
  onStart: () => void;
  onSkip: () => void;
  onRestore: () => void;
  onOpenMove: (id: string) => void;
}) {
  const status = resolveStatus(session, today);
  const meta = dayLabel(session.date);
  const muscles = sessionMuscles(session);
  const primary = (muscles as MuscleId[]).slice(0, 4);
  const lifts = useSpoonful((s) => s.liftSessions);
  const imperial = useSpoonful((s) => s.body.units) !== "metric";
  const copy = dinnerFollowsCopy(session, status, plated?.title);
  const showWeight = (kg: number) => `${Math.round(imperial ? lbFromKg(kg) : kg)} ${imperial ? "lb" : "kg"}`;

  return (
    <section className="train-session mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {meta.today ? "Today" : meta.weekday} · {session.kind === "rest" ? "Off" : session.kind === "lift" ? "Lift" : "Cardio"}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-tight">{session.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{session.why}</p>
        </div>
        {session.kind !== "rest" && session.moves.length > 0 ? (
          <MuscleMap primary={primary} secondary={[]} size="sm" />
        ) : null}
      </div>

      {session.kind === "lift" ? (
        <ul className="mt-3 space-y-1.5">
          {session.moves.map((m) => {
            const ex = exerciseById(m.moveId);
            const prev = previousLine(lifts, m.moveId);
            const alts = swapOf === m.moveId ? substituteMoves(m.moveId, 6) : [];
            return (
              <li key={m.moveId} className="overflow-hidden rounded-2xl bg-background">
                <div className="flex min-h-14 items-center gap-2 px-2">
                  <button type="button" onClick={() => onOpenMove(m.moveId)} className="shrink-0">
                    {ex ? <img src={ex.image} alt="" className="h-12 w-12 rounded-lg bg-muted object-cover" /> : null}
                  </button>
                  <button type="button" onClick={() => onOpenMove(m.moveId)} className="min-w-0 flex-1 py-2 text-left">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{ex?.name ?? m.moveId}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {m.sets} × {m.reps}
                      {(() => {
                        const last = prev?.sets.filter((s) => s.done && !s.warmup).at(-1);
                        if (!last) return "";
                        const next = nextWorkingKg(lifts, m.moveId, prev, previousSessionForMove(lifts, m.moveId)?.feel);
                        const lastTxt = ` · last ${showWeight(last.weightKg)}`;
                        const rir = last.rir != null ? ` @${last.rir}` : "";
                        const tryTxt =
                          next && next > last.weightKg
                            ? ` · try ${showWeight(next)}`
                            : next && next < last.weightKg
                              ? ` · deload to ${showWeight(next)}`
                              : "";
                        return `${lastTxt}${rir}${tryTxt}`;
                      })()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Swap ${ex?.name ?? "move"}`}
                    onClick={() => onSwapOf(swapOf === m.moveId ? null : m.moveId)}
                  >
                    <ArrowLeftRight />
                  </Button>
                </div>
                {alts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 border-t border-border px-2 py-2">
                    {alts.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => onSwap(m.moveId, alt.id)}
                        className="flex flex-col items-center rounded-xl bg-card px-1 py-2 text-center"
                      >
                        <img src={alt.image} alt="" className="h-10 w-10 rounded-lg bg-muted object-cover" />
                        <span className="mt-1 line-clamp-2 text-[10px] leading-tight">{alt.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {session.kind === "cardio" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {session.minutes} min {session.cardioKind ?? "walk"}
        </p>
      ) : null}

      {session.kind !== "rest" && delta ? (
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">
          {status === "skipped" || status === "missed"
            ? `Training carbs off the plate · −${delta.carbs}g carbs · −${delta.burn} kcal`
            : `This session · +${delta.burn} kcal · +${delta.protein}g protein · +${delta.carbs}g carbs at dinner`}
        </p>
      ) : null}

      <div className="mt-3 overflow-hidden rounded-2xl bg-background">
        {plated?.recipe ? <MealPhoto recipe={plated.recipe} className="h-28 w-full" /> : null}
        <div className="px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Dinner follows this workout</p>
          <p className="mt-1 font-display text-xl leading-tight">{plated?.title ?? "Nothing plated yet"}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
        </div>
      </div>

      {session.kind === "rest" ? (
        <div className="mt-3 space-y-2">
          {nextLift ? (
            <button type="button" className="hud-btn hud-btn-on h-12 w-full" onClick={() => onPickDate(nextLift.date)} data-tour="start-session">
              Next session · {nextLift.name}
            </button>
          ) : null}
        </div>
      ) : status === "planned" ? (
        <div className="mt-4 flex gap-2">
          <button type="button" className="hud-btn hud-btn-on flex h-12 flex-1 items-center justify-center gap-1.5" data-tour="start-session" onClick={onStart}>
            {session.kind === "lift" ? <Play className="size-4" /> : <Footprints className="size-4" />}
            {session.kind === "lift" ? "Start session" : "Log it"}
          </button>
          <button type="button" className="hud-btn flex h-12 items-center justify-center gap-1.5 px-4" onClick={onSkip}>
            <SkipForward className="size-4" />
            Skip
          </button>
        </div>
      ) : status === "done" ? (
        <div className="mt-4 flex gap-2">
          <button type="button" className="hud-btn flex h-12 flex-1 items-center justify-center gap-1.5" onClick={onStart} data-tour="start-session">
            <Dumbbell className="size-4" />
            Open again
          </button>
          <button type="button" className="hud-btn flex h-12 items-center justify-center gap-1.5 px-4" onClick={onRestore}>
            <Undo2 className="size-4" />
            Undo
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button type="button" className="hud-btn hud-btn-on flex h-12 flex-1 items-center justify-center" onClick={onStart} data-tour="start-session">
            Catch-up
          </button>
          <button type="button" className="hud-btn flex h-12 items-center justify-center gap-1.5 px-4" onClick={onRestore}>
            <Undo2 className="size-4" />
            Put back
          </button>
        </div>
      )}
    </section>
  );
}
