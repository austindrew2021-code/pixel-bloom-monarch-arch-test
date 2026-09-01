import { useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { ADDONS } from "@/lib/recipes";
import { STREAK_SAVE_FREE_MONTH } from "@/lib/ranks";
import { useSpoonful } from "@/lib/spoonful-store";
import { brokenStreakInfo } from "@/lib/streak";

const STREAK_SAVE_ADDON = ADDONS.find((a) => a.id === "streak-save")!;

/**
 * Snapchat-style reactive offer: appears only right after a real streak break,
 * never browsable in the Store. Kitchen Table members get a few free saves a
 * month before this ever asks for money.
 */
export function StreakOfferCard() {
  const cookedDates = useSpoonful((s) => s.cookedDates);
  const streakSavedDates = useSpoonful((s) => s.streakSavedDates);
  const streakSaveOfferSeen = useSpoonful((s) => s.streakSaveOfferSeen);
  const streakSaveBonus = useSpoonful((s) => s.streakSaveBonus);
  const streakSaveUsed = useSpoonful((s) => s.streakSaveUsed);
  const unlocked = useSpoonful((s) => s.unlocked);
  const streakSaveRemaining = useSpoonful((s) => s.streakSaveRemaining);
  const applyStreakSave = useSpoonful((s) => s.useStreakSave);
  const dismissStreakOffer = useSpoonful((s) => s.dismissStreakOffer);
  const unlock = useSpoonful((s) => s.unlock);
  const hasAddon = useSpoonful((s) => s.hasAddon);
  const [buying, setBuying] = useState(false);

  // streakSaveBonus/Used/unlocked are read only to keep this reactive to the
  // cap changing — the value itself comes from streakSaveRemaining() below.
  void streakSaveBonus;
  void streakSaveUsed;
  void unlocked;

  const info = brokenStreakInfo(cookedDates, streakSavedDates);
  if (!info || streakSaveOfferSeen.includes(info.brokenDate)) return null;

  const remaining = streakSaveRemaining();
  const table = hasAddon("kitchen-table");

  function save() {
    if (!info) return;
    const ok = applyStreakSave(info.brokenDate);
    toast(ok ? `Streak saved — back to ${info.priorStreak} nights` : "Couldn't save the streak");
    setBuying(false);
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-start px-4"
        style={{ bottom: "calc(4.9rem + env(safe-area-inset-bottom))" }}
      >
        <div
          data-testid="streak-offer"
          className="celebrate-pop pointer-events-auto w-full max-w-sm rounded-3xl bg-card px-5 py-5 shadow-[var(--shadow-lift)] ring-1 ring-border"
        >
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Flame className="size-3.5" /> Streak broken
          </p>
          <p className="mt-2 font-display text-2xl leading-tight">Your {info.priorStreak}-night streak slipped</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {remaining > 0
              ? `You missed cooking last night. Save the streak — you have ${remaining} free save${remaining === 1 ? "" : "s"} left this month.`
              : "You missed cooking last night. This month's free saves are used up."}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => (remaining > 0 ? save() : setBuying(true))}
              className="flex-1 rounded-full bg-spark px-4 py-2.5 text-sm font-semibold text-spark-foreground"
            >
              {remaining > 0 ? "Save my streak — free" : `Save for ${formatPrice(STREAK_SAVE_ADDON.price)}`}
            </button>
            <button
              type="button"
              onClick={() => dismissStreakOffer(info.brokenDate)}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground"
            >
              Let it go
            </button>
          </div>
          {!table ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Kitchen Table members get {STREAK_SAVE_FREE_MONTH} free saves every month.
            </p>
          ) : null}
        </div>
      </div>

      <Sheet open={buying} onOpenChange={setBuying}>
        <SheetContent title="Confirm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">One-time</p>
          <h2 className="mt-2 font-display text-2xl">{STREAK_SAVE_ADDON.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{STREAK_SAVE_ADDON.description}</p>
          <p className="mt-4 font-display text-3xl tabular-nums">
            {formatPrice(STREAK_SAVE_ADDON.price)}
            <span className="text-base font-sans"> once</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            On the App Store and Play Store this is a one-time payment. Nothing is charged in this test kitchen.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                unlock("streak-save");
                save();
              }}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Confirm — {formatPrice(STREAK_SAVE_ADDON.price)}
            </button>
            <button
              type="button"
              onClick={() => setBuying(false)}
              className="w-full rounded-full px-4 py-3 text-sm font-medium text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
