import { Ban, RefreshCw, Smartphone } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FITNESS_SOURCES, SYNC_ACCESS, type FitnessSourceId, type SyncAccess } from "@/lib/devices";
import { t, type LocaleId } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SyncPermissionSheet({
  open,
  source,
  current,
  locale,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  source: FitnessSourceId | null;
  current: SyncAccess | null;
  locale: LocaleId;
  onOpenChange: (open: boolean) => void;
  onChoose: (access: SyncAccess | null) => void;
}) {
  const src = FITNESS_SOURCES.find((s) => s.id === source);
  const linked = Boolean(current);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={t(locale, "syncAccessTitle")}>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">{src?.label ?? "Device"}</p>
        <h2 className="mt-1 font-display text-2xl leading-tight">
          {linked ? t(locale, "changeAccess") : t(locale, "syncAccessTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(locale, "syncAccessBody")}</p>

        <div className="mt-5 grid gap-2">
          {SYNC_ACCESS.map((opt) => {
            const Icon = opt.id === "always" ? RefreshCw : Smartphone;
            const on = current === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChoose(opt.id)}
                className={cn(
                  "flex min-h-16 items-start gap-3 rounded-2xl px-4 py-3 text-left",
                  on ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                )}
              >
                <Icon className="mt-0.5 size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(locale, opt.id === "always" ? "alwaysAllow" : "whileUsing")}</span>
                  <span className={cn("mt-0.5 block text-xs leading-relaxed", on ? "opacity-85" : "text-muted-foreground")}>
                    {t(locale, opt.id === "always" ? "alwaysAllowHint" : "whileUsingHint")}
                  </span>
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="flex min-h-14 items-center gap-3 rounded-2xl bg-background px-4 text-left shadow-[var(--shadow-border)]"
          >
            <Ban className="size-5 shrink-0 text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold">{linked ? t(locale, "unlinkDevice") : t(locale, "dontAllow")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t(locale, "dontAllowHint")}</span>
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
