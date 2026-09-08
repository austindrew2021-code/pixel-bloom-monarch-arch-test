import { dayLabel } from "./week.ts";

export type KitchenUpdate = {
  id: string;
  at: string;
  date: string;
  fromName: string;
  toName: string;
  why: string;
};

export function plateChangeWhy(kind: "lift" | "skip" | "miss" | "fuel"): string {
  if (kind === "lift") return "You finished a workout, so dinner changed to match.";
  if (kind === "skip") return "You skipped a workout, so dinner got quieter.";
  if (kind === "miss") return "A workout was missed, so tonight's plate changed.";
  return "Tonight's dinner updated to match today's fuel.";
}

export function plateChangeKind(status: string | undefined, afterLift: boolean): "lift" | "skip" | "miss" | "fuel" {
  if (status === "skipped") return "skip";
  if (status === "missed") return "miss";
  if (status === "done" || afterLift) return "lift";
  return "fuel";
}

export function whenLabel(date: string): string {
  const day = dayLabel(date);
  return day.today ? "Tonight" : day.weekday;
}
