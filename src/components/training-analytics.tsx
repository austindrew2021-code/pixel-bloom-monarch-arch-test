import { bestLifts, liftAnalyticsSummary, weeklyVolumeTrend } from "@/lib/lift";
import { useSpoonful } from "@/lib/spoonful-store";

function fmtKg(kg: number, imperial: boolean): string {
  const shown = imperial ? Math.round(kg * 2.2046226218) : Math.round(kg);
  return `${shown.toLocaleString()} ${imperial ? "lb" : "kg"}`;
}

/**
 * The training-side twin of Shop's savings tracker: a free one-line teaser,
 * and a full Kitchen Table dashboard over PR/volume math (lift.ts) that
 * already runs today with nowhere to show it.
 */
export function TrainingAnalytics({ onOpenStore }: { onOpenStore: () => void }) {
  const liftSessions = useSpoonful((s) => s.liftSessions);
  const hasKitchenTable = useSpoonful((s) => s.hasAddon("kitchen-table"));
  const body = useSpoonful((s) => s.body);
  const imperial = body.units !== "metric";

  const summary = liftAnalyticsSummary(liftSessions);
  if (summary.allTime.sessions === 0) return null;

  if (!hasKitchenTable) {
    return (
      <button
        type="button"
        onClick={onOpenStore}
        className="mt-4 w-full rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
      >
        <p className="text-sm font-medium">
          You've moved {fmtKg(summary.week.volumeKg, imperial)} this week across {summary.week.sessions}{" "}
          session{summary.week.sessions === 1 ? "" : "s"}.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Kitchen Table ($7.99/mo) unlocks the full training dashboard — PR history, best lifts, and a volume trend.
        </p>
      </button>
    );
  }

  const trend = weeklyVolumeTrend(liftSessions);
  const lifts = bestLifts(liftSessions);

  return (
    <section className="mt-4 rounded-3xl bg-spark p-4 text-spark-foreground">
      <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">Training analytics</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <AnalyticsStat label="This week" value={String(summary.week.sessions)} hint={fmtKg(summary.week.volumeKg, imperial)} />
        <AnalyticsStat label="This month" value={String(summary.month.sessions)} hint={fmtKg(summary.month.volumeKg, imperial)} />
        <AnalyticsStat label="All-time PRs" value={String(summary.allTime.prCount)} hint={`${summary.allTime.sessions} sessions`} />
      </div>
      {trend.some((v) => v > 0) ? (
        <div className="mt-4">
          <p className="text-xs opacity-80">Volume, last {trend.length} weeks</p>
          <div className="mt-2 flex h-16 items-end gap-1">
            {trend.map((v, i) => {
              const max = Math.max(1, ...trend);
              const h = 6 + (v / max) * 58;
              return (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                  <span className="w-full rounded-t-md bg-spark-foreground/70" style={{ height: `${h}px` }} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {lifts.length ? (
        <div className="mt-4">
          <p className="text-xs opacity-80">Best lifts</p>
          <ul className="mt-2 divide-y divide-spark-foreground/15">
            {lifts.map((lift) => (
              <li key={lift.moveId} className="flex items-center justify-between py-2 text-sm">
                <span>{lift.name}</span>
                <span className="tabular-nums opacity-90">~{fmtKg(lift.best1rm, imperial)} 1RM</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function AnalyticsStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 truncate font-display text-2xl tabular-nums leading-tight sm:text-3xl">{value}</p>
      <p className="truncate text-xs opacity-80">{hint}</p>
    </div>
  );
}
