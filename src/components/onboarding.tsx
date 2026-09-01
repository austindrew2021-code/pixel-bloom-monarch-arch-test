import { useMemo, useState } from "react";
import { KitchenHero } from "@/components/kitchen-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTIVITY,
  DEFAULT_BODY,
  GOAL_KINDS,
  kgFromLb,
  lbFromKg,
  macrosFromBody,
  tdeeKcal,
  type BodyProfile,
} from "@/lib/body";
import { COUNTRIES, LOCALES, type CountryId, type LocaleId } from "@/lib/i18n";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { ALLERGIES } from "@/lib/shield";
import { useSpoonful } from "@/lib/spoonful-store";
import type { AllergyId, PrefId } from "@/lib/types";
import { cn } from "@/lib/utils";

const PREFS: { id: PrefId; label: string; hint: string }[] = [
  { id: "vegetarian", label: "Vegetarian", hint: "No meat or fish" },
  { id: "vegan", label: "Vegan", hint: "No animal products" },
  { id: "pescatarian", label: "Pescatarian", hint: "Fish is fine" },
  { id: "gluten-free", label: "Gluten-free", hint: "No wheat, barley, rye" },
  { id: "sugar-free", label: "Sugar-free", hint: "No added sugar" },
  { id: "quick", label: "Weeknights", hint: "Under 30 minutes" },
  { id: "budget", label: "Budget", hint: "Pantry-first cooking" },
];

export function Onboarding() {
  const completeOnboarding = useSpoonful((s) => s.completeOnboarding);
  const [household, setHousehold] = useState(2);
  const [prefs, setPrefs] = useState<PrefId[]>([]);
  const [allergies, setAllergies] = useState<AllergyId[]>([]);
  const [nextGen, setNextGen] = useState(false);
  const [body, setBody] = useState<BodyProfile>(DEFAULT_BODY);
  const [locale, setLocale] = useState<LocaleId>("en");
  const [country, setCountry] = useState<CountryId>("CA");
  const macros = useMemo(() => macrosFromBody(body), [body]);
  const tdee = useMemo(() => tdeeKcal(body), [body]);
  const imperial = body.units !== "metric";

  function toggle(id: PrefId) {
    setPrefs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function toggleAllergy(id: AllergyId) {
    setAllergies((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function finish(sample: boolean) {
    completeOnboarding({ household, prefs, allergies, sample, nextGen, goal: macros, body, locale, country });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col overflow-x-clip px-6 pb-10">
      {isPreviewChrome() ? <div className="chrome-gutter h-14 shrink-0" /> : <div className="h-8 shrink-0" />}
      <KitchenHero className="mx-auto" />
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-spark">Spoonful</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95] text-foreground">
        Dinner,
        <br />
        decided.
      </h1>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-foreground/80">
        Plan dinner for the week. Shop once. Cook from steps that name the food, the pan, and the time.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-medium">How you want it</h2>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={() => setNextGen(false)}
            className={cn(
              "rounded-3xl px-4 py-4 text-left",
              !nextGen ? "bg-spark text-spark-foreground" : "bg-card text-foreground shadow-[var(--shadow-border)]",
            )}
          >
            <p className="font-display text-2xl leading-tight">Simple Kitchen</p>
            <p className={cn("mt-1 text-sm leading-relaxed", !nextGen ? "opacity-90" : "text-muted-foreground")}>
              Huge type. Tonight on top. One tap to pick dinner. No calorie tracking.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setNextGen(true)}
            className={cn(
              "rounded-3xl px-4 py-4 text-left",
              nextGen ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-[var(--shadow-border)]",
            )}
          >
            <p className="font-display text-2xl leading-tight">Next Gen</p>
            <p className={cn("mt-1 text-sm leading-relaxed", nextGen ? "opacity-90" : "text-muted-foreground")}>
              Same kitchen, plus a training week for your body goal. Dinners move when you train, skip, or miss.
            </p>
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-medium">Your body</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional. Used to set calorie and protein targets. Add body fat if you know it. You can change this later in Fuel.
        </p>
        <div className="mt-3 flex gap-2">
          {(["female", "male"] as const).map((sex) => (
            <button
              key={sex}
              type="button"
              onClick={() => setBody((b) => ({ ...b, sex }))}
              className={cn(
                "h-11 flex-1 rounded-full text-sm",
                body.sex === sex ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {sex === "female" ? "Female" : "Male"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setBody((b) => ({ ...b, units: imperial ? "metric" : "imperial" }))}
            className="h-11 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]"
          >
            {imperial ? "lb / in" : "kg / cm"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            Age
            <Input
              className="mt-1"
              inputMode="numeric"
              value={String(body.age || "")}
              onChange={(e) => setBody((b) => ({ ...b, age: Number(e.target.value) || 0 }))}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {imperial ? "Weight (lb)" : "Weight (kg)"}
            <Input
              className="mt-1"
              inputMode="decimal"
              value={String(imperial ? Math.round(lbFromKg(body.weightKg)) || "" : Math.round(body.weightKg) || "")}
              onChange={(e) => {
                const n = Number(e.target.value);
                setBody((b) => ({ ...b, weightKg: imperial ? kgFromLb(n || 0) : n || 0 }));
              }}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {imperial ? "Height (in)" : "Height (cm)"}
            <Input
              className="mt-1"
              inputMode="numeric"
              value={String(imperial ? Math.round(body.heightCm / 2.54) || "" : Math.round(body.heightCm) || "")}
              onChange={(e) => {
                const n = Number(e.target.value);
                setBody((b) => ({ ...b, heightCm: imperial ? n * 2.54 : n || 0 }));
              }}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Body fat % <span className="font-normal">(optional)</span>
            <Input
              className="mt-1"
              inputMode="decimal"
              placeholder="e.g. 22"
              value={body.bodyFatPct != null ? String(body.bodyFatPct) : ""}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  setBody((b) => ({ ...b, bodyFatPct: undefined }));
                  return;
                }
                const n = Number(raw);
                setBody((b) => ({ ...b, bodyFatPct: Number.isFinite(n) ? n : undefined }));
              }}
            />
          </label>
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">How much you move</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ACTIVITY.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setBody((b) => ({ ...b, activity: a.id }))}
              className={cn(
                "h-11 rounded-full px-3 text-sm",
                body.activity === a.id ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{ACTIVITY.find((a) => a.id === body.activity)?.hint}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Body goal</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GOAL_KINDS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setBody((b) => ({ ...b, goalKind: g.id }))}
              className={cn(
                "h-11 rounded-full px-3 text-sm",
                body.goalKind === g.id ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{GOAL_KINDS.find((g) => g.id === body.goalKind)?.hint}</p>
        <p className="mt-3 text-sm tabular-nums text-foreground">
          {tdee} kcal to stay here · {macros.cal} kcal target · {macros.protein}g protein
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Equipment</p>
        <div className="mt-2 flex gap-2">
          {(
            [
              { id: "full" as const, label: "Full gym", hint: "Barbells, machines, cables" },
              { id: "bodyweight" as const, label: "No equipment", hint: "Bodyweight only" },
            ]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setBody((b) => ({ ...b, equipmentAccess: opt.id }))}
              className={cn(
                "h-11 flex-1 rounded-full text-sm",
                (body.equipmentAccess ?? "full") === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {(body.equipmentAccess ?? "full") === "bodyweight"
            ? "Your training week only picks moves that need no gear at all."
            : "Your training week can use any equipment. Change this anytime in Train."}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-medium">Who is eating</h2>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setHousehold(n)}
              className={cn(
                "flex size-12 items-center justify-center rounded-full text-base font-medium",
                household === n
                  ? "bg-spark text-spark-foreground"
                  : "bg-card text-foreground shadow-[var(--shadow-border)]",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-medium">Skip these</h2>
        <p className="mt-1 text-sm text-muted-foreground">Kitchen Shield hides them from every suggestion.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ALLERGIES.map((a) => {
            const on = allergies.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAllergy(a.id)}
                className={cn(
                  "min-h-16 rounded-2xl px-4 py-3 text-left",
                  on ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
                )}
              >
                <div className="text-sm font-medium">{a.label}</div>
                <div className={cn("mt-0.5 text-xs", on ? "opacity-80" : "text-muted-foreground")}>{a.hint}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-medium">How you like to cook</h2>
        <p className="mt-1 text-sm text-muted-foreground">Optional. Change later in Extras.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PREFS.map((pref) => {
            const on = prefs.includes(pref.id);
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => toggle(pref.id)}
                className={cn(
                  "min-h-16 rounded-2xl px-4 py-3 text-left",
                  on ? "bg-accent text-accent-foreground" : "bg-card shadow-[var(--shadow-border)]",
                )}
              >
                <div className="text-sm font-medium">{pref.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{pref.hint}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-medium">Language and country</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            Language
            <select
              className="mt-1.5 w-full"
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleId)}
            >
              {LOCALES.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Country
            <select
              className="mt-1.5 w-full"
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryId)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-2">
        <Button size="lg" variant="spark" className="w-full" onClick={() => finish(true)}>
          Fill a sample week
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => finish(false)}>
          Start with a blank week
        </Button>
      </div>
    </main>
  );
}
