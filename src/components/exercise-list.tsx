import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  categoryLabel,
  EXERCISE_DB_CATEGORIES,
  loadExerciseDb,
  searchExerciseDb,
  type ExerciseDbRecord,
} from "@/lib/exercise-db";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { cn } from "@/lib/utils";

/**
 * Full-text/category browser over the 1,324-exercise reference database.
 * Separate from ExerciseLibrary (src/components/exercise-library.tsx), which
 * browses the hand-tuned lift catalog used for session programming.
 */
export function ExerciseList({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (exercise: ExerciseDbRecord) => void;
}) {
  const [records, setRecords] = useState<ExerciseDbRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  useEffect(() => {
    let cancelled = false;
    loadExerciseDb()
      .then((data) => {
        if (!cancelled) setRecords(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    if (!records) return [];
    return searchExerciseDb(records, query, category).slice(0, 200);
  }, [records, query, category]);

  return (
    <div
      data-testid="exercise-list"
      className="fixed inset-0 z-50 flex flex-col bg-background pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div className="flex items-stretch">
        <div className="flex min-w-0 flex-1 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Encyclopedia</p>
            <h2 className="font-display text-2xl">Exercises</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close exercise list">
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
            onClick={() => setCategory("all")}
            className={cn(
              "h-11 shrink-0 rounded-full px-3 text-sm capitalize",
              category === "all" ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
            )}
          >
            All
          </button>
          {EXERCISE_DB_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory((cur) => (cur === c ? "all" : c))}
              className={cn(
                "h-11 shrink-0 rounded-full px-3 text-sm capitalize",
                category === c ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <p className="px-4 pt-3 text-center text-xs text-muted-foreground">
        {!records && !loadError
          ? "Loading exercises…"
          : category === "all"
            ? `${list.length}${list.length === 200 ? "+" : ""} exercises`
            : `${categoryLabel(category)} · ${list.length}${list.length === 200 ? "+" : ""} exercises`}
      </p>

      {loadError ? (
        <p className="px-4 pb-10 pt-6 text-center text-sm text-muted-foreground">
          Couldn't load the exercise database. Check your connection and try again.
        </p>
      ) : (
        <ul className="mt-2 grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto px-4 pb-10">
          {list.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onOpen(ex)}
                className="flex h-full w-full flex-col rounded-3xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
              >
                <img
                  src={ex.image}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-2xl bg-muted object-cover"
                />
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{ex.name}</p>
                <p className="mt-1 line-clamp-1 text-xs capitalize text-muted-foreground">
                  {ex.target} · {ex.equipment}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
      {records && list.length === 0 ? (
        <p className="px-4 pb-10 text-center text-sm text-muted-foreground">No exercises match that filter.</p>
      ) : null}
    </div>
  );
}
