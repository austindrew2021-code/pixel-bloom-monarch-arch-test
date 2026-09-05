import { useEffect } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { useSpoonful } from "@/lib/spoonful-store";
import { pushNote } from "@/lib/notify";
import { isWorkoutCelebration } from "@/lib/ranks";

export function CelebrateOverlay() {
  const last = useSpoonful((s) => s.lastCelebrate);
  const clear = useSpoonful((s) => s.clearCelebrate);
  const share = useSpoonful((s) => s.shareCelebration);
  const prefs = useSpoonful((s) => s.notifyPrefs);
  const focusLock = useSpoonful((s) => s.focusLock);
  const shareable = last ? isWorkoutCelebration(last.id) : false;

  useEffect(() => {
    if (!last || focusLock > 0) return;
    if (prefs.milestones) pushNote(last.title, last.body);
    const id = window.setTimeout(() => clear(), shareable ? 6000 : 3200);
    return () => window.clearTimeout(id);
  }, [last, clear, prefs.milestones, shareable, focusLock]);

  if (!last || focusLock > 0) return null;

  return (
    <div className="pointer-events-none chrome-gutter fixed inset-x-0 top-[max(5.5rem,env(safe-area-inset-top))] z-50 flex justify-start pl-4">
      <div className="celebrate-pop pointer-events-auto w-full max-w-sm rounded-3xl bg-spark px-5 py-5 text-spark-foreground shadow-[var(--shadow-lift)]">
        <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">Milestone</p>
        <p className="mt-2 font-display text-3xl leading-tight">{last.title}</p>
        <p className="mt-2 text-sm leading-relaxed opacity-90">{last.body}</p>
        {shareable ? (
          <button
            type="button"
            onClick={async () => {
              const ok = await share();
              toast(ok ? "Shared with your followers" : "Sign in to share with followers");
            }}
            className="mt-3 flex items-center gap-1.5 rounded-full bg-spark-foreground/15 px-3 py-1.5 text-xs font-medium"
          >
            <Share2 className="size-3.5" /> Share with followers
          </button>
        ) : null}
      </div>
    </div>
  );
}
