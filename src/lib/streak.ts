import { addDays, format, parseISO } from "date-fns";

const todayKey = () => format(new Date(), "yyyy-MM-dd");

export function cookStreak(cookedDates: string[], today = todayKey()): number {
  const set = new Set(cookedDates);
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = format(cursor, "yyyy-MM-dd");
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 60) break;
  }
  return streak;
}

/** A streak worth offering to protect — a single missed night isn't worth the interruption. */
const MIN_STREAK_TO_OFFER = 2;

export type BrokenStreak = { brokenDate: string; priorStreak: number };

/**
 * Detects a streak that broke overnight — yesterday wasn't cooked (or already
 * saved), and the days before it had a real streak going. Returns the date
 * that needs a Streak Save to restore the count, and how long the streak was.
 * Never true for a streak already protected by cookedDates or a prior save.
 */
export function brokenStreakInfo(
  cookedDates: string[],
  streakSavedDates: string[],
  today = todayKey(),
): BrokenStreak | null {
  const protectedDates = [...cookedDates, ...streakSavedDates];
  const yesterday = format(addDays(parseISO(`${today}T12:00:00`), -1), "yyyy-MM-dd");
  if (protectedDates.includes(yesterday)) return null;
  const dayBefore = format(addDays(parseISO(`${today}T12:00:00`), -2), "yyyy-MM-dd");
  const priorStreak = cookStreak(protectedDates, dayBefore);
  if (priorStreak < MIN_STREAK_TO_OFFER) return null;
  return { brokenDate: yesterday, priorStreak };
}
