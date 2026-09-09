import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * The kitchen short: twelve quiet seconds a cook chooses to watch, in exchange
 * for something small.
 *
 * The promise this component exists to keep is the one printed on it — no
 * pop-ups in cook or shop, ever. It is only ever mounted from a tap: Extras,
 * the skin picker, the streak offer. It never appears on its own, it can always
 * be skipped, and skipping costs nothing but the reward.
 *
 * One component for every reward surface so that promise cannot drift. If a
 * short ever shows up somewhere uninvited, it is a call site to fix, not a
 * second player to audit.
 */
export function KitchenShort({
  /** What the cook gets. One short line, in their words, not ours. */
  reward,
  headline = "Tonight still happens",
  seconds = 12,
  onCollect,
  onClose,
}: {
  reward: string;
  headline?: string;
  seconds?: number;
  onCollect: () => void;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
    const id = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Kitchen short"
    >
      <div className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-[var(--shadow-lift)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Kitchen short</p>
        <h2 className="mt-1 font-display text-2xl">{headline}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A quiet {seconds} seconds. No pop-ups in cook or shop — ever. Collect at the end for {reward}.
        </p>
        <div className="relative mt-4 overflow-hidden rounded-2xl bg-foreground px-4 py-10 text-center text-background">
          <p className="font-display text-4xl tabular-nums">{left}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-70">
            {left > 0 ? "Stay with the kitchen" : "Ready"}
          </p>
        </div>
        {left > 0 ? (
          <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
            Skip — no reward
          </Button>
        ) : (
          <Button variant="spark" className="mt-4 w-full" onClick={onCollect}>
            Collect
          </Button>
        )}
      </div>
    </div>
  );
}
