import { Check, ChevronLeft, ChevronRight, Heart, ShoppingBasket, Sparkles, UtensilsCrossed, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MealPhoto } from "@/components/meal-photo";
import { MacroBar } from "@/components/macro-bar";
import { Plate } from "@/components/plate";
import { RecipePicker } from "@/components/recipe-picker";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { isUnlocked } from "@/lib/access";
import { cuisineBar } from "@/lib/cuisine";
import { dayFuel, isoDate } from "@/lib/fuel";
import { formatMinutes } from "@/lib/format";
import { t } from "@/lib/i18n";
import { mealsFromPantry } from "@/lib/pantry-match";
import { portionSyncFor } from "@/lib/portion-sync";
import { expectedWorkoutsForDate, resolveStatus } from "@/lib/program";
import { recipeById } from "@/lib/recipes";
import { rankForXp } from "@/lib/ranks";
import { proteinDot, skipTitle } from "@/lib/shield";
import {
  nutritionForDate,
  nutritionForDateExcluding,
  plannedForWeek,
  recipeAllowed,
  resolveMeal,
  unlockedRecipes,
  useSpoonful,
  weekPlanText,
  weekPulse,
} from "@/lib/spoonful-store";
import type { MealSlotKind, PlannedMeal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dayLabel, shiftWeek, weekDates, weekHeading } from "@/lib/week";
import { AiChefSheet } from "./ai-chef-sheet";
import { CookView } from "./cook-view";

export function PlanView({ onOpenStore }: { onOpenStore: () => void }) {
  const weekStart = useSpoonful((s) => s.weekStart);
  const setWeekStart = useSpoonful((s) => s.setWeekStart);
  const meals = useSpoonful((s) => s.meals);
  const fillWeek = useSpoonful((s) => s.fillWeek);
  const fillFromFuel = useSpoonful((s) => s.fillFromFuel);
  const undoFill = useSpoonful((s) => s.undoFill);
  const undoMeals = useSpoonful((s) => s.undoMeals);
  const surpriseDinner = useSpoonful((s) => s.surpriseDinner);
  const skipNight = useSpoonful((s) => s.skipNight);
  const unlocked = useSpoonful((s) => s.unlocked);
  const pantry = useSpoonful((s) => s.pantry);
  const setTab = useSpoonful((s) => s.setTab);
  const nextGen = useSpoonful((s) => s.nextGen);
  const portionSync = useSpoonful((s) => s.portionSync);
  const portionMultByDate = useSpoonful((s) => s.portionMultByDate);
  const goal = useSpoonful((s) => s.goal);
  const workouts = useSpoonful((s) => s.workouts);
  const stepsByDate = useSpoonful((s) => s.stepsByDate);
  const snacks = useSpoonful((s) => s.snacks);
  const cookedDates = useSpoonful((s) => s.cookedDates);
  const household = useSpoonful((s) => s.household);
  const prefs = useSpoonful((s) => s.prefs);
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const xp = useSpoonful((s) => s.xp);
  const chefRemaining = useSpoonful((s) => s.chefRemaining);
  const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
  const body = useSpoonful((s) => s.body);
  const locale = useSpoonful((s) => s.locale);
  const programWeek = useSpoonful((s) => s.programWeek);
  const ensureProgram = useSpoonful((s) => s.ensureProgram);
  const [picker, setPicker] = useState<{ date: string; slot: MealSlotKind } | null>(null);
  const [active, setActive] = useState<PlannedMeal | null>(null);
  const [chefOpen, setChefOpen] = useState(false);
  const [cooking, setCooking] = useState<PlannedMeal | null>(null);
  const [weekOpen, setWeekOpen] = useState(false);
  const rebuildShopFromTonight = useSpoonful((s) => s.rebuildShopFromTonight);

  useEffect(() => {
    if (nextGen) ensureProgram();
  }, [nextGen, weekStart, ensureProgram, body.goalKind]);

  const weekMeals = useMemo(() => plannedForWeek(meals, weekStart), [meals, weekStart]);
  const dates = weekDates(weekStart);
  const pulse = weekPulse(meals, weekStart, cookedDates, household);
  const nutritionOn = isUnlocked(unlocked, "nutrition") || nextGen;
  const chefOn = isUnlocked(unlocked, "ai-chef");
  const rank = rankForXp(xp);
  const today = isoDate();
  const todayDate = dates.find((d) => dayLabel(d).today);
  const tonight = todayDate
    ? weekMeals.find((m) => m.date === todayDate && m.slot === "dinner")
    : undefined;
  const pantryIdea =
    pantry.length >= 2
      ? mealsFromPantry(
          pantry.map((p) => p.name),
          unlockedRecipes(unlocked).filter((r) => recipeAllowed(r, prefs, allergies, hidden)),
          1,
        )[0]
      : undefined;
  const todayWorkouts = expectedWorkoutsForDate({
    date: today,
    today,
    sessions: programWeek?.sessions ?? [],
    logged: workouts.filter((w) => w.date === today),
    bodyKg: body.weightKg,
  });
  const fuel =
    nextGen || portionSync
      ? dayFuel({
          goal,
          eaten: nutritionForDate(meals, today, snacks, portionMultByDate),
          workouts: todayWorkouts,
          steps: stepsByDate[today] ?? 0,
          body,
        })
      : null;
  // Same-day fuel, but with tonight's own dinner left out — the room dinner
  // alone is meant to fill, so scaling it against that (rather than against
  // what's left after eating it) is the correct basis for the multiplier.
  const tonightSync =
    portionSync && todayDate && tonight && !tonight.skip && resolveMeal(tonight).recipe
      ? portionSyncFor(
          resolveMeal(tonight).recipe!,
          dayFuel({
            goal,
            eaten: nutritionForDateExcluding(meals, today, snacks, tonight.id),
            workouts: todayWorkouts,
            steps: stepsByDate[today] ?? 0,
            body,
          }).remaining.cal,
        )
      : null;

  function pickForMe(date: string) {
    const recipe = surpriseDinner(date);
    toast(recipe ? `Plated ${recipe.name}` : "Unlock more recipes or loosen Skip these");
  }

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">This week</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">{weekHeading(weekStart)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {nextGen
              ? "Dinner tonight. If you finish, skip, or miss a workout, this dinner updates to match."
              : "Dinner tonight. Tap Rest of the week when you want more days."}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Previous week"
            onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Next week"
            onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </header>

      {weekOpen ? (
      <div className="mt-5 flex min-w-0 items-center gap-1.5 overflow-hidden" aria-label="Protein rainbow">
        {dates.map((date) => {
          const dinner = weekMeals.find((m) => m.date === date && m.slot === "dinner");
          const protein = dinner && !dinner.skip ? resolveMeal(dinner).recipe?.protein : undefined;
          const cooked = cookedDates.includes(date);
          return (
            <span
              key={date}
              className={cn(
                "h-2 min-w-0 flex-1 rounded-full",
                dinner?.skip ? "bg-muted" : proteinDot(protein),
                cooked && "ring-1 ring-inset ring-primary",
              )}
              title={dinner ? resolveMeal(dinner).title : "Open"}
            />
          );
        })}
      </div>
      ) : null}

      {todayDate ? (
        <section className="mt-5 overflow-hidden rounded-3xl bg-spark text-spark-foreground shadow-[var(--shadow-lift)]" data-tour="tonight">
          <button
            type="button"
            onClick={() =>
              tonight
                ? tonight.skip
                  ? setPicker({ date: todayDate, slot: "dinner" })
                  : setActive(tonight)
                : setPicker({ date: todayDate, slot: "dinner" })
            }
            className="w-full text-left"
          >
            {tonight && !tonight.skip && resolveMeal(tonight).recipe ? (
              <MealPhoto recipe={resolveMeal(tonight).recipe!} className="h-44 w-full overflow-hidden" />
            ) : null}
            <div className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-80">Tonight</p>
            {tonight && !tonight.skip ? (
              <div>
                <h2 className="mt-2 break-words font-display text-3xl leading-tight">{resolveMeal(tonight).title}</h2>
                <p className="mt-1 text-sm opacity-90">
                  {formatMinutes(resolveMeal(tonight).minutes)}
                  {nextGen && resolveMeal(tonight).recipe
                    ? ` · ${tonightSync?.nutrition.protein ?? resolveMeal(tonight).recipe?.nutrition.protein}g protein`
                    : ""}
                </p>
                {nextGen && programWeek?.sessions.find((s) => s.date === todayDate) ? (
                  <p className="mt-2 text-xs opacity-80">
                    {(() => {
                      const ses = programWeek.sessions.find((s) => s.date === todayDate)!;
                      const st = resolveStatus(ses, today);
                      if (ses.kind === "rest") return "Rest day · dinner stays the same";
                      if (st === "done") return `${ses.name} done · dinner matches the workout`;
                      if (st === "skipped") return `${ses.name} skipped · lighter dinner`;
                      if (st === "missed") return `${ses.name} missed`;
                      return `${ses.name} still to do · ${ses.minutes} min`;
                    })()}
                  </p>
                ) : null}
                {tonightSync ? (
                  <p className="mt-2 text-xs opacity-80" data-testid="portion-sync-note">
                    Portion Sync: {tonightSync.note}
                  </p>
                ) : null}
              </div>
            ) : tonight?.skip ? (
              <div className="mt-2">
                <h2 className="font-display text-3xl leading-tight">{skipTitle(tonight.skip)}</h2>
                <p className="mt-1 text-sm opacity-90">Tap to put a plate back on.</p>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-spark-foreground/15">
                  <UtensilsCrossed className="size-7" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-tight">Nothing plated yet</h2>
                  <p className="mt-1 text-sm opacity-90">One tap and we pick dinner.</p>
                </div>
              </div>
            )}
            </div>
          </button>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4" data-tour="cook">
            {tonight && !tonight.skip ? (
              <>
                <Button
                  className="w-full bg-spark-foreground text-spark hover:opacity-95"
                  onClick={() => setCooking(tonight)}
                >
                  Cook now
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-spark-foreground hover:bg-spark-foreground/10"
                  onClick={() => setPicker({ date: todayDate, slot: "dinner" })}
                >
                  Swap
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="w-full bg-spark-foreground text-spark hover:opacity-95"
                  onClick={() => pickForMe(todayDate)}
                >
                  {nextGen ? "Surprise me" : "Pick for me"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-spark-foreground hover:bg-spark-foreground/10"
                  onClick={() => skipNight(todayDate, "takeout")}
                >
                  Eating out
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              className="w-full text-spark-foreground hover:bg-spark-foreground/10"
              onClick={() => setPicker({ date: todayDate, slot: "dinner" })}
            >
              <Heart className="size-4" />
              Add from favorites
            </Button>
            <Button
              variant="ghost"
              className="w-full text-spark-foreground hover:bg-spark-foreground/10"
              onClick={() => {
                rebuildShopFromTonight();
                setTab("shop");
              }}
            >
              <ShoppingBasket className="size-4" />
              Shop tonight
            </Button>
          </div>
        </section>
      ) : null}

      {todayDate ? (
        <button
          type="button"
          onClick={() => {
            const todayBreakfast = weekMeals.find((m) => m.date === todayDate && m.slot === "breakfast");
            if (todayBreakfast) setActive(todayBreakfast);
            else setPicker({ date: todayDate, slot: "breakfast" });
          }}
          className="mt-3 flex min-w-0 items-center gap-3 rounded-3xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
        >
          {(() => {
            const todayBreakfast = weekMeals.find((m) => m.date === todayDate && m.slot === "breakfast");
            const rec = todayBreakfast ? resolveMeal(todayBreakfast).recipe : undefined;
            return (
              <>
                {rec ? (
                  <MealPhoto recipe={rec} className="size-16 shrink-0 rounded-2xl" />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-background text-sm text-muted-foreground">
                    AM
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">{t(locale, "breakfast")}</p>
                  <p className="mt-1 truncate font-medium">
                    {todayBreakfast ? resolveMeal(todayBreakfast).title : t(locale, "addBreakfast")}
                  </p>
                </div>
              </>
            );
          })()}
        </button>
      ) : null}

      {fuel ? (
        <button
          type="button"
          onClick={() => setTab("fit")}
          className="mt-3 w-full rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Fuel left today</p>
          <div className="mt-3 space-y-2">
            <MacroBar label="Protein" value={fuel.eaten.protein} of={fuel.target.protein} />
            <MacroBar label="Calories" value={fuel.eaten.cal} of={fuel.target.cal} unit="" />
          </div>
        </button>
      ) : null}

      {weekOpen ? (
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="rounded-full bg-spark px-3 py-1.5 text-spark-foreground">
          {rank.title}
        </span>
        <span className="rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums">
          {pulse.dinners}/7 dinners
        </span>
        <span className="rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums">
          {pulse.proteins} proteins
        </span>
        {pulse.cooked > 0 ? (
          <span className="rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums">
            {pulse.cooked} cooked
          </span>
        ) : null}
        {pulse.takeout > 0 ? (
          <span className="rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)]">
            {pulse.takeout} out
          </span>
        ) : null}
        <span className="rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums">
          ~${pulse.cost}
        </span>
      </div>
      ) : null}

      {pantryIdea && !tonight ? (
        <button
          type="button"
          onClick={() => setTab("snap")}
          className="mt-4 w-full rounded-3xl bg-accent px-4 py-3 text-left text-accent-foreground"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em]">From the pantry</p>
          <p className="mt-1 font-display text-xl leading-tight">{pantryIdea.title}</p>
        </button>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            const n = nextGen ? fillFromFuel() || fillWeek(false) : fillWeek(false);
            toast(n ? `Plated ${n} open night${n === 1 ? "" : "s"}` : "This week is already full");
          }}
        >
          <WandSparkles />
          {nextGen ? "Fill from workouts" : "Fill empty nights"}
        </Button>
        <Button
          variant="spark"
          className="flex-1"
          onClick={() => {
            if (chefRemaining() <= 0) {
              onOpenStore();
              toast(
                hasPlus
                  ? "Chef is spent this week"
                  : "Free kitchens get 3 chef plates a week. Kitchen+ raises the cap.",
              );
              return;
            }
            if (!chefOn) {
              onOpenStore();
              toast("AI Chef is an add-on");
              return;
            }
            setChefOpen(true);
          }}
        >
          <Sparkles />
          AI Chef
        </Button>
      </div>
      {undoMeals ? (
        <button
          type="button"
          className="mt-2 text-sm text-muted-foreground"
          onClick={() => {
            const ok = undoFill();
            toast(ok ? "Fill undone" : "Nothing to undo");
          }}
        >
          Undo last fill
        </button>
      ) : (
        <button
          type="button"
          className="mt-2 text-sm text-muted-foreground"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(weekPlanText(meals, weekStart));
              toast("Week copied");
            } catch {
              toast("Could not copy");
            }
          }}
        >
          Copy this week
        </button>
      )}

      <button
        type="button"
        onClick={() => setWeekOpen((v) => !v)}
        className="mt-6 w-full rounded-full bg-card px-4 py-3 text-sm font-medium shadow-[var(--shadow-border)]"
      >
        {weekOpen ? "Hide the rest of the week" : "Rest of the week"}
      </button>

      {weekOpen ? (
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {dates.map((date) => {
          const meta = dayLabel(date);
          const dinner = weekMeals.find((m) => m.date === date && m.slot === "dinner");
          const lunch = weekMeals.find((m) => m.date === date && m.slot === "lunch");
          const breakfast = weekMeals.find((m) => m.date === date && m.slot === "breakfast");
          const session = nextGen ? programWeek?.sessions.find((s) => s.date === date) : undefined;
          const sessionStatus = session ? resolveStatus(session, today) : undefined;
          if (meta.today) return null;
          return (
            <li key={date} className="rounded-3xl bg-card p-2 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between px-3 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-medium">{meta.weekday}</span>
                  <span className="text-xs text-muted-foreground">{meta.monthDay}</span>
                </div>
                {cookedDates.includes(date) ? (
                  <Check className="size-4 text-primary" aria-label="Cooked" />
                ) : (
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      dinner?.skip ? "bg-muted" : proteinDot(resolveMeal(dinner ?? { id: "", date, slot: "dinner" }).recipe?.protein),
                    )}
                  />
                )}
              </div>
              {session && session.kind !== "rest" ? (
                <button
                  type="button"
                  onClick={() => setTab("fit")}
                  className="mx-3 mt-2 rounded-full bg-background px-3 py-1.5 text-left text-xs text-muted-foreground"
                >
                  {session.name}
                  {sessionStatus === "done"
                    ? " · done"
                    : sessionStatus === "skipped"
                      ? " · skipped"
                      : sessionStatus === "missed"
                        ? " · missed"
                        : ` · ${session.minutes} min`}
                </button>
              ) : null}
              <DaySlot
                label="Dinner"
                meal={dinner}
                onAdd={() => setPicker({ date, slot: "dinner" })}
                onOpen={() => {
                  if (dinner?.skip) {
                    setPicker({ date, slot: "dinner" });
                    return;
                  }
                  if (dinner) setActive(dinner);
                }}
              />
              {breakfast ? (
                <DaySlot
                  label={t(locale, "breakfast")}
                  meal={breakfast}
                  onAdd={() => setPicker({ date, slot: "breakfast" })}
                  onOpen={() => setActive(breakfast)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPicker({ date, slot: "breakfast" })}
                  className="mt-1 min-h-11 w-full rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground"
                >
                  {t(locale, "addBreakfast")}
                </button>
              )}
              {lunch ? (
                <DaySlot
                  label="Lunch"
                  meal={lunch}
                  onAdd={() => setPicker({ date, slot: "lunch" })}
                  onOpen={() => setActive(lunch)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPicker({ date, slot: "lunch" })}
                  className="mt-1 min-h-11 w-full rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground"
                >
                  {t(locale, "addLunch")}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      ) : null}

      <RecipePicker
        open={picker !== null}
        onOpenChange={(o) => !o && setPicker(null)}
        onPick={(id) => {
          if (!picker) return;
          useSpoonful.getState().assignMeal(picker.date, picker.slot, id);
          setPicker(null);
        }}
        onCustom={(custom) => {
          if (!picker) return;
          useSpoonful.getState().assignCustom(picker.date, picker.slot, custom);
          setPicker(null);
        }}
        onSurprise={
          picker?.slot === "dinner"
            ? () => {
                if (!picker) return;
                pickForMe(picker.date);
                setPicker(null);
              }
            : undefined
        }
        onSkip={
          picker?.slot === "dinner"
            ? (kind) => {
                if (!picker) return;
                skipNight(picker.date, kind);
                setPicker(null);
              }
            : undefined
        }
        onLocked={() => {
          setPicker(null);
          onOpenStore();
        }}
      />

      <MealActions
        meal={active}
        onClose={() => setActive(null)}
        onCook={() => {
          if (active) setCooking(active);
          setActive(null);
        }}
        onSwap={() => {
          if (!active) return;
          setPicker({ date: active.date, slot: active.slot });
          setActive(null);
        }}
        nutritionOn={nutritionOn}
        nextGen={nextGen}
      />

      <AiChefSheet open={chefOpen} onOpenChange={setChefOpen} />
      {cooking ? <CookView meal={cooking} onClose={() => setCooking(null)} /> : null}
    </div>
  );
}

function DaySlot({
  label,
  meal,
  onAdd,
  onOpen,
}: {
  label: string;
  meal?: PlannedMeal;
  onAdd: () => void;
  onOpen: () => void;
}) {
  if (!meal) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex min-h-16 w-full items-center rounded-2xl bg-background px-4 text-left text-base text-muted-foreground"
      >
        Add {label.toLowerCase()}
      </button>
    );
  }
  const resolved = resolveMeal(meal);
  if (meal.skip) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 flex min-h-16 w-full items-center rounded-2xl bg-background px-4 text-left"
      >
        <div>
          <p className="text-sm font-medium">{resolved.title}</p>
          <p className="text-xs text-muted-foreground">{label} · no grocery</p>
        </div>
      </button>
    );
  }
  const plate = resolved.recipe?.plate ?? "bowl";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative mt-2 flex min-h-16 w-full items-center gap-3 overflow-hidden rounded-2xl bg-background px-2 py-2 text-left"
    >
      <span className={cn("absolute inset-y-2 left-1.5 w-1 rounded-full", cuisineBar(resolved.recipe?.cuisine))} />
      {resolved.recipe ? (
        <MealPhoto recipe={resolved.recipe} className="size-14 shrink-0 rounded-xl" />
      ) : (
        <Plate kind={plate} size="sm" className="ml-1.5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{resolved.title}</p>
        <p className="text-xs text-muted-foreground">
          {label} · {formatMinutes(resolved.minutes)}
        </p>
      </div>
    </button>
  );
}

function MealActions({
  meal,
  onClose,
  onCook,
  onSwap,
  nutritionOn,
  nextGen,
}: {
  meal: PlannedMeal | null;
  onClose: () => void;
  onCook: () => void;
  onSwap: () => void;
  nutritionOn: boolean;
  nextGen: boolean;
}) {
  const removeMeal = useSpoonful((s) => s.removeMeal);
  const toggleFavorite = useSpoonful((s) => s.toggleFavorite);
  const hideRecipe = useSpoonful((s) => s.hideRecipe);
  const skipNight = useSpoonful((s) => s.skipNight);
  const markCooked = useSpoonful((s) => s.markCooked);
  const surpriseDinner = useSpoonful((s) => s.surpriseDinner);
  const favorites = useSpoonful((s) => s.favorites);
  const resolved = meal ? resolveMeal(meal) : null;
  const recipe = meal?.recipeId ? recipeById(meal.recipeId) : resolved?.recipe;
  const loved = recipe ? favorites.includes(recipe.id) : false;

  return (
    <Sheet open={meal !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={resolved?.title ?? "Meal"}>
        {resolved ? (
          <div>
            {recipe ? <MealPhoto recipe={recipe} className="h-44 rounded-2xl" /> : null}
            <div className="mt-4 min-w-0">
              <h2 className="font-display text-3xl leading-tight">{resolved.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatMinutes(resolved.minutes)}
                {recipe ? ` · ${recipe.servings} servings` : null}
              </p>
              {(nutritionOn || nextGen) && recipe ? (
                <p className="mt-2 text-sm tabular-nums">
                  {recipe.nutrition.protein}g protein
                  {nutritionOn
                    ? ` · ${recipe.nutrition.cal} kcal · ${recipe.nutrition.carbs}g carbs`
                    : ""}
                </p>
              ) : null}
            </div>
            {recipe ? (
              <p className="mt-4 text-base leading-relaxed text-foreground/80">{recipe.description}</p>
            ) : resolved.custom?.notes ? (
              <p className="mt-4 text-base leading-relaxed text-foreground/80">{resolved.custom.notes}</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="spark" className="w-full" onClick={onCook}>
                Cook this
              </Button>
              <Button variant="secondary" className="w-full" onClick={onSwap}>
                Swap recipe
              </Button>
              {meal ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    const pick = surpriseDinner(meal.date);
                    toast(pick ? `Swapped to ${pick.name}` : "No other match");
                    onClose();
                  }}
                >
                  Something else like this
                </Button>
              ) : null}
              {recipe ? (
                <Button variant="ghost" className="w-full" onClick={() => toggleFavorite(recipe.id)}>
                  {loved ? "Saved to favorites" : "Save to favorites"}
                </Button>
              ) : null}
              {meal ? (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    markCooked(meal.date);
                    toast("Marked as cooked");
                    onClose();
                  }}
                >
                  I already ate this
                </Button>
              ) : null}
              {meal?.slot === "dinner" ? (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    skipNight(meal.date, "takeout");
                    onClose();
                  }}
                >
                  Eating out instead
                </Button>
              ) : null}
              {recipe ? (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    hideRecipe(recipe.id);
                    toast("Won’t suggest this again");
                    onClose();
                  }}
                >
                  Never again
                </Button>
              ) : null}
              <Button
                variant="ghost"
                className="w-full text-destructive"
                onClick={() => {
                  if (meal) removeMeal(meal.id);
                  onClose();
                }}
              >
                Remove from week
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
