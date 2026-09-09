import { Dumbbell, Plus } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isoDate } from "@/lib/fuel";
import { buildGymPlate, foodsInRole, type FoodRole } from "@/lib/gym-plate";
import { useSpoonful } from "@/lib/spoonful-store";
import type { Nutrition } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The gym plate.
 *
 * A lifter eats the same handful of foods and moves the grams around. That is a
 * different thing from a recipe, and the library — 1539 dishes of chow-chow and
 * potato croquettes — was never going to serve it. So: pick four foods once,
 * and every day this says how much of each to weigh out to hit the macros that
 * are actually left today.
 *
 * It sits under the day's remaining macros, so a plate late in the day is
 * smaller than one at breakfast. That is the point.
 */
export function GymPlateCard({
  remaining,
  className,
}: {
  /** What is left of today after everything already eaten. */
  remaining: Nutrition;
  className?: string;
}) {
  const gymPlate = useSpoonful((s) => s.gymPlate);
  const setGymPlate = useSpoonful((s) => s.setGymPlate);
  const addSnack = useSpoonful((s) => s.addSnack);
  const prefs = useSpoonful((s) => s.prefs);

  const diet = useMemo(
    () => ({ vegetarian: prefs.includes("vegetarian"), vegan: prefs.includes("vegan") }),
    [prefs],
  );

  // What one meal of the rest of the day looks like.
  const target = useMemo<Nutrition>(() => {
    const meals = Math.max(1, gymPlate.meals);
    return {
      cal: Math.round(remaining.cal / meals),
      protein: Math.round(remaining.protein / meals),
      carbs: Math.round(remaining.carbs / meals),
      fat: Math.round(remaining.fat / meals),
    };
  }, [remaining, gymPlate.meals]);

  const plate = useMemo(
    () => buildGymPlate({ target, protein: gymPlate.protein, carb: gymPlate.carb, veg: gymPlate.veg, fat: gymPlate.fat }),
    [target, gymPlate],
  );

  const nothingLeft = target.protein <= 5 && target.cal <= 80;

  return (
    <section
      data-testid="gym-plate"
      className={cn("rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-spark">
            <Dumbbell className="size-3.5" /> Gym plate
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight">Weigh it out</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your four foods, scaled to what's left today.
          </p>
        </div>
        <label className="shrink-0 text-right text-xs text-muted-foreground">
          Meals left
          <select
            className="mt-1 block h-11 w-20 rounded-xl bg-background px-2 text-center text-sm shadow-[var(--shadow-border)]"
            value={gymPlate.meals}
            onChange={(e) => setGymPlate({ meals: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <FoodPick role="protein" label="Protein" value={gymPlate.protein} diet={diet} onPick={(protein) => setGymPlate({ protein })} />
        <FoodPick role="carb" label="Carb" value={gymPlate.carb} diet={diet} onPick={(carb) => setGymPlate({ carb })} />
        <FoodPick role="veg" label="Veg" value={gymPlate.veg} diet={diet} onPick={(veg) => setGymPlate({ veg })} />
        <FoodPick role="fat" label="Fat" value={gymPlate.fat} diet={diet} onPick={(fat) => setGymPlate({ fat })} />
      </div>

      {nothingLeft ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Today's macros are done. Nothing left to weigh out.
        </p>
      ) : plate ? (
        <>
          <ul className="mt-4 space-y-1.5" data-testid="gym-plate-items">
            {plate.items.map((item) => (
              <li key={item.food.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{item.food.name}</span>
                <span className="shrink-0 font-display text-lg tabular-nums">{item.grams} g</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm tabular-nums text-muted-foreground">
            {plate.totals.cal} kcal · {plate.totals.protein}p · {plate.totals.carbs}c · {plate.totals.fat}f
          </p>
          {/*
            * When clamping to real portions means the plate cannot land, say so.
            * A lifter checks these numbers, and quietly missing by 20 g of carbs
            * is how an app stops being trusted.
            */}
          {!plate.onTarget ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground" data-testid="gym-plate-off">
              Closest these four can get — {offLine(plate.off)}. Swap a food to land it.
            </p>
          ) : null}
          <Button
            className="mt-4 w-full"
            variant="spark"
            onClick={() => {
              addSnack({
                date: isoDate(),
                name: plate.items.map((i) => `${i.grams}g ${i.food.name.toLowerCase()}`).join(", "),
                nutrition: plate.totals,
              });
              toast("Plate logged");
            }}
          >
            <Plus />
            Log this plate
          </Button>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Those four foods are too alike to split the macros between. Try a leaner protein or a different fat.
        </p>
      )}
    </section>
  );
}

function offLine(off: Nutrition): string {
  const bits: string[] = [];
  const say = (n: number, unit: string) => (n > 0 ? `${n}g under on ${unit}` : `${Math.abs(n)}g over on ${unit}`);
  if (Math.abs(off.protein) > 4) bits.push(say(off.protein, "protein"));
  if (Math.abs(off.carbs) > 6) bits.push(say(off.carbs, "carbs"));
  if (Math.abs(off.fat) > 4) bits.push(say(off.fat, "fat"));
  return bits.length ? bits.join(", ") : "within a few grams";
}

function FoodPick({
  role,
  label,
  value,
  diet,
  onPick,
}: {
  role: FoodRole;
  label: string;
  value: string;
  diet: { vegetarian: boolean; vegan: boolean };
  onPick: (id: string) => void;
}) {
  const options = useMemo(() => foodsInRole(role, diet), [role, diet]);
  // A vegan kitchen that had chicken saved must not show a blank select.
  const safe = options.some((f) => f.id === value) ? value : (options[0]?.id ?? value);
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <select
        className="mt-1 block h-11 w-full rounded-xl bg-background px-2 text-sm text-foreground shadow-[var(--shadow-border)]"
        value={safe}
        onChange={(e) => onPick(e.target.value)}
      >
        {options.map((food) => (
          <option key={food.id} value={food.id}>{food.name}</option>
        ))}
      </select>
    </label>
  );
}
