import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryLabel, type ExerciseDbRecord } from "@/lib/exercise-db";
import { isPreviewChrome } from "@/lib/preview-chrome";

/**
 * Renders one exercise from the reference database: form GIF, target/
 * equipment badges, and numbered step-by-step instructions.
 */
export function ExerciseDetailCard({
  exercise,
  onClose,
}: {
  exercise: ExerciseDbRecord;
  onClose: () => void;
}) {
  return (
    <div data-testid="exercise-detail-card" className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-stretch">
          <div className="flex h-14 min-w-0 flex-1 items-center justify-between gap-2 px-3">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
              <X />
            </Button>
            <p className="min-w-0 truncate font-display text-xl capitalize">{exercise.name}</p>
            <div className="size-9" aria-hidden />
          </div>
          {isPreviewChrome() ? <div className="pill-slot" aria-hidden /> : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32">
        <div className="flex flex-col items-center rounded-3xl bg-card p-3 shadow-[var(--shadow-border)]">
          <img
            src={exercise.gif}
            alt={`${exercise.name} demonstration`}
            className="aspect-square w-full max-w-xs rounded-2xl bg-muted object-cover"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-card px-3 py-1.5 text-xs capitalize shadow-[var(--shadow-border)]">
            {categoryLabel(exercise.category)}
          </span>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs capitalize shadow-[var(--shadow-border)]">
            {exercise.equipment}
          </span>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs capitalize shadow-[var(--shadow-border)]">
            Target: {exercise.target}
          </span>
        </div>

        {exercise.secondaryMuscles.length ? (
          <p className="mt-3 text-sm capitalize text-muted-foreground">
            Also works: {exercise.secondaryMuscles.join(", ")}
          </p>
        ) : null}

        <div className="mt-5">
          <h2 className="font-display text-xl">Instructions</h2>
          <ol className="mt-2 space-y-2">
            {exercise.steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl bg-card px-4 py-3 text-sm leading-relaxed shadow-[var(--shadow-border)]"
              >
                <span className="shrink-0 font-display text-spark">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Media © Gym Visual — gymvisual.com
        </p>
      </div>
    </div>
  );
}
