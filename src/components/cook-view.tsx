import { Check, ChevronLeft, ChevronRight, Pause, Play, Timer, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { foodsUsedInStep, scaleMethodSteps } from "@/lib/cook-steps";

import { scaleQty } from "@/lib/cuisine";
import { formatMinutes, formatQty } from "@/lib/format";
import { resolveMeal, useSpoonful } from "@/lib/spoonful-store";
import { postKitchenEvent } from "@/lib/family";
import type { PlannedMeal } from "@/lib/types";
import { cn } from "@/lib/utils";

function parseStepSeconds(text: string): number | null {
  const range = text.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*min/i);
  if (range) {
    const n = Number(range[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 180) return n * 60;
  }
  const m = text.match(/(\d+)\s*(?:minutes?|mins?)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 180) return null;
  return n * 60;
}

function clock(total: number): string {
  const mm = Math.floor(total / 60);
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function CookView({ meal, onClose }: { meal: PlannedMeal; onClose: () => void }) {
  const resolved = resolveMeal(meal);
  const recipe = resolved.recipe;
  const household = useSpoonful((s) => s.household);
  const markCooked = useSpoonful((s) => s.markCooked);
  const saveLeftovers = useSpoonful((s) => s.saveLeftovers);
  const rawSteps = recipe?.steps ?? resolved.custom?.steps ?? (resolved.custom?.notes ? [resolved.custom.notes] : ["Cook it how you like."]);
  const ingredients = recipe?.ingredients ?? resolved.custom?.ingredients ?? [];
  const servings = recipe?.servings ?? household;
  const steps = scaleMethodSteps(rawSteps, ingredients, household, servings);

  const [step, setStep] = useState(0);
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [seconds, setSeconds] = useState(resolved.minutes * 60);
  const [ticking, setTicking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const current = steps[step] ?? steps[0];
  const parsed = parseStepSeconds(current ?? "");
  const [stepLeft, setStepLeft] = useState<number | null>(parsed);
  const [stepTicking, setStepTicking] = useState(false);
  const used = foodsUsedInStep(current ?? "", ingredients);

  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    const next = parseStepSeconds(current ?? "");
    setStepLeft(next);
    setStepTicking(false);
  }, [step, current]);

  useEffect(() => {
    if (!stepTicking) return;
    const id = window.setInterval(() => {
      setStepLeft((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stepTicking]);

  useEffect(() => {
    if (stepLeft !== 0 || !stepTicking) return;
    setStepTicking(false);
    toast("Step timer done");
  }, [stepLeft, stepTicking]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function speak() {
    const synth = window.speechSynthesis;
    if (!synth) {
      toast("Speaking is not on this device");
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(`Step ${step + 1}. ${current}`);
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  function stopSpeak() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function finish() {
    stopSpeak();
    markCooked(meal.date);
    if (useSpoonful.getState().hasAddon("family")) {
      void postKitchenEvent({
        data: { kind: "cooked", body: `cooked ${resolved.title}`, recipeName: resolved.title },
      }).catch(() => {});
    }
    toast("Logged as cooked");
    onClose();
  }

  function IngList({ items }: { items: typeof ingredients }) {
    if (items.length === 0) return null;
    return (
      <ul className="mt-3 space-y-1">
        {items.map((ing, i) => {
          const on = Boolean(have[ing.name]);
          return (
            <li key={`${ing.name}-${i}`}>
              <button
                type="button"
                onClick={() => setHave((h) => ({ ...h, [ing.name]: !h[ing.name] }))}
                className="flex min-h-12 w-full items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md shadow-[var(--shadow-border)]",
                    on && "bg-primary text-primary-foreground shadow-none",
                  )}
                >
                  {on ? <Check className="size-3.5" /> : null}
                </span>
                <span className={cn("flex-1 text-base", on && "text-muted-foreground line-through")}>{ing.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatQty(scaleQty(ing.qty, household, servings), ing.unit)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-1 px-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cook mode">
          <X />
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-base font-medium">{resolved.title}</p>
          <p className="text-xs text-muted-foreground">{formatMinutes(resolved.minutes)}</p>
        </div>
        <span className="inline-flex size-11 items-center justify-center text-sm tabular-nums text-muted-foreground">
          {step + 1}/{steps.length}
        </span>
      </header>

      <div className="flex items-center justify-center gap-2 px-4">
        <p className="font-display text-4xl tabular-nums leading-none">{clock(seconds)}</p>
        <Button
          variant="secondary"
          size="icon"
          aria-label={ticking ? "Pause whole-dish timer" : "Start whole-dish timer"}
          onClick={() => setTicking((t) => !t)}
        >
          {ticking ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={speaking ? "Stop speaking" : "Speak this step"}
          onClick={() => (speaking ? stopSpeak() : speak())}
        >
          {speaking ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>
      {stepLeft !== null ? (
        <div className="mt-2 flex items-center justify-center px-4">
          <button
            type="button"
            onClick={() => setStepTicking((v) => !v)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full px-4 text-sm",
              stepTicking ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
            )}
          >
            <Timer className="size-4" />
            {stepTicking ? "Pause this step" : "Timer for this step"}
            <span className="tabular-nums">{clock(stepLeft)}</span>
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">
          Step {step + 1} of {steps.length}
        </p>
        <p className="mt-2 text-xl leading-relaxed" aria-live="polite">
          {current}
        </p>
        {used.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Use in this step</h2>
            <IngList items={used} />
          </section>
        ) : null}
        {step === 0 && ingredients.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              All ingredients · {household} {household === 1 ? "person" : "people"}
            </h2>
            <IngList items={ingredients} />
          </section>
        ) : null}
      </div>

      <footer className="flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={step === 0}
            onClick={() => {
              stopSpeak();
              setStep((s) => Math.max(0, s - 1));
            }}
          >
            <ChevronLeft />
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              variant="spark"
              className="flex-1"
              onClick={() => {
                stopSpeak();
                setStep((s) => s + 1);
              }}
            >
              Next
              <ChevronRight />
            </Button>
          ) : (
            <Button variant="spark" className="flex-1" onClick={finish}>
              I cooked this
            </Button>
          )}
        </div>
        {step === steps.length - 1 ? (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              const ok = saveLeftovers(meal.date);
              toast(ok ? "Leftovers become tomorrow’s lunch" : "No dinner to save");
              finish();
            }}
          >
            Save leftovers for tomorrow
          </Button>
        ) : null}
      </footer>
    </div>
  );
}
