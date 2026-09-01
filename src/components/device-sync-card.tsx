import { Watch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SyncPermissionSheet } from "@/components/sync-permission-sheet";
import { disableAlwaysSync, enableAlwaysSync } from "@/lib/background-sync";
import { FITNESS_SOURCES, type FitnessSourceId, type SyncAccess } from "@/lib/devices";
import { t } from "@/lib/i18n";
import { useSpoonful } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

/**
 * Watch/Health Connect device linking — shared between Extras (where people
 * expect a settings-style list) and the Body pane (where people actually
 * think to look for "connect my watch"), so it only needs to live in one
 * place in code.
 */
export function DeviceSyncCard() {
  const fitnessSource = useSpoonful((s) => s.fitnessSource);
  const setFitnessSource = useSpoonful((s) => s.setFitnessSource);
  const linkFitness = useSpoonful((s) => s.linkFitness);
  const setSyncAccess = useSpoonful((s) => s.setSyncAccess);
  const syncAccess = useSpoonful((s) => s.syncAccess);
  const importFitness = useSpoonful((s) => s.importFitness);
  const lastSyncAt = useSpoonful((s) => s.lastSyncAt);
  const syncFitness = useSpoonful((s) => s.syncFitness);
  const locale = useSpoonful((s) => s.locale);
  const [asking, setAsking] = useState<FitnessSourceId | null>(null);
  const access = syncAccess ?? (fitnessSource ? "while-using" : null);

  return (
    <>
      <section className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Watch &amp; Health Connect</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap a source. You get the same three choices as Health Connect and the iPhone: Always allow, While using the
          app, or Don’t allow. Always allow keeps Fuel current after you leave — steps, rings, heart, sleep, a session,
          the same weight you already entered. Import a JSON export to overwrite with your file.
        </p>
        {lastSyncAt ? (
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            {access === "always" ? "Always allow" : "While using"} · last pull {new Date(lastSyncAt).toLocaleString()}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FITNESS_SOURCES.map((src) => {
            const on = fitnessSource === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => setAsking(src.id as FitnessSourceId)}
                className={cn(
                  "h-11 rounded-full px-3.5 text-sm",
                  on ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                )}
              >
                {src.label}
              </button>
            );
          })}
        </div>
        {fitnessSource ? (
          <div className="mt-3">
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                access === "always" ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              <p className="text-sm font-medium">{access === "always" ? t(locale, "alwaysOn") : t(locale, "whileOn")}</p>
              <p className={cn("mt-0.5 text-xs leading-relaxed", access === "always" ? "opacity-85" : "text-muted-foreground")}>
                {access === "always" ? t(locale, "alwaysOnHint") : t(locale, "whileOnHint")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant={access === "always" ? "secondary" : "spark"}
                  className={cn("flex-1", access === "always" && "bg-spark-foreground text-spark hover:opacity-95")}
                  onClick={async () => {
                    if (access === "always") {
                      setSyncAccess("while-using");
                      await disableAlwaysSync();
                      toast("Syncs only while this kitchen is open");
                      return;
                    }
                    setSyncAccess("always");
                    const ok = await enableAlwaysSync();
                    toast(
                      ok
                        ? "Always allow — Fuel keeps updating after you leave"
                        : "Always allow is on. Allow notifications so you hear when dinner plates while you’re away.",
                    );
                  }}
                >
                  {access === "always" ? t(locale, "whileUsing") : t(locale, "alwaysAllow")}
                </Button>
                <Button
                  variant="ghost"
                  className={access === "always" ? "text-spark-foreground" : undefined}
                  onClick={() => {
                    setFitnessSource(null);
                    void disableAlwaysSync();
                    toast("Device unlinked");
                  }}
                >
                  {t(locale, "unlinkDevice")}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{FITNESS_SOURCES.find((s) => s.id === fitnessSource)?.hint}.</p>
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={() => {
                const plated = syncFitness({ live: false });
                toast(plated ? `Pulled again — plated ${plated}` : "Pulled again — Fuel matches the device");
              }}
            >
              Refresh now
            </Button>
            <label className="mt-3 block text-sm">
              <span className="text-muted-foreground">Import JSON export</span>
              <input
                type="file"
                accept="application/json,.json"
                className="mt-2 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const raw = JSON.parse(await file.text()) as {
                      steps?: number;
                      weightKg?: number;
                      weightLb?: number;
                      heightCm?: number;
                      age?: number;
                      workouts?: { date?: string; kind?: string; minutes?: number; kcal?: number; volumeKg?: number; distanceKm?: number }[];
                    };
                    importFitness({
                      steps: raw.steps,
                      body: {
                        ...(typeof raw.weightKg === "number" ? { weightKg: raw.weightKg } : {}),
                        ...(typeof raw.weightLb === "number" ? { weightKg: raw.weightLb / 2.2046226218 } : {}),
                        ...(typeof raw.heightCm === "number" ? { heightCm: raw.heightCm } : {}),
                        ...(typeof raw.age === "number" ? { age: raw.age } : {}),
                      },
                      workouts: (raw.workouts ?? []).map((w) => ({
                        id: "imp",
                        date: w.date ?? new Date().toISOString().slice(0, 10),
                        kind: (w.kind as "lift" | "run" | "walk" | "ride" | "class" | "other") ?? "other",
                        minutes: w.minutes ?? 30,
                        kcal: w.kcal,
                        volumeKg: w.volumeKg,
                        distanceKm: w.distanceKm,
                      })),
                    });
                    toast("Import written to Fuel — body and workouts live");
                  } catch {
                    toast("That file was not a Spoonful fitness export");
                  }
                }}
              />
            </label>
          </div>
        ) : null}
        <a
          href="/watch"
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-background px-4 text-sm shadow-[var(--shadow-border)]"
        >
          <Watch className="size-4" />
          Open watch face
        </a>
      </section>

      <SyncPermissionSheet
        open={asking !== null}
        source={asking}
        current={asking && asking === fitnessSource ? access : null}
        locale={locale}
        onOpenChange={(o) => !o && setAsking(null)}
        onChoose={async (choice: SyncAccess | null) => {
          const src = asking;
          setAsking(null);
          if (!src) return;
          if (choice === null) {
            if (fitnessSource === src) {
              setFitnessSource(null);
              await disableAlwaysSync();
              toast("Device unlinked");
            } else {
              toast("Not linked");
            }
            return;
          }
          const label = FITNESS_SOURCES.find((s) => s.id === src)?.label ?? src;
          linkFitness(src, choice);
          if (choice === "always") {
            const ok = await enableAlwaysSync();
            toast(
              ok
                ? `${label} · Always allow — Fuel keeps updating after you leave`
                : `${label} · Always allow is on. Allow notifications so you hear when dinner plates while you’re away.`,
            );
            return;
          }
          await disableAlwaysSync();
          toast(`${label} · syncs while this kitchen is open`);
        }}
      />
    </>
  );
}
