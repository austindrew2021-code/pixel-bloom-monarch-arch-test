import { Flame, Share2, Utensils, Wallet, X } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildRecap, recapDue, recapHeadline, recapShareText } from "@/lib/recap";
import { mealSavings } from "@/lib/shield";
import { resolveMeal, useSpoonful } from "@/lib/spoonful-store";
import { shiftWeek, weekDates } from "@/lib/week";
import { cn } from "@/lib/utils";

/**
 * The week, told back.
 *
 * Appears Sunday evening and Monday, once, and only for a week the cook
 * actually cooked in. It is dismissible and it never blocks anything — the
 * point is to be a good moment, not an obstacle between a cook and dinner.
 */
export function WeekRecapCard({ className }: { className?: string }) {
  const weekStart = useSpoonful((s) => s.weekStart);
  const meals = useSpoonful((s) => s.meals);
  const cookedDates = useSpoonful((s) => s.cookedDates);
  const household = useSpoonful((s) => s.household);
  const lastRecapWeek = useSpoonful((s) => s.lastRecapWeek);
  const seeRecap = useSpoonful((s) => s.seeRecap);

  // The week just finished, not the one being planned.
  const past = useMemo(() => shiftWeek(weekStart, -1), [weekStart]);

  const recap = useMemo(() => {
    const dates = new Set(weekDates(past));
    const nights = meals
      .filter((m) => dates.has(m.date) && m.slot === "dinner")
      .map((m) => {
        const resolved = resolveMeal(m);
        return {
          date: m.date,
          title: resolved.title,
          protein: resolved.recipe?.protein,
          saved: resolved.recipe ? mealSavings(resolved.recipe, household) : 0,
          takeout: Boolean(m.skip),
        };
      });
    return buildRecap({ weekStart: past, cookedDates, nights });
  }, [past, meals, cookedDates, household]);

  if (!recapDue({ weekStart: past, lastSeenWeek: lastRecapWeek, recap })) return null;

  async function share() {
    const text = recapShareText(recap);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast("Copied — paste it wherever you like");
    } catch {
      // A cancelled share sheet is not an error worth a toast.
    }
  }

  return (
    <section
      data-testid="week-recap"
      className={cn("rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)]", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Last week</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">{recapHeadline(recap)}</h2>
        </div>
        <button
          type="button"
          aria-label="Dismiss the recap"
          onClick={() => seeRecap(past)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat icon={<Utensils className="size-4" />} label="Cooked" value={`${recap.cooked}`} />
        <Stat icon={<Wallet className="size-4" />} label="Kept" value={`$${recap.saved}`} />
        <Stat icon={<Flame className="size-4" />} label="In a row" value={`${recap.bestRun}`} />
      </dl>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {recap.favourite
          ? `${recap.favourite} came back more than once. ${recap.variety} different proteins on the table.`
          : recap.variety > 1
            ? `${recap.variety} different proteins on the table — no rut in sight.`
            : "Next week is a fresh one."}
        {recap.takeout > 0 ? ` ${recap.takeout} night${recap.takeout === 1 ? "" : "s"} out.` : ""}
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => void share()}>
          <Share2 />
          Share the week
        </Button>
        <Button variant="spark" className="flex-1" onClick={() => seeRecap(past)}>
          Plan this week
        </Button>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background px-2 py-3 shadow-[var(--shadow-border)]">
      <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
