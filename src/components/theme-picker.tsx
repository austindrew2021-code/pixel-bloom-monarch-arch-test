import { Check } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Theme cards preview their own palette rather than describing it: each
 * swatch is painted in that theme's real background/card/accent, so the
 * choice is visible before you commit to it.
 */
export function ThemePicker({
  theme,
  onPick,
}: {
  theme: ThemeId;
  onPick: (id: ThemeId) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 pb-2">
      {THEMES.map((t) => {
        const active = theme === t.id;
        const [bg, card, accent] = t.swatch;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t.id)}
              aria-pressed={active}
              className={cn(
                "flex w-full flex-col rounded-3xl p-3 text-left",
                active ? "bg-card ring-2 ring-spark" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              <span
                className="relative flex h-16 w-full items-end gap-1 overflow-hidden rounded-2xl p-2"
                style={{ background: bg }}
                aria-hidden
              >
                <span className="h-8 flex-1 rounded-lg" style={{ background: card }} />
                <span className="size-8 shrink-0 rounded-full" style={{ background: accent }} />
                {active ? (
                  <span
                    className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full"
                    style={{ background: accent }}
                  >
                    <Check className="size-3" style={{ color: bg }} />
                  </span>
                ) : null}
              </span>
              <span className="mt-2 text-sm font-medium">{t.label}</span>
              <span className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.hint}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
