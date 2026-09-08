import { addDays, format, parseISO, startOfWeek } from "date-fns";

export function mondayOf(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function weekDates(weekStart: string): string[] {
  const start = parseISO(`${weekStart}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

export function shiftWeek(weekStart: string, delta: number): string {
  return format(addDays(parseISO(`${weekStart}T12:00:00`), delta * 7), "yyyy-MM-dd");
}

export function dayLabel(date: string): { weekday: string; monthDay: string; today: boolean } {
  const d = parseISO(`${date}T12:00:00`);
  return {
    weekday: format(d, "EEE"),
    monthDay: format(d, "MMM d"),
    today: date === format(new Date(), "yyyy-MM-dd"),
  };
}

export function weekHeading(weekStart: string): string {
  const start = parseISO(`${weekStart}T12:00:00`);
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "MMM d")} – ${format(end, "d")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}
