import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plate } from "@/components/plate";
import { TesterGate } from "@/components/tester-gate";
import { dayFuel, isoDate } from "@/lib/fuel";
import { formatMinutes } from "@/lib/format";
import { nutritionForDate, resolveMeal, useSpoonful } from "@/lib/spoonful-store";
import { rankProgress } from "@/lib/ranks";
import { isTesterUnlocked } from "@/lib/tester";

export const Route = createFileRoute("/watch")({ component: WatchFace });

function WatchFace() {
  const meals = useSpoonful((s) => s.meals);
  const goal = useSpoonful((s) => s.goal);
  const workouts = useSpoonful((s) => s.workouts);
  const stepsByDate = useSpoonful((s) => s.stepsByDate);
  const snacks = useSpoonful((s) => s.snacks);
  const xp = useSpoonful((s) => s.xp);
  const onboarded = useSpoonful((s) => s.onboarded);
  const body = useSpoonful((s) => s.body);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(isTesterUnlocked());
    const done = useSpoonful.persist.rehydrate();
    void Promise.resolve(done).then(() => {
      const theme = useSpoonful.getState().theme;
      document.documentElement.dataset.theme = theme === "midnight" ? "midnight" : "paper";
    });
  }, []);

  const today = isoDate();
  const dinner = meals.find((m) => m.date === today && m.slot === "dinner");
  const resolved = dinner ? resolveMeal(dinner) : null;
  const fuel = dayFuel({
    goal,
    eaten: nutritionForDate(meals, today, snacks),
    workouts: workouts.filter((w) => w.date === today),
    steps: stepsByDate[today] ?? 0,
    body,
  });
  const rank = rankProgress(xp);

  if (allowed !== true) {
    if (allowed === false) return <TesterGate onUnlock={() => setAllowed(true)} />;
    return <main className="min-h-dvh bg-background" />;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-6 text-foreground">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-spark">Watch face</p>
      <p className="mt-1 text-center text-xs text-muted-foreground">Apple Watch · Wear OS · phone</p>
      {!onboarded ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">Open Spoonful on your phone and plate tonight first.</p>
      ) : resolved && !resolved.skip ? (
        <>
          <Plate kind={resolved.recipe?.plate ?? "bowl"} size="lg" className="mt-4" />
          <h1 className="mt-3 text-center font-display text-3xl leading-tight">{resolved.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatMinutes(resolved.minutes)}</p>
        </>
      ) : (
        <h1 className="mt-4 text-center font-display text-3xl">Nothing plated</h1>
      )}
      <p className="mt-6 font-display text-2xl tabular-nums">{Math.round(fuel.remaining.cal)}</p>
      <p className="text-xs text-muted-foreground">kcal left · {fuel.remaining.protein}g protein</p>
      <p className="mt-4 text-sm font-medium">{rank.current.title}</p>
      <a href="/" className="mt-6 text-sm text-spark">
        Open kitchen
      </a>
    </main>
  );
}
