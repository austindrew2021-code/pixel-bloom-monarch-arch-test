import { Bookmark, History, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExerciseFigure } from "@/components/exercise-figure";
import { MuscleLegend, MuscleMap } from "@/components/muscle-map";
import { Button } from "@/components/ui/button";
import { lbFromKg } from "@/lib/body";
import { EQUIPMENT_LABEL, MUSCLE_LABEL, type Exercise } from "@/lib/exercises";
import { bestEpley, epley1rm, previousLine } from "@/lib/lift";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { useSpoonful } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

export function ExerciseSheet({
  exercise,
  onClose,
  onStart,
}: {
  exercise: Exercise;
  onClose: () => void;
  onStart?: (id: string) => void;
}) {
  const sessions = useSpoonful((s) => s.liftSessions);
  const favMoves = useSpoonful((s) => s.favMoves);
  const toggleFavMove = useSpoonful((s) => s.toggleFavMove);
  const body = useSpoonful((s) => s.body);
  const imperial = body.units !== "metric";
  const [tab, setTab] = useState<"about" | "history" | "progress">("about");
  const saved = favMoves.includes(exercise.id);
  const prev = previousLine(sessions, exercise.id);
  const best = bestEpley(sessions, exercise.id);
  const history = useMemo(() => {
    return [...sessions]
      .reverse()
      .flatMap((s) => {
        const line = s.lines.find((l) => l.moveId === exercise.id);
        if (!line) return [];
        const working = line.sets.filter((x) => x.done && !x.warmup);
        if (working.length === 0) return [];
        const top = working.reduce((a, b) => (epley1rm(b.weightKg, b.reps) > epley1rm(a.weightKg, a.reps) ? b : a));
        return [
          {
            date: s.date,
            name: s.name,
            sets: working,
            est: epley1rm(top.weightKg, top.reps),
            volume: working.reduce((n, x) => n + x.weightKg * x.reps, 0),
          },
        ];
      })
      .slice(0, 12);
  }, [sessions, exercise.id]);
  const peak = Math.max(1, ...history.map((h) => h.est));

  async function share() {
    const text = `${exercise.name}\n${exercise.setup}\n${exercise.cues.map((c) => `• ${c}`).join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: exercise.name, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast("Copied cues");
    } catch {
      /* user cancelled */
    }
  }

  function fmt(kg: number) {
    return imperial ? `${Math.round(lbFromKg(kg))} lb` : `${Math.round(kg * 10) / 10} kg`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-stretch">
          <div className="flex h-14 min-w-0 flex-1 items-center justify-between gap-2 px-3">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
              <X />
            </Button>
            <p className="min-w-0 truncate font-display text-xl">{exercise.name}</p>
            <Button
              variant="ghost"
              size="icon"
              aria-label={saved ? "Remove favorite" : "Save exercise"}
              onClick={() => toggleFavMove(exercise.id)}
            >
              <Bookmark className={cn(saved && "fill-current")} />
            </Button>
          </div>
          {isPreviewChrome() ? <div className="pill-slot" aria-hidden /> : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32">
        <div className="flex flex-col items-center rounded-3xl bg-card px-4 py-5 shadow-[var(--shadow-border)]">
          <ExerciseFigure exercise={exercise} size="lg" />
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {exercise.primary.map((id) => MUSCLE_LABEL[id]).join(", ")}
            {exercise.secondary.length ? ` · ${exercise.secondary.map((id) => MUSCLE_LABEL[id]).join(", ")}` : ""}
          </p>
        </div>

        <Button className="mt-3 w-full" variant="spark" onClick={() => void share()}>
          <Share2 /> Share exercise
        </Button>
        <Button
          className="mt-2 w-full"
          variant="secondary"
          onClick={() => toggleFavMove(exercise.id)}
        >
          <Bookmark className={cn(saved && "fill-current")} />
          {saved ? "Saved" : "Add to favorites"}
        </Button>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-card p-1 shadow-[var(--shadow-border)]">
          {(["about", "history", "progress"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-11 rounded-full text-sm capitalize",
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {id}
            </button>
          ))}
        </div>

        {tab === "about" ? (
          <section className="mt-4 space-y-4">
            <p className="text-sm leading-relaxed text-foreground/85">{exercise.setup}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-card px-3 py-1.5 text-xs shadow-[var(--shadow-border)]">
                {EQUIPMENT_LABEL[exercise.equipment]}
              </span>
              <span className="rounded-full bg-card px-3 py-1.5 text-xs shadow-[var(--shadow-border)]">
                {exercise.defaultSets} × {exercise.defaultReps}
              </span>
              <span className="rounded-full bg-card px-3 py-1.5 text-xs shadow-[var(--shadow-border)]">
                {exercise.restSec}s rest
              </span>
            </div>
            <div>
              <h2 className="font-display text-xl">Cues</h2>
              <ul className="mt-2 space-y-2">
                {exercise.cues.map((c) => (
                  <li key={c} className="rounded-2xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-xl">How this hits</h2>
              <div className="mt-3 flex justify-center rounded-3xl bg-card px-4 py-4 shadow-[var(--shadow-border)]">
                <MuscleMap primary={exercise.primary} secondary={exercise.secondary} size="md" />
              </div>
              <div className="mt-2 flex justify-center">
                <MuscleLegend primary={exercise.primary} secondary={exercise.secondary} />
              </div>
            </div>
          </section>
        ) : null}

        {tab === "history" ? (
          <section className="mt-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No working sets yet. Log this from a session and the loads land here.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={`${h.date}-${h.name}`} className="rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{h.date}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">est 1RM {fmt(h.est)}</p>
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {h.sets.map((x) => `${x.reps}×${fmt(x.weightKg)}`).join("  ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {prev ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="size-3.5" /> Last session loaded when you start this move.
              </p>
            ) : null}
          </section>
        ) : null}

        {tab === "progress" ? (
          <section className="mt-4">
            {history.length < 2 ? (
              <p className="text-sm text-muted-foreground">Need two logged sessions before a trend shows.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Estimated 1RM</p>
                <div className="mt-2 flex h-28 items-end gap-1">
                  {[...history].reverse().map((h) => (
                    <div key={`${h.date}-bar`} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                      <span
                        className="w-full rounded-t-md bg-spark"
                        style={{ height: `${18 + (h.est / peak) * 86}px` }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  Best {fmt(best || peak)} · {history.length} sessions
                </p>
              </>
            )}
          </section>
        ) : null}

        {onStart ? (
          <Button className="mt-6 w-full" variant="spark" onClick={() => onStart(exercise.id)}>
            Add to session
          </Button>
        ) : null}
      </div>
    </div>
  );
}
