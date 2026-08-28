import { useEffect } from "react";
import { useSpoonful } from "@/lib/spoonful-store";
import { pushNote } from "@/lib/notify";

export function CelebrateOverlay() {
  const last = useSpoonful((s) => s.lastCelebrate);
  const clear = useSpoonful((s) => s.clearCelebrate);
  const prefs = useSpoonful((s) => s.notifyPrefs);

  useEffect(() => {
    if (!last) return;
    if (prefs.milestones) pushNote(last.title, last.body);
    const id = window.setTimeout(() => clear(), 3200);
    return () => window.clearTimeout(id);
  }, [last, clear, prefs.milestones]);

  if (!last) return null;

  return (
    <div className="pointer-events-none chrome-gutter fixed inset-x-0 top-[max(5.5rem,env(safe-area-inset-top))] z-50 flex justify-start pl-4">
      <div className="celebrate-pop w-full max-w-sm rounded-3xl bg-spark px-5 py-5 text-spark-foreground shadow-[var(--shadow-lift)]">
        <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">Milestone</p>
        <p className="mt-2 font-display text-3xl leading-tight">{last.title}</p>
        <p className="mt-2 text-sm leading-relaxed opacity-90">{last.body}</p>
      </div>
    </div>
  );
}
