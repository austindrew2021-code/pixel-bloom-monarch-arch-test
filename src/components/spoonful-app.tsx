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
import { SkyView } from "@/components/sky-view";
import { GlyphFrame } from "@/components/theme-glyphs";
import { TrainView } from "@/components/train-view";
import { UsernameGate } from "@/components/username-gate";
import { Walkthrough } from "@/components/walkthrough";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, listNotifications } from "@/lib/community";
import { coachPulse, coachSay, markCoachPing } from "@/lib/coach";
import { cookStreak, isoDate } from "@/lib/fuel";
import { htmlLang, t } from "@/lib/i18n";
import { menuById, NAV_MENUS, normalizePins, type NavPinId } from "@/lib/nav";
import { msUntilHour, pushNote } from "@/lib/notify";
import { resolveStatus } from "@/lib/program";
import { toast } from "sonner";
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
  const look = themeById(normalizeTheme(theme));
  const root = document.documentElement;
  root.dataset.theme = look.id;
  root.dataset.ease = nextGen ? "next" : "simple";
  root.dataset.art = look.art ? "1" : "0";
  root.lang = htmlLang(locale);
}

export function SpoonfulApp() {
  const onboarded = useSpoonful((s) => s.onboarded);
  const walkthroughOpen = useSpoonful((s) => s.walkthroughOpen);
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
  const planUpdates = useSpoonful((s) => s.planUpdates);
  const markPlanUpdatesRead = useSpoonful((s) => s.markPlanUpdatesRead);
  const focusLock = useSpoonful((s) => s.focusLock);
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<{ username: string } | null | undefined>(undefined);
  const [extras, setExtras] = useState(false);
  const [skyOpen, setSkyOpen] = useState(false);
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
    return useSpoonful.subscribe(() => applyChrome());
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
    const tick = () => {
      const s = useSpoonful.getState();
      if (!s.coach.on) return;
      const today = isoDate();
      const session = s.programWeek?.sessions.find((row) => row.date === today);
      const todayStatus =
        !session || session.kind === "rest"
          ? "none"
          : resolveStatus(session, today);
      const event = coachPulse({
        prefs: s.coach,
        day: today,
        hour: new Date().getHours(),
        dinnerHour: s.dinnerHour,
        todayStatus,
        hasDinner: s.meals.some((m) => m.date === today && m.slot === "dinner" && !m.skip),
        hasSnack: s.snacks.some((x) => x.date === today),
      });
      if (!event) return;
      const line = coachSay(event, s.coach, { locale: s.locale });
      s.setCoach(markCoachPing(s.coach, event, today));
      if (line) toast(line);
    };
    tick();
    const id = window.setInterval(tick, 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

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

  const look = themeById(theme);
  const shellStyle = { backgroundColor: look.swatch[0] };

  if (!allowed) {
    return (
      <div className="relative min-h-dvh text-foreground" data-theme={look.id} style={shellStyle}>
        <TesterGate onUnlock={() => setAllowed(true)} />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <div className="relative min-h-dvh text-foreground" data-theme={look.id} style={shellStyle}>
        <Onboarding />
      </div>
    );
  }
  if (user && !user.isDevFallback && profile === null) {
    return (
      <div className="relative min-h-dvh text-foreground" data-theme={look.id} style={shellStyle}>
        <UsernameGate
          onDone={() => {
            void getMyProfile().then((p) => setProfile(p ?? undefined));
          }}
        />
      </div>
    );
  }

  function goPin(id: NavPinId) {
    if (id === "extras") {
      setExtras(true);
      return;
    }
    if (id === "sky") {
      setSkyOpen(true);
      setExtras(false);
      return;
    }
    setExtras(false);
    setTab(id);
  }

  return (
    <div
      className="relative min-h-dvh max-w-full overflow-x-clip text-foreground"
      data-theme={look.id}
      style={shellStyle}
    >
      <ThemeOrnament theme={theme} />
      {skyOpen ? (
        <SkyView
          onClose={() => {
            setSkyOpen(false);
            setThemeOpen(false);
          }}
        />
      ) : (
      <div className="relative z-10 min-h-dvh bg-transparent">
      <CelebrateOverlay />
      <KitchenUpdateBanner
        latest={planUpdates[0]}
        visible={planUpdates.length > 0 && tab !== "plan" && extras === false && focusLock <= 0}
        onSeePlan={() => setTab("plan")}
        onDismiss={markPlanUpdatesRead}
      />
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
              className="hud-btn hud-btn-icon size-12 shrink-0"
              aria-label={`Theme: ${themeById(theme).label}`}
            >
              <GlyphFrame theme={theme}>
                <Palette className="size-4" />
              </GlyphFrame>
            </button>
            <button
              type="button"
              data-tour="kitchen-mode"
              onClick={() => setNextGen(!nextGen)}
              className={cn(
                "hud-btn h-12 min-w-0 flex-1 text-base font-semibold",
                nextGen ? "hud-btn-on" : "",
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
                const on = id === "extras" ? extras : id === "sky" ? skyOpen : tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goPin(id)}
                    className={cn(
                      "hud-chip relative flex h-11 shrink-0 items-center gap-1.5 px-3 text-sm font-medium",
                      on && "hud-chip-on",
                    )}
                  >
                    <GlyphFrame theme={theme} on={on} className="size-7">
                      <Icon className="size-3.5" strokeWidth={on ? 2.4 : 1.8} />
                    </GlyphFrame>
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
              className="hud-btn hud-btn-icon size-11 shrink-0"
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
          <ThemePicker
            theme={theme}
            onPick={setTheme}
            onWatch={() => {
              setThemeOpen(false);
              setSkyOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {walkthroughOpen ? <Walkthrough onExtras={setExtras} /> : null}

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
                      "relative flex size-11 items-center justify-center",
                      snap && "nav-snap-icon rounded-full bg-spark text-spark-foreground",
                    )}
                  >
                    {snap ? (
                      <Icon className="size-5" strokeWidth={on ? 2.4 : 1.8} />
                    ) : (
                      <GlyphFrame theme={theme} on={on}>
                        <Icon className="size-5" strokeWidth={on ? 2.4 : 1.8} />
                      </GlyphFrame>
                    )}
                    {item.id === "plan" && planUpdates.length > 0 ? (
                      <span
                        className="absolute right-1 top-1 size-2 rounded-full bg-spark"
                        data-testid="plan-updates-dot"
                      />
                    ) : null}
                  </span>
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>
      )}
      {tab === "train" && !skyOpen ? (
        <div className="train-hud-screen">
          <TrainView onOpenStore={() => setExtras(true)} />
        </div>
      ) : null}
    </div>
  );
}

function KitchenUpdateBanner({
  latest,
  visible,
  onSeePlan,
  onDismiss,
}: {
  latest?: { toName: string; why: string };
  visible: boolean;
  onSeePlan: () => void;
  onDismiss: () => void;
}) {
  if (!visible || !latest) return null;
  return (
    <div className="chrome-gutter pointer-events-none fixed inset-x-0 top-[max(5.5rem,env(safe-area-inset-top))] z-40 flex justify-start px-4">
      <div
        className="pointer-events-auto w-full max-w-sm rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)]"
        data-testid="kitchen-update-banner"
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Updates</p>
        <p className="mt-1 font-display text-xl leading-tight">{latest.toName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{latest.why}</p>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" variant="spark" onClick={onSeePlan}>
            See Plan
          </Button>
          <Button className="flex-1" variant="secondary" onClick={onDismiss}>
            Got it
          </Button>
        </div>
      </div>
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
