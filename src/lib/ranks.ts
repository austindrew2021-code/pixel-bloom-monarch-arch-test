import { cookStreak, isoDate } from "./fuel";

export type Rank = {
  id: string;
  title: string;
  xp: number;
  hint: string;
};

export const RANKS: Rank[] = [
  { id: "dishwasher", title: "Dishwasher", xp: 0, hint: "Everyone starts here" },
  { id: "prep", title: "Prep cook", xp: 60, hint: "You showed up" },
  { id: "home", title: "Home cook", xp: 160, hint: "Dinner is a habit" },
  { id: "line", title: "Line cook", xp: 320, hint: "Weeknights do not scare you" },
  { id: "sous", title: "Sous chef", xp: 560, hint: "The board stays full" },
  { id: "head", title: "Head chef", xp: 880, hint: "People eat because of you" },
  { id: "maritime", title: "Maritime legend", xp: 1280, hint: "Sauce on the pita, salt in the pot" },
  { id: "legend", title: "Kitchen legend", xp: 1800, hint: "The house runs on you" },
];

export type Milestone = {
  id: string;
  title: string;
  body: string;
  xp: number;
};

export function rankForXp(xp: number): Rank {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (xp >= rank.xp) current = rank;
  }
  return current;
}

export function nextRank(xp: number): Rank | null {
  return RANKS.find((r) => r.xp > xp) ?? null;
}

export function rankProgress(xp: number): { current: Rank; next: Rank | null; pct: number } {
  const current = rankForXp(xp);
  const next = nextRank(xp);
  if (!next) return { current, next: null, pct: 100 };
  const span = next.xp - current.xp;
  const pct = span <= 0 ? 100 : Math.round(((xp - current.xp) / span) * 100);
  return { current, next, pct: Math.max(0, Math.min(100, pct)) };
}

export const MILESTONES = [
  {
    id: "first-plate",
    title: "First plate",
    body: "You cooked it. The streak starts tonight.",
  },
  {
    id: "streak-3",
    title: "Three-night streak",
    body: "Three dinners in a row. The kitchen is awake.",
  },
  {
    id: "streak-7",
    title: "Week on the board",
    body: "Seven nights cooked. That is a real kitchen.",
  },
  {
    id: "cooked-12",
    title: "Dozen dinners",
    body: "Twelve plates logged. You are past the hard part.",
  },
  {
    id: "snap-1",
    title: "Fridge reader",
    body: "You snapped the kitchen. Dinner from what you have.",
  },
  {
    id: "family-1",
    title: "Family table",
    body: "The kitchen is shared. Live meal updates are on.",
  },
  {
    id: "xp-sous",
    title: "Sous chef",
    body: "You cooked your way into the rank. Keep the board full.",
  },
  {
    id: "first-lift",
    title: "First session",
    body: "Logged your first workout. The training log starts here.",
  },
  {
    id: "lift-10",
    title: "Ten sessions",
    body: "Ten workouts on the board. The habit is real.",
  },
  {
    id: "lift-25",
    title: "Twenty-five sessions",
    body: "Twenty-five sessions logged. That's a serious training log.",
  },
  {
    id: "saved-100",
    title: "Hundred saved",
    body: "You've saved about $100 cooking instead of ordering in.",
  },
] as const;

export type Celebrate = {
  id: string;
  title: string;
  body: string;
};

export function milestonesFor(input: {
  cookedDates: string[];
  streakSavedDates?: string[];
  xp: number;
  seen: string[];
  snapped: boolean;
  family: boolean;
  liftCount?: number;
  savedTotal?: number;
}): Celebrate[] {
  const out: Celebrate[] = [];
  // A saved night keeps the streak count alive for milestones too — that's the
  // whole point of protecting it — but it never counts as a real cooked dinner.
  const streak = cookStreak([...input.cookedDates, ...(input.streakSavedDates ?? [])], isoDate());
  const cooked = input.cookedDates.length;
  const lifts = input.liftCount ?? 0;
  const saved = input.savedTotal ?? 0;
  const ok: Record<string, boolean> = {
    "first-plate": cooked >= 1,
    "streak-3": streak >= 3,
    "streak-7": streak >= 7,
    "cooked-12": cooked >= 12,
    "snap-1": input.snapped,
    "family-1": input.family,
    "xp-sous": input.xp >= 560,
    "first-lift": lifts >= 1,
    "lift-10": lifts >= 10,
    "lift-25": lifts >= 25,
    "saved-100": saved >= 100,
  };
  for (const row of MILESTONES) {
    if (ok[row.id] && !input.seen.includes(row.id)) {
      out.push({ id: row.id, title: row.title, body: row.body });
    }
  }
  return out;
}

const WORKOUT_MILESTONE_IDS = new Set(["first-lift", "lift-10", "lift-25"]);

/** True for a PR celebration or a workout-count milestone — the ones worth offering to share. */
export function isWorkoutCelebration(id: string): boolean {
  return id.startsWith("pr-") || WORKOUT_MILESTONE_IDS.has(id);
}

export const CHEF_FREE_WEEK = 3;
export const CHEF_PLUS_WEEK = 40;
export const CHEF_PACK_15 = 15;
export const CHEF_PACK_40 = 40;
export const SNAP_FREE_WEEK = 8;
export const LOOKUP_FREE_WEEK = 3;
/** Free Streak Saves Kitchen Table bundles in every month, before it charges for more. */
export const STREAK_SAVE_FREE_MONTH = 3;
