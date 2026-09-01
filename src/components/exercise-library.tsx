import { Bookmark, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MuscleMap } from "@/components/muscle-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EQUIPMENT_FILTER,
  equipmentLabel,
  EXERCISES,
  MUSCLE_GROUPS,
  MUSCLE_LABEL,
  type Equipment,
  type Exercise,
  type MuscleId,
} from "@/lib/exercises";
import type { Muscle } from "@/lib/lift";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 150;

export function ExerciseLibrary({
  favMoves,
  onClose,
  onOpen,
}: {
  favMoves: string[];
  onClose: () => void;
  onOpen: (ex: Exercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleId | "all">("all");
  const [group, setGroup] = useState<"all" | Muscle>("all");
  const [gear, setGear] = useState<Equipment | "all">("all");
  const [savedOnly, setSavedOnly] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (savedOnly && !favMoves.includes(e.id)) return false;
      if (group !== "all" && e.muscle !== group) return false;
      if (gear !== "all" && e.equipment !== gear) return false;
      if (muscle !== "all" && !e.primary.includes(muscle) && !e.secondary.includes(muscle)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.primary.some((id) => MUSCLE_LABEL[id].toLowerCase().includes(q)) ||
        e.equipment.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [query, muscle, group, gear, savedOnly, favMoves]);

  const list = matches.slice(0, PAGE_SIZE);

  return (
    <div
      data-testid="exercise-library"
      className="fixed inset-0 z-50 flex flex-col bg-background pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div className="flex items-stretch">
        <div className="flex min-w-0 flex-1 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Library</p>
            <h2 className="font-display text-2xl">Exercises</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close library">
            <X />
          </Button>
        </div>
        {isPreviewChrome() ? <div className="pill-slot" aria-hidden /> : null}
      </div>

      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Squat, hamstrings, cable…"
            className="pl-9"
          />
        </div>
        <div className="chip-row mt-2">
          <button
            type="button"
            onClick={() => setSavedOnly((v) => !v)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm",
              savedOnly ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
            )}
          >
            <Bookmark className="size-3.5" /> Saved
          </button>
          {(["all", "legs", "push", "pull", "core", "full"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setGroup(id)}
              className={cn(
                "h-11 shrink-0 rounded-full px-3 text-sm capitalize",
                group === id ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {id}
            </button>
          ))}
        </div>
        <div className="chip-row mt-2">
          <button
            type="button"
            onClick={() => setGear("all")}
            className={cn(
              "h-11 shrink-0 rounded-full px-3 text-sm",
              gear === "all" ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
            )}
          >
            Any kit
          </button>
          {EQUIPMENT_FILTER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setGear(id)}
              className={cn(
                "h-11 shrink-0 rounded-full px-3 text-sm",
                gear === id ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {equipmentLabel(id)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto px-4 pb-1">
        {MUSCLE_GROUPS.map((g) => {
          const on = muscle === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setMuscle((cur) => (cur === g.id ? "all" : g.id))}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center rounded-2xl px-0.5 py-1.5",
                on ? "bg-card ring-2 ring-spark" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              <MuscleMap primary={[g.id]} secondary={[]} size="chip" />
              <span className="mt-0.5 text-[10px] leading-tight">{g.label}</span>
            </button>
          );
        })}
      </div>
      <p className="px-4 pt-1 text-center text-xs text-muted-foreground">
        {muscle === "all"
          ? `${matches.length} moves · tap a muscle to filter`
          : `${MUSCLE_LABEL[muscle]} · ${matches.length} moves`}
      </p>

      <ul className="mt-2 grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto px-4 pb-10">
        {list.map((ex) => (
          <li key={ex.id}>
            <button
              type="button"
              onClick={() => onOpen(ex)}
              className="flex h-full w-full flex-col rounded-3xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
            >
              <div className="relative flex items-start justify-center">
                <img
                  src={ex.image}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-2xl bg-muted object-cover"
                />
                {favMoves.includes(ex.id) ? (
                  <Bookmark className="absolute right-1 top-1 size-3.5 fill-current text-spark drop-shadow" />
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{ex.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {MUSCLE_LABEL[ex.primary[0] ?? "chest"]} · {equipmentLabel(ex.equipment)}
              </p>
            </button>
          </li>
        ))}
      </ul>
      {matches.length === 0 ? (
        <p className="px-4 pb-10 text-center text-sm text-muted-foreground">No moves match that filter.</p>
      ) : null}
      {matches.length > PAGE_SIZE ? (
        <p className="px-4 pb-10 text-center text-xs text-muted-foreground">
          Showing the first {PAGE_SIZE}. Search or filter to narrow it down.
        </p>
      ) : null}
    </div>
  );
}
