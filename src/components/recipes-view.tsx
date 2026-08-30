import { ChevronLeft, Copy, Dices, Heart, Mic, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CookView } from "@/components/cook-view";
import { MealPhoto } from "@/components/meal-photo";
import { RecipeCard } from "@/components/recipe-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { isUnlocked } from "@/lib/access";
import { COLLECTION_GROUPS, COLLECTIONS, collectionById, recipesInCollection } from "@/lib/collections";
import { goalLabel } from "@/lib/body";
import { dietFlags, isHealthy, isComfort, isBreakfast, isDessert, isSauceLike, isHighProtein, matchesDiet, type DietFlag } from "@/lib/diet";
import { fitsGoal, strictestGoal } from "@/lib/goal-fit";
import { t, voiceFor } from "@/lib/i18n";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cuisineBar, scaleQty } from "@/lib/cuisine";
import { scaleMethodSteps } from "@/lib/cook-steps";
import { formatMinutes, formatQty } from "@/lib/format";

import { lookupDish } from "@/lib/kitchen-ai";
import { packLabel, RECIPES, recipeById } from "@/lib/recipes";
import { mealsFromPantry } from "@/lib/pantry-match";
import { recipesByCuisine, searchRecipes } from "@/lib/search";
import { recipeAllergens, recipeSafe } from "@/lib/shield";
import { unlockedRecipes, useSpoonful } from "@/lib/spoonful-store";
import type { PlannedMeal, Protein, Recipe } from "@/lib/types";
import { mondayOf } from "@/lib/week";
import { cn } from "@/lib/utils";

const DIET_CHIPS: { id: DietFlag | "all" | "healthy" | "quick"; key: string }[] = [
  { id: "all", key: "all" },
  { id: "vegetarian", key: "vegetarian" },
  { id: "vegan", key: "vegan" },
  { id: "gluten-free", key: "glutenFree" },
  { id: "sugar-free", key: "sugarFree" },
  { id: "dairy-free", key: "dairyFree" },
  { id: "keto", key: "keto" },
  { id: "healthy", key: "healthy" },
  { id: "quick", key: "quick" },
];

const MORE_CHIPS: { id: "protein" | "saved" | "breakfast" | "dessert" | "comfort" | "pantry"; key: string }[] = [
  { id: "protein", key: "highProtein" },
  { id: "saved", key: "saved" },
  { id: "breakfast", key: "breakfast" },
  { id: "dessert", key: "dessert" },
  { id: "comfort", key: "comfort" },
  { id: "pantry", key: "fromPantry" },
];

const TIME_CHIPS: { id: number | null; key: string }[] = [
  { id: null, key: "anyTime" },
  { id: 15, key: "minutes15" },
  { id: 30, key: "minutes30" },
  { id: 45, key: "minutes45" },
];

const PROTEIN_CHIPS: { id: Protein | null; key: string }[] = [
  { id: null, key: "anyProtein" },
  { id: "chicken", key: "chicken" },
  { id: "beef", key: "beef" },
  { id: "pork", key: "pork" },
  { id: "fish", key: "fish" },
  { id: "veg", key: "veg" },
];

const RECENT_KEY = "sf-recent-recipes";

type SortId = "name" | "time" | "protein";


function listen(onText: (t: string) => void, lang: string) {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    toast("Voice search is not on this device");
    return;
  }
  const rec = new Ctor();
  rec.lang = lang;
  rec.onresult = (ev: { results: { 0: { 0: { transcript: string } } } }) => {
    onText(ev.results[0][0].transcript);
  };
  rec.start();
}

type SpeechRec = {
  lang: string;
  onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  start: () => void;
};

export function RecipesView({ onOpenStore }: { onOpenStore: () => void }) {
  const unlocked = useSpoonful((s) => s.unlocked);
  const assignCustom = useSpoonful((s) => s.assignCustom);
  const setTab = useSpoonful((s) => s.setTab);
  const favorites = useSpoonful((s) => s.favorites);
  const nextGen = useSpoonful((s) => s.nextGen);
  const consumeLookup = useSpoonful((s) => s.consumeLookup);
  const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const locale = useSpoonful((s) => s.locale);
  const pantry = useSpoonful((s) => s.pantry);
  const body = useSpoonful((s) => s.body);
  const seats = useSpoonful((s) => s.seats) ?? [];
  const tableGoal = strictestGoal([body.goalKind, ...seats.map((s) => s.goalKind)]);
  const available = unlockedRecipes(unlocked);
  const nutritionOn = isUnlocked(unlocked, "nutrition") || nextGen;
  const { user } = useCurrentUserState();
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<(typeof DIET_CHIPS)[number]["id"]>("all");
  const [more, setMore] = useState<(typeof MORE_CHIPS)[number]["id"] | null>(null);
  const [rail, setRail] = useState<string | null>(null);
  const [shelf, setShelf] = useState<string | null>(null);
  const [timeMax, setTimeMax] = useState<number | null>(null);
  const [protein, setProtein] = useState<Protein | null>(null);
  const [sort, setSort] = useState<SortId>("name");
  const [active, setActive] = useState<Recipe | null>(null);
  const [cooking, setCooking] = useState<PlannedMeal | null>(null);
  const [looking, setLooking] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const browsingShelves =
    !query.trim() && diet === "all" && more === null && rail === null && shelf === null && timeMax === null && protein === null;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of COLLECTIONS) map[c.id] = 0;
    for (const r of RECIPES) {
      for (const c of COLLECTIONS) {
        if (c.match(r)) map[c.id] += 1;
      }
    }
    return map;
  }, []);

  const tonightPicks = useMemo(() => {
    const day = new Date().toISOString().slice(0, 10);
    const seed = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
    const pool = RECIPES.filter(
      (r) =>
        r.minutes <= 45 &&
        !isDessert(r) &&
        !isSauceLike(r) &&
        !isBreakfast(r) &&
        fitsGoal(r, tableGoal, "dinner"),
    );
    const pick: Recipe[] = [];
    for (let i = 0; i < pool.length && pick.length < 6; i++) {
      const recipe = pool[(seed + i * 19) % pool.length]!;
      if (!pick.some((x) => x.id === recipe.id)) pick.push(recipe);
    }
    return pick;
  }, [tableGoal]);

  const list = useMemo(() => {
    let pool = RECIPES;
    if (shelf === "all") pool = RECIPES;
    else if (shelf) pool = recipesInCollection(shelf, pool);
    else if (rail) pool = recipesByCuisine(rail, pool);
    if (query.trim()) pool = searchRecipes(query, pool);
    const pantryIds =
      more === "pantry"
        ? new Set(mealsFromPantry(pantry.map((x) => x.name), RECIPES, 40).map((h) => h.recipeId))
        : null;
    const hideOffGoal =
      nextGen &&
      (tableGoal === "lose" || tableGoal === "recomp") &&
      !query.trim() &&
      more !== "dessert" &&
      more !== "breakfast";
    const filtered = pool.filter((r) => {
      if (hidden.includes(r.id)) return false;
      if (!showBlocked && allergies.length > 0 && !recipeSafe(r, allergies)) return false;
      if (hideOffGoal && !fitsGoal(r, tableGoal, "dinner")) return false;
      if (timeMax !== null && r.minutes > timeMax) return false;
      if (protein === "fish") {
        if (r.protein !== "fish" && r.protein !== "seafood") return false;
      } else if (protein && r.protein !== protein) return false;
      if (diet === "healthy") return isHealthy(r);
      if (diet === "quick") return r.minutes <= 30;
      if (diet !== "all") return matchesDiet(r, diet);
      if (more === "protein") return isHighProtein(r);
      if (more === "pantry") return pantryIds?.has(r.id) ?? false;
      if (more === "saved") return favorites.includes(r.id);
      if (more === "breakfast") return isBreakfast(r);
      if (more === "dessert") return isDessert(r);
      if (more === "comfort") return isComfort(r);
      return true;
    });
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sort === "time") return a.minutes - b.minutes;
      if (sort === "protein") return b.nutrition.protein - a.nutrition.protein;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [query, diet, more, rail, shelf, favorites, hidden, allergies, showBlocked, sort, timeMax, protein, pantry, nextGen, tableGoal]);

  function openRecipe(recipe: Recipe) {
    setActive(recipe);
    setRecent((prev) => {
      const next = [recipe.id, ...prev.filter((id) => id !== recipe.id)].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function clearBrowse() {
    setDiet("all");
    setMore(null);
    setRail(null);
    setShelf(null);
    setTimeMax(null);
    setProtein(null);
    setQuery("");
  }

  function surprise() {
    let pool = browsingShelves ? RECIPES.filter((r) => !hidden.includes(r.id)) : list;
    if (nextGen && (tableGoal === "lose" || tableGoal === "recomp") && browsingShelves) {
      pool = pool.filter((r) => fitsGoal(r, tableGoal, "dinner"));
    }
    if (pool.length === 0) {
      toast(t(locale, "noDishes"));
      return;
    }
    openRecipe(pool[Math.floor(Math.random() * pool.length)]!);
  }

  async function lookUp() {
    if (!user) {
      toast("Sign in to look up dishes that are not in the library");
      return;
    }
    if (!consumeLookup()) {
      toast(hasPlus ? "Look-up is spent this week" : "Free kitchens get 3 look-ups a week. Kitchen+ raises that.");
      return;
    }
    setLooking(true);
    try {
      const res = await lookupDish({ data: { query } });
      if (!res.ok) {
        toast(res.error);
        return;
      }
      assignCustom(mondayOf(), "dinner", {
        id: `lookup-${Date.now()}`,
        name: res.recipe.name,
        minutes: res.recipe.minutes,
        notes: `${res.recipe.description}\n\n${res.recipe.steps.join(" ")}`,
        ingredients: res.recipe.ingredients.map((i) => ({
          name: i.name,
          qty: i.qty,
          unit: i.unit,
          aisle: "Other" as const,
        })),
        nutrition: res.recipe.nutrition,
        steps: res.recipe.steps,
      });
      toast(`Found ${res.recipe.name} — plated on Monday`);
      setTab("plan");
    } catch {
      toast("Look-up failed");
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">{t(locale, "kitchen")}</p>
      <h1 className="mt-1 font-display text-4xl">{t(locale, "recipes")}</h1>
      <p className="mt-2 text-sm text-foreground/80">
        {RECIPES.length} dishes, grouped by diet, how you cook, and the table they belong on.
        {allergies.length > 0 ? " Kitchen Shield is on." : ""}
      </p>
      {nextGen && (tableGoal === "lose" || tableGoal === "recomp") ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Next Gen is locked to {goalLabel(tableGoal)}. Off-goal dinners stay hidden unless you search. Desserts stay a treat — Fill, Surprise, and the Chef will not auto-plate them.
        </p>
      ) : null}

      <div className="relative mt-4 min-w-0">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Vegan chili, GF pizza, Instant Pot, latkes…"
          className="pl-10 pr-12"
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center"
          aria-label="Voice search"
          onClick={() => listen(setQuery, voiceFor(locale))}
        >
          <Mic className="size-4" />
        </button>
      </div>
      {query.trim() && list.length === 0 ? (
        <Button className="mt-3 w-full" onClick={() => void lookUp()} disabled={looking}>
          {looking ? "Looking it up…" : `Look up “${query.trim()}”`}
        </Button>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button variant="spark" className="h-11 flex-1" onClick={surprise}>
          <Dices className="size-4" />
          {t(locale, "surprise")}
        </Button>
        {!browsingShelves ? (
          <Button variant="secondary" className="h-11" onClick={clearBrowse}>
            {t(locale, "clearFilters")}
          </Button>
        ) : null}
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t(locale, "diet")}</p>
      <div className="chip-row mt-2">
        {DIET_CHIPS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setDiet(f.id);
              setMore(null);
            }}
            className={
              diet === f.id
                ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground"
                : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {t(locale, f.key)}
          </button>
        ))}
        {MORE_CHIPS.filter((f) => f.id !== "pantry" || pantry.length > 0).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setMore(more === f.id ? null : f.id);
              setDiet("all");
            }}
            className={
              more === f.id
                ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground"
                : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {t(locale, f.key)}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t(locale, "time")}</p>
      <div className="chip-row mt-2">
        {TIME_CHIPS.map((f) => (
          <button
            key={String(f.id)}
            type="button"
            onClick={() => setTimeMax(f.id)}
            className={
              timeMax === f.id
                ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground"
                : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {t(locale, f.key)}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t(locale, "protein")}</p>
      <div className="chip-row mt-2">
        {PROTEIN_CHIPS.map((f) => (
          <button
            key={String(f.id)}
            type="button"
            onClick={() => setProtein(f.id)}
            className={
              protein === f.id
                ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground"
                : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {f.id === "veg" ? t(locale, "veg") : f.id ? f.id[0]!.toUpperCase() + f.id.slice(1) : t(locale, f.key)}
          </button>
        ))}
      </div>


      {allergies.length > 0 ? (
        <button
          type="button"
          className="mt-2 text-xs text-muted-foreground"
          onClick={() => setShowBlocked((v) => !v)}
        >
          {showBlocked ? "Hide blocked dishes" : "Show dishes Kitchen Shield hid"}
        </button>
      ) : null}

      {browsingShelves ? (
        <div className="mt-5 space-y-7">
          <section>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t(locale, "tonightPicks")}</p>
              <button type="button" className="text-xs text-spark" onClick={() => setShelf("all")}>
                {t(locale, "allCatalog")} · {RECIPES.length}
              </button>
            </div>
            <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {tonightPicks.map((recipe) => (
                <li key={recipe.id} className="w-36 shrink-0">
                  <button
                    type="button"
                    onClick={() => openRecipe(recipe)}
                    className="w-full overflow-hidden rounded-3xl bg-card text-left shadow-[var(--shadow-border)]"
                  >
                    <MealPhoto recipe={recipe} className="h-20 w-full rounded-none" />
                    <p className="truncate px-2.5 py-2 text-xs font-medium">{recipe.name}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {recent.length > 0 ? (
            <section>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t(locale, "recent")}</p>
              <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {recent.map((id) => {
                  const recipe = recipeById(id);
                  if (!recipe) return null;
                  return (
                    <li key={id} className="w-36 shrink-0">
                      <button
                        type="button"
                        onClick={() => openRecipe(recipe)}
                        className="w-full overflow-hidden rounded-3xl bg-card text-left shadow-[var(--shadow-border)]"
                      >
                        <MealPhoto recipe={recipe} className="h-20 w-full rounded-none" />
                        <p className="truncate px-2.5 py-2 text-xs font-medium">{recipe.name}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {COLLECTION_GROUPS.map((group) => (
            <section key={group.id}>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t(locale, group.labelKey)}</p>
              <ul className="mt-2 grid grid-cols-2 gap-3">
                {group.ids.map((id) => {
                  const c = collectionById(id);
                  if (!c) return null;
                  const cover = RECIPES.find((r) => c.match(r));
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setShelf(c.id);
                          setRail(null);
                        }}
                        className="w-full overflow-hidden rounded-3xl bg-card text-left shadow-[var(--shadow-border)]"
                      >
                        {cover ? <MealPhoto recipe={cover} className="h-28 w-full rounded-none" /> : (
                          <div className="h-28 bg-background" />
                        )}
                        <div className="px-3 py-2.5">
                          <p className="truncate font-medium">{c.label}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {counts[c.id] ?? 0} · {c.hint}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearBrowse}
              className="flex h-11 items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
              {t(locale, "backShelves")}
            </button>
            <p className="truncate text-sm font-medium">
              {shelf === "all" ? t(locale, "allDishes") : shelf ? collectionById(shelf)?.label : rail ? rail : query.trim() ? query.trim() : t(locale, "allDishes")}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "dish" : "dishes"}
            </p>
            <div className="flex gap-1">
              {([
                ["name", t(locale, "sortName")],
                ["time", t(locale, "sortTime")],
                ["protein", t(locale, "sortProtein")],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSort(id)}
                  className={
                    sort === id
                      ? "h-9 rounded-full bg-primary px-3 text-xs text-primary-foreground"
                      : "h-9 rounded-full bg-card px-3 text-xs shadow-[var(--shadow-border)]"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {list.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">{t(locale, "noDishes")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {list.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard
                    recipe={recipe}
                    locked={!available.some((a) => a.id === recipe.id)}
                    nutritionOn={nutritionOn}
                    onOpen={() => {
                      if (!available.some((a) => a.id === recipe.id)) {
                        onOpenStore();
                        return;
                      }
                      openRecipe(recipe);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Sheet open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent title={active?.name ?? "Recipe"}>
          {active ? (
            <RecipeDetail
              key={active.id}
              recipe={active}
              nutritionOn={nutritionOn}
              nextGen={nextGen}
              onOpen={openRecipe}
              onCook={() => {
                const meal: PlannedMeal = {
                  id: `cook-${active.id}`,
                  date: mondayOf(),
                  slot: "dinner",
                  recipeId: active.id,
                };
                setCooking(meal);
                setActive(null);
              }}
              onPlan={() => {
                useSpoonful.getState().assignMeal(mondayOf(), "dinner", active.id);
                setActive(null);
                useSpoonful.getState().setTab("plan");
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
      {cooking ? <CookView meal={cooking} onClose={() => setCooking(null)} /> : null}
    </div>
  );
}

function similarTo(recipe: Recipe): Recipe[] {
  const tags = new Set((recipe.tags ?? []).map((x) => x.toLowerCase()));
  return RECIPES.filter((r) => r.id !== recipe.id)
    .map((r) => {
      let score = 0;
      if (r.cuisine && r.cuisine === recipe.cuisine) score += 5;
      if (r.protein === recipe.protein) score += 2;
      if (r.plate === recipe.plate) score += 1;
      for (const tag of r.tags ?? []) if (tags.has(tag.toLowerCase())) score += 1;
      return { r, score };
    })
    .filter((x) => x.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.r);
}

function RecipeDetail({
  recipe,
  nutritionOn,
  nextGen,
  onCook,
  onPlan,
  onOpen,
}: {
  recipe: Recipe;
  nutritionOn: boolean;
  nextGen: boolean;
  onCook: () => void;
  onPlan: () => void;
  onOpen: (recipe: Recipe) => void;
}) {
  const household = useSpoonful((s) => s.household);
  const hideRecipe = useSpoonful((s) => s.hideRecipe);
  const locale = useSpoonful((s) => s.locale);
  const favorites = useSpoonful((s) => s.favorites);
  const toggleFavorite = useSpoonful((s) => s.toggleFavorite);
  const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
  const loved = favorites.includes(recipe.id);
  const [serves, setServes] = useState(household);
  const flags = recipeAllergens(recipe);
  const diets = dietFlags(recipe);
  const related = similarTo(recipe);
  const scaled = recipe.ingredients.map((ing) => ({
    ...ing,
    shown: formatQty(scaleQty(ing.qty, serves, recipe.servings), ing.unit),
  }));
  const shownSteps = scaleMethodSteps(recipe.steps, recipe.ingredients, serves, recipe.servings);

  return (
    <div>
      <MealPhoto recipe={recipe} className="h-44 rounded-2xl" />
      <div className="mt-4">
        <span className={cn("mb-2 inline-block h-1.5 w-10 rounded-full", cuisineBar(recipe.cuisine))} />
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-3xl leading-tight">{recipe.name}</h2>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]"
            aria-label={loved ? "Unsave" : "Save"}
            onClick={() => toggleFavorite(recipe.id)}
          >
            <Heart className={cn("size-4", loved && "fill-spark text-spark")} />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatMinutes(recipe.minutes)}
          {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{packLabel(recipe.pack)}</Badge>
          {diets.map((f) => (
            <Badge key={f} variant="outline">
              {f === "gluten-free" ? "GF" : f === "sugar-free" ? "SF" : f === "dairy-free" ? "DF" : f}
            </Badge>
          ))}
          {flags.map((f) => (
            <Badge key={f} variant="outline">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      <p className="mt-4 text-base leading-relaxed text-foreground/80">{recipe.description}</p>
      {recipe.source ? (
        <p className="mt-3 rounded-2xl bg-background px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {recipe.source.book}
          {recipe.source.year ? ` (${recipe.source.year})` : ""}
          {recipe.source.author ? ` · ${recipe.source.author}` : ""}. {recipe.source.credit}
        </p>
      ) : null}
      {nutritionOn || nextGen ? (
        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ["kcal", recipe.nutrition.cal],
            ["protein", `${recipe.nutrition.protein}g`],
            ["carbs", `${recipe.nutrition.carbs}g`],
            ["fat", `${recipe.nutrition.fat}g`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-background px-2 py-3">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="mt-1 font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-medium">{t(locale, "servings")}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]"
            aria-label="Fewer servings"
            onClick={() => setServes((n) => Math.max(1, n - 1))}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center tabular-nums font-medium">{serves}</span>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]"
            aria-label="More servings"
            onClick={() => setServes((n) => Math.min(12, n + 1))}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {scaled.map((ing, i) => (
          <li key={`${ing.name}-${i}`} className="flex justify-between gap-3">
            <span className="min-w-0">{ing.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{ing.shown}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            for (const ing of recipe.ingredients) addExtraGrocery(ing.name, ing.aisle);
            toast("On the grocery list");
          }}
        >
          <ShoppingBag className="size-4" />
          {t(locale, "addIngredients")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            const lines = scaled.map((ing) => `${ing.shown} ${ing.name}`.trim()).join("\n");
            try {
              await navigator.clipboard.writeText(`${recipe.name}\n${lines}`);
              toast("Copied");
            } catch {
              toast("Couldn’t copy");
            }
          }}
        >
          <Copy className="size-4" />
          {t(locale, "copyIngredients")}
        </Button>
      </div>
      <h3 className="mt-6 text-sm font-medium">Method</h3>
      <p className="mt-1 text-sm text-muted-foreground">Each step names the food, the pan, and how long.</p>
      <ol className="mt-2 space-y-3 text-base leading-relaxed text-foreground/80">
        {shownSteps.map((step, i) => (

          <li key={`step-${i}`} className="flex gap-3">
            <span className="w-5 shrink-0 font-medium tabular-nums text-foreground">{i + 1}</span>
            <span className="min-w-0">{step}</span>
          </li>
        ))}
      </ol>
      {related.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-medium">{t(locale, "similar")}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {related.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onOpen(r)}
                  className="w-full overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-border)]"
                >
                  <MealPhoto recipe={r} className="h-16 w-full rounded-none" />
                  <p className="truncate px-2 py-1.5 text-xs font-medium">{r.name}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="spark" className="w-full" onClick={onCook}>
          Cook this
        </Button>
        <Button variant="secondary" className="w-full" onClick={onPlan}>
          Put on Monday dinner
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            hideRecipe(recipe.id);
            toast("Won’t suggest this again");
          }}
        >
          Never again
        </Button>
      </div>
    </div>
  );
}
