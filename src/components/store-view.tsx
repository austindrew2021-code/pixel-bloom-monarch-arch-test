import { Check, Copy, Download, Play, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DeviceSyncCard } from "@/components/device-sync-card";
import { formatPrice } from "@/lib/format";
import { isoDate } from "@/lib/fuel";
import { interacMemo } from "@/lib/gift";
import { seatCap as seatsFor } from "@/lib/access";
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
  const [watching, setWatching] = useState(false);
  const [secs, setSecs] = useState(12);
  const lastWatchDate = useSpoonful((s) => s.lastWatchDate);
  const earnWatchPlate = useSpoonful((s) => s.earnWatchPlate);
  const inviteClaimed = useSpoonful((s) => s.inviteClaimed);
  const claimInvitePlate = useSpoonful((s) => s.claimInvitePlate);
  const claimGiftCode = useSpoonful((s) => s.claimGiftCode);
  const lastGiftCode = useSpoonful((s) => s.lastGiftCode);
  const giftCodes = useSpoonful((s) => s.giftCodes);
  const giftTableUntil = useSpoonful((s) => s.giftTableUntil);
  const unlocked = useSpoonful((s) => s.unlocked);
  const [giftIn, setGiftIn] = useState("");
  const watchedToday = lastWatchDate === isoDate();
  const cap = seatsFor(unlocked);
  const paid = ADDONS.filter((a) => {
    if (a.price <= 0) return false;
    if (table && (a.id === "chef-plus" || a.id === "family" || a.id === "kitchen-table" || a.id === "table-year"))
      return false;
    if (a.id === "streak-save" || a.id === "family" || a.id === "table-year") return false;
    return true;
  });
  const yearTable = ADDONS.find((a) => a.id === "table-year")!;

  useEffect(() => {
    if (!watching) return;
    setSecs(12);
    const t = window.setInterval(() => {
      setSecs((n) => {
        if (n <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [watching]);

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Kitchen</p>
      <h1 className="mt-1 font-display text-4xl" data-tour="extras-head">Extras</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/80">
        The main kitchen is free — recipes, tonight, shopping, leftover lunches, and Fill cart. You only pay for extra chef plates, a family table, a gift, or a team. Watch a short for a plate. Interac memo is on every paid extra so Atlantic kitchens can pay without a store cut.
      </p>

      <section className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Earn a plate</p>
        <h2 className="mt-1 font-display text-2xl">Watch a short</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One 12-second kitchen short a day. You get a chef plate. Dinner, shop, and cook stay ad-free — always. When ads go live, this same button is how we pay Chef.
        </p>
        <Button
          className="mt-4 w-full"
          variant={watchedToday ? "secondary" : "spark"}
          disabled={watchedToday}
          onClick={() => setWatching(true)}
        >
          <Play className="size-4" />
          {watchedToday ? "Back tomorrow" : "Watch for a chef plate"}
        </Button>
        <Button
          className="mt-2 w-full"
          variant="secondary"
          disabled={inviteClaimed}
          onClick={async () => {
            const text = "Dinner, the shop, and the gym in one kitchen — Spoonful. Ask me for a key.";
            try {
              await navigator.clipboard.writeText(text);
            } catch {
              /* private mode */
            }
            const ok = claimInvitePlate();
            toast(ok ? "Invite copied — one chef plate is on this week" : "Invite already claimed");
          }}
        >
          <Share className="size-4" />
          {inviteClaimed ? "Invite already used" : "Copy invite · earn a plate"}
        </Button>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const ok = claimGiftCode(giftIn);
            toast(ok ? "Kitchen Table is on for 30 days" : "That code is not a gift, or it's already used here");
            if (ok) setGiftIn("");
          }}
        >
          <Input
            value={giftIn}
            onChange={(e) => setGiftIn(e.target.value)}
            placeholder="GIFT-·····"
            aria-label="Gift code"
          />
          <Button type="submit" variant="secondary">
            Claim
          </Button>
        </form>
        {giftTableUntil ? (
          <p className="mt-2 text-xs text-muted-foreground">Gifted Table through {giftTableUntil}.</p>
        ) : null}
        {lastGiftCode ? (
          <button
            type="button"
            className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl bg-background px-3 text-left text-sm shadow-[var(--shadow-border)]"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `A month of Spoonful Kitchen Table — code ${lastGiftCode}. Open Extras and type it under Earn a plate.`,
                );
                toast("Gift copied");
              } catch {
                toast(lastGiftCode);
              }
            }}
          >
            <span>
              Last gift · <span className="font-medium tracking-wide">{lastGiftCode}</span>
            </span>
            <Copy className="size-4 text-muted-foreground" />
          </button>
        ) : null}
        {giftCodes.length > 1 ? (
          <p className="mt-2 text-xs text-muted-foreground">{giftCodes.length} gifts minted on this kitchen.</p>
        ) : null}
      </section>

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
          Android: download the small Spoonful APK and tap Update (same signing as the app already on the phone). iPhone: open this kitchen in Safari, tap Share, then Add to Home Screen.
        </p>
        <a
          href="/Spoonful-Test.apk"
          download="Spoonful-Test.apk"
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-spark px-5 text-sm font-medium text-spark-foreground shadow-[var(--shadow-lift)]"
          onClick={() =>
            toast("Saving Spoonful-Test.apk. Open the file and tap Update — do not uninstall.")
          }
        >
          <Download className="size-4" />
          Download Android APK
        </a>
        <p className="mt-2 text-xs text-muted-foreground">
          If the preview blocks the file, open the folder next to Preview → GET-THE-APP → Spoonful-Test.apk. Allow install from this source, then kitchen key PLATE-8F2R.
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
        {paid.map((addon, i) => {
          const pack =
            addon.id === "plates-15" ||
            addon.id === "plates-40" ||
            addon.id === "sos-3" ||
            addon.id === "gift-table" ||
            addon.id.startsWith("tip-");
          const owned = !pack && hasAddon(addon.id);
          const group = extraGroup(addon.id);
          const prev = i > 0 ? extraGroup(paid[i - 1]!.id) : "";
          return (
            <li key={addon.id}>
              {group && group !== prev ? (
                <p className="mb-2 mt-2 text-xs font-medium uppercase tracking-[0.14em] text-spark">{group}</p>
              ) : null}
              <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
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
                ) : addon.id === "kitchen-table" ? (
                  <div className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => setBuying(addon)}>
                      Start {formatPrice(addon.price)}/mo
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => setBuying(yearTable)}>
                      Or {formatPrice(yearTable.price)}/year · two months free
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setBuying(addon)}>
                    {pack ? "Add " : "Start "}
                    {formatPrice(addon.price)}
                    {addon.period === "month" ? "/mo" : addon.period === "once" ? " once" : ""}
                  </Button>
                )}
              </div>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: cap }, (_, i) => i + 1).map((n) => (
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
                  buying.id === "tip-flour" || buying.id === "tip-butter"
                    ? "Thank you — plates are on this week"
                    : buying.id === "founder"
                      ? "Founder kitchen is on — Table for life in this test kitchen"
                      : buying.id === "table-year"
                        ? "Kitchen Table is on for a year in this test kitchen"
                        : buying.id === "gift-table"
                          ? `Gift code ${useSpoonful.getState().lastGiftCode} — send it, they claim in Extras`
                          : buying.id === "trainer"
                            ? "Trainer kitchen is on — 8 client seats"
                            : buying.id === "team-kitchen"
                              ? "Team kitchen is on — 12 seats this season"
                              : buying.id === "sos-3"
                                ? "Three SOS plates are on this week"
                        : plated && buying.id === "body-sync"
                        ? `${buying.name} is on — plated from the watch`
                        : `${buying.name} is on`,
                );
                setBuying(null);
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      {watching ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-[var(--shadow-lift)]">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Kitchen short</p>
            <h2 className="mt-1 font-display text-2xl">Tonight still happens</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A quiet 12 seconds. No pop-ups in cook or shop — ever. Collect at the end for one chef plate this week.
            </p>
            <div className="relative mt-4 overflow-hidden rounded-2xl bg-foreground px-4 py-10 text-center text-background">
              <p className="font-display text-4xl tabular-nums">{secs}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-70">
                {secs > 0 ? "Stay with the kitchen" : "Ready"}
              </p>
            </div>
            {secs > 0 ? (
              <Button variant="ghost" className="mt-4 w-full" onClick={() => setWatching(false)}>
                Skip — no plate
              </Button>
            ) : (
              <Button
                variant="spark"
                className="mt-4 w-full"
                onClick={() => {
                  const ok = earnWatchPlate();
                  setWatching(false);
                  toast(ok ? "Chef plate is on this week" : "Already collected today");
                }}
              >
                Collect chef plate
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function extraGroup(id: string): string {
  if (id === "kitchen-table" || id === "chef-plus") return "The bill";
  if (id === "founder") return "Lifetime";
  if (id === "trainer" || id === "team-kitchen" || id === "gift-table") return "For the house";
  if (id.startsWith("tip-")) return "Thank the kitchen";
  if (id.startsWith("plates-") || id === "sos-3") return "This week";
  return "";
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
  const year = addon.id === "table-year";
  const country = useSpoonful((s) => s.country);
  const memo = interacMemo(addon.name, TESTER_KEY);
  const interac = country === "CA";
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {year ? "Year" : addon.id === "team-kitchen" ? "Season" : once ? "One-time" : "Subscription"}
      </p>
      <h2 className="mt-2 font-display text-2xl">{addon.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{addon.description}</p>
      <p className="mt-4 font-display text-3xl tabular-nums">
        {formatPrice(addon.price)}
        <span className="text-base font-sans">
          {year ? "/year" : addon.id === "team-kitchen" ? " a season" : once ? " once" : "/mo"}
        </span>
      </p>
      {interac ? (
        <div className="mt-4 rounded-2xl bg-background p-3 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Interac e-Transfer</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send {formatPrice(addon.price)} to the Interac email that came with your kitchen key. Paste this memo so we know it's you.
          </p>
          <button
            type="button"
            className="mt-3 flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl bg-card px-3 text-left text-sm shadow-[var(--shadow-border)]"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(memo);
                toast("Memo copied");
              } catch {
                toast(memo);
              }
            }}
          >
            <span className="min-w-0 truncate font-medium tracking-wide">{memo}</span>
            <Copy className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {year
          ? "Twelve months of Kitchen Table. Two months free versus monthly. This test kitchen unlocks now — Interac is how Atlantic kitchens will pay without a store cut."
          : addon.id === "founder"
            ? "Lifetime Table. The one that never comes back. This test kitchen unlocks now; Interac is the real bill when you send it."
            : once
              ? "One-time. Nothing is charged in this test kitchen. Interac memo is ready so the money can land when billing is live."
              : "Monthly when billing is live. Cancel any time. Nothing is charged in this test kitchen."}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Button className="w-full" onClick={onConfirm}>
          {interac ? "I've sent it" : "Start"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Not now
        </Button>
      </div>
    </div>
  );
}
