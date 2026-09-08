import { ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveMeal, useSpoonful } from "@/lib/spoonful-store";
import { isoDate } from "@/lib/fuel";
import { THEMES, themeById, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function SkyView({ onClose }: { onClose: () => void }) {
  const theme = useSpoonful((s) => s.theme);
  const setTheme = useSpoonful((s) => s.setTheme);
  const meals = useSpoonful((s) => s.meals);
  const look = themeById(theme);
  const [tour, setTour] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.documentElement.dataset.sky = "1";
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      delete document.documentElement.dataset.sky;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!tour) return;
    const id = window.setInterval(() => {
      const i = THEMES.findIndex((t) => t.id === useSpoonful.getState().theme);
      const next = THEMES[(i + 1) % THEMES.length];
      if (next) useSpoonful.getState().setTheme(next.id);
    }, 9000);
    return () => window.clearInterval(id);
  }, [tour]);

  const tonight = meals.find((m) => m.date === isoDate() && m.slot === "dinner" && !m.skip);
  const dinner = tonight ? resolveMeal(tonight).title : "Nothing plated yet";
  const hh = now.getHours() % 12 || 12;
  const mm = String(now.getMinutes()).padStart(2, "0");
  const time = `${hh}:${mm}`;
  const idx = Math.max(0, THEMES.findIndex((t) => t.id === theme));

  function step(dir: number) {
    setTour(false);
    const next = THEMES[(idx + dir + THEMES.length) % THEMES.length];
    if (next) setTheme(next.id);
  }

  function pick(id: ThemeId) {
    setTour(false);
    setTheme(id);
  }

  return (
    <div className="sky-view" role="dialog" aria-label={`${look.label} look`}>
      <button type="button" className="sky-view__hit" onClick={onClose} aria-label="Back to the kitchen" />
      <header className="sky-view__top">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-spark">{look.group}</p>
        <h1 className="font-display text-4xl leading-none">{look.label}</h1>
        <p className="mt-1 max-w-xs text-sm text-foreground/80">{look.hint}</p>
      </header>
      <div className="sky-view__clock">
        <p className="font-display text-5xl tabular-nums leading-none">{time}</p>
        <p className="mt-2 text-sm text-foreground/80">Tonight · {dinner}</p>
      </div>
      <footer className="sky-view__bar">
        <div className="flex items-center gap-2">
          <button type="button" className="hud-btn hud-btn-icon size-11" onClick={() => step(-1)} aria-label="Previous look">
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className={cn("hud-btn h-11 flex-1 px-3 text-sm font-medium", tour && "hud-btn-on")}
            onClick={() => setTour((v) => !v)}
          >
            {tour ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
            {tour ? "Stop tour" : "Tour every look"}
          </button>
          <button type="button" className="hud-btn hud-btn-icon size-11" onClick={() => step(1)} aria-label="Next look">
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="sky-view__dots" role="tablist" aria-label="Looks">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === theme}
              aria-label={t.label}
              className={cn("sky-view__dot", t.id === theme && "is-on")}
              style={{ background: t.swatch[2] }}
              onClick={() => pick(t.id)}
            />
          ))}
        </div>
        <button type="button" className="hud-btn hud-btn-on mt-3 h-12 w-full text-sm font-semibold" onClick={onClose}>
          Back to the kitchen
        </button>
      </footer>
    </div>
  );
}
