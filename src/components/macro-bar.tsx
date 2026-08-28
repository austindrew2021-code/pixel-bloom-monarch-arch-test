import { pct } from "@/lib/fuel";
import { cn } from "@/lib/utils";

export function MacroBar({
  label,
  value,
  of,
  unit = "g",
}: {
  label: string;
  value: number;
  of: number;
  unit?: string;
}) {
  const p = pct(value, of);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(value)}
          {unit} / {Math.round(of)}
          {unit}
        </span>
      </div>
      <div className="meter mt-1.5">
        <span className={cn(p > 100 ? "bg-destructive" : "bg-spark")} style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
    </div>
  );
}
