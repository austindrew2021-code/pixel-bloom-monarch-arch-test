import { Check, ChevronDown, Lock, Moon, Play } from "lucide-react";
import { useState } from "react";
import {
  THEME_GROUPS,
  THEMES,
  themesIn,
  type SkinPackId,
  type Theme,
  type ThemeGroup,
  type ThemeId,
} from "@/lib/themes";
import { useSpoonful } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

function SwatchArt({ theme }: { theme: Theme }) {
  if (theme.art) {
    return <img src={theme.art} alt="" className="absolute inset-0 size-full object-cover" />;
  }
  if (theme.id === "brass") {
    return (
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 64" aria-hidden>
        <g fill="none" stroke="#d99a3c" strokeWidth="2.4" opacity="0.55">
          <circle cx="78" cy="14" r="12" strokeDasharray="3.2 3.2" />
          <circle cx="78" cy="14" r="4.5" />
          <circle cx="95" cy="34" r="8" strokeDasharray="2.6 2.6" />
        </g>
      </svg>
    );
  }
  if (theme.id === "neon") {
    return (
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 64" aria-hidden>
        <g stroke="#22e0ff" strokeWidth="0.6" opacity="0.35">
          {[10, 22, 34, 46, 58].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} />
          ))}
        </g>
      </svg>
    );
  }
  if (theme.id === "terminal") {
    return (
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 64" aria-hidden>
        <g stroke="#3dff9a" strokeWidth="1" opacity="0.22">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={i} x1="0" y1={i * 4 + 2} x2="100" y2={i * 4 + 2} />
          ))}
        </g>
      </svg>
    );
  }
  if (theme.id === "aether") {
    return (
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 64" aria-hidden>
        <g fill="none" stroke="#3dffd0" strokeWidth="0.8" opacity="0.55">
          <rect x="6" y="6" width="10" height="10" />
          <rect x="84" y="6" width="10" height="10" />
          <circle cx="78" cy="22" r="10" strokeDasharray="2 3" />
        </g>
      </svg>
    );
  }
  return null;
}

function ThemeCard({
  theme,
  active,
  locked,
  onPick,
}: {
  theme: Theme;
  active: boolean;
  locked: boolean;
  onPick: (id: ThemeId) => void;
}) {
  const [bg, card, accent] = theme.swatch;
  return (
    <button
      type="button"
      onClick={() => onPick(theme.id)}
      aria-pressed={active}
      data-theme={theme.id}
      className={cn("hud-panel flex w-full flex-col p-3 text-left", active ? "ring-2 ring-spark" : "")}
    >
      <span
        className="relative flex h-16 w-full items-end gap-1 overflow-hidden p-2"
        style={{ background: bg }}
        aria-hidden
      >
        <SwatchArt theme={theme} />
        <span className="relative h-8 flex-1 rounded-lg" style={{ background: card }} />
        <span className="relative size-8 shrink-0 rounded-full" style={{ background: accent }} />
        {active ? (
          <span
            className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full"
            style={{ background: accent }}
          >
            <Check className="size-3" style={{ color: bg }} />
          </span>
        ) : null}
        {locked ? (
          <span
            className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground/70"
            aria-label="In a skin pack"
          >
            <Lock className="size-3 text-background" />
          </span>
        ) : null}
      </span>
      <span className="mt-2 flex items-center gap-1.5 text-sm font-medium">{theme.label}</span>
      <span className="mt-0.5 text-xs leading-snug text-muted-foreground">{theme.hint}</span>
    </button>
  );
}

function GroupGrid({
  group,
  theme,
  allowed,
  onPick,
}: {
  group: ThemeGroup;
  theme: ThemeId;
  allowed: (id: ThemeId) => boolean;
  onPick: (id: ThemeId) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {themesIn(group).map((t) => (
        <li key={t.id}>
          <ThemeCard theme={t} active={theme === t.id} locked={!allowed(t.id)} onPick={onPick} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The offer under a locked group. Two ways in and no dark pattern: watch a
 * short for a week of it, or buy the pack outright. The kitchen underneath is
 * identical either way — this is paint.
 */
function PackOffer({
  pack,
  label,
  onWatchForSkins,
  onOpenStore,
}: {
  pack: SkinPackId;
  label: string;
  onWatchForSkins?: (pack: SkinPackId) => void;
  onOpenStore?: () => void;
}) {
  const owned = useSpoonful((s) => s.hasAddon(pack));
  const trials = useSpoonful((s) => s.skinTrials);
  const daysLeft = useSpoonful((s) => s.skinTrialDaysLeft);
  const left = daysLeft(pack);

  if (owned) return null;
  if (left > 0) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {label} on trial — {left} {left === 1 ? "day" : "days"} left.{" "}
        {onOpenStore ? (
          <button type="button" className="font-medium text-spark underline-offset-4 hover:underline" onClick={onOpenStore}>
            Keep them for $3.99
          </button>
        ) : null}
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {onWatchForSkins && !trials[pack] ? (
        <button
          type="button"
          className="hud-btn flex h-10 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-medium"
          onClick={() => onWatchForSkins(pack)}
        >
          <Play className="size-3.5" />
          Watch a short — a week free
        </button>
      ) : null}
      {onOpenStore ? (
        <button
          type="button"
          className="hud-btn hud-btn-on flex h-10 flex-1 items-center justify-center px-3 text-xs font-semibold"
          onClick={onOpenStore}
        >
          Unlock {label} · $3.99
        </button>
      ) : null}
    </div>
  );
}

export function ThemePicker({
  theme,
  onPick,
  onWatch,
  onWatchForSkins,
  onOpenStore,
}: {
  theme: ThemeId;
  onPick: (id: ThemeId) => void;
  onWatch?: () => void;
  onWatchForSkins?: (pack: SkinPackId) => void;
  onOpenStore?: () => void;
}) {
  const [seasonsOpen, setSeasonsOpen] = useState(themesIn("season").some((t) => t.id === theme));
  const current = THEMES.find((t) => t.id === theme);
  const allowed = useSpoonful((s) => s.skinAllowed);
  // Subscribing to both keeps the grid honest the moment a pack is bought or a
  // trial starts; `skinAllowed` itself is a stable function reference.
  useSpoonful((s) => s.unlocked);
  useSpoonful((s) => s.skinTrials);

  return (
    <div className="space-y-5 pb-2">
      {onWatch ? (
        <button type="button" className="hud-btn hud-btn-on flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold" onClick={onWatch}>
          <Moon className="size-4" />
          Watch {current?.label ?? "this look"}
        </button>
      ) : null}
      {THEME_GROUPS.filter((g) => g.id !== "season").map((group) => (
        <section key={group.id}>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">{group.label}</p>
          <p className="mt-0.5 mb-2 text-xs text-muted-foreground">{group.hint}</p>
          <GroupGrid group={group.id} theme={theme} allowed={allowed} onPick={onPick} />
          {group.id === "world" ? (
            <PackOffer
              pack="skins-world"
              label="World skins"
              onWatchForSkins={onWatchForSkins}
              onOpenStore={onOpenStore}
            />
          ) : null}
        </section>
      ))}
      <section>
        <button
          type="button"
          className="hud-btn flex h-12 w-full items-center justify-between px-4 text-left"
          aria-expanded={seasonsOpen}
          onClick={() => setSeasonsOpen((v) => !v)}
        >
          <span>
            <span className="block text-xs font-medium uppercase tracking-[0.14em]">Seasons</span>
            <span className="text-sm">Spring through winter</span>
          </span>
          <ChevronDown className={cn("size-4 transition-transform", seasonsOpen && "rotate-180")} />
        </button>
        {seasonsOpen ? (
          <div className="mt-2">
            <GroupGrid group="season" theme={theme} allowed={allowed} onPick={onPick} />
            <PackOffer
              pack="skins-season"
              label="Season skins"
              onWatchForSkins={onWatchForSkins}
              onOpenStore={onOpenStore}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
