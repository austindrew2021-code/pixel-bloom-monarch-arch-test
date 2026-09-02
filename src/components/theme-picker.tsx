import { Check } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * A hint of each theme's ornament inside its swatch, so the themes that carry
 * real art advertise it rather than looking like another two-tone palette.
 */
function SwatchArt({ id }: { id: ThemeId }) {
  if (id === "brass") {
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
  if (id === "nebula") {
    return (
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 64" aria-hidden>
        <defs>
          <filter id="swatch-neb" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="4" />
            <feGaussianBlur stdDeviation="2" />
            <feColorMatrix
              type="matrix"
              values="0.9 0 0.5 0 0.05  0.1 0.4 0.6 0 0.02  1 0.2 0.9 0 0.12  0 0 0 0.8 -0.15"
            />
          </filter>
        </defs>
        <rect width="100" height="64" filter="url(#swatch-neb)" opacity="0.75" />
        <g fill="#fff">
          {[
            [12, 9, 0.9],
            [34, 20, 0.7],
            [58, 8, 1],
            [82, 26, 0.8],
            [23, 43, 0.7],
            [68, 47, 0.9],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity="0.75" />
          ))}
        </g>
      </svg>
    );
  }
  if (id === "neon") {
    return (
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 64" aria-hidden>
        <g stroke="#22e0ff" strokeWidth="0.6" opacity="0.35">
          {[10, 22, 34, 46, 58].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} />
          ))}
          {[14, 34, 54, 74, 94].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="64" />
          ))}
        </g>
        <path d="M62 4 L54 26 L64 26 L56 46" fill="none" stroke="#ff2fb3" strokeWidth="2.2" opacity="0.8" />
      </svg>
    );
  }
  if (id === "terminal") {
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
  return null;
}

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
                <SwatchArt id={t.id} />
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
