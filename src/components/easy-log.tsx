import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ingredientLines, LEFTOVER_PASTA, parseIngredientLines } from "@/lib/easy-kitchen";
import { isoDate } from "@/lib/fuel";
import { recipeById } from "@/lib/recipes";
import { resolveMeal, useSpoonful } from "@/lib/spoonful-store";
import type { CustomMeal } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Week-1 log: type leftover pasta, stay on this screen, Done is a checkmark.
 *
 * One Done finishes the log — the editor dismisses, the meal stays logged, and
 * the confirmation reads on the card instead of sitting under a Cancel/Done pair
 * the cook has to tap again. Streak and celebrate overlays are held back while
 * the form is open and for a beat after it closes, so nothing steals the tap.
 */
export function EasyLogCard({ className }: { className?: string }) {
  const meals = useSpoonful((s) => s.meals);
  const favorites = useSpoonful((s) => s.favorites);
  const cookedDates = useSpoonful((s) => s.cookedDates);
  const logTonight = useSpoonful((s) => s.logTonight);
  const assignMeal = useSpoonful((s) => s.assignMeal);
  const markCooked = useSpoonful((s) => s.markCooked);
  const lockKitchen = useSpoonful((s) => s.lockKitchen);
  const unlockKitchen = useSpoonful((s) => s.unlockKitchen);
  const today = isoDate();
  const tonight = meals.find((m) => m.date === today && m.slot === "dinner" && !m.skip);
  const cooked = cookedDates.includes(today);
  const resolved = tonight ? resolveMeal(tonight) : null;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lines, setLines] = useState("");
  const [busy, setBusy] = useState(false);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (!open && !holding) return;
    lockKitchen();
    return () => unlockKitchen();
  }, [open, holding, lockKitchen, unlockKitchen]);

  // Long enough for the "logged" toast to live out its 4 seconds. A milestone
  // that lands on top of the confirmation is a celebration stealing the log.
  useEffect(() => {
    if (!holding) return;
    const id = window.setTimeout(() => setHolding(false), 4500);
    return () => window.clearTimeout(id);
  }, [holding]);

  const recents = useMemo(() => {
    const seen = new Set<string>();
    const out: { label: string; meal?: CustomMeal; recipeId?: string }[] = [
      { label: LEFTOVER_PASTA.name, meal: LEFTOVER_PASTA },
    ];
    seen.add(LEFTOVER_PASTA.name.toLowerCase());
    for (const id of favorites) {
      const recipe = recipeById(id);
      if (!recipe || seen.has(recipe.name.toLowerCase())) continue;
      seen.add(recipe.name.toLowerCase());
      out.push({ label: recipe.name, recipeId: recipe.id });
    }
    for (const meal of [...meals].reverse()) {
      const title = resolveMeal(meal).title;
      if (!title || seen.has(title.toLowerCase()) || meal.skip) continue;
      seen.add(title.toLowerCase());
      out.push({ label: title, meal: meal.custom, recipeId: meal.recipeId });
      if (out.length >= 8) break;
    }
    return out;
  }, [favorites, meals]);

  function fill(chip: { label: string; meal?: CustomMeal; recipeId?: string }) {
    setOpen(true);
    if (chip.meal) {
      setName(chip.meal.name);
      setLines(ingredientLines(chip.meal.ingredients));
      return;
    }
    if (chip.recipeId) {
      const recipe = recipeById(chip.recipeId);
      setName(recipe?.name ?? chip.label);
      setLines(recipe ? ingredientLines(recipe.ingredients) : "");
      return;
    }
    setName(chip.label);
    setLines("");
  }

  function cancel() {
    setOpen(false);
    setBusy(false);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const ings = parseIngredientLines(lines);
      const fav = recents.find((c) => c.recipeId && c.label.toLowerCase() === trimmed.toLowerCase());
      if (fav?.recipeId && ings.length === 0) {
        assignMeal(today, "dinner", fav.recipeId);
        markCooked(today);
        useSpoonful.getState().setShopScope("tonight");
      } else {
        logTonight({ name: trimmed, ingredients: ings, cooked: true });
      }
      // One Done closes the editor. The meal is already in the log, so the
      // confirmation belongs on the card, not under a live Cancel/Done pair.
      setHolding(true);
      setOpen(false);
      toast(`${trimmed} logged`);
    } catch {
      // Never wipe a mid-log: the draft stays on screen to try again.
      toast("Couldn't save that meal — draft is still here");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section data-testid="easy-log" className={cn("rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Tonight</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">Log this meal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Type what you ate, or tap a meal you've had before.
          </p>
        </div>
        {cooked && resolved ? (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Meal logged">
            <Check className="size-5" />
          </span>
        ) : null}
      </div>

      {resolved && !open ? (
        <p className="mt-3 text-sm font-medium" data-testid="easy-log-done">
          {resolved.title}
          {cooked ? " · logged" : ""}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {recents.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => fill(chip)}
            className="h-11 rounded-full bg-background px-3.5 text-sm shadow-[var(--shadow-border)]"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {open ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="block text-sm">
            Name
            <Input
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leftover pasta"
              required
            />
          </label>
          <label className="block text-sm">
            Ingredients
            <textarea
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              rows={4}
              placeholder="pasta, 12 oz&#10;tomato sauce, 1 jar&#10;milk, 1 cup"
              className="mt-1.5 w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="mt-1 block text-xs text-muted-foreground">One ingredient per line. The shop list uses these.</span>
          </label>
          {busy ? <p className="text-sm text-spark">Saving…</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={cancel} disabled={busy}>
              <X />
              Cancel
            </Button>
            <Button type="submit" className="flex-1" variant="spark" disabled={busy || !name.trim()}>
              <Check />
              {busy ? "Saving" : "Done"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          className="mt-4 w-full"
          variant="spark"
          onClick={() => setOpen(true)}
        >
          Log tonight
        </Button>
      )}
    </section>
  );
}
