import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { planWeekWithChef } from "@/lib/ai-chef";
import { goalLabel, leanMassKg } from "@/lib/body";
import { dayFuel, isoDate } from "@/lib/fuel";
import { fitsGoal, strictestGoal } from "@/lib/goal-fit";
import { nutritionForDate, recipeAllowed, unlockedRecipes, useSpoonful } from "@/lib/spoonful-store";
import type { Aisle } from "@/lib/types";
import { weekDates } from "@/lib/week";

const SUGGESTIONS = [
  "Georgian khachapuri, vegetarian, under 40 minutes.",
  "Senegalese thieboudienne, no dairy, leftover-friendly.",
  "I lifted heavy. High protein Korean or Peruvian, 30 minutes, not the usual rotation.",
];

const WAIT_TIPS = [
  "Salt pasta water until it tastes like the sea — that's the only chance to season the noodle.",
  "Pat meat dry before it hits the pan. Wet meat steams instead of browning.",
  "A rest after roasting is part of the cook. Slice too soon and the juice runs onto the board.",
  "Taste the sauce before you plate, not after. A pinch of salt at the end is cheaper than a ruined pan.",
  "Don't crowd the skillet. Two batches gold beats one batch grey.",
  "Save a cup of pasta water. Starch is how a sauce clings.",
  "Let a stew sit overnight if you can. It is better the next day, every time.",
  "Heat the pan first, then the fat, then the food. Cold oil in a cold pan is a stew.",
];

const AISLES: Aisle[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Bakery",
  "Frozen",
  "Herbs & Spices",
  "Other",
];

export function AiChefSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const weekStart = useSpoonful((s) => s.weekStart);
  const household = useSpoonful((s) => s.household);
  const unlocked = useSpoonful((s) => s.unlocked);
  const prefs = useSpoonful((s) => s.prefs);
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const assignMeal = useSpoonful((s) => s.assignMeal);
  const assignCustom = useSpoonful((s) => s.assignCustom);
  const consumeChef = useSpoonful((s) => s.consumeChef);
  const chefRemaining = useSpoonful((s) => s.chefRemaining);
  const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
  const goal = useSpoonful((s) => s.goal);
  const body = useSpoonful((s) => s.body);
  const seats = useSpoonful((s) => s.seats) ?? [];
  const meals = useSpoonful((s) => s.meals);
  const workouts = useSpoonful((s) => s.workouts);
  const stepsByDate = useSpoonful((s) => s.stepsByDate);
  const snacks = useSpoonful((s) => s.snacks);
  const portionMultByDate = useSpoonful((s) => s.portionMultByDate);
  const [prompt, setPrompt] = useState(SUGGESTIONS[2] ?? SUGGESTIONS[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"tonight" | "week">("tonight");
  const [tip, setTip] = useState(0);
  const today = isoDate();
  const remaining = dayFuel({
    goal,
    eaten: nutritionForDate(meals, today, snacks, portionMultByDate),
    workouts: workouts.filter((w) => w.date === today),
    steps: stepsByDate[today] ?? 0,
    body,
  }).remaining;

  useEffect(() => {
    if (!busy) return;
    setTip(0);
    const id = window.setInterval(() => {
      setTip((n) => (n + 1) % WAIT_TIPS.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [busy]);

  async function run() {
    if (chefRemaining() <= 0) {
      toast(hasPlus ? "Chef is resting this week. Extra plate packs are in Extras." : "Free kitchens get 3 chef plates a week. Kitchen Table or Kitchen+ opens the whole world, or add a plate pack in Extras.");
      return;
    }
    setBusy(true);
    try {
      const tableGoal = strictestGoal([body.goalKind, ...seats.map((s) => s.goalKind)]);
      const recipes = unlockedRecipes(unlocked)
        .filter((r) => recipeAllowed(r, prefs, allergies, hidden) && fitsGoal(r, tableGoal, "dinner"))
        .slice(0, 80)
        .map((r) => ({
          id: r.id,
          name: r.name,
          minutes: r.minutes,
          protein: r.protein,
          tags: r.tags,
        }));
      const result = await planWeekWithChef({
        data: {
          prompt: `${prompt} Fit a ${goalLabel(tableGoal)} goal.`,
          days: scope === "tonight" ? [today] : weekDates(weekStart),
          household,
          recipes,
          invent: hasPlus,
          allergies,
          prefs,
          remaining,
          body: {
            kcal: goal.cal,
            protein: goal.protein,
            weightKg: body.weightKg,
            goalKind: tableGoal,
            bodyFatPct: body.bodyFatPct,
            leanKg: leanMassKg(body),
          },
          scope,
        },
      });
      if (!result.ok) {
        toast(result.error);
        return;
      }
      consumeChef();
      for (const day of result.days) {
        if (day.recipeId) {
          assignMeal(day.date, "dinner", day.recipeId);
        } else if (day.dish) {
          assignCustom(day.date, "dinner", {
            id: `chef-${day.date}-${Date.now()}`,
            name: day.dish.name,
            minutes: day.dish.minutes,
            notes: `${day.dish.description ?? ""}\n\n${day.dish.steps.join(" ")}`.trim(),
            steps: day.dish.steps,
            ingredients: day.dish.ingredients.map((i) => ({
              name: i.name,
              qty: i.qty,
              unit: i.unit,
              aisle: AISLES.includes(i.aisle as Aisle) ? (i.aisle as Aisle) : "Other",
            })),
            nutrition: day.dish.nutrition,
          });
        }
      }
      toast(result.note || `Planned ${result.days.length} dinners`);
      onOpenChange(false);
    } catch {
      toast("The chef is busy. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="AI Chef">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {hasPlus ? "Kitchen+ worldwide" : "Library chef"}
        </p>
        <h2 className="mt-2 font-display text-2xl">
          {hasPlus ? "Any plate on earth, fitted to you" : "Tell the kitchen how the week feels"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {hasPlus
            ? `The chef invents dishes that are not in the catalog — fitted to your ${goalLabel(body.goalKind)} goal, remaining protein, allergies, and what you lifted. Nutrition is per serving from typical USDA values.`
            : "Free kitchens get 3 plates a week from the library, already filtered to your body goal. Kitchen Table or Kitchen+ lets the chef cook anything imaginable, 40 times a week."}{" "}
          {chefRemaining()} left this week.
        </p>
        <div className="mt-3 flex gap-1.5">
          {(["tonight", "week"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={
                scope === id
                  ? "h-11 flex-1 rounded-full bg-spark text-sm text-spark-foreground"
                  : "h-11 flex-1 rounded-full bg-background text-sm shadow-[var(--shadow-border)]"
              }
            >
              {id === "tonight" ? "Tonight" : "Whole week"}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          maxLength={500}
          className="mt-4 w-full rounded-2xl bg-background p-3 text-sm leading-relaxed shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-3 flex flex-col gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="rounded-2xl bg-background px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <Button className="mt-5 w-full" disabled={busy || !prompt.trim()} onClick={() => void run()}>
          {busy ? "Chef is cooking…" : hasPlus ? (scope === "tonight" ? "Invent tonight" : "Cook the world") : "Plan my dinners"}
        </Button>
        {busy ? (
          <p className="mt-4 min-h-[4.5rem] rounded-2xl bg-background px-3 py-3 text-sm leading-relaxed text-muted-foreground">
            {WAIT_TIPS[tip]}
          </p>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
