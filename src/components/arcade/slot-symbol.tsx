import { SHAPES, shapeFor } from "@/lib/arcade/slots/art";
import type { SlotConfig } from "@/lib/arcade/slots/types";

/**
 * One drawn symbol.
 *
 * Each is a filled SVG path with a gradient, a rim stroke and an overlaid
 * detail path, so it reads as artwork rather than an icon. Wilds and scatters
 * get the theme's glow colour and their own idle motion — a wild should look
 * like it wants to be noticed even when the reels are still.
 *
 * Gradient ids are namespaced per symbol instance. Two SVGs on one page sharing
 * a gradient id will both take whichever definition rendered last, which shows
 * up as a whole reel suddenly wearing one symbol's colours.
 */
export function SlotSymbol({
  config,
  symbol,
  lit,
  size = 44,
}: {
  config: SlotConfig;
  symbol: number;
  lit?: boolean;
  size?: number;
}) {
  const definition = config.symbols[symbol];
  const kind = definition?.kind ?? "pay";
  const special = kind !== "pay";
  const shape = shapeFor(config.theme.id, symbol);
  const art = SHAPES[shape];

  const base = special
    ? config.theme.glow
    : (config.theme.palette[Math.min(symbol, config.theme.palette.length - 1)] ?? "#94a3b8");
  const gradientId = `sym-${config.theme.id}-${symbol}-${shape}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`overflow-visible ${special ? "slot-sym-special" : ""} ${lit ? "slot-sym-lit" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={base} stopOpacity="1" />
          <stop offset="55%" stopColor={base} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0b1120" stopOpacity="0.9" />
        </linearGradient>
        {(special || lit) && (
          <filter id={`${gradientId}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={lit ? 4 : 2.4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={special || lit ? `url(#${gradientId}-glow)` : undefined}>
        <path
          d={art.body}
          fill={`url(#${gradientId})`}
          stroke={lit ? config.theme.glow : base}
          strokeWidth={lit ? 3.5 : 2.5}
          strokeLinejoin="round"
        />
        {art.detail ? (
          <path
            d={art.detail}
            fill="none"
            stroke={lit ? "#ffffff" : base}
            strokeOpacity={lit ? 0.9 : 0.55}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </g>
    </svg>
  );
}
