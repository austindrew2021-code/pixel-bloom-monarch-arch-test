import { Dumbbell, Droplets, Flame, Footprints, HeartPulse, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeviceSyncCard } from "@/components/device-sync-card";
import { LiftSheet } from "@/components/lift-sheet";
import { MacroBar } from "@/components/macro-bar";
import { Plate } from "@/components/plate";
import { ProgressPhotos } from "@/components/progress-photos";
import { TrainingAnalytics } from "@/components/training-analytics";
import { TrainView } from "@/components/train-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTIVITY,
  GOAL_KINDS,
  bmrKcal,
  bmrMethod,
  formatBodyFat,
  formatHeight,
  formatWeight,
  goalLabel,
  kgFromLb,
  lbFromKg,
  macrosFromBody,
  normalizeGoalKind,
  tdeeKcal,
} from "@/lib/body";
import { cuisineBar } from "@/lib/cuisine";
import { FITNESS_SOURCES } from "@/lib/devices";
import { disableAlwaysSync, enableAlwaysSync } from "@/lib/background-sync";
import { recoveryLabel } from "@/lib/fitness-sync";
import { fitsGoal, strictestGoal } from "@/lib/goal-fit";
import {
  WORKOUTS,
  applyHealthToFuel,
  dayFuel,
  healthAdvice,
  isoDate,
  pct,
  rankForFuel,
  workoutKcal,
} from "@/lib/fuel";
import { formatMinutes } from "@/lib/format";
import { sessionVolumeKg } from "@/lib/lift";
import { expectedWorkoutsForDate } from "@/lib/program";
import { rankProgress } from "@/lib/ranks";
import { SNACKS } from "@/lib/shield";
import {
  nutritionForDate,
  recipeAllowed,
  unlockedRecipes,
  useSpoonful,
} from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";
import { weekDates } from "@/lib/week";
import type { WorkoutKind } from "@/lib/types";

export function FitView({ onOpenStore }: { onOpenStore?: () => void }) {
  const goal = useSpoonful((s) => s.goal);
  const meals = useSpoonful((s) => s.meals);
  const pantry = useSpoonful((s) => s.pantry);
  const workouts = useSpoonful((s) => s.workouts);
  const stepsByDate = useSpoonful((s) => s.stepsByDate);
  const setSteps = useSpoonful((s) => s.setSteps);
  const addWorkout = useSpoonful((s) => s.addWorkout);
  const removeWorkout = useSpoonful((s) => s.removeWorkout);
  const assignMeal = useSpoonful((s) => s.assignMeal);
  const fillFromFuel = useSpoonful((s) => s.fillFromFuel);
  const setTab = useSpoonful((s) => s.setTab);
  const unlocked = useSpoonful((s) => s.unlocked);
  const prefs = useSpoonful((s) => s.prefs);
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const weekStart = useSpoonful((s) => s.weekStart);
  const snacks = useSpoonful((s) => s.snacks);
  const addSnack = useSpoonful((s) => s.addSnack);
  const removeSnack = useSpoonful((s) => s.removeSnack);
  const xp = useSpoonful((s) => s.xp);
  const body = useSpoonful((s) => s.body);
  const setBody = useSpoonful((s) => s.setBody);
  const applyBodyGoal = useSpoonful((s) => s.applyBodyGoal);
  const fitnessSource = useSpoonful((s) => s.fitnessSource);
  const lastSyncAt = useSpoonful((s) => s.lastSyncAt);
  const liftSessions = useSpoonful((s) => s.liftSessions);
  const programWeek = useSpoonful((s) => s.programWeek);
  const weightLog = useSpoonful((s) => s.weightLog) ?? [];
  const syncFitness = useSpoonful((s) => s.syncFitness);
  const healthByDate = useSpoonful((s) => s.healthByDate) ?? {};
  const autoPlate = useSpoonful((s) => s.autoPlate);
  const setAutoPlate = useSpoonful((s) => s.setAutoPlate);
  const portionMultByDate = useSpoonful((s) => s.portionMultByDate);
  const logWater = useSpoonful((s) => s.logWater);
  const syncAccess = useSpoonful((s) => s.syncAccess);
  const setSyncAccess = useSpoonful((s) => s.setSyncAccess);
  const seats = useSpoonful((s) => s.seats) ?? [];
  const tableGoal = strictestGoal([body.goalKind, ...seats.map((s) => s.goalKind)]);
  const today = isoDate();
  const loggedToday = workouts.filter((w) => w.date === today);
  const todayWork = expectedWorkoutsForDate({
    date: today,
    today,
    sessions: programWeek?.sessions ?? [],
    logged: loggedToday,
    bodyKg: body.weightKg,
  });
  const todaySnacks = snacks.filter((s) => s.date === today);
  const eaten = nutritionForDate(meals, today, snacks, portionMultByDate);
  const health = healthByDate[today];
  const synced = true;
  let fuel = dayFuel({
    goal,
    eaten,
    workouts: todayWork,
    steps: stepsByDate[today] ?? health?.steps ?? 0,
    body,
  });
  if (synced && health) fuel = applyHealthToFuel(fuel, health);
  const afterLift = todayWork.some((w) => w.kind === "lift");
  const pool = unlockedRecipes(unlocked).filter(
    (r) => recipeAllowed(r, prefs, allergies, hidden) && fitsGoal(r, tableGoal, "dinner"),
  );
  const recovery = health && synced ? recoveryLabel(health) : undefined;
  const ranked = useMemo(
    () =>
      rankForFuel(pool, fuel.remaining, pantry.map((p) => p.name), {
        afterLift,
        recovery,
        goalKind: tableGoal,
      }).slice(0, 4),
    [pool, fuel.remaining, pantry, afterLift, recovery, tableGoal],
  );
  const advice = health ? healthAdvice(health) : null;
  const rank = rankProgress(xp);
  const weekDatesList = weekDates(weekStart);
  const weekProtein = weekDatesList.reduce((sum, d) => sum + nutritionForDate(meals, d, snacks, portionMultByDate).protein, 0);
  const [minutes, setMinutes] = useState("45");
  const [kind, setKind] = useState<WorkoutKind>("run");
  const [distance, setDistance] = useState("");
  const [stepDraft, setStepDraft] = useState(String(stepsByDate[today] ?? ""));
  const [liftOpen, setLiftOpen] = useState(false);
  const [editBody, setEditBody] = useState(false);
  const [pane, setPane] = useState<"train" | "fuel">("train");
  const tdee = tdeeKcal(body);
  const bmr = bmrKcal(body);
  const lastLift = liftSessions[liftSessions.length - 1];
  const srcLabel = FITNESS_SOURCES.find((s) => s.id === fitnessSource)?.label;
  const imperial = body.units !== "metric";
  const activity = ACTIVITY.find((a) => a.id === body.activity);
  const access = syncAccess ?? (fitnessSource ? "while-using" : null);

  useEffect(() => {
    if (!fitnessSource) return;
    if (!useSpoonful.getState().healthByDate[isoDate()]) {
      const plated = syncFitness({ live: false });
      if (plated) toast(`Plated ${plated} from the watch`);
    }
    if (access === "always") return;
    syncFitness({ live: true });
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      syncFitness({ live: true });
    }, 40000);
    return () => window.clearInterval(id);
  }, [fitnessSource, syncFitness, access]);

  useEffect(() => {
    setStepDraft(String(stepsByDate[today] ?? ""));
  }, [stepsByDate, today]);

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Live Fuel</p>
      <h1 className="mt-1 font-display text-4xl leading-tight">Fuel</h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
        Training follows {goalLabel(body.goalKind)}
        {tableGoal !== normalizeGoalKind(body.goalKind) ? `; dinner follows the table's ${goalLabel(tableGoal)}` : ""}. Done,
        skipped, or missed sessions rewrite tonight automatically — calories from your body ({bmrMethod(body)}
        {formatBodyFat(body) ? `, ${formatBodyFat(body)}` : ""}), ACSM METs for cardio, and the load on the bar for lifts.
      </p>

      <section className="mt-5 rounded-3xl bg-spark p-4 text-spark-foreground" data-tour="fuel-now">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">Right now</p>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full bg-spark-foreground" />
            {srcLabel ? `${srcLabel} ${access === "always" ? "always" : "live"}` : "Kitchen live"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <LiveStat label="Left" value={`${Math.round(fuel.remaining.cal)}`} hint="kcal" />
          <LiveStat label="Protein" value={`${Math.round(fuel.remaining.protein)}`} hint="g" />
          <LiveStat label="Burned" value={`${Math.round(fuel.burn)}`} hint="kcal" />
        </div>
        {lastSyncAt ? (
          <p className="mt-2 text-xs opacity-80">
            {access === "always" ? "Always allow · " : ""}
            Last pull {new Date(lastSyncAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        ) : null}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-card p-1 shadow-[var(--shadow-border)]" data-tour="train-pane">
        <button
          type="button"
          onClick={() => setPane("train")}
          className={cn(
            "h-11 rounded-full text-sm font-medium",
            pane === "train" ? "bg-spark text-spark-foreground" : "text-muted-foreground",
          )}
        >
          Train
        </button>
        <button
          type="button"
          onClick={() => setPane("fuel")}
          className={cn(
            "h-11 rounded-full text-sm font-medium",
            pane === "fuel" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Body
        </button>
      </div>

      {pane === "train" ? (
        <>
          <TrainView />
          <TrainingAnalytics onOpenStore={() => onOpenStore?.()} />
        </>
      ) : null}

      {pane === "fuel" ? (
      <>
      {health && fitnessSource ? (
        <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl">From the watch</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {access === "always"
                  ? "Rings, heart, sleep, and water — still pulling after you leave the kitchen."
                  : "Rings, heart, sleep, and water — updates while Fuel is open. Switch to Always allow in Extras to keep going when you leave."}
              </p>
            </div>
            <HeartPulse className="size-5 shrink-0 text-spark" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <Ring label="Move" value={health.activeKcal} of={health.moveGoal} unit="kcal" />
            <Ring label="Exercise" value={health.exerciseMin} of={health.exerciseGoal} unit="min" />
            <Ring label="Stand" value={health.standHours} of={health.standGoal} unit="hr" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Steps" value={health.steps.toLocaleString()} hint={`${health.distanceKm} km`} />
            <Stat label="Heart" value={`${health.heartRate}`} hint={`rest ${health.restingHr}`} />
            <Stat label="HRV" value={`${health.hrvMs}`} hint="ms" />
            <Stat label="Sleep" value={`${health.sleepHours}h`} hint={`score ${health.sleepScore}`} />
            <Stat label="VO₂" value={`${health.vo2max}`} hint="ml/kg" />
            <Stat label="SpO₂" value={`${health.spo2}%`} hint={`${health.flights} flights`} />
          </div>
          {advice ? (
            <div
              className={cn(
                "mt-4 rounded-2xl px-4 py-3",
                advice.recovery === "low"
                  ? "bg-spark text-spark-foreground"
                  : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              <p className="text-xs font-medium uppercase tracking-[0.14em]">{advice.recovery === "low" ? "Recover" : advice.recovery === "high" ? "Fuel up" : "Steady"}</p>
              <p className="mt-1 font-display text-xl">{advice.title}</p>
              <p className={cn("mt-1 text-sm leading-relaxed", advice.recovery === "low" ? "opacity-90" : "text-muted-foreground")}>
                {advice.body}
              </p>
              {!synced ? (
                <p className="mt-2 text-xs opacity-80">Body Sync applies this to tonight automatically. Suggestions below still work — tap to plate.</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Water</p>
              <p className="text-xs tabular-nums text-muted-foreground">{health.waterMl} / 2000 ml</p>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-background">
              <span className="bg-primary" style={{ width: `${pct(health.waterMl, 2000)}%` }} />
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  logWater(250);
                  toast("Glass logged");
                }}
              >
                <Droplets />
                +250 ml
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  logWater(-250);
                  toast("Undid a glass");
                }}
              >
                Undo
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{access === "always" ? "Always allow" : "While using the app"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {access === "always"
                  ? "Fuel keeps updating after you leave."
                  : "Switch on to sync even when Spoonful is closed."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={access === "always"}
              onClick={async () => {
                if (access === "always") {
                  setSyncAccess("while-using");
                  await disableAlwaysSync();
                  toast("Syncs only while this kitchen is open");
                  return;
                }
                setSyncAccess("always");
                const ok = await enableAlwaysSync();
                toast(
                  ok
                    ? "Always allow — Fuel keeps updating after you leave"
                    : "Always allow is on. Allow notifications so you hear when dinner plates while you’re away.",
                );
              }}
              className={cn(
                "h-11 w-16 shrink-0 rounded-full text-xs font-semibold",
                access === "always" ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {access === "always" ? "On" : "Off"}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Auto-plate dinner</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Body Sync is included. After each full pull, tonight fills if the slot is empty — matched to {goalLabel(tableGoal)}. Manual stays.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoPlate}
              onClick={() => setAutoPlate(!autoPlate)}
              className={cn(
                "h-11 w-16 shrink-0 rounded-full text-xs font-semibold",
                autoPlate ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {autoPlate ? "On" : "Off"}
            </button>
          </div>
        </section>
      ) : fitnessSource ? (
        <p className="mt-3 text-sm text-muted-foreground">Pulling the watch snapshot…</p>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">
            Link Apple Health, Health Connect, Garmin, Fitbit, or Strava and Fuel fills live. You can still type steps
            and workouts below.
          </p>
          <div className="mt-3">
            <DeviceSyncCard />
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Rank" value={rank.current.title} />
        <Stat label="TDEE" value={`${tdee}`} hint="kcal" />
        <Stat label="Weight" value={formatWeight(body)} />
      </div>

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl">Body</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatHeight(body)} · {body.age}y · {body.sex} · {goalLabel(body.goalKind)}
              {formatBodyFat(body) ? ` · ${formatBodyFat(body)}` : ""}
              {seats.length > 0 ? ` · table follows ${goalLabel(tableGoal)}` : ""}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              BMR {bmr} kcal ({bmrMethod(body)}) × {activity?.label ?? "Active"} {activity?.factor ?? 1.55} = TDEE {tdee}.
              Training today is added on top so it is not counted twice.
            </p>
          </div>
          <Button variant="secondary" className="shrink-0" onClick={() => setEditBody((v) => !v)}>
            {editBody ? "Close" : "Edit"}
          </Button>
        </div>
        <label className="mt-4 block text-xs text-muted-foreground">
          Body fat % <span className="font-normal">(optional)</span>
          <Input
            className="mt-1"
            inputMode="decimal"
            placeholder="e.g. 22 — skip if you don't know"
            defaultValue={body.bodyFatPct != null ? String(body.bodyFatPct) : ""}
            key={body.bodyFatPct ?? "none"}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              if (!raw) {
                setBody({ bodyFatPct: undefined });
                return;
              }
              const n = Number(raw);
              setBody({ bodyFatPct: Number.isFinite(n) ? n : undefined });
            }}
          />
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {body.bodyFatPct
            ? `Katch–McArdle on lean mass. Calories and protein just updated.`
            : "Skip if you don't know. We use Mifflin–St Jeor until you add it. Body fat makes protein and calories track lean mass, not total weight."}
        </p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Body goal</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GOAL_KINDS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setBody({ goalKind: g.id })}
              className={cn(
                "h-11 min-w-0 rounded-full px-3 text-sm",
                body.goalKind === g.id ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{GOAL_KINDS.find((g) => g.id === body.goalKind)?.hint}</p>
        {editBody ? (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              {(["female", "male"] as const).map((sex) => (
                <button
                  key={sex}
                  type="button"
                  onClick={() => setBody({ sex })}
                  className={cn(
                    "h-11 flex-1 rounded-full text-sm",
                    body.sex === sex ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
                  )}
                >
                  {sex === "female" ? "Female" : "Male"}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBody({ units: imperial ? "metric" : "imperial" })}
                className="h-11 rounded-full bg-background px-4 text-sm shadow-[var(--shadow-border)]"
              >
                {imperial ? "lb / ft" : "kg / cm"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Age
                <Input
                  className="mt-1"
                  inputMode="numeric"
                  defaultValue={String(body.age)}
                  onBlur={(e) => setBody({ age: Math.max(16, Math.min(80, Number(e.target.value) || 34)) })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                {imperial ? "Weight lb" : "Weight kg"}
                <Input
                  className="mt-1"
                  inputMode="decimal"
                  defaultValue={String(imperial ? Math.round(lbFromKg(body.weightKg)) : Math.round(body.weightKg))}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    setBody({ weightKg: imperial ? kgFromLb(n || 160) : n || 74 });
                  }}
                />
              </label>
              <label className="col-span-2 text-xs text-muted-foreground">
                {imperial ? "Height in" : "Height cm"}
                <Input
                  className="mt-1"
                  inputMode="numeric"
                  defaultValue={String(imperial ? Math.round(body.heightCm / 2.54) : Math.round(body.heightCm))}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    setBody({ heightCm: imperial ? n * 2.54 : n || 168 });
                  }}
                />
              </label>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">How much you move</p>
            <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
              {ACTIVITY.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setBody({ activity: a.id })}
                  className={cn(
                    "h-11 min-w-0 max-w-full truncate rounded-full px-3 text-sm",
                    body.activity === a.id ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{ACTIVITY.find((a) => a.id === body.activity)?.hint}</p>
            <Button
              className="w-full"
              onClick={() => {
                applyBodyGoal();
                toast(`Targets set to ${macrosFromBody(useSpoonful.getState().body).cal} kcal`);
                setEditBody(false);
              }}
            >
              Recalculate targets
            </Button>
          </div>
        ) : null}
        {weightLog.length > 1 ? (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">Weight</p>
            <div className="mt-2 flex h-16 items-end gap-1">
              {weightLog.slice(-10).map((w) => {
                const nums = weightLog.map((x) => x.kg);
                const min = Math.min(...nums);
                const max = Math.max(...nums);
                const span = Math.max(1, max - min);
                const h = 24 + ((w.kg - min) / span) * 40;
                return (
                  <div key={w.date} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                    <span className="w-full rounded-t-md bg-spark" style={{ height: `${h}px` }} />
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {formatWeight({ ...body, weightKg: weightLog[0]!.kg })} → {formatWeight(body)}
            </p>
          </div>
        ) : null}
      </section>

      <ProgressPhotos onOpenStore={() => onOpenStore?.()} />

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Today</h2>
        <div className="mt-4 space-y-3">
          <MacroBar label="Protein" value={fuel.eaten.protein} of={fuel.target.protein} />
          <MacroBar label="Carbs" value={fuel.eaten.carbs} of={fuel.target.carbs} />
          <MacroBar label="Fat" value={fuel.eaten.fat} of={fuel.target.fat} />
          <MacroBar label="Calories" value={fuel.eaten.cal} of={fuel.target.cal} unit="" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Week protein {Math.round(weekProtein)}g · target {goal.protein * 7}g · TDEE {tdee} before training
        </p>
      </section>

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Lift</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sets, reps, and load. Heavier bar, more burn — volume × range of motion, not a flat 6 kcal/min guess.
        </p>
        {lastLift ? (
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            Last session {Math.round(imperial ? lbFromKg(sessionVolumeKg(lastLift)) : sessionVolumeKg(lastLift))}{" "}
            {imperial ? "lb" : "kg"} moved
          </p>
        ) : null}
        <Button className="mt-3 w-full" variant="spark" onClick={() => setLiftOpen(true)}>
          <Dumbbell />
          Start lifting
        </Button>
        {liftSessions.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {[...liftSessions]
              .reverse()
              .slice(0, 4)
              .map((s) => (
                <li key={s.id} className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
                  <span>
                    {s.name} · {s.date}
                  </span>
                  <span>
                    {imperial ? Math.round(lbFromKg(sessionVolumeKg(s))) : Math.round(sessionVolumeKg(s))}{" "}
                    {imperial ? "lb" : "kg"}
                  </span>
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Already ate</h2>
        <p className="mt-1 text-sm text-muted-foreground">Closes the gap before dinner. Values are per serving.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SNACKS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => {
                addSnack({ date: today, name: s.name, nutrition: s.nutrition });
                toast(`${s.name} logged`);
              }}
              className="h-11 rounded-full bg-background px-3.5 text-sm shadow-[var(--shadow-border)]"
            >
              {s.name}
              <span className="ml-1 tabular-nums text-muted-foreground">{s.nutrition.protein}g</span>
            </button>
          ))}
        </div>
        <ul className="mt-3 space-y-2">
          {todaySnacks.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-2xl bg-background px-3 py-2">
              <p className="text-sm">
                {s.name} · {s.nutrition.protein}g · {s.nutrition.cal} kcal
              </p>
              <button
                type="button"
                className="flex size-11 items-center justify-center"
                aria-label="Remove snack"
                onClick={() => removeSnack(s.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Cardio</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(stepDraft);
            if (!Number.isFinite(n)) return;
            setSteps(today, n);
            toast("Steps saved — burn updated");
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Steps today</span>
            <Footprints className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={stepDraft}
              onChange={(e) => setStepDraft(e.target.value)}
              inputMode="numeric"
              placeholder="Steps today"
              className="pl-10"
            />
          </label>
          <Button type="submit" variant="secondary">
            Save
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {WORKOUTS.filter((w) => w.id !== "lift").map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setKind(w.id)}
              className={cn(
                "h-11 rounded-full px-3.5 text-sm",
                kind === w.id ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            inputMode="numeric"
            placeholder="Minutes"
          />
          <Input
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            inputMode="decimal"
            placeholder={kind === "ride" || kind === "run" || kind === "walk" ? "Km" : "—"}
          />
        </div>
        <Button
          className="mt-2 w-full"
          variant="spark"
          onClick={() => {
            const mins = Number(minutes) || 30;
            const km = Number(distance) || undefined;
            addWorkout({ date: today, kind, minutes: mins, distanceKm: km });
            toast("Logged — remaining calories and protein moved");
          }}
        >
          <Plus />
          Log
        </Button>
        <ul className="mt-3 space-y-2">
          {loggedToday.map((w) => (
            <li key={w.id} className="flex items-center justify-between rounded-2xl bg-background px-3 py-2">
              <p className="text-sm">
                {WORKOUTS.find((x) => x.id === w.kind)?.label} · {w.minutes} min · {workoutKcal(w, body)} kcal
                {w.volumeKg ? ` · ${Math.round(imperial ? lbFromKg(w.volumeKg) : w.volumeKg)} ${imperial ? "lb" : "kg"}` : ""}
              </p>
              <button
                type="button"
                className="flex size-11 items-center justify-center"
                aria-label="Remove workout"
                onClick={() => removeWorkout(w.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Fuel me</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ranked for remaining calories and protein after that work{synced && health ? " and tonight’s recovery" : ""}.</p>
          </div>
          <Flame className="size-5 text-spark" />
        </div>
        <ul className="mt-3 space-y-2">
          {ranked.map((hit) => (
            <li key={hit.recipe.id}>
              <button
                type="button"
                onClick={() => {
                  assignMeal(today, "dinner", hit.recipe.id);
                  setTab("plan");
                  toast(`Plated ${hit.recipe.name} tonight`);
                }}
                className="relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
              >
                <span className={cn("absolute inset-y-3 left-2 w-1 rounded-full", cuisineBar(hit.recipe.cuisine))} />
                <Plate kind={hit.recipe.plate} className="ml-2" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{hit.recipe.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hit.why}</p>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {hit.recipe.nutrition.protein}g protein · {hit.recipe.nutrition.cal} kcal · {formatMinutes(hit.recipe.minutes)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          variant="secondary"
          onClick={() => {
            const n = fillFromFuel();
            toast(n ? `Plated ${n} night${n === 1 ? "" : "s"} from training` : "This week is already full");
            setTab("plan");
          }}
        >
          <Dumbbell />
          Fuel the empty nights
        </Button>
      </section>
      </>
      ) : null}

      <LiftSheet open={liftOpen} onClose={() => setLiftOpen(false)} />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl bg-card px-3 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-display text-xl tabular-nums leading-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function LiveStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 truncate font-display text-2xl tabular-nums leading-tight sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

function Ring({ label, value, of, unit }: { label: string; value: number; of: number; unit: string }) {
  const p = pct(value, of) / 100;
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = `${c * p} ${c}`;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 56 56" className="size-16" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" className="stroke-border" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          className="stroke-spark"
          strokeWidth="6"
          strokeDasharray={dash}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <p className="mt-1 text-xs font-medium">{label}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {Math.round(value)} {unit}
      </p>
    </div>
  );
}
