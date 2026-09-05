import { BookOpen, CalendarDays, Camera, Droplets, Dumbbell, Palette, Pencil, ShoppingBasket } from "lucide-react";
import { useEffect, useState } from "react";
import { CelebrateOverlay } from "@/components/celebrate";
import { DessertsView } from "@/components/desserts-view";
import { FitView } from "@/components/fit-view";
import { Wordmark } from "@/components/kitchen-hero";
import { Onboarding } from "@/components/onboarding";
import { PeopleView } from "@/components/people-view";
import { PlanView } from "@/components/plan-view";
import { RecipesView } from "@/components/recipes-view";
import { SaucesView } from "@/components/sauces-view";
import { ShopView } from "@/components/shop-view";
import { SnapView } from "@/components/snap-view";
import { StoreView } from "@/components/store-view";
import { StreakOfferCard } from "@/components/streak-offer";
import { TesterGate } from "@/components/tester-gate";
import { ThemeOrnament } from "@/components/theme-ornament";
import { ThemePicker } from "@/components/theme-picker";
import { UsernameGate } from "@/components/username-gate";
import { Walkthrough } from "@/components/walkthrough";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, listNotifications } from "@/lib/community";
import { cookStreak, isoDate } from "@/lib/fuel";
import { htmlLang, t } from "@/lib/i18n";
import { menuById, NAV_MENUS, normalizePins, type NavPinId } from "@/lib/nav";
import { msUntilHour, pushNote } from "@/lib/notify";
import { consumePendingSync, enableAlwaysSync, onBackgroundSync } from "@/lib/background-sync";
import { listenNativeHealth } from "@/lib/native-health";
import { rankForXp } from "@/lib/ranks";
import { loadKitchenState, saveKitchenState } from "@/lib/kitchen-cloud";
import { resolveMeal, useSpoonful, type TabId } from "@/lib/spoonful-store";
import { isTesterUnlocked } from "@/lib/tester";
import { normalizeTheme, themeById } from "@/lib/themes";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { cn } from "@/lib/utils";

function applyChrome() {
  const { theme, nextGen, locale } = useSpoonful.getState();
  document.documentElement.dataset.theme = normalizeTheme(theme);
  document.documentElement.dataset.ease = nextGen ? "next" : "simple";
  document.documentElement.lang = htmlLang(locale);
}

export function SpoonfulApp() {
  const onboarded = useSpoonful((s) => s.onboarded);
  const walkthroughDone = useSpoonful((s) => s.walkthroughDone);
  const tab = useSpoonful((s) => s.tab);
  const setTab = useSpoonful((s) => s.setTab);
  const theme = useSpoonful((s) => s.theme);
  const setTheme = useSpoonful((s) => s.setTheme);
  const nextGen = useSpoonful((s) => s.nextGen);
  const setNextGen = useSpoonful((s) => s.setNextGen);
  const cookedDates = useSpoonful((s) => s.cookedDates);
  const streakSavedDates = useSpoonful((s) => s.streakSavedDates);
  const xp = useSpoonful((s) => s.xp);
  const notifyPrefs = useSpoonful((s) => s.notifyPrefs);
  const dinnerHour = useSpoonful((s) => s.dinnerHour);
  const meals = useSpoonful((s) => s.meals);
  const locale = useSpoonful((s) => s.locale);
  const navPins = useSpoonful((s) => s.navPins);
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<{ username: string } | null | undefined>(undefined);
  const [extras, setExtras] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [editPins, setEditPins] = useState(false);
  const [unread, setUnread] = useState(0);
  const [allowed, setAllowed] = useState(false);
  const [previewChrome, setPreviewChrome] = useState(false);
  const streak = cookStreak([...cookedDates, ...streakSavedDates], isoDate());
  const rank = rankForXp(xp);
  const pins = normalizePins(navPins);

  const tabs: { id: TabId; label: string; icon: typeof CalendarDays }[] = nextGen
    ? [
        { id: "plan", label: t(locale, "plan"), icon: CalendarDays },
        { id: "recipes", label: t(locale, "recipes"), icon: BookOpen },
        { id: "snap", label: t(locale, "snap"), icon: Camera },
        { id: "fit", label: t(locale, "fuel"), icon: Dumbbell },
        { id: "shop", label: t(locale, "shop"), icon: ShoppingBasket },
      ]
    : [
        { id: "plan", label: t(locale, "plan"), icon: CalendarDays },
        { id: "recipes", label: t(locale, "recipes"), icon: BookOpen },
        { id: "snap", label: t(locale, "snap"), icon: Camera },
        { id: "sauces", label: t(locale, "sauces"), icon: Droplets },
        { id: "shop", label: t(locale, "shop"), icon: ShoppingBasket },
      ];

  useEffect(() => {
    setAllowed(isTesterUnlocked());
    setPreviewChrome(isPreviewChrome());
  }, []);

  useEffect(() => {
    void Promise.resolve(useSpoonful.persist.rehydrate()).then(async () => {
      const s = useSpoonful.getState();
      if (!s.fitnessSource) return;
      if (!s.syncAccess) s.setSyncAccess("while-using");
      const always = useSpoonful.getState().syncAccess === "always";
      const pending = await consumePendingSync();
      if (always) {
        await enableAlwaysSync();
        const plated = useSpoonful.getState().syncFitness({ live: false });
        if (plated) pushNote("Tonight is plated", plated);
        return;
      }
      if (pending) useSpoonful.getState().syncFitness({ live: false });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let hydrating = true;
    let timer = 0;
    void loadKitchenState()
      .then((row) => {
        if (row?.json) {
          try {
            const payload = JSON.parse(row.json) as Record<string, unknown>;
            if (payload && typeof payload === "object") {
              useSpoonful.getState().hydrateFromCloud(payload);
            }
          } catch {
            /* keep local kitchen */
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        hydrating = false;
      });
    const unsub = useSpoonful.subscribe(() => {
      if (hydrating) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const payload = useSpoonful.getState().kitchenPayload();
        void saveKitchenState({ data: { json: JSON.stringify(payload) } }).catch(() => {});
      }, 2500);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    return listenNativeHealth((day) => {
      useSpoonful.getState().applyNativeHealth(day);
    });
  }, []);

  useEffect(() => {
    const stop = onBackgroundSync(() => {
      const s = useSpoonful.getState();
      if (!s.fitnessSource || s.syncAccess !== "always") return;
      const plated = s.syncFitness({ live: false });
      if (plated) pushNote("Tonight is plated", plated);
    });
    return stop;
  }, []);

  useEffect(() => {
    if (!onboarded) return;
    const tick = () => {
      const s = useSpoonful.getState();
      if (!s.fitnessSource || s.syncAccess !== "always") return;
      s.syncFitness({ live: true });
    };
    const id = window.setInterval(tick, 40000);
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const s = useSpoonful.getState();
      if (s.fitnessSource && s.syncAccess === "always") s.syncFitness({ live: false });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [onboarded]);

  useEffect(() => {
    applyChrome();
  }, [theme, nextGen, locale]);

  useEffect(() => {
    if (!notifyPrefs.dinner) return;
    const wait = Math.min(msUntilHour(dinnerHour), 12 * 60 * 60 * 1000);
    const id = window.setTimeout(() => {
      const today = isoDate();
      const dinner = useSpoonful.getState().meals.find((m) => m.date === today && m.slot === "dinner");
      const title = dinner ? resolveMeal(dinner).title : "Nothing plated yet";
      pushNote("Tonight", title);
    }, wait);
    return () => window.clearTimeout(id);
  }, [notifyPrefs.dinner, dinnerHour, meals]);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setProfile(null);
      setUnread(0);
      return;
    }
    void getMyProfile()
      .then((p) => setProfile(p))
      .catch(() => setProfile(null));
    void listNotifications()
      .then((rows) => setUnread(rows.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user, isPending, tab]);

  if (!allowed) {
    return <TesterGate onUnlock={() => setAllowed(true)} />;
  }

  if (!onboarded) return <Onboarding />;
  if (user && !user.isDevFallback && profile === null && walkthroughDone) {
    return (
      <UsernameGate
        onDone={() => {
          void getMyProfile().then((p) => setProfile(p ?? undefined));
        }}
      />
    );
  }

  function goPin(id: NavPinId) {
    if (id === "extras") {
      setExtras(true);
      return;
    }
    setExtras(false);
    setTab(id);
  }

  return (
    <div className="min-h-dvh max-w-full overflow-x-clip bg-transparent text-foreground">
      <ThemeOrnament theme={theme} />
      <CelebrateOverlay />
      <StreakOfferCard />
      <header className="pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-center">
          <div className="flex h-14 min-w-0 flex-1 items-center px-4">
            <Wordmark />
          </div>
          {previewChrome ? <div className="pill-slot" aria-hidden /> : null}
        </div>

        <div className="mx-auto max-w-2xl px-4">
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              data-tour="theme"
              onClick={() => setThemeOpen(true)}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]"
              aria-label={`Theme: ${themeById(theme).label}`}
            >
              <Palette className="size-4" />
            </button>
            <button
              type="button"
              data-tour="kitchen-mode"
              onClick={() => setNextGen(!nextGen)}
              className={cn(
                "flex h-12 min-w-0 flex-1 items-center justify-center rounded-full text-base font-semibold",
                nextGen ? "bg-primary text-primary-foreground" : "bg-spark text-spark-foreground",
              )}
              aria-pressed={nextGen}
            >
              {nextGen ? t(locale, "nextGen") : t(locale, "simple")} Kitchen
            </button>
          </div>

          <p className="mt-2 text-center text-sm font-medium text-spark">
            {rank.title}
            {streak > 0 ? ` · ${streak}d` : ""}
          </p>
          <nav className="mt-1 flex items-center gap-1" aria-label="Shortcuts" data-tour="shortcuts">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5">
              {pins.map((id) => {
                const menu = menuById(id);
                if (!menu) return null;
                const Icon = menu.icon;
                const on = id === "extras" ? extras : tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goPin(id)}
                    className={cn(
                      "relative flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
                      on ? "bg-spark text-spark-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={on ? 2.4 : 1.8} />
                    {t(locale, menu.labelKey)}
                    {id === "people" && unread > 0 ? (
                      <span className={cn("size-1.5 rounded-full", on ? "bg-spark-foreground" : "bg-spark")} />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setEditPins(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
              aria-label={t(locale, "editPins")}
            >
              <Pencil className="size-4" />
            </button>
          </nav>
        </div>
      </header>

      {tab === "plan" ? <PlanView onOpenStore={() => setExtras(true)} /> : null}
      {tab === "recipes" ? <RecipesView onOpenStore={() => setExtras(true)} /> : null}
      {tab === "sauces" ? <SaucesView /> : null}
      {tab === "desserts" ? <DessertsView /> : null}
      {tab === "snap" ? <SnapView /> : null}
      {tab === "people" ? <PeopleView /> : null}
      {tab === "fit" ? <FitView onOpenStore={() => setExtras(true)} /> : null}
      {tab === "shop" ? <ShopView onOpenStore={() => setExtras(true)} /> : null}

      {extras ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur">
            <div className="mx-auto flex max-w-2xl items-center">
              <div className="flex h-14 min-w-0 flex-1 items-center justify-between px-4">
                <button type="button" onClick={() => setExtras(false)} className="h-11 text-sm font-medium">
                  {t(locale, "closeExtras")}
                </button>
                <SignedOut>
                  <a href="/login" className="h-11 text-sm font-medium text-spark">
                    Sign in
                  </a>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
              {previewChrome ? <div className="pill-slot" aria-hidden /> : null}
            </div>
          </div>
          <StoreView />
        </div>
      ) : null}

      <Sheet open={editPins} onOpenChange={setEditPins}>
        <SheetContent title={t(locale, "editPins")}>
          <PinEditor onDone={() => setEditPins(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={themeOpen} onOpenChange={setThemeOpen}>
        <SheetContent title="Kitchen look">
          <ThemePicker theme={theme} onPick={setTheme} />
        </SheetContent>
      </Sheet>

      {!walkthroughDone ? <Walkthrough onExtras={setExtras} /> : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 overflow-visible border-t border-border bg-card/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end">
          {tabs.map((item) => {
            const Icon = item.icon;
            const on = tab === item.id;
            const snap = item.id === "snap";
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  data-tour={`nav-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "relative flex h-[4.35rem] w-full min-w-0 flex-col items-center justify-end gap-1 pb-1.5 text-[11px] font-semibold leading-none",
                    on && snap && "text-spark-foreground",
                    on && !snap && "text-primary",
                    !on && snap && "text-spark-foreground",
                    !on && !snap && "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center",
                      snap && "nav-snap-icon rounded-full bg-spark text-spark-foreground",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={on ? 2.4 : 1.8} />
                  </span>
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function PinEditor({ onDone }: { onDone: () => void }) {
  const locale = useSpoonful((s) => s.locale);
  const navPins = useSpoonful((s) => s.navPins);
  const togglePin = useSpoonful((s) => s.togglePin);
  const pins = normalizePins(navPins);

  return (
    <div className="pb-4 pt-1">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">{t(locale, "editPins")}</p>
      <h2 className="mt-1 font-display text-2xl">Shortcuts</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(locale, "pinHint")}</p>
      <p className="mt-1 text-xs tabular-nums text-muted-foreground">{pins.length} / 6</p>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {NAV_MENUS.map((menu) => {
          const on = pins.includes(menu.id);
          const Icon = menu.icon;
          const full = !on && pins.length >= 6;
          return (
            <li key={menu.id}>
              <button
                type="button"
                disabled={full}
                onClick={() => togglePin(menu.id)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm",
                  on ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">{t(locale, menu.labelKey)}</span>
                <span className="text-xs">{on ? "Pinned" : full ? "Max 6" : "Add"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button className="mt-5 w-full" onClick={onDone}>
        {t(locale, "donePins")}
      </Button>
    </div>
  );
}
