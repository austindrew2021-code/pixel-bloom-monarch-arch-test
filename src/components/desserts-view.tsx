import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CookView } from "@/components/cook-view";
import { MealPhoto } from "@/components/meal-photo";
import { RecipeCard } from "@/components/recipe-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cuisineBar, scaleQty } from "@/lib/cuisine";
import { isDessert, isHealthy } from "@/lib/diet";
import { formatMinutes, formatQty } from "@/lib/format";
import { scaleMethodSteps } from "@/lib/cook-steps";
import { strictestGoal } from "@/lib/goal-fit";
import { t } from "@/lib/i18n";
import { RECIPES } from "@/lib/recipes";
import { searchRecipes } from "@/lib/search";
import { recipeAllergens, recipeSafe } from "@/lib/shield";
import { useSpoonful } from "@/lib/spoonful-store";
import { mondayOf } from "@/lib/week";
import type { PlannedMeal, Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

const MENUS = [
  { id: "all", key: "all" },
  { id: "healthy", key: "healthy" },
  { id: "fruit", key: "fruit" },
  { id: "baking", key: "baking" },
  { id: "chilled", key: "chilled" },
  { id: "world", key: "world" },
] as const;

function dessertMenu(recipe: Recipe): string {
  const tags = recipe.tags ?? [];
  if (tags.includes("healthy") || isHealthy(recipe)) return "healthy";
  if (tags.includes("fruit")) return "fruit";
  if (tags.includes("chilled")) return "chilled";
  if (tags.includes("world")) return "world";
  if (tags.includes("baking")) return "baking";
  return "baking";
}

export function DessertsView() {
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const assignMeal = useSpoonful((s) => s.assignMeal);
  const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
  const setTab = useSpoonful((s) => s.setTab);
  const locale = useSpoonful((s) => s.locale);
  const household = useSpoonful((s) => s.household);
  const body = useSpoonful((s) => s.body);
  const seats = useSpoonful((s) => s.seats) ?? [];
  const tableGoal = strictestGoal([body.goalKind, ...seats.map((s) => s.goalKind)]);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<(typeof MENUS)[number]["id"]>("all");
  const [active, setActive] = useState<Recipe | null>(null);
  const [cooking, setCooking] = useState<PlannedMeal | null>(null);

  const pool = useMemo(() => RECIPES.filter(isDessert), []);
  const list = useMemo(() => {
    let rows = pool.filter((r) => !hidden.includes(r.id) && recipeSafe(r, allergies));
    if (menu === "healthy") rows = rows.filter((r) => isHealthy(r) || (r.tags ?? []).includes("healthy"));
    else if (menu !== "all") rows = rows.filter((r) => dessertMenu(r) === menu);
    if (query.trim()) rows = searchRecipes(query, rows);
    return rows;
  }, [pool, menu, query, hidden, allergies]);

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">{t(locale, "kitchen")}</p>
      <h1 className="mt-1 font-display text-4xl" data-tour="desserts-head">{t(locale, "desserts")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
        Its own menu. Fruit, bakery, chilled, and the world — plus a Healthy toggle that still tastes like dessert.
      </p>
      {tableGoal === "lose" ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A treat, not on your Cut fat plate. Fill, Surprise, Fuel, and the Chef will not auto-plate these.
        </p>
      ) : null}

      <Input
        className="mt-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nanaimo, grunt, flan…"
      />

      <div className="chip-row mt-3">
        {MENUS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMenu(m.id)}
            className={
              menu === m.id
                ? "h-11 shrink-0 rounded-full bg-spark px-4 text-sm text-spark-foreground"
                : "h-11 shrink-0 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {t(locale, m.key)}
            {m.id === "all" ? ` ${pool.length}` : ""}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {list.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard recipe={recipe} locked={false} nutritionOn onOpen={() => setActive(recipe)} />
          </li>
        ))}
      </ul>

      <Sheet open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent title={active?.name ?? "Dessert"}>
          {active ? (
            <div>
              <MealPhoto recipe={active} className="h-44 rounded-2xl" />
              <div className={cn("mt-4 h-2 w-16 rounded-full", cuisineBar(active.cuisine))} />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
              {recipeAllergens(active).length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Contains: {recipeAllergens(active).join(", ")}</p>
              ) : null}
              <p className="mt-3 text-sm tabular-nums">
                {formatMinutes(active.minutes)} · {active.nutrition.cal} kcal / serving · {active.nutrition.protein}g protein
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                {active.ingredients.map((ing, i) => (
                  <li key={`${ing.name}-${i}`} className="flex justify-between gap-3">
                    <span className="min-w-0">{ing.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatQty(scaleQty(ing.qty, household, active.servings), ing.unit)}
                    </span>
                  </li>
                ))}
              </ul>
              <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm leading-relaxed">
                {scaleMethodSteps(active.steps, active.ingredients, household, active.servings).map((s, i) => (
                  <li key={`step-${i}`}>{s}</li>
                ))}
              </ol>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    assignMeal(mondayOf(), "dinner", active.id);
                    setActive(null);
                    setTab("plan");
                    toast(`Plated ${active.name}`);
                  }}
                >
                  {t(locale, "plateTonight")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    addExtraGrocery(active.name, "Bakery");
                    toast("Added to this week's shop");
                  }}
                >
                  {t(locale, "addGrocery")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setCooking({
                      id: `cook-${active.id}`,
                      date: mondayOf(),
                      slot: "dinner",
                      recipeId: active.id,
                    });
                    setActive(null);
                  }}
                >
                  {t(locale, "cookNow")}
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      {cooking ? <CookView meal={cooking} onClose={() => setCooking(null)} /> : null}
    </div>
  );
}
