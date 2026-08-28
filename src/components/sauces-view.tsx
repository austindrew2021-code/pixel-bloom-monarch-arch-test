import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CookView } from "@/components/cook-view";
import { MealPhoto } from "@/components/meal-photo";
import { RecipeCard } from "@/components/recipe-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cuisineBar } from "@/lib/cuisine";
import { formatMinutes } from "@/lib/format";
import { RECIPES } from "@/lib/recipes";
import { SAUCE_MENUS, isSauceRecipe, saucesIn, type SauceMenuId } from "@/lib/sauce-menu";
import { searchRecipes } from "@/lib/search";
import { recipeAllergens, recipeSafe } from "@/lib/shield";
import { useSpoonful } from "@/lib/spoonful-store";
import { mondayOf } from "@/lib/week";
import type { PlannedMeal, Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SaucesView() {
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const assignMeal = useSpoonful((s) => s.assignMeal);
  const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
  const setTab = useSpoonful((s) => s.setTab);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<SauceMenuId | "all">("all");
  const [active, setActive] = useState<Recipe | null>(null);
  const [cooking, setCooking] = useState<PlannedMeal | null>(null);

  const list = useMemo(() => {
    let pool = saucesIn(menu, RECIPES.filter(isSauceRecipe)).filter(
      (r) => !hidden.includes(r.id) && recipeSafe(r, allergies),
    );
    if (query.trim()) pool = searchRecipes(query, pool);
    return pool;
  }, [menu, query, hidden, allergies]);

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Kitchen</p>
      <h1 className="mt-1 font-display text-4xl">Sauces</h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
        Donair shops, dry rubs, mother sauces, and the rest of the world. Its own menu — not buried in Recipes.
      </p>

      <Input
        className="mt-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Greco, chimichurri, jerk rub…"
      />

      <div className="chip-row mt-3">
        <button
          type="button"
          onClick={() => setMenu("all")}
          className={
            menu === "all"
              ? "h-11 shrink-0 rounded-full bg-spark px-4 text-sm text-spark-foreground"
              : "h-11 shrink-0 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]"
          }
        >
          All {RECIPES.filter(isSauceRecipe).length}
        </button>
        {SAUCE_MENUS.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => setMenu(m.id)}
            className={
              menu === m.id
                ? "h-11 shrink-0 rounded-full bg-spark px-4 text-sm text-spark-foreground"
                : "h-11 shrink-0 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {m.label}
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
        <SheetContent title={active?.name ?? "Sauce"}>
          {active ? (
            <div>
              <MealPhoto recipe={active} className="h-44 rounded-2xl" />
              <div className={cn("mt-4 h-2 w-16 rounded-full", cuisineBar(active.cuisine))} />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
              {recipeAllergens(active).length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Contains: {recipeAllergens(active).join(", ")}</p>
              ) : null}
              <p className="mt-3 text-sm tabular-nums">
                {formatMinutes(active.minutes)} · {active.nutrition.cal} kcal / serving
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                {active.ingredients.map((ing, i) => (
                  <li key={`${ing.name}-${i}`}>
                    {ing.qty} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>
              <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm leading-relaxed">
                {active.steps.map((s, i) => (
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
                  Plate with tonight
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    addExtraGrocery(active.name, "Pantry");
                    toast("Added to this week's shop");
                  }}
                >
                  Add to grocery
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
                  Cook now
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
