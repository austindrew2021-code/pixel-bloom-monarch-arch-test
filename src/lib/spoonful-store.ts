import { addDays, parseISO } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BODY, lbFromKg, macrosFromBody, normalizeBody, type BodyProfile, type FamilySeat, type GoalKind } from "./body";
import { isDinnerMain, isGlutenFree, isSugarFree, isVegan } from "./diet";
import { fitsGoal, strictestGoal } from "./goal-fit";
import { isUnlocked } from "./access";
import type { CountryId, LocaleId } from "./i18n";
import { DEFAULT_GOAL, addNutrition, applyHealthToFuel, dayFuel, emptyNutrition, isoDate, rankForFuel, workoutKcal } from "./fuel";
import { liveStepBump, pullFromSource, pullHealthDay, recoveryLabel, catchUpSteps, type HealthDay } from "./fitness-sync";
import { hasNativeHealth, requestNativeHealth } from "./native-health";
import { scaleQty } from "./cuisine";
import { ADDONS, RECIPES, recipeById } from "./recipes";
import {
  CHEF_FREE_WEEK,
  CHEF_PACK_15,
  CHEF_PACK_40,
  CHEF_PLUS_WEEK,
  LOOKUP_FREE_WEEK,
  SNAP_FREE_WEEK,
  milestonesFor,
  rankForXp,
  type Celebrate,
} from "./ranks";
import { DEFAULT_NOTIFY, type NotifyPrefs } from "./notify";
import type { FitnessSourceId, SyncAccess } from "./devices";
import { DEFAULT_NAV_PINS, normalizePins, type NavPinId } from "./nav";
import { mealSavings, plateCost, recipeSafe } from "./shield";
import { postKitchenEvent } from "./family";
import { shareAchievement, syncMyStats } from "./community";
import type { LiftSession } from "./lift";
import { liftKcal, moveById, sessionPRs, sessionRomM, sessionVolumeKg } from "./lift";
import {
  expectedWorkoutsForDate,
  isProgramWeek,
  matchLoggedToSession,
  patchSession,
  rebuildProgram,
  sessionAfterCardio,
  sessionAfterLift,
  sessionSkipped,
  swapMove,
  type ProgramWeek,
  type SessionStatus,
} from "./program";
import type {
  AddonId,
  Aisle,
  AllergyId,
  CustomMeal,
  ExtraGroceryItem,
  MacroGoal,
  MealSlotKind,
  PantryItem,
  PlannedMeal,
  PrefId,
  Protein,
  Recipe,
  Snack,
  Workout,
  WorkoutKind,
} from "./types";
import { mondayOf, shiftWeek, weekDates } from "./week";

function rollAiWeek(
  get: () => SpoonfulState,
  set: (partial: Partial<SpoonfulState>) => void,
) {
  const week = mondayOf();
  const s = get();
  if (s.chefWeek !== week) {
    set({ chefWeek: week, chefCount: 0, snapCount: 0, lookupCount: 0 });
  }
}

export type TabId = "plan" | "recipes" | "snap" | "people" | "shop" | "fit" | "sauces" | "desserts";

export type GroceryLine = {
  key: string;
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
  fromPantry: boolean;
};

type SpoonfulState = {
  onboarded: boolean;
  household: number;
  prefs: PrefId[];
  allergies: AllergyId[];
  hidden: string[];
  weekStart: string;
  meals: PlannedMeal[];
  undoMeals: PlannedMeal[] | null;
  pantry: PantryItem[];
  extraGrocery: ExtraGroceryItem[];
  checked: Record<string, boolean>;
  unlocked: AddonId[];
  theme: "paper" | "midnight";
  tab: TabId;
  walkthroughDone: boolean;
  nextGen: boolean;
  goal: MacroGoal;
  stepsByDate: Record<string, number>;
  workouts: Workout[];
  favorites: string[];
  cookedDates: string[];
  snacks: Snack[];
  xp: number;
  seenMilestones: string[];
  lastCelebrate: Celebrate | null;
  snapped: boolean;
  chefWeek: string;
  chefCount: number;
  snapCount: number;
  lookupCount: number;
  notifyPrefs: NotifyPrefs;
  dinnerHour: number;
  fitnessSource: FitnessSourceId | null;
  lastSyncAt: string | null;
  syncAccess: SyncAccess | null;
  body: BodyProfile;
  liftSessions: LiftSession[];
  weightLog: { date: string; kg: number }[];
  locale: LocaleId;
  country: CountryId;
  navPins: NavPinId[];
  healthByDate: Record<string, HealthDay>;
  autoPlate: boolean;
  seats: FamilySeat[];
  chefBonus: number;
  chefBonusWeek: string;
  programWeek: ProgramWeek | null;
  favMoves: string[];
  completeOnboarding: (input: {
    household: number;
    prefs: PrefId[];
    allergies?: AllergyId[];
    sample: boolean;
    nextGen?: boolean;
    goal?: MacroGoal;
    body?: BodyProfile;
    locale?: LocaleId;
    country?: CountryId;
  }) => void;
  setTab: (tab: TabId) => void;
  setWeekStart: (weekStart: string) => void;
  setHousehold: (n: number) => void;
  togglePref: (pref: PrefId) => void;
  toggleAllergy: (id: AllergyId) => void;
  setTheme: (theme: "paper" | "midnight") => void;
  setNextGen: (nextGen: boolean) => void;
  setGoal: (goal: MacroGoal) => void;
  assignMeal: (date: string, slot: MealSlotKind, recipeId: string) => void;
  assignCustom: (date: string, slot: MealSlotKind, custom: CustomMeal) => void;
  skipNight: (date: string, kind: "takeout" | "rest") => void;
  removeMeal: (id: string) => void;
  fillWeek: (overwrite: boolean) => number;
  fillFromFuel: () => number;
  surpriseDinner: (date: string) => Recipe | null;
  hideRecipe: (recipeId: string) => void;
  unhideRecipe: (recipeId: string) => void;
  undoFill: () => boolean;
  addPantry: (name: string) => void;
  removePantry: (id: string) => void;
  addExtraGrocery: (name: string, aisle: Aisle) => void;
  removeExtraGrocery: (id: string) => void;
  toggleChecked: (key: string) => void;
  clearChecked: () => void;
  stashCheckedToPantry: () => number;
  unlock: (id: AddonId) => void;
  hasAddon: (id: AddonId) => boolean;
  finishWalkthrough: () => void;
  resetWalkthrough: () => void;
  setSteps: (date: string, steps: number) => void;
  addWorkout: (input: {
    date: string;
    kind: WorkoutKind;
    minutes: number;
    kcal?: number;
    volumeKg?: number;
    distanceKm?: number;
    source?: FitnessSourceId;
    silent?: boolean;
  }) => void;
  removeWorkout: (id: string) => void;
  setBody: (patch: Partial<BodyProfile>) => void;
  applyBodyGoal: () => void;
  saveLiftSession: (session: LiftSession) => void;
  importFitness: (input: {
    steps?: number;
    workouts?: Workout[];
    body?: Partial<BodyProfile>;
  }) => void;
  syncFitness: (opts?: { live?: boolean }) => string | undefined;
  applyNativeHealth: (day: HealthDay) => void;
  touchSync: () => void;
  toggleFavorite: (recipeId: string) => void;
  setNavPins: (pins: NavPinId[]) => void;
  togglePin: (id: NavPinId) => void;
  setAutoPlate: (on: boolean) => void;
  setSeats: (seats: FamilySeat[]) => void;
  addSeat: (name: string, goalKind: GoalKind) => void;
  updateSeat: (id: string, patch: Partial<FamilySeat>) => void;
  removeSeat: (id: string) => void;
  hydrateFromCloud: (payload: Record<string, unknown>) => void;
  kitchenPayload: () => Record<string, unknown>;
  ensureProgram: () => ProgramWeek;
  markSession: (id: string, status: SessionStatus) => string | undefined;
  restoreSession: (id: string) => string | undefined;
  swapSessionMove: (sessionId: string, fromId: string, toId: string) => void;
  toggleFavMove: (moveId: string) => void;
  replateFromFuel: (dates?: string[]) => { count: number; names: string[] };
  logWater: (ml: number) => void;
  markCooked: (date: string) => void;
  saveLeftovers: (fromDate: string) => boolean;
  addSnack: (input: { date: string; name: string; nutrition: Snack["nutrition"] }) => void;
  removeSnack: (id: string) => void;
  awardXp: (amount: number, reason?: string) => Celebrate | null;
  clearCelebrate: () => void;
  shareCelebration: () => Promise<boolean>;
  consumeChef: () => boolean;
  consumeSnap: () => boolean;
  consumeLookup: () => boolean;
  chefRemaining: () => number;
  setNotifyPrefs: (patch: Partial<NotifyPrefs>) => void;
  setDinnerHour: (hour: number) => void;
  setFitnessSource: (id: FitnessSourceId | null) => void;
  linkFitness: (id: FitnessSourceId, access: SyncAccess) => void;
  setSyncAccess: (access: SyncAccess | null) => void;
  setLocale: (locale: LocaleId) => void;
  setCountry: (country: CountryId) => void;
  markSnapped: () => void;
};

function chefCapOf(s: { unlocked: AddonId[]; chefBonus: number; chefBonusWeek: string; chefWeek: string }): number {
  const plus = isUnlocked(s.unlocked, "chef-plus");
  const week = s.chefWeek || mondayOf();
  const bonus = s.chefBonusWeek === week ? s.chefBonus : 0;
  return (plus ? CHEF_PLUS_WEEK : CHEF_FREE_WEEK) + bonus;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

export function unlockedRecipes(_unlocked: AddonId[] = []): Recipe[] {
  return RECIPES;
}

export function recipeMatchesPrefs(recipe: Recipe, prefs: PrefId[]): boolean {
  const veg = prefs.includes("vegetarian");
  const pesc = prefs.includes("pescatarian");
  const vegan = prefs.includes("vegan");
  if (vegan) {
    if (!isVegan(recipe)) return false;
  } else if (veg) {
    if (!["veg", "eggs"].includes(recipe.protein)) return false;
  } else if (pesc) {
    if (!["veg", "eggs", "fish", "seafood"].includes(recipe.protein)) return false;
  }
  if (prefs.includes("gluten-free") && !isGlutenFree(recipe)) return false;
  if (prefs.includes("sugar-free") && !isSugarFree(recipe)) return false;
  if (prefs.includes("quick") && recipe.minutes <= 30) {
    /* keep */
  } else if (prefs.includes("quick") && recipe.minutes > 30) return false;
  if (prefs.includes("budget") && recipe.minutes > 90) return false;
  if (prefs.includes("budget") && !recipe.tags.includes("budget") && recipe.pack !== "free") {
    return recipe.tags.includes("budget");
  }
  return true;
}

export function recipeAllowed(
  recipe: Recipe,
  prefs: PrefId[],
  allergies: AllergyId[] = [],
  hidden: string[] = [],
): boolean {
  if (hidden.includes(recipe.id)) return false;
  if (!recipeSafe(recipe, allergies)) return false;
  return recipeMatchesPrefs(recipe, prefs);
}

function mealKey(date: string, slot: MealSlotKind) {
  return `${date}:${slot}`;
}

function allowedPool(
  unlocked: AddonId[],
  prefs: PrefId[],
  allergies: AllergyId[],
  hidden: string[],
  goalKind?: GoalKind | string,
): Recipe[] {
  return unlockedRecipes(unlocked).filter(
    (r) => isDinnerMain(r) && recipeAllowed(r, prefs, allergies, hidden) && fitsGoal(r, goalKind ?? "maintain", "dinner"),
  );
}

function tableGoalOf(body: BodyProfile, seats: FamilySeat[]): GoalKind {
  return strictestGoal([body.goalKind, ...seats.map((s) => s.goalKind)]);
}

function proteinOf(meal?: PlannedMeal): Protein | undefined {
  if (!meal || meal.skip) return undefined;
  return resolveMeal(meal).recipe?.protein;
}

function pickVaried(
  pool: Recipe[],
  used: Set<string>,
  avoid?: Protein,
  remaining?: ReturnType<typeof dayFuel>["remaining"],
  pantry: string[] = [],
  afterLift = false,
  recovery?: "low" | "ok" | "high",
  goalKind?: GoalKind | string,
  extra?: { afterCardio?: boolean; skipped?: boolean },
): Recipe | undefined {
  const fresh = pool.filter((r) => !used.has(r.id));
  const varied = avoid ? fresh.filter((r) => r.protein !== avoid) : fresh;
  const list = varied.length > 0 ? varied : fresh;
  if (list.length === 0) return undefined;
  const opts = { afterLift, recovery, goalKind, afterCardio: extra?.afterCardio, skipped: extra?.skipped };
  if (remaining) {
    return rankForFuel(list, remaining, pantry, opts)[0]?.recipe;
  }
  return rankForFuel(list, { cal: 700, protein: 40, carbs: 60, fat: 25 }, pantry, opts)[0]?.recipe ?? list[0];
}

function mealLocked(meal: PlannedMeal | undefined, cookedDates: string[]): boolean {
  if (!meal) return false;
  if (meal.skip) return true;
  if (meal.custom) return true;
  if (cookedDates.includes(meal.date)) return true;
  if (meal.recipeId && meal.auto !== true) return true;
  return false;
}

function pruneHealth(map: Record<string, HealthDay>): Record<string, HealthDay> {
  const keys = Object.keys(map).sort();
  if (keys.length <= 14) return map;
  const keep = new Set(keys.slice(-14));
  const out: Record<string, HealthDay> = {};
  for (const k of keys) {
    const row = map[k];
    if (keep.has(k) && row) out[k] = row;
  }
  return out;
}

export const useSpoonful = create<SpoonfulState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      household: 2,
      prefs: [],
      allergies: [],
      hidden: [],
      weekStart: mondayOf(),
      meals: [],
      undoMeals: null,
      pantry: [],
      extraGrocery: [],
      checked: {},
      unlocked: [],
      theme: "paper",
      tab: "plan",
      walkthroughDone: false,
      nextGen: false,
      goal: DEFAULT_GOAL,
      stepsByDate: {},
      workouts: [],
      favorites: [],
      cookedDates: [],
      snacks: [],
      xp: 0,
      seenMilestones: [],
      lastCelebrate: null,
      snapped: false,
      chefWeek: mondayOf(),
      chefCount: 0,
      snapCount: 0,
      lookupCount: 0,
      notifyPrefs: DEFAULT_NOTIFY,
      dinnerHour: 18,
      fitnessSource: null,
      lastSyncAt: null,
      syncAccess: null,
      body: DEFAULT_BODY,
      liftSessions: [],
      weightLog: [{ date: isoDate(), kg: DEFAULT_BODY.weightKg }],
      locale: "en",
      country: "CA",
      navPins: [...DEFAULT_NAV_PINS],
      healthByDate: {},
      autoPlate: true,
      seats: [],
      chefBonus: 0,
      chefBonusWeek: mondayOf(),
      programWeek: null,
      favMoves: [],
      completeOnboarding: ({ household, prefs, allergies, sample, nextGen, goal, body, locale, country }) => {
        const nextBody = normalizeBody(body ?? DEFAULT_BODY);
        set({
          onboarded: true,
          household,
          prefs,
          allergies: allergies ?? [],
          tab: "plan",
          nextGen: Boolean(nextGen),
          body: nextBody,
          goal: goal ?? macrosFromBody(nextBody),
          weightLog: [{ date: isoDate(), kg: nextBody.weightKg }],
          locale: locale ?? "en",
          country: country ?? "CA",
        });
        if (nextGen) get().ensureProgram();
        if (sample) get().fillWeek(true);
        if (sample && nextGen) get().replateFromFuel();
      },
      setTab: (tab) => set({ tab }),
      setWeekStart: (weekStart) => {
        set({ weekStart });
        get().ensureProgram();
      },
      setHousehold: (household) => set({ household }),
      togglePref: (pref) =>
        set((s) => ({
          prefs: s.prefs.includes(pref) ? s.prefs.filter((p) => p !== pref) : [...s.prefs, pref],
        })),
      toggleAllergy: (id) =>
        set((s) => ({
          allergies: s.allergies.includes(id) ? s.allergies.filter((a) => a !== id) : [...s.allergies, id],
        })),
      setTheme: (theme) => set({ theme }),
      setNextGen: (nextGen) => {
        set((s) => ({
          nextGen,
          tab: !nextGen && s.tab === "fit" ? "plan" : nextGen && s.tab === "people" ? "fit" : s.tab,
        }));
        if (nextGen) get().ensureProgram();
      },
      setGoal: (goal) => set({ goal }),
      assignMeal: (date, slot, recipeId) => {
        set((s) => {
          const rest = s.meals.filter((m) => mealKey(m.date, m.slot) !== mealKey(date, slot));
          return {
            meals: [...rest, { id: uid(), date, slot, recipeId }],
          };
        });
        if (slot === "dinner" && date === isoDate()) {
          const recipe = RECIPES.find((r) => r.id === recipeId);
          const s = get();
          if (s.hasAddon("family") && s.notifyPrefs.family) {
            void postKitchenEvent({
              data: { kind: "plated", body: `plated ${recipe?.name ?? "dinner"}`, recipeName: recipe?.name },
            }).catch(() => {});
          }
        }
      },
      assignCustom: (date, slot, custom) =>
        set((s) => {
          const rest = s.meals.filter((m) => mealKey(m.date, m.slot) !== mealKey(date, slot));
          return { meals: [...rest, { id: uid(), date, slot, custom }] };
        }),
      skipNight: (date, kind) =>
        set((s) => {
          const rest = s.meals.filter((m) => mealKey(m.date, m.slot) !== mealKey(date, "dinner"));
          return { meals: [...rest, { id: uid(), date, slot: "dinner", skip: kind }] };
        }),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      fillWeek: (overwrite) => {
        const { weekStart, meals, unlocked, prefs, allergies, hidden, nextGen, cookedDates, body, seats } = get();
        const goalKind = tableGoalOf(body, seats ?? []);
        if (nextGen && !overwrite) {
          const n = get().fillFromFuel();
          if (n > 0) return n;
        }
        const pool = shuffle(allowedPool(unlocked, prefs, allergies, hidden, goalKind));
        if (pool.length === 0) return 0;
        const dates = weekDates(weekStart);
        const snapshot = meals;
        const kept = meals.filter((m) => {
          if (m.slot !== "dinner") return true;
          if (!dates.includes(m.date)) return true;
          if (m.skip) return true;
          return !overwrite;
        });
        let filled = 0;
        const added: PlannedMeal[] = [];
        const used = new Set(kept.filter((m) => m.recipeId).map((m) => m.recipeId as string));
        for (const m of meals) {
          if (m.recipeId && cookedDates.includes(m.date)) used.add(m.recipeId);
        }
        for (const date of dates) {
          const existing = kept.find((m) => m.date === date && m.slot === "dinner");
          if (existing) continue;
          const prevDate = isoDate(addDays(parseISO(`${date}T12:00:00`), -1));
          const prev =
            added.find((m) => m.date === prevDate && m.slot === "dinner") ??
            kept.find((m) => m.date === prevDate && m.slot === "dinner");
          const recipe = pickVaried(pool, used, proteinOf(prev), undefined, [], false, undefined, goalKind);
          if (!recipe) continue;
          used.add(recipe.id);
          added.push({ id: uid(), date, slot: "dinner", recipeId: recipe.id, auto: nextGen || undefined });
          filled += 1;
        }
        set({ meals: [...kept, ...added], undoMeals: snapshot });
        return filled;
      },
      fillFromFuel: () => {
        return get().replateFromFuel().count;
      },
      surpriseDinner: (date) => {
        const { meals, unlocked, prefs, allergies, hidden, pantry, goal, workouts, stepsByDate, snacks, nextGen, body, seats } =
          get();
        const goalKind = tableGoalOf(body, seats ?? []);
        const pool = shuffle(allowedPool(unlocked, prefs, allergies, hidden, goalKind));
        if (pool.length === 0) return null;
        const used = new Set(meals.filter((m) => m.recipeId).map((m) => m.recipeId as string));
        const prevDate = isoDate(addDays(parseISO(`${date}T12:00:00`), -1));
        const prev = meals.find((m) => m.date === prevDate && m.slot === "dinner");
        let pick: Recipe | undefined;
        if (nextGen) {
          const program = get().ensureProgram();
          const session = program.sessions.find((s) => s.date === date);
          const eaten = nutritionForDate(meals, date, snacks);
          const dayWork = expectedWorkoutsForDate({
            date,
            today: isoDate(),
            sessions: program.sessions,
            logged: workouts,
            bodyKg: body.weightKg,
          });
          const health = get().healthByDate[date];
          let fuel = dayFuel({
            goal,
            eaten,
            workouts: dayWork,
            steps: stepsByDate[date] ?? health?.steps ?? 0,
            body,
          });
          if (health) fuel = applyHealthToFuel(fuel, health);
          pick = pickVaried(
            pool,
            used,
            proteinOf(prev),
            fuel.remaining,
            pantry.map((p) => p.name),
            sessionAfterLift(session, isoDate()) || dayWork.some((w) => w.kind === "lift"),
            health ? recoveryLabel(health) : undefined,
            goalKind,
            {
              afterCardio: sessionAfterCardio(session, isoDate()),
              skipped: sessionSkipped(session, isoDate()),
            },
          );
        } else {
          pick = pickVaried(pool, used, proteinOf(prev), undefined, [], false, undefined, goalKind);
        }
        if (!pick) pick = pool[0];
        if (!pick) return null;
        get().assignMeal(date, "dinner", pick.id);
        return pick;
      },
      hideRecipe: (recipeId) =>
        set((s) => ({
          hidden: s.hidden.includes(recipeId) ? s.hidden : [...s.hidden, recipeId],
          meals: s.meals.filter((m) => m.recipeId !== recipeId),
        })),
      unhideRecipe: (recipeId) => set((s) => ({ hidden: s.hidden.filter((id) => id !== recipeId) })),
      undoFill: () => {
        const snap = get().undoMeals;
        if (!snap) return false;
        set({ meals: snap, undoMeals: null });
        return true;
      },
      addPantry: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          if (s.pantry.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return s;
          return { pantry: [...s.pantry, { id: uid(), name: trimmed }] };
        });
      },
      removePantry: (id) => set((s) => ({ pantry: s.pantry.filter((p) => p.id !== id) })),
      addExtraGrocery: (name, aisle) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const { weekStart } = get();
        set((s) => ({
          extraGrocery: [...s.extraGrocery, { id: uid(), name: trimmed, aisle, weekStart }],
        }));
      },
      removeExtraGrocery: (id) => set((s) => ({ extraGrocery: s.extraGrocery.filter((e) => e.id !== id) })),
      toggleChecked: (key) => set((s) => ({ checked: { ...s.checked, [key]: !s.checked[key] } })),
      clearChecked: () => {
        const { weekStart, checked } = get();
        const next = { ...checked };
        for (const key of Object.keys(next)) {
          if (key.startsWith(`${weekStart}::`)) delete next[key];
        }
        set({ checked: next });
      },
      stashCheckedToPantry: () => {
        const { weekStart, meals, extraGrocery, pantry, checked, household } = get();
        const lines = groceryForWeek(meals, weekStart, extraGrocery, pantry, household);
        let n = 0;
        for (const line of lines) {
          const key = `${weekStart}::${line.key}`;
          if (!checked[key]) continue;
          get().addPantry(line.name);
          n += 1;
        }
        return n;
      },
      unlock: (id) => {
        const already = get().unlocked.includes(id);
        rollAiWeek(get, set);
        set((s) => {
          if (id === "plates-15" || id === "plates-40") {
            const week = mondayOf();
            const add = id === "plates-15" ? CHEF_PACK_15 : CHEF_PACK_40;
            const bonus = (s.chefBonusWeek === week ? s.chefBonus : 0) + add;
            return { chefBonus: bonus, chefBonusWeek: week };
          }
          if (s.unlocked.includes(id)) return s;
          const extra: AddonId[] = [];
          if (id === "kitchen-table") {
            extra.push("chef-plus", "family");
          }
          const addon = ADDONS.find((a) => a.id === id);
          if (addon?.includes) {
            for (const pack of addon.includes) {
              if (pack === "weeknight" || pack === "protein" || pack === "batch") {
                extra.push(pack);
              }
            }
          }
          const unlocked = Array.from(new Set([...s.unlocked, id, ...extra]));
          return { unlocked, autoPlate: true };
        });
        if ((id === "family" || id === "kitchen-table") && !already) get().awardXp(15);
      },
      hasAddon: (id) => isUnlocked(get().unlocked, id),
      finishWalkthrough: () => set({ walkthroughDone: true }),
      resetWalkthrough: () => set({ walkthroughDone: false }),
      setSteps: (date, steps) =>
        set((s) => ({ stepsByDate: { ...s.stepsByDate, [date]: Math.max(0, Math.round(steps)) } })),
      addWorkout: (input) => {
        const body = get().body;
        const minutes = Math.max(5, input.minutes);
        const kcal =
          input.kcal && input.kcal > 0
            ? Math.round(input.kcal)
            : workoutKcal(
                {
                  id: "tmp",
                  date: input.date,
                  kind: input.kind,
                  minutes,
                  volumeKg: input.volumeKg,
                  distanceKm: input.distanceKm,
                },
                body,
              );
        set((s) => ({
          workouts: [
            ...s.workouts,
            {
              id: uid(),
              date: input.date,
              kind: input.kind,
              minutes,
              kcal,
              volumeKg: input.volumeKg,
              distanceKm: input.distanceKm,
              source: input.source ?? s.fitnessSource ?? undefined,
            },
          ],
        }));
        if (!input.silent) get().awardXp(12, "workout");
        const week = get().programWeek;
        if (week) {
          const session = week.sessions.find((s) => s.date === input.date && s.status === "planned");
          if (session && matchLoggedToSession(session, get().workouts)) {
            set({
              programWeek: {
                ...week,
                sessions: week.sessions.map((s) => (s.id === session.id ? { ...s, status: "done" as const } : s)),
              },
            });
          }
        }
        if (get().nextGen && !input.silent) get().replateFromFuel([input.date]);
      },
      removeWorkout: (id) => {
        const w = get().workouts.find((x) => x.id === id);
        set((s) => ({ workouts: s.workouts.filter((x) => x.id !== id) }));
        if (w && get().nextGen) {
          const week = get().programWeek;
          if (week) {
            const session = week.sessions.find((s) => s.date === w.date && s.status === "done");
            const still = get().workouts.some((x) => x.date === w.date);
            if (session && !still) {
              set({
                programWeek: {
                  ...week,
                  sessions: week.sessions.map((s) => (s.id === session.id ? { ...s, status: "planned" as const } : s)),
                },
              });
            }
          }
          get().replateFromFuel([w.date]);
        }
      },
      setBody: (patch) => {
        set((s) => {
          const body = normalizeBody({ ...s.body, ...patch });
          let weightLog = s.weightLog ?? [];
          if (typeof patch.weightKg === "number" && Math.abs(patch.weightKg - s.body.weightKg) >= 0.15) {
            const today = isoDate();
            weightLog = [...s.weightLog.filter((w) => w.date !== today), { date: today, kg: body.weightKg }].slice(-60);
          }
          return { body, weightLog, goal: macrosFromBody(body) };
        });
        if (patch.goalKind) get().ensureProgram();
      },
      applyBodyGoal: () => {
        const body = get().body;
        set({ goal: macrosFromBody(body) });
      },
      saveLiftSession: (session) => {
        const finished: LiftSession = { ...session, finishedAt: session.finishedAt ?? Date.now() };
        const priorSessions = get().liftSessions;
        const minutes = Math.max(8, Math.round(((finished.finishedAt ?? Date.now()) - finished.startedAt) / 60000));
        const volumeKg = sessionVolumeKg(finished);
        const kcal = liftKcal(get().body.weightKg, minutes, volumeKg, sessionRomM(finished));
        set((s) => ({
          liftSessions: [...s.liftSessions.filter((x) => x.id !== finished.id), finished].slice(-40),
        }));
        get().addWorkout({ date: finished.date, kind: "lift", minutes, kcal, volumeKg });
        const prs = sessionPRs(priorSessions, finished);
        if (prs[0]) {
          const pr = prs[0];
          const move = moveById(pr.moveId);
          const imperial = get().body.units !== "metric";
          const weight = imperial ? `${Math.round(lbFromKg(pr.weightKg))} lb` : `${Math.round(pr.weightKg * 10) / 10} kg`;
          set({
            lastCelebrate: {
              id: `pr-${finished.id}-${pr.moveId}`,
              title: "New PR!",
              body: `${move?.name ?? pr.moveId} — ${weight} × ${pr.reps}. Your best yet.`,
            },
          });
        }
        const week = get().programWeek;
        if (week) {
          const session = week.sessions.find((s) => s.date === finished.date && s.kind === "lift" && s.status !== "skipped");
          if (session) {
            set({
              programWeek: {
                ...week,
                sessions: week.sessions.map((s) => (s.id === session.id ? { ...s, status: "done" as const } : s)),
              },
            });
            if (get().nextGen) get().replateFromFuel([finished.date]);
          }
        }
        get().ensureProgram();
      },
      importFitness: ({ steps, workouts, body }) => {
        const today = isoDate();
        if (body) {
          get().setBody(body);
          get().applyBodyGoal();
        }
        if (typeof steps === "number") get().setSteps(today, steps);
        for (const w of workouts ?? []) {
          get().addWorkout({
            date: w.date || today,
            kind: w.kind,
            minutes: w.minutes,
            kcal: w.kcal,
            volumeKg: w.volumeKg,
            distanceKm: w.distanceKm,
            source: get().fitnessSource ?? w.source,
            silent: true,
          });
        }
        get().touchSync();
      },
      syncFitness: ({ live } = {}) => {
        if (hasNativeHealth()) {
          requestNativeHealth();
          return undefined;
        }
        const s = get();
        if (!s.fitnessSource) return undefined;
        const today = isoDate();
        const prev = s.healthByDate[today];
        const last = s.lastSyncAt ? Date.parse(s.lastSyncAt) : 0;
        const elapsed = Number.isFinite(last) && last > 0 ? Date.now() - last : 0;
        const catchUp = s.syncAccess === "always" && elapsed > 90_000;
        const liveTick = Boolean(live) && !catchUp;
        if (liveTick) {
          if (Number.isFinite(last) && Date.now() - last < 25000) return undefined;
          const health = pullHealthDay(s.fitnessSource, s.body, new Date(), prev);
          const cur = s.stepsByDate[today] ?? health.steps;
          const steps = liveStepBump(cur, s.body.activity);
          const nextHealth: HealthDay = {
            ...health,
            steps,
            distanceKm: Math.round((steps / 1280) * 100) / 100,
          };
          set((st) => ({
            healthByDate: pruneHealth({ ...st.healthByDate, [today]: nextHealth }),
            stepsByDate: { ...st.stepsByDate, [today]: steps },
            lastSyncAt: new Date().toISOString(),
          }));
          return undefined;
        }
        const health = pullHealthDay(s.fitnessSource, s.body, new Date(), prev);
        const pulled = pullFromSource(s.fitnessSource, s.body);
        const caught = catchUp
          ? catchUpSteps(s.stepsByDate[today] ?? health.steps, s.body.activity, elapsed)
          : health.steps;
        const steps = Math.max(health.steps, caught);
        const nextHealth: HealthDay = {
          ...health,
          steps,
          distanceKm: Math.round((steps / 1280) * 100) / 100,
        };
        get().setSteps(today, steps);
        set((st) => ({
          healthByDate: pruneHealth({ ...st.healthByDate, [today]: nextHealth }),
        }));
        const already = get().workouts.some((w) => w.date === today && w.source === s.fitnessSource);
        if (!already && pulled.workout) {
          get().addWorkout({
            date: today,
            kind: pulled.workout.kind,
            minutes: pulled.workout.minutes,
            volumeKg: pulled.workout.volumeKg,
            distanceKm: pulled.workout.distanceKm,
            source: s.fitnessSource,
            silent: true,
          });
        }
        get().touchSync();
        const now = get();
        if (!now.autoPlate) return undefined;
        if (now.meals.some((m) => m.date === today && m.slot === "dinner")) return undefined;
        const pool = allowedPool(now.unlocked, now.prefs, now.allergies, now.hidden, tableGoalOf(now.body, now.seats ?? []));
        if (pool.length === 0) return undefined;
        const used = new Set(now.meals.filter((m) => m.recipeId).map((m) => m.recipeId as string));
        const eaten = nutritionForDate(now.meals, today, now.snacks);
        const dayWork = now.workouts.filter((w) => w.date === today);
        let fuel = dayFuel({
          goal: now.goal,
          eaten,
          workouts: dayWork,
          steps: now.stepsByDate[today] ?? steps,
          body: now.body,
        });
        fuel = applyHealthToFuel(fuel, nextHealth);
        const prevDate = isoDate(addDays(parseISO(`${today}T12:00:00`), -1));
        const prevMeal = now.meals.find((m) => m.date === prevDate && m.slot === "dinner");
        const pick = pickVaried(
          pool,
          used,
          proteinOf(prevMeal),
          fuel.remaining,
          now.pantry.map((p) => p.name),
          dayWork.some((w) => w.kind === "lift"),
          recoveryLabel(nextHealth),
          tableGoalOf(now.body, now.seats ?? []),
        );
        if (!pick) return undefined;
        get().assignMeal(today, "dinner", pick.id);
        return pick.name;
      },
      applyNativeHealth: (day) => {
        const today = day.date || isoDate();
        set((st) => ({
          healthByDate: pruneHealth({ ...st.healthByDate, [today]: day }),
          stepsByDate: { ...st.stepsByDate, [today]: day.steps },
          lastSyncAt: new Date().toISOString(),
        }));
      },
      touchSync: () => set({ lastSyncAt: new Date().toISOString() }),
      toggleFavorite: (recipeId) =>
        set((s) => ({
          favorites: s.favorites.includes(recipeId)
            ? s.favorites.filter((id) => id !== recipeId)
            : [...s.favorites, recipeId],
        })),
      setNavPins: (pins) => set({ navPins: normalizePins(pins) }),
      togglePin: (id) =>
        set((s) => {
          const cur = normalizePins(s.navPins);
          if (cur.includes(id)) return { navPins: normalizePins(cur.filter((x) => x !== id)) };
          if (cur.length >= 6) return s;
          return { navPins: [...cur, id] };
        }),
      setAutoPlate: (on) => set({ autoPlate: on }),
      setSeats: (seats) => set({ seats }),
      addSeat: (name, goalKind) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          if ((s.seats ?? []).length >= 6) return s;
          return {
            seats: [...(s.seats ?? []), { id: uid(), name: trimmed, goalKind }],
          };
        });
      },
      updateSeat: (id, patch) =>
        set((s) => ({
          seats: (s.seats ?? []).map((seat) => (seat.id === id ? { ...seat, ...patch } : seat)),
        })),
      removeSeat: (id) => set((s) => ({ seats: (s.seats ?? []).filter((seat) => seat.id !== id) })),
      ensureProgram: () => {
        const s = get();
        const today = isoDate();
        const week = rebuildProgram(s.programWeek, s.weekStart, s.body.goalKind, today, s.liftSessions);
        const synced = week.sessions.map((session) => {
          if (session.status === "planned" && matchLoggedToSession(session, s.workouts)) {
            return { ...session, status: "done" as const };
          }
          return session;
        });
        const next = { ...week, sessions: synced };
        const same =
          s.programWeek &&
          s.programWeek.weekStart === next.weekStart &&
          s.programWeek.goalKind === next.goalKind &&
          s.programWeek.sessions.length === next.sessions.length &&
          s.programWeek.sessions.every((ses, i) => {
            const n = next.sessions[i];
            return n && ses.id === n.id && ses.status === n.status && ses.name === n.name && ses.kind === n.kind;
          });
        if (!same) set({ programWeek: next });
        return get().programWeek ?? next;
      },
      markSession: (id, status) => {
        const week = get().ensureProgram();
        const session = week.sessions.find((s) => s.id === id);
        if (!session || session.kind === "rest") return undefined;
        set({ programWeek: { ...week, sessions: week.sessions.map((s) => (s.id === id ? { ...s, status } : s)) } });
        if (status === "done" && !get().workouts.some((w) => w.date === session.date && w.kind === (session.kind === "lift" ? "lift" : session.cardioKind ?? "walk"))) {
          get().addWorkout({
            date: session.date,
            kind: session.kind === "lift" ? "lift" : (session.cardioKind ?? "walk"),
            minutes: session.minutes,
            silent: true,
          });
        }
        if (status === "skipped" || status === "missed") {
          const kinds = session.kind === "lift" ? (["lift"] as const) : undefined;
          set((st) => ({
            workouts: st.workouts.filter((w) => {
              if (w.date !== session.date) return true;
              if (w.source) return true;
              if (kinds) return w.kind !== "lift";
              return false;
            }),
          }));
        }
        const plated = get().replateFromFuel([session.date]);
        return plated.names[0];
      },
      restoreSession: (id) => {
        const week = get().ensureProgram();
        const session = week.sessions.find((s) => s.id === id);
        if (!session || session.kind === "rest") return undefined;
        set({ programWeek: patchSession(week, id, { status: "planned" }) });
        if (session.status === "done") {
          const kinds = session.kind === "lift" ? "lift" : (session.cardioKind ?? "walk");
          set((st) => ({
            workouts: st.workouts.filter((w) => {
              if (w.date !== session.date) return true;
              if (w.source) return true;
              return w.kind !== kinds;
            }),
          }));
        }
        const plated = get().replateFromFuel([session.date]);
        return plated.names[0];
      },
      swapSessionMove: (sessionId, fromId, toId) => {
        const week = get().ensureProgram();
        set({ programWeek: swapMove(week, sessionId, fromId, toId) });
      },
      toggleFavMove: (moveId) =>
        set((s) => ({
          favMoves: s.favMoves.includes(moveId) ? s.favMoves.filter((id) => id !== moveId) : [...s.favMoves, moveId],
        })),
      replateFromFuel: (onlyDates) => {
        const program = get().ensureProgram();
        const {
          weekStart,
          meals,
          unlocked,
          prefs,
          allergies,
          hidden,
          pantry,
          goal,
          workouts,
          stepsByDate,
          snacks,
          body,
          seats,
          cookedDates,
        } = get();
        const goalKind = tableGoalOf(body, seats ?? []);
        const pool = allowedPool(unlocked, prefs, allergies, hidden, goalKind);
        if (pool.length === 0) return { count: 0, names: [] };
        const today = isoDate();
        const dates = (onlyDates && onlyDates.length > 0 ? onlyDates : weekDates(weekStart)).filter((d) =>
          weekDates(weekStart).includes(d),
        );
        const snapshot = meals;
        const used = new Set(meals.filter((m) => m.recipeId).map((m) => m.recipeId as string));
        const added: PlannedMeal[] = [];
        const names: string[] = [];
        for (const date of dates) {
          const existing = meals.find((m) => m.date === date && m.slot === "dinner");
          if (mealLocked(existing, cookedDates)) continue;
          const eaten = nutritionForDate(
            meals.filter((m) => !(m.date === date && m.slot === "dinner")),
            date,
            snacks,
          );
          const session = program.sessions.find((s) => s.date === date);
          const dayWork = expectedWorkoutsForDate({
            date,
            today,
            sessions: program.sessions,
            logged: workouts,
            bodyKg: body.weightKg,
          });
          const health = get().healthByDate[date];
          let fuel = dayFuel({
            goal,
            eaten,
            workouts: dayWork,
            steps: stepsByDate[date] ?? health?.steps ?? 0,
            body,
          });
          if (health) fuel = applyHealthToFuel(fuel, health);
          const prevDate = isoDate(addDays(parseISO(`${date}T12:00:00`), -1));
          const prev =
            added.find((m) => m.date === prevDate) ?? meals.find((m) => m.date === prevDate && m.slot === "dinner");
          const pick = pickVaried(
            pool,
            used,
            proteinOf(prev),
            fuel.remaining,
            pantry.map((p) => p.name),
            sessionAfterLift(session, today) || dayWork.some((w) => w.kind === "lift"),
            health ? recoveryLabel(health) : undefined,
            goalKind,
            {
              afterCardio: sessionAfterCardio(session, today),
              skipped: sessionSkipped(session, today),
            },
          );
          if (!pick) continue;
          if (existing?.recipeId === pick.id) continue;
          used.add(pick.id);
          added.push({ id: uid(), date, slot: "dinner", recipeId: pick.id, auto: true });
          names.push(pick.name);
        }
        if (added.length === 0) return { count: 0, names: [] };
        const rest = meals.filter((m) => !(m.slot === "dinner" && added.some((a) => a.date === m.date)));
        set({ meals: [...rest, ...added], undoMeals: snapshot });
        return { count: added.length, names };
      },
      kitchenPayload: () => {
        const s = get();
        return {
          onboarded: s.onboarded,
          household: s.household,
          prefs: s.prefs,
          allergies: s.allergies,
          hidden: s.hidden,
          weekStart: s.weekStart,
          meals: s.meals,
          pantry: s.pantry,
          extraGrocery: s.extraGrocery,
          checked: s.checked,
          unlocked: s.unlocked,
          theme: s.theme,
          walkthroughDone: s.walkthroughDone,
          nextGen: s.nextGen,
          goal: s.goal,
          stepsByDate: s.stepsByDate,
          workouts: s.workouts,
          favorites: s.favorites,
          cookedDates: s.cookedDates,
          snacks: s.snacks,
          xp: s.xp,
          seenMilestones: s.seenMilestones,
          snapped: s.snapped,
          chefWeek: s.chefWeek,
          chefCount: s.chefCount,
          snapCount: s.snapCount,
          lookupCount: s.lookupCount,
          notifyPrefs: s.notifyPrefs,
          dinnerHour: s.dinnerHour,
          fitnessSource: s.fitnessSource,
          lastSyncAt: s.lastSyncAt,
          syncAccess: s.syncAccess,
          body: s.body,
          liftSessions: s.liftSessions,
          weightLog: s.weightLog,
          locale: s.locale,
          country: s.country,
          navPins: s.navPins,
          healthByDate: s.healthByDate,
          autoPlate: s.autoPlate,
          seats: s.seats,
          chefBonus: s.chefBonus,
          chefBonusWeek: s.chefBonusWeek,
          programWeek: s.programWeek,
          favMoves: s.favMoves,
          updatedAt: new Date().toISOString(),
        };
      },
      hydrateFromCloud: (payload) => {
        const body = payload.body && typeof payload.body === "object" ? normalizeBody(payload.body as BodyProfile) : get().body;
        set({
          ...(typeof payload.onboarded === "boolean" ? { onboarded: payload.onboarded } : {}),
          ...(typeof payload.household === "number" ? { household: payload.household } : {}),
          ...(Array.isArray(payload.prefs) ? { prefs: payload.prefs as PrefId[] } : {}),
          ...(Array.isArray(payload.allergies) ? { allergies: payload.allergies as AllergyId[] } : {}),
          ...(Array.isArray(payload.hidden) ? { hidden: payload.hidden as string[] } : {}),
          ...(typeof payload.weekStart === "string" ? { weekStart: payload.weekStart } : {}),
          ...(Array.isArray(payload.meals) ? { meals: payload.meals as PlannedMeal[] } : {}),
          ...(Array.isArray(payload.pantry) ? { pantry: payload.pantry as PantryItem[] } : {}),
          ...(Array.isArray(payload.extraGrocery) ? { extraGrocery: payload.extraGrocery as ExtraGroceryItem[] } : {}),
          ...(payload.checked && typeof payload.checked === "object" ? { checked: payload.checked as Record<string, boolean> } : {}),
          ...(Array.isArray(payload.unlocked) ? { unlocked: payload.unlocked as AddonId[] } : {}),
          ...(payload.theme === "paper" || payload.theme === "midnight" ? { theme: payload.theme } : {}),
          ...(typeof payload.walkthroughDone === "boolean" ? { walkthroughDone: payload.walkthroughDone } : {}),
          ...(typeof payload.nextGen === "boolean" ? { nextGen: payload.nextGen } : {}),
          ...(payload.goal && typeof payload.goal === "object" ? { goal: payload.goal as MacroGoal } : {}),
          ...(payload.stepsByDate && typeof payload.stepsByDate === "object"
            ? { stepsByDate: payload.stepsByDate as Record<string, number> }
            : {}),
          ...(Array.isArray(payload.workouts) ? { workouts: payload.workouts as Workout[] } : {}),
          ...(Array.isArray(payload.favorites) ? { favorites: payload.favorites as string[] } : {}),
          ...(Array.isArray(payload.cookedDates) ? { cookedDates: payload.cookedDates as string[] } : {}),
          ...(Array.isArray(payload.snacks) ? { snacks: payload.snacks as Snack[] } : {}),
          ...(typeof payload.xp === "number" ? { xp: payload.xp } : {}),
          body,
          ...(Array.isArray(payload.seats) ? { seats: payload.seats as FamilySeat[] } : {}),
          ...(typeof payload.chefBonus === "number" ? { chefBonus: payload.chefBonus } : {}),
          ...(typeof payload.chefBonusWeek === "string" ? { chefBonusWeek: payload.chefBonusWeek } : {}),
          ...(typeof payload.autoPlate === "boolean" ? { autoPlate: payload.autoPlate } : {}),
          ...(isProgramWeek(payload.programWeek) ? { programWeek: payload.programWeek } : {}),
          ...(Array.isArray(payload.favMoves) ? { favMoves: payload.favMoves as string[] } : {}),
        });
      },
      logWater: (ml) => {
        const today = isoDate();
        const s = get();
        const existing = s.healthByDate[today];
        const base =
          existing ??
          (s.fitnessSource
            ? pullHealthDay(s.fitnessSource, s.body, new Date())
            : {
                date: today,
                steps: s.stepsByDate[today] ?? 0,
                distanceKm: 0,
                flights: 0,
                activeKcal: 0,
                basalKcal: 0,
                exerciseMin: 0,
                standHours: 0,
                moveGoal: 500,
                exerciseGoal: 30,
                standGoal: 12,
                heartRate: 72,
                restingHr: 62,
                walkingHrAvg: 98,
                hrvMs: 42,
                vo2max: 38,
                spo2: 98,
                sleepHours: 7,
                sleepScore: 72,
                waterMl: 0,
                mindfulMin: 0,
                weightKg: s.body.weightKg,
              });
        set({
          healthByDate: pruneHealth({
            ...s.healthByDate,
            [today]: { ...base, waterMl: Math.max(0, base.waterMl + ml) },
          }),
        });
      },
      markCooked: (date) => {
        const already = get().cookedDates.includes(date);
        set((s) => ({
          cookedDates: s.cookedDates.includes(date) ? s.cookedDates : [...s.cookedDates, date],
        }));
        if (!already) get().awardXp(25, "cooked");
      },
      saveLeftovers: (fromDate) => {
        const dinner = get().meals.find((m) => m.date === fromDate && m.slot === "dinner");
        if (!dinner || dinner.skip) return false;
        const resolved = resolveMeal(dinner);
        const next = isoDate(addDays(parseISO(`${fromDate}T12:00:00`), 1));
        const ings = (resolved.recipe?.ingredients ?? resolved.custom?.ingredients ?? []).map((ing) => ({
          ...ing,
          qty: Math.max(0.25, ing.qty * 0.5),
        }));
        const n = resolved.recipe?.nutrition ?? resolved.custom?.nutrition;
        get().assignCustom(next, "lunch", {
          id: `leftover-${fromDate}`,
          name: `Leftover ${resolved.title}`,
          minutes: 12,
          notes: "From last night. Reheat gently, add a green if you have one.",
          ingredients: ings,
          nutrition: n
            ? { cal: Math.round(n.cal / 2), protein: Math.round(n.protein / 2), carbs: Math.round(n.carbs / 2), fat: Math.round(n.fat / 2) }
            : undefined,
        });
        return true;
      },
      addSnack: ({ date, name, nutrition }) =>
        set((s) => ({
          snacks: [...s.snacks, { id: uid(), date, name, nutrition }],
        })),
      removeSnack: (id) => set((s) => ({ snacks: s.snacks.filter((x) => x.id !== id) })),
      awardXp: (amount) => {
        const s = get();
        const before = rankForXp(s.xp);
        const xp = s.xp + Math.max(0, amount);
        const after = rankForXp(xp);
        const fresh = milestonesFor({
          cookedDates: s.cookedDates,
          xp,
          seen: s.seenMilestones,
          snapped: s.snapped,
          family: isUnlocked(s.unlocked, "family"),
          liftCount: s.liftSessions.length,
          savedTotal: savingsSummary(s.meals, s.cookedDates, s.household).allTime,
        });
        let lastCelebrate: Celebrate | null = s.lastCelebrate;
        const seen = [...s.seenMilestones];
        if (after.id !== before.id) {
          lastCelebrate = { id: `rank-${after.id}`, title: after.title, body: after.hint };
        } else if (fresh[0]) {
          lastCelebrate = fresh[0];
          seen.push(fresh[0].id);
        }
        set({ xp, seenMilestones: seen, lastCelebrate });
        void syncMyStats({ data: { xp, liftCount: get().liftSessions.length } }).catch(() => {});
        return lastCelebrate && lastCelebrate !== s.lastCelebrate ? lastCelebrate : null;
      },
      clearCelebrate: () => set({ lastCelebrate: null }),
      shareCelebration: async () => {
        const last = get().lastCelebrate;
        if (!last) return false;
        try {
          const res = await shareAchievement({ data: { title: last.title, body: last.body } });
          return res.ok;
        } catch {
          return false;
        }
      },
      consumeChef: () => {
        rollAiWeek(get, set);
        const s = get();
        const cap = chefCapOf(s);
        if (s.chefCount >= cap) return false;
        set({ chefCount: s.chefCount + 1 });
        return true;
      },
      consumeSnap: () => {
        rollAiWeek(get, set);
        const s = get();
        if (isUnlocked(s.unlocked, "chef-plus")) return true;
        if (s.snapCount >= SNAP_FREE_WEEK) return false;
        set({ snapCount: s.snapCount + 1 });
        return true;
      },
      consumeLookup: () => {
        rollAiWeek(get, set);
        const s = get();
        const cap = isUnlocked(s.unlocked, "chef-plus") ? 20 : LOOKUP_FREE_WEEK;
        if (s.lookupCount >= cap) return false;
        set({ lookupCount: s.lookupCount + 1 });
        return true;
      },
      chefRemaining: () => {
        rollAiWeek(get, set);
        const s = get();
        return Math.max(0, chefCapOf(s) - s.chefCount);
      },
      setNotifyPrefs: (patch) => set((s) => ({ notifyPrefs: { ...s.notifyPrefs, ...patch } })),
      setDinnerHour: (hour) => set({ dinnerHour: Math.max(15, Math.min(22, hour)) }),
      setFitnessSource: (id) => {
        set({ fitnessSource: id, syncAccess: id ? get().syncAccess ?? "while-using" : null });
        if (id) get().syncFitness({ live: false });
        else set({ lastSyncAt: null, syncAccess: null });
      },
      linkFitness: (id, access) => {
        set({ fitnessSource: id, syncAccess: access });
        get().syncFitness({ live: false });
      },
      setSyncAccess: (access) => set({ syncAccess: access }),
      setLocale: (locale) => set({ locale }),
      setCountry: (country) =>
        set((s) => ({
          country,
          body: {
            ...s.body,
            units: country === "US" ? "imperial" : country === "CA" ? s.body.units : "metric",
          },
        })),
      markSnapped: () => {
        set({ snapped: true });
        get().awardXp(8, "snap");
      },
    }),
    {
      name: "spoonful-v1",
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SpoonfulState>;
        const body = normalizeBody({ ...current.body, ...(p.body ?? {}) });
        return {
          ...current,
          ...p,
          body,
          seats: Array.isArray(p.seats) ? p.seats : current.seats,
          chefBonus: typeof p.chefBonus === "number" ? p.chefBonus : 0,
          chefBonusWeek: typeof p.chefBonusWeek === "string" ? p.chefBonusWeek : current.chefBonusWeek,
          autoPlate: typeof p.autoPlate === "boolean" ? p.autoPlate : true,
          programWeek: isProgramWeek(p.programWeek) ? p.programWeek : current.programWeek,
          favMoves: Array.isArray(p.favMoves) ? p.favMoves : current.favMoves,
        };
      },
      partialize: (s) => ({
        onboarded: s.onboarded,
        household: s.household,
        prefs: s.prefs,
        allergies: s.allergies,
        hidden: s.hidden,
        weekStart: s.weekStart,
        meals: s.meals,
        undoMeals: s.undoMeals,
        pantry: s.pantry,
        extraGrocery: s.extraGrocery,
        checked: s.checked,
        unlocked: s.unlocked,
        theme: s.theme,
        walkthroughDone: s.walkthroughDone,
        nextGen: s.nextGen,
        goal: s.goal,
        stepsByDate: s.stepsByDate,
        workouts: s.workouts,
        favorites: s.favorites,
        cookedDates: s.cookedDates,
        snacks: s.snacks,
        xp: s.xp,
        seenMilestones: s.seenMilestones,
        snapped: s.snapped,
        chefWeek: s.chefWeek,
        chefCount: s.chefCount,
        snapCount: s.snapCount,
        lookupCount: s.lookupCount,
        notifyPrefs: s.notifyPrefs,
        dinnerHour: s.dinnerHour,
        fitnessSource: s.fitnessSource,
        lastSyncAt: s.lastSyncAt,
        syncAccess: s.syncAccess,
        body: s.body,
        liftSessions: s.liftSessions,
        weightLog: s.weightLog,
        locale: s.locale,
        country: s.country,
        navPins: s.navPins,
        healthByDate: s.healthByDate,
        autoPlate: s.autoPlate,
        seats: s.seats,
        chefBonus: s.chefBonus,
        chefBonusWeek: s.chefBonusWeek,
        programWeek: s.programWeek,
        favMoves: s.favMoves,
      }),
    },
  ),
);

export function plannedForWeek(meals: PlannedMeal[], weekStart: string): PlannedMeal[] {
  const dates = new Set(weekDates(weekStart));
  return meals.filter((m) => dates.has(m.date));
}

export function resolveMeal(meal: PlannedMeal): {
  title: string;
  minutes: number;
  recipe?: Recipe;
  custom?: CustomMeal;
  skip?: PlannedMeal["skip"];
} {
  if (meal.skip === "takeout") return { title: "Eating out", minutes: 0, skip: "takeout" };
  if (meal.skip === "rest") return { title: "Kitchen closed", minutes: 0, skip: "rest" };
  if (meal.custom) {
    return { title: meal.custom.name, minutes: meal.custom.minutes, custom: meal.custom };
  }
  if (meal.recipeId) {
    const recipe = recipeById(meal.recipeId);
    if (recipe) return { title: recipe.name, minutes: recipe.minutes, recipe };
  }
  return { title: "Pick another dish", minutes: 0 };
}

export function nutritionForDate(
  meals: PlannedMeal[],
  date: string,
  snacks: Snack[] = [],
): ReturnType<typeof emptyNutrition> {
  const fromMeals = meals
    .filter((m) => m.date === date && !m.skip)
    .reduce((sum, m) => {
      const resolved = resolveMeal(m);
      const n = resolved.recipe?.nutrition ?? resolved.custom?.nutrition;
      return n ? addNutrition(sum, n) : sum;
    }, emptyNutrition());
  return snacks
    .filter((s) => s.date === date)
    .reduce((sum, s) => addNutrition(sum, s.nutrition), fromMeals);
}

function pantryHit(name: string, pantry: PantryItem[]): boolean {
  const n = name.toLowerCase();
  return pantry.some((p) => {
    const pn = p.name.toLowerCase();
    return n.includes(pn) || pn.includes(n);
  });
}

export function groceryForWeek(
  meals: PlannedMeal[],
  weekStart: string,
  extra: ExtraGroceryItem[],
  pantry: PantryItem[],
  household = 4,
): GroceryLine[] {
  const dates = new Set(weekDates(weekStart));
  const map = new Map<string, GroceryLine>();

  const add = (name: string, qty: number, unit: string, aisle: Aisle) => {
    const key = `${aisle}::${name.toLowerCase()}::${unit}`;
    const existing = map.get(key);
    if (existing) {
      existing.qty += qty;
      return;
    }
    map.set(key, {
      key,
      name,
      qty,
      unit,
      aisle,
      fromPantry: pantryHit(name, pantry),
    });
  };

  for (const meal of meals) {
    if (!dates.has(meal.date) || meal.skip) continue;
    const resolved = resolveMeal(meal);
    const ingredients = resolved.recipe?.ingredients ?? resolved.custom?.ingredients ?? [];
    const servings = resolved.recipe?.servings ?? 4;
    for (const ing of ingredients) {
      add(ing.name, scaleQty(ing.qty, household, servings), ing.unit, ing.aisle);
    }
  }

  for (const item of extra) {
    if (item.weekStart !== weekStart) continue;
    add(item.name, 1, "", item.aisle);
  }

  return Array.from(map.values());
}

export function weekPulse(
  meals: PlannedMeal[],
  weekStart: string,
  cookedDates: string[],
  household: number,
): {
  dinners: number;
  takeout: number;
  rest: number;
  cooked: number;
  proteins: number;
  cost: number;
} {
  const dates = weekDates(weekStart);
  const dinners = meals.filter((m) => dates.includes(m.date) && m.slot === "dinner");
  const plated = dinners.filter((m) => !m.skip);
  const proteins = new Set(
    plated.map((m) => resolveMeal(m).recipe?.protein).filter((p): p is Protein => Boolean(p)),
  );
  const cost = plated.reduce((sum, m) => {
    const recipe = resolveMeal(m).recipe;
    return recipe ? sum + plateCost(recipe, household) : sum;
  }, 0);
  return {
    dinners: plated.length,
    takeout: dinners.filter((m) => m.skip === "takeout").length,
    rest: dinners.filter((m) => m.skip === "rest").length,
    cooked: dates.filter((d) => cookedDates.includes(d)).length,
    proteins: proteins.size,
    cost: Math.round(cost),
  };
}

export type SavingsSummary = { week: number; month: number; allTime: number; count: number };

/** Estimated dollars saved cooking actually-cooked dinners instead of ordering them in. */
export function savingsSummary(
  meals: PlannedMeal[],
  cookedDates: string[],
  household: number,
  today = isoDate(),
): SavingsSummary {
  const thisWeek = new Set(weekDates(mondayOf(parseISO(`${today}T12:00:00`))));
  const monthPrefix = today.slice(0, 7);
  let week = 0;
  let month = 0;
  let allTime = 0;
  let count = 0;
  for (const date of cookedDates) {
    const dinner = meals.find((m) => m.date === date && m.slot === "dinner" && !m.skip);
    if (!dinner) continue;
    const recipe = resolveMeal(dinner).recipe;
    if (!recipe) continue;
    const savings = mealSavings(recipe, household);
    allTime += savings;
    count += 1;
    if (date.slice(0, 7) === monthPrefix) month += savings;
    if (thisWeek.has(date)) week += savings;
  }
  return { week: Math.round(week), month: Math.round(month), allTime: Math.round(allTime), count };
}

/** Estimated dollars saved per week, oldest to newest, for the last `weeks` weeks including this one. */
export function weeklySavingsTrend(
  meals: PlannedMeal[],
  cookedDates: string[],
  household: number,
  weeks = 8,
  today = isoDate(),
): number[] {
  const thisWeekStart = mondayOf(parseISO(`${today}T12:00:00`));
  const totals: number[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = shiftWeek(thisWeekStart, -i);
    const dates = new Set(weekDates(start));
    let sum = 0;
    for (const date of cookedDates) {
      if (!dates.has(date)) continue;
      const dinner = meals.find((m) => m.date === date && m.slot === "dinner" && !m.skip);
      const recipe = dinner ? resolveMeal(dinner).recipe : undefined;
      if (recipe) sum += mealSavings(recipe, household);
    }
    totals.push(Math.round(sum));
  }
  return totals;
}

export function weekPlanText(meals: PlannedMeal[], weekStart: string): string {
  const dates = weekDates(weekStart);
  return dates
    .map((date) => {
      const dinner = meals.find((m) => m.date === date && m.slot === "dinner");
      const lunch = meals.find((m) => m.date === date && m.slot === "lunch");
      const day = parseISO(`${date}T12:00:00`);
      const label = day.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
      const d = dinner ? resolveMeal(dinner).title : "open";
      const l = lunch ? ` / lunch: ${resolveMeal(lunch).title}` : "";
      return `${label}: ${d}${l}`;
    })
    .join("\n");
}

export const AISLE_ORDER: Aisle[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Pantry",
  "Frozen",
  "Herbs & Spices",
  "Other",
];
