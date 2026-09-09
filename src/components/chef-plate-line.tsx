import { Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { KitchenShort } from "@/components/kitchen-short";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { CHEF_FREE_WEEK } from "@/lib/ranks";
import { ADDONS } from "@/lib/recipes";
import { useSpoonful } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

/** The two plate packs that already exist. No new price is invented here. */
const PACK_IDS = ["plates-15", "plates-40"] as const;

/**
 * One honest line after a free Chef plate is used.
 *
 * The whole kitchen stays free — library, Snap, barcode, Fuel, Body Sync, Plan
 * tonight and Shop-from-plan are never behind this. The only thing sold is more
 * Chef plates, and only the packs the store already carries.
 */
export function ChefPlateLine({ onOpenStore, className }: { onOpenStore: () => void; className?: string }) {
  const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
  const hasTable = useSpoonful((s) => s.hasAddon("kitchen-table"));
  // Reading the count subscribes to it; chefRemaining rolls the week over first.
  useSpoonful((s) => s.chefCount);
  const chefRemaining = useSpoonful((s) => s.chefRemaining);
  const earnWatchPlate = useSpoonful((s) => s.earnWatchPlate);
  const lastWatchDate = useSpoonful((s) => s.lastWatchDate);
  const [watching, setWatching] = useState(false);

  // Nothing to say to a cook who has not spent a free plate yet, or to one who
  // already pays for a bigger cap.
  if (hasPlus || hasTable) return null;
  const left = chefRemaining();
  if (left >= CHEF_FREE_WEEK) return null;

  const packs = ADDONS.filter((a) => (PACK_IDS as readonly string[]).includes(a.id));
  const watchedToday = lastWatchDate === new Date().toISOString().slice(0, 10);

  return (
    <div
      data-testid="chef-plate-line"
      className={cn("rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]", className)}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 shrink-0 text-spark" />
        {CHEF_FREE_WEEK} free Chef plates this week. More plates are extra.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {left === 0 ? "You have used all three." : `${left} left. Resets Monday.`} The library, Snap, barcode, and
        tonight's dinner stay free.
      </p>
      {/* A cook out of plates gets a free way back before a paid one. */}
      {left === 0 && !watchedToday ? (
        <Button variant="spark" className="mt-3 w-full" onClick={() => setWatching(true)}>
          <Play />
          Watch a short — one more plate
        </Button>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {packs.map((pack) => (
          <Button key={pack.id} variant="secondary" className="flex-1" onClick={onOpenStore}>
            {pack.name} · {formatPrice(pack.price)}
          </Button>
        ))}
      </div>
      {watching ? (
        <KitchenShort
          reward="one more Chef plate this week"
          onClose={() => setWatching(false)}
          onCollect={() => {
            const ok = earnWatchPlate();
            setWatching(false);
            toast(ok ? "Chef plate is on this week" : "Already collected today");
          }}
        />
      ) : null}
    </div>
  );
}
