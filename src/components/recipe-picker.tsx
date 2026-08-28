import { Heart, Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MealPhoto } from "@/components/meal-photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { goalLabel } from "@/lib/body";
import { dietFlags } from "@/lib/diet";
import { formatMinutes } from "@/lib/format";
import { fitsGoal, strictestGoal } from "@/lib/goal-fit";
import { packLabel, RECIPES } from "@/lib/recipes";
import { searchRecipes } from "@/lib/search";
import { recipeSafe } from "@/lib/shield";
import { recipeAllowed, unlockedRecipes, useSpoonful } from "@/lib/spoonful-store";
import type { CustomMeal, Ingredient, Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecipePicker({
  open,
  onOpenChange,
  onPick,
  onCustom,
  onLocked,
  onSurprise,
  onSkip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (recipeId: string) => void;
  onCustom: (custom: CustomMeal) => void;
  onLocked: () => void;
  onSurprise?: () => void;
  onSkip?: (kind: "takeout" | "rest") => void;
}) {
  const unlocked = useSpoonful((s) => s.unlocked);
  const prefs = useSpoonful((s) => s.prefs);
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const nextGen = useSpoonful((s) => s.nextGen);
  const body = useSpoonful((s) => s.body);
  const seats = useSpoonful((s) => s.seats) ?? [];
  const tableGoal = strictestGoal([body.goalKind, ...seats.map((s) => s.goalKind)]);
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const available = unlockedRecipes(unlocked);

  const list = useMemo(() => {
    const base = query.trim() ? searchRecipes(query, RECIPES) : RECIPES;
    const openRecipes = base.filter((r) => available.some((a) => a.id === r.id) && !hidden.includes(r.id));
    const locked = base.filter((r) => !available.some((a) => a.id === r.id));
    const preferred = openRecipes.filter((r) => recipeAllowed(r, prefs, allergies, hidden));
    const rest = openRecipes.filter((r) => !recipeAllowed(r, prefs, allergies, hidden) && recipeSafe(r, allergies));
    const onGoal = preferred.filter((r) => fitsGoal(r, tableGoal, "dinner"));
    const offGoal = preferred.filter((r) => !fitsGoal(r, tableGoal, "dinner"));
    const hideOff = (tableGoal === "lose" || tableGoal === "recomp") && !query.trim();
    const visibleOff = hideOff ? [] : offGoal;
    return [...onGoal, ...visibleOff, ...rest, ...locked.filter((r) => recipeSafe(r, allergies))];
  }, [query, available, prefs, allergies, hidden, tableGoal]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setQuery("");
          setCustomOpen(false);
        }
      }}
    >
      <SheetContent title="Choose a recipe">
        {customOpen ? (
          <CustomForm
            onCancel={() => setCustomOpen(false)}
            onSave={(c) => {
              onCustom(c);
              setCustomOpen(false);
            }}
          />
        ) : (
          <>
            <h2 className="font-display text-2xl">Add to the week</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dishes that fit {goalLabel(tableGoal)} sit first. Off-goal plates stay hidden unless you search for them.
            </p>
            {onSurprise || onSkip ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {onSurprise ? (
                  <Button variant="spark" className="w-full" onClick={onSurprise}>
                    {nextGen ? "Surprise me" : "Pick for me"}
                  </Button>
                ) : null}
                {onSkip ? (
                  <Button variant="secondary" className="w-full" onClick={() => onSkip("takeout")}>
                    Eating out
                  </Button>
                ) : null}
                {onSkip ? (
                  <Button variant="ghost" className="col-span-2 w-full" onClick={() => onSkip("rest")}>
                    Kitchen closed
                  </Button>
                ) : null}
              </div>
            ) : null}
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jiggs, scoff, CTM, donair…"
                className="pl-10"
              />
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setCustomOpen(true)}>
              Use your own meal
            </Button>
            <ul className="mt-4 space-y-2">
              {list.map((recipe) => (
                <RecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  locked={!available.some((a) => a.id === recipe.id)}
                  onPick={onPick}
                  onLocked={onLocked}
                  offGoal={!fitsGoal(recipe, tableGoal, "dinner")}
                />
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RecipeRow({
  recipe,
  locked,
  onPick,
  onLocked,
  offGoal,
}: {
  recipe: Recipe;
  locked: boolean;
  onPick: (id: string) => void;
  onLocked: () => void;
  offGoal?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => (locked ? onLocked() : onPick(recipe.id))}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-background p-2 text-left",
        locked && "opacity-70",
      )}
    >
      <MealPhoto recipe={recipe} className="size-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{recipe.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatMinutes(recipe.minutes)} · {packLabel(recipe.pack)}
          {offGoal ? " · off your goal" : ""}
        </p>
      </div>
      {locked ? <Lock className="size-4 text-muted-foreground" /> : null}
    </button>
  );
}

function CustomForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (custom: CustomMeal) => void;
}) {
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState("tomatoes, 4\ngarlic, 3 cloves\nolive oil, 2 tbsp");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          id: `custom-${Date.now()}`,
          name: name.trim(),
          minutes: Number(minutes) || 30,
          notes: notes.trim(),
          ingredients: parseIngredientLines(lines),
        });
      }}
    >
      <h2 className="font-display text-2xl">Your own meal</h2>
      <label className="text-sm">
        Name
        <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="text-sm">
        Minutes
        <Input
          className="mt-1.5"
          inputMode="numeric"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </label>
      <label className="text-sm">
        Ingredients
        <textarea
          value={lines}
          onChange={(e) => setLines(e.target.value)}
          rows={5}
          className="mt-1.5 w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          One per line. Name, then optional amount — like “onion, 1”.
        </span>
      </label>
      <label className="text-sm">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Add to week
        </Button>
      </div>
    </form>
  );
}

function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, rest] = line.split(",").map((s) => s.trim());
      const name = namePart || "item";
      if (!rest) return { name, qty: 1, unit: "", aisle: "Other" as const };
      const bits = rest.split(/\s+/);
      const qty = Number(bits[0]);
      if (Number.isFinite(qty)) {
        return { name, qty, unit: bits.slice(1).join(" "), aisle: "Other" as const };
      }
      return { name, qty: 1, unit: rest, aisle: "Other" as const };
    });
}

export function RecipeCard({
  recipe,
  locked,
  nutritionOn,
  onOpen,
}: {
  recipe: Recipe;
  locked: boolean;
  nutritionOn: boolean;
  onOpen: () => void;
}) {
  const nextGen = useSpoonful((s) => s.nextGen);
  const favorites = useSpoonful((s) => s.favorites);
  const toggleFavorite = useSpoonful((s) => s.toggleFavorite);
  const loved = favorites.includes(recipe.id);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-stretch gap-3 overflow-hidden rounded-3xl bg-card p-2 text-left shadow-[var(--shadow-border)]"
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl">
        <MealPhoto recipe={recipe} className="size-full" />
        <span
          role="button"
          tabIndex={0}
          aria-label={loved ? "Unsave" : "Save"}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(recipe.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(recipe.id);
            }
          }}
          className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-card/90"
        >
          <Heart className={cn("size-3.5", loved && "fill-spark text-spark")} />
        </span>
      </div>
      <div className="min-w-0 flex-1 py-1 pr-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate font-medium">{recipe.name}</p>
          {locked ? <Lock className="size-3.5 shrink-0 text-muted-foreground" /> : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{formatMinutes(recipe.minutes)}</Badge>
          {recipe.cuisine ? <Badge variant="outline" className="max-w-[8.5rem]">{recipe.cuisine}</Badge> : null}
          {recipe.source?.year ? <Badge variant="outline">{recipe.source.year}</Badge> : null}
          {dietFlags(recipe).slice(0, 2).map((f) => (
            <Badge key={f} variant="outline">
              {f === "gluten-free" ? "GF" : f === "sugar-free" ? "SF" : f === "dairy-free" ? "DF" : f}
            </Badge>
          ))}
          {(nutritionOn || nextGen) && !locked ? (
            <Badge variant="outline">{recipe.nutrition.protein}g protein</Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}
