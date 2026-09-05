import { Check, Download, Share, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DeviceSyncCard } from "@/components/device-sync-card";
import { formatPrice } from "@/lib/format";
import { isoDate } from "@/lib/fuel";
import { COUNTRIES, LOCALES, t } from "@/lib/i18n";
import { enablePush } from "@/lib/notify";
import { ADDONS, RECIPES } from "@/lib/recipes";
import { MILESTONES, RANKS, rankProgress } from "@/lib/ranks";
import { ALLERGIES } from "@/lib/shield";
import { useSpoonful } from "@/lib/spoonful-store";
import { TESTER_KEY } from "@/lib/tester";
import type { Addon } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StoreView() {
  const unlock = useSpoonful((s) => s.unlock);
  const hasAddon = useSpoonful((s) => s.hasAddon);
  const household = useSpoonful((s) => s.household);
  const setHousehold = useSpoonful((s) => s.setHousehold);
  const nextGen = useSpoonful((s) => s.nextGen);
  const setNextGen = useSpoonful((s) => s.setNextGen);
  const portionSync = useSpoonful((s) => s.portionSync);
  const setPortionSync = useSpoonful((s) => s.setPortionSync);
  const allergies = useSpoonful((s) => s.allergies);
  const toggleAllergy = useSpoonful((s) => s.toggleAllergy);
  const hidden = useSpoonful((s) => s.hidden);
  const unhideRecipe = useSpoonful((s) => s.unhideRecipe);
  const undoFill = useSpoonful((s) => s.undoFill);
  const undoMeals = useSpoonful((s) => s.undoMeals);
  const xp = useSpoonful((s) => s.xp);
  const seenMilestones = useSpoonful((s) => s.seenMilestones);
  const snapped = useSpoonful((s) => s.snapped);
  const chefRemaining = useSpoonful((s) => s.chefRemaining);
  const notifyPrefs = useSpoonful((s) => s.notifyPrefs);
  const setNotifyPrefs = useSpoonful((s) => s.setNotifyPrefs);
  const dinnerHour = useSpoonful((s) => s.dinnerHour);
  const setDinnerHour = useSpoonful((s) => s.setDinnerHour);
  const locale = useSpoonful((s) => s.locale);
  const country = useSpoonful((s) => s.country);
  const setLocale = useSpoonful((s) => s.setLocale);
  const setCountry = useSpoonful((s) => s.setCountry);
  const rank = rankProgress(xp);
  const table = hasAddon("kitchen-table");
  const [buying, setBuying] = useState<Addon | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const paid = ADDONS.filter((a) => {
    if (a.price <= 0) return false;
    if (table && (a.id === "chef-plus" || a.id === "family")) return false;
    // Streak Save only ever appears on the offer card at the moment a streak
    // actually breaks — not browsable here, so that stays true.
    if (a.id === "streak-save") return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Kitchen</p>
      <h1 className="mt-1 font-display text-4xl" data-tour="extras-head">Extras</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/80">
        The main kitchen is free — recipes, logging, Snap, tonight's plan, and shopping. You only pay if you want extra chef plates or family seats.
      </p>

      <section className="mt-6 rounded-3xl bg-spark p-4 text-spark-foreground">
        <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">Private testing</p>
        <h2 className="mt-1 font-display text-2xl">Kitchen key</h2>
        <p className="mt-1 text-sm opacity-90">
          Only people you give this key to can open Spoonful. Send the link and the key together — never post either in public.
        </p>
        <p className="mt-4 font-display text-3xl tracking-[0.12em]">{TESTER_KEY}</p>
        <Button
          className="mt-4 w-full bg-spark-foreground text-spark hover:opacity-95"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(TESTER_KEY);
              toast("Key copied — send it only to your testers");
            } catch {
              toast(`Write this down: ${TESTER_KEY}`);
            }
          }}
        >
          Copy key
        </Button>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Test as an app</p>
        <h2 className="mt-1 font-display text-2xl">On your phone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Android: tap Download APK below and install Spoonful. iPhone: open this kitchen in Safari, tap Share, then Add to Home Screen. That is the free iPhone app for now.
        </p>
        <Button
          type="button"
          className="mt-4 w-full"
          variant="spark"
          disabled={grabbing}
          onClick={async () => {
            setGrabbing(true);
            try {
              const res = await fetch("/Spoonful-Test.apk");
              if (!res.ok) throw new Error("missing");
              const blob = await res.blob();
              const file = new Blob([blob], { type: "application/vnd.android.package-archive" });
              const url = URL.createObjectURL(file);
              const a = document.createElement("a");
              a.href = url;
              a.download = "Spoonful-Test.apk";
              a.rel = "noopener";
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 4000);
              toast("If nothing saved, tap Download APK again or open GET-THE-APP in the files list");
            } catch {
              toast("Tap the folder next to Preview app → GET-THE-APP → Spoonful-Test.apk");
            } finally {
              setGrabbing(false);
            }
          }}
        >
          <Download className="size-4" />
          {grabbing ? "Preparing APK…" : "Download Android APK"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Open the file, allow install from this source, then enter kitchen key PLATE-8F2R. Meals stay on that phone.
        </p>
        <a
          href="?install=1&platform=ios"
          className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full bg-background px-5 text-sm font-medium shadow-[var(--shadow-border)]"
        >
          <Share className="size-4" />
          iPhone: Add to Home Screen
        </a>
        <p className="mt-2 text-xs text-muted-foreground">
          Safari → Share → Add to Home Screen. It opens full-screen like an app. Same kitchen key.
        </p>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Smartphone className="mt-0.5 size-4 shrink-0" />
          Android Chrome can also use the browser menu → Install app if you open Spoonful in Chrome instead of the APK.
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">{rank.current.title}</p>
        <h2 className="mt-1 font-display text-2xl tabular-nums">{xp} XP</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {rank.next ? `${rank.next.xp - xp} XP to ${rank.next.title}` : "Top of the kitchen"}
        </p>
        <div className="meter mt-3">
          <span className="bg-spark" style={{ width: `${rank.pct}%` }} />
        </div>
        <ol className="mt-4 space-y-1">
          {RANKS.map((r) => {
            const on = r.id === rank.current.id;
            const earned = xp >= r.xp;
            return (
              <li
                key={r.id}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm",
                  on
                    ? "bg-spark text-spark-foreground"
                    : earned
                      ? "bg-background"
                      : "text-muted-foreground",
                )}
              >
                <span className="font-medium">{r.title}</span>
                <span className="tabular-nums">{r.xp} XP</span>
              </li>
            );
          })}
        </ol>
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {MILESTONES.map((m) => {
            const got =
              seenMilestones.includes(m.id) ||
              (m.id === "xp-sous" && xp >= 560) ||
              (m.id === "family-1" && hasAddon("family")) ||
              (m.id === "snap-1" && snapped);
            return (
              <li
                key={m.id}
                className={cn(
                  "rounded-2xl px-3 py-2",
                  got ? "bg-primary text-primary-foreground" : "bg-background",
                )}
              >
                <p className="text-sm font-medium">{m.title}</p>
                <p className={cn("mt-0.5 text-xs", got ? "opacity-80" : "text-muted-foreground")}>
                  {got ? "Earned" : m.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl bg-spark p-4 text-spark-foreground">
        <h2 className="font-display text-2xl">Kitchen mode</h2>
        <p className="mt-1 text-sm opacity-90">
          Simple is large type and Tonight first. Next Gen adds a training week for your body goal, calories and protein, and dinners that rewrite when you train, skip, or miss.
        </p>
        <Button
          className="mt-4 w-full bg-spark-foreground text-spark hover:opacity-95"
          onClick={() => setNextGen(!nextGen)}
        >
          {nextGen ? "Switch to Simple Kitchen" : "Switch to Next Gen"}
        </Button>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl">Portion Sync</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Groceries are bought for the week, so tonight's dish never swaps — Portion Sync just scales how much
              of it you cook: a big-burn day pads the plate with extra produce, a lighter day trims it down to save
              for tomorrow. Free, like the rest of Fuel.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={portionSync}
            onClick={() => setPortionSync(!portionSync)}
            className={cn(
              "h-11 w-16 shrink-0 rounded-full text-xs font-semibold",
              portionSync ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
            )}
          >
            {portionSync ? "On" : "Off"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">{t(locale, "language")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "languageHint")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LOCALES.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => {
                setLocale(loc.id);
                toast(loc.label);
              }}
              className={cn(
                "h-12 min-w-0 truncate rounded-2xl px-2 text-sm",
                locale === loc.id ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              {loc.label}
            </button>
          ))}
        </div>
        <h2 className="mt-5 font-display text-xl">{t(locale, "country")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "countryHint")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCountry(c.id);
                toast(`${c.label} · ${c.hint}`);
              }}
              className={cn(
                "min-h-14 rounded-2xl px-3 py-3 text-left",
                country === c.id ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              <p className="text-sm font-medium">{c.label}</p>
              <p className={cn("mt-0.5 text-xs", country === c.id ? "opacity-80" : "text-muted-foreground")}>{c.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <ul className="mt-6 space-y-3">
        {paid.map((addon) => {
          const pack = addon.id === "plates-15" || addon.id === "plates-40";
          const owned = !pack && hasAddon(addon.id);
          return (
            <li key={addon.id} className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl leading-tight">{addon.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{addon.tagline}</p>
                </div>
                {owned ? (
                  <Badge variant="solid">On</Badge>
                ) : (
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(addon.price)}
                    {addon.period === "month" ? "/mo" : addon.period === "once" ? " once" : ""}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{addon.description}</p>
              {addon.id === "chef-plus" || addon.id === "kitchen-table" ? (
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {chefRemaining()} Chef plates left this week
                </p>
              ) : null}
              <div className="mt-4">
                {owned ? (
                  <p className="flex items-center gap-1.5 text-sm text-primary">
                    <Check className="size-4" /> Ready
                  </p>
                ) : (
                  <Button className="w-full" onClick={() => setBuying(addon)}>
                    {pack ? "Add " : "Start "}
                    {formatPrice(addon.price)}
                    {addon.period === "month" ? "/mo" : addon.period === "once" ? " once" : ""}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Included</p>
        <h2 className="mt-1 font-display text-xl">Body Sync</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Watch, rings, heart, sleep, and water. Always free. Link a device below and tonight plates from the day you actually had.
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Your kitchen follows you</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in. The week, pantry, Fuel, body, and goal save to your account — the same way MyFitnessPal and Lose It keep a log when you change phones. iPhone and Android backups of the app help, but the account is the source of truth for App Store and Google Play. A new phone: sign in, kitchen is there.
        </p>
      </section>

      <div className="mt-6">
        <DeviceSyncCard />
      </div>
      <a
        href="?install=1"
        className="mt-3 inline-flex h-11 items-center rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]"
      >
        Add to Home Screen
      </a>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Live pings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dinner reminder, family table updates, milestone pop-ups, and your rest timer. Each one can be off.
        </p>
        <div className="mt-3 grid gap-2">
          {(
            [
              ["meals", "Tonight changes"],
              ["family", "Family table"],
              ["milestones", "Ranks and streaks"],
              ["dinner", "Dinner-time reminder"],
              ["rest", "Rest timer done"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setNotifyPrefs({ [key]: !notifyPrefs[key] })}
              className={cn(
                "flex min-h-12 items-center justify-between rounded-2xl px-4 text-sm",
                notifyPrefs[key] ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              {label}
              <span className="text-xs">{notifyPrefs[key] ? "On" : "Off"}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="dinner-hour">
            Remind at
          </label>
          <select
            id="dinner-hour"
            className="h-12 min-w-0 flex-1 rounded-xl bg-background px-3 text-base shadow-[var(--shadow-border)]"
            value={dinnerHour}
            onChange={(e) => setDinnerHour(Number(e.target.value) || 18)}
          >
            {Array.from({ length: 8 }, (_, i) => 15 + i).map((h) => (
              <option key={h} value={h}>
                {h}:00
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={async () => {
              const ok = await enablePush();
              toast(ok ? "Notifications allowed" : "Notifications blocked on this device");
            }}
          >
            Allow
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Allergies</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll hide matching recipes from dinner picks and the recipe list.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ALLERGIES.map((a) => {
            const on = allergies.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAllergy(a.id)}
                className={cn(
                  "min-h-14 rounded-2xl px-3 py-3 text-left",
                  on ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
                )}
              >
                <p className="text-sm font-medium">{a.label}</p>
                <p className={cn("mt-0.5 text-xs", on ? "opacity-80" : "text-muted-foreground")}>{a.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {hidden.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Never again</h2>
          <ul className="mt-3 space-y-1">
            {hidden.map((id) => {
              const recipe = RECIPES.find((r) => r.id === id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="min-h-11 w-full rounded-2xl bg-background px-3 text-left text-sm"
                    onClick={() => unhideRecipe(id)}
                  >
                    {recipe?.name ?? id}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {undoMeals ? (
        <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Undo fill</h2>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => toast(undoFill() ? "Fill undone" : "Nothing to undo")}
          >
            Undo last fill
          </Button>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Tour</h2>
        <Button variant="secondary" className="mt-3 w-full" onClick={() => useSpoonful.getState().resetWalkthrough()}>
          Replay the walkthrough
        </Button>
      </section>

      <section className="mt-10 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Household</h2>
        <p className="mt-1 text-sm text-muted-foreground">How many plates you usually set.</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setHousehold(n)}
              className={
                household === n
                  ? "flex size-11 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground"
                  : "flex size-11 items-center justify-center rounded-full bg-background text-sm shadow-[var(--shadow-border)]"
              }
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <Sheet open={buying !== null} onOpenChange={(o) => !o && setBuying(null)}>
        <SheetContent title="Confirm">
          {buying ? (
            <Checkout
              addon={buying}
              onCancel={() => setBuying(null)}
              onConfirm={() => {
                unlock(buying.id);
                const plated =
                  buying.id === "body-sync"
                    ? useSpoonful.getState().meals.find((m) => m.date === isoDate() && m.slot === "dinner")
                    : undefined;
                toast(
                  plated && buying.id === "body-sync"
                    ? `${buying.name} is on — plated from the watch`
                    : `${buying.name} is on`,
                );
                setBuying(null);
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Checkout({
  addon,
  onCancel,
  onConfirm,
}: {
  addon: Addon;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const once = addon.period === "once";
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {once ? "One-time" : "Subscription"}
      </p>
      <h2 className="mt-2 font-display text-2xl">{addon.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{addon.description}</p>
      <p className="mt-4 font-display text-3xl tabular-nums">
        {formatPrice(addon.price)}
        <span className="text-base font-sans">{once ? " once" : "/mo"}</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {once
          ? "On the App Store and Play Store this is a one-time payment. Nothing is charged in this test kitchen."
          : "On the App Store and Play Store this would bill monthly. Cancel any time. Nothing is charged in this test kitchen."}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Button className="w-full" onClick={onConfirm}>
          Start
        </Button>
        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Not now
        </Button>
      </div>
    </div>
  );
}
