import { useId } from "react";
import type { MuscleId } from "@/lib/exercises";
import { cn } from "@/lib/utils";

type Size = "chip" | "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  chip: "h-11 w-[2.75rem]",
  sm: "h-[5.5rem] w-[6.4rem]",
  md: "h-36 w-[10.4rem]",
  lg: "h-52 w-[15rem]",
};

function tone(id: MuscleId, primary: Set<string>, secondary: Set<string>, idle: string): string {
  if (primary.has(id)) return "var(--color-spark)";
  if (secondary.has(id)) return "var(--color-primary)";
  return idle;
}

export function MuscleMap({
  primary = [],
  secondary = [],
  size = "md",
  className,
  onSelect,
}: {
  primary?: MuscleId[];
  secondary?: MuscleId[];
  size?: Size;
  className?: string;
  onSelect?: (id: MuscleId) => void;
}) {
  const p = new Set(primary);
  const s = new Set(secondary);
  const uid = useId().replace(/:/g, "");
  const frontClip = `front-body-${uid}`;
  const backClip = `back-body-${uid}`;
  const idle = "color-mix(in oklab, var(--color-foreground) 16%, var(--color-card))";
  const line = "color-mix(in oklab, var(--color-foreground) 32%, transparent)";
  const clickable = Boolean(onSelect);

  function region(id: MuscleId, d: string) {
    return (
      <path
        d={d}
        fill={tone(id, p, s, idle)}
        className={cn(clickable && "cursor-pointer")}
        onClick={
          clickable
            ? (e) => {
                e.stopPropagation();
                onSelect?.(id);
              }
            : undefined
        }
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 240"
      className={cn(SIZES[size], "shrink-0 overflow-visible", className)}
      role="img"
      aria-label="Muscle map"
    >
      <defs>
        <clipPath id={frontClip}>
          <path d="M50 8c6.2 0 11 4.6 11 10.4S56.2 29 50 29s-11-4.6-11-10.6S43.8 8 50 8zm-7 22h14c1.4 6 1.6 9 .6 11H42c-1-2-.8-5 .6-11zM29 44c8-8 14-10 21-10s13 2 21 10c4 4 6 10 6 16v18c0 8-1.5 16-4 26l3 38c.6 6-2 10-7 10h-5v46c0 16-1 30-2 42-1 8-5 12-11 12h-4c-6 0-10-4-11-12-1-12-2-26-2-42v-46h-5c-5 0-7.6-4-7-10l3-38c-2.5-10-4-18-4-26V60c0-6 2-12 6-16z" />
        </clipPath>
        <clipPath id={backClip}>
          <path d="M150 8c6.2 0 11 4.6 11 10.4S156.2 29 150 29s-11-4.6-11-10.6S143.8 8 150 8zm-7 22h14c1.4 6 1.6 9 .6 11h-15.2c-1-2-.8-5 .6-11zM129 44c8-8 14-10 21-10s13 2 21 10c4 4 6 10 6 16v18c0 8-1.5 16-4 26l3 38c.6 6-2 10-7 10h-5v46c0 16-1 30-2 42-1 8-5 12-11 12h-4c-6 0-10-4-11-12-1-12-2-26-2-42v-46h-5c-5 0-7.6-4-7-10l3-38c-2.5-10-4-18-4-26V60c0-6 2-12 6-16z" />
        </clipPath>
      </defs>

      {/* Front silhouette */}
      <path
        d="M50 8c6.2 0 11 4.6 11 10.4S56.2 29 50 29s-11-4.6-11-10.6S43.8 8 50 8zm-7 22h14c1.4 6 1.6 9 .6 11H42c-1-2-.8-5 .6-11zM29 44c8-8 14-10 21-10s13 2 21 10c4 4 6 10 6 16v18c0 8-1.5 16-4 26l3 38c.6 6-2 10-7 10h-5v46c0 16-1 30-2 42-1 8-5 12-11 12h-4c-6 0-10-4-11-12-1-12-2-26-2-42v-46h-5c-5 0-7.6-4-7-10l3-38c-2.5-10-4-18-4-26V60c0-6 2-12 6-16z"
        fill={idle}
        stroke={line}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <g clipPath={`url(#${frontClip})`} style={clickable ? undefined : { pointerEvents: "none" }}>
        {region("front-delts", "M32 42c6-6 11-8 18-8v16c-6 1-12 4-16 10-3-4-4-12-2-18z")}
        {region("front-delts", "M68 42c-6-6-11-8-18-8v16c6 1 12 4 16 10 3-4 4-12 2-18z")}
        {region("chest", "M38 48h12v22c-6 1-11 0-14-5-3-4-2-12 2-17z")}
        {region("chest", "M50 48h12c4 5 5 13 2 17-3 5-8 6-14 5V48z")}
        {region("biceps", "M30 58c-3 8-4 16-2 26 4 0 7-6 8-14 1-7-2-12-6-12z")}
        {region("biceps", "M70 58c3 8 4 16 2 26-4 0-7-6-8-14-1-7 2-12 6-12z")}
        {region("forearms", "M28 86c-2 10-3 18-1 26 3 0 6-6 6-14 1-7-2-12-5-12z")}
        {region("forearms", "M72 86c2 10 3 18 1 26-3 0-6-6-6-14-1-7 2-12 5-12z")}
        {region("abs", "M44 70h12v32H44z")}
        {region("obliques", "M37 72h7v30h-5c-2-8-3-20-2-30z")}
        {region("obliques", "M56 72h7c1 10 0 22-2 30h-5V72z")}
        {region("quads", "M38 108h11v50H39c-2-14-2-34-1-50z")}
        {region("quads", "M51 108h11c1 16 1 36-1 50H51V108z")}
        {region("adductors", "M46 112h8v36h-8z")}
      </g>

      {/* Back silhouette */}
      <path
        d="M150 8c6.2 0 11 4.6 11 10.4S156.2 29 150 29s-11-4.6-11-10.6S143.8 8 150 8zm-7 22h14c1.4 6 1.6 9 .6 11h-15.2c-1-2-.8-5 .6-11zM129 44c8-8 14-10 21-10s13 2 21 10c4 4 6 10 6 16v18c0 8-1.5 16-4 26l3 38c.6 6-2 10-7 10h-5v46c0 16-1 30-2 42-1 8-5 12-11 12h-4c-6 0-10-4-11-12-1-12-2-26-2-42v-46h-5c-5 0-7.6-4-7-10l3-38c-2.5-10-4-18-4-26V60c0-6 2-12 6-16z"
        fill={idle}
        stroke={line}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <g clipPath={`url(#${backClip})`} style={clickable ? undefined : { pointerEvents: "none" }}>
        {region("traps", "M138 36h24c1 8 0 14-3 16h-18c-3-2-4-8-3-16z")}
        {region("rear-delts", "M132 42c6-6 11-8 18-8v14c-6 2-11 5-15 11-3-4-5-11-3-17z")}
        {region("rear-delts", "M168 42c-6-6-11-8-18-8v14c6 2 11 5 15 11 3-4 5-11 3-17z")}
        {region("side-delts", "M129 46c-2 6-2 12 0 16 3-2 6-8 7-13-1-2-4-4-7-3z")}
        {region("side-delts", "M171 46c2 6 2 12 0 16-3-2-6-8-7-13 1-2 4-4 7-3z")}
        {region("upper-back", "M140 52h20v20h-20z")}
        {region("lats", "M132 54c-1 14 2 28 8 38 3-8 5-20 5-32-4-4-9-6-13-6z")}
        {region("lats", "M168 54c1 14-2 28-8 38-3-8-5-20-5-32 4-4 9-6 13-6z")}
        {region("triceps", "M130 58c-3 8-4 16-2 26 4 0 7-6 7-14 0-7-2-12-5-12z")}
        {region("triceps", "M170 58c3 8 4 16 2 26-4 0-7-6-7-14 0-7 2-12 5-12z")}
        {region("forearms", "M128 86c-2 10-3 18-1 24 3 0 6-6 6-13 1-7-2-11-5-11z")}
        {region("forearms", "M172 86c2 10 3 18 1 24-3 0-6-6-6-13-1-7 2-11 5-11z")}
        {region("lower-back", "M142 86h16v20h-16z")}
        {region("glutes", "M136 108h14v18c-6 2-12 1-14-4-2-4-1-10 0-14z")}
        {region("glutes", "M150 108h14c1 4 2 10 0 14-2 5-8 6-14 4v-18z")}
        {region("hamstrings", "M137 126h12v40h-11c-2-12-2-28-1-40z")}
        {region("hamstrings", "M151 126h12c1 12 1 28-1 40h-11v-40z")}
        {region("calves", "M138 168h11v38h-10c-2-12-2-26-1-38z")}
        {region("calves", "M151 168h11c1 12 1 26-1 38h-10v-38z")}
      </g>
    </svg>
  );
}

export function MuscleLegend({ primary, secondary }: { primary: MuscleId[]; secondary: MuscleId[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-spark" />
        Primary
        {primary.length ? ` · ${primary.length}` : ""}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-primary" />
        Secondary
        {secondary.length ? ` · ${secondary.length}` : ""}
      </span>
    </div>
  );
}
