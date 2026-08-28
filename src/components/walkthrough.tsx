import { useEffect, useRef, useState } from "react";
import { KitchenHero } from "@/components/kitchen-hero";
import { Button } from "@/components/ui/button";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { useSpoonful } from "@/lib/spoonful-store";
import type { PlateKind } from "@/lib/types";

const STEPS: { title: string; body: string; plates: PlateKind[] }[] = [
  {
    title: "What Spoonful does",
    body: "It plans dinner for the week, writes the grocery list, and walks you through cooking — each step names the food, the pan, and how long.",
    plates: ["roast", "pasta", "green"],
  },
  {
    title: "Tonight is the red card",
    body: "That card is dinner tonight. Tap Pick for me if you do not want to choose. Tap Cook now when you are at the stove. Next and Back move through the method.",
    plates: ["roast", "skillet", "bowl"],
  },
  {
    title: "Recipes",
    body: "Open Recipes to browse. Tap a dish to read ingredients and the full method. Put it on tonight, or cook it right away.",
    plates: ["pasta", "curry", "taco"],
  },
  {
    title: "Shop",
    body: "Shop builds a grocery list from the week, sized for how many people eat here. Eating-out nights stay off the list.",
    plates: ["bowl", "roast", "toast"],
  },
  {
    title: "Snap the fridge",
    body: "Photograph the pantry or a pile of food. Spoonful lists what it sees, then suggests meals you can make from it.",
    plates: ["bowl", "skillet", "toast"],
  },
];

export function Walkthrough() {
  const finish = useSpoonful((s) => s.finishWalkthrough);
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const live = useRef<HTMLParagraphElement>(null);
  const current = STEPS[step]!;

  useEffect(() => {
    live.current?.focus();
  }, [step]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function speak() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(`${current.title}. ${current.body}`);
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  function stopSpeak() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="pl-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {isPreviewChrome() ? <div className="chrome-gutter" /> : null}
        <p className="flex h-12 items-center text-sm font-medium uppercase tracking-[0.16em] text-spark">
          Tour {step + 1} of {STEPS.length}
        </p>
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto px-6 py-6">
        <KitchenHero plates={current.plates} />
        <p ref={live} tabIndex={-1} className="mt-4 text-base font-medium text-spark" aria-live="polite">
          Step {step + 1}
        </p>
        <h1 id="tour-title" className="mt-2 font-display text-4xl leading-tight">
          {current.title}
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-foreground">{current.body}</p>
        <div className="mt-8 flex flex-col gap-2">
          <Button variant="secondary" className="h-12 w-full" onClick={speaking ? stopSpeak : speak}>
            {speaking ? "Stop speaking" : "Read this out loud"}
          </Button>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          variant="secondary"
          className="h-12 flex-1"
          disabled={step === 0}
          onClick={() => {
            stopSpeak();
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          Back
        </Button>
        <Button variant="ghost" className="h-12 flex-1" onClick={finish}>
          Skip
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            className="h-12 flex-1 bg-spark text-spark-foreground hover:opacity-95"
            onClick={() => {
              stopSpeak();
              setStep((s) => s + 1);
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            className="h-12 flex-1 bg-spark text-spark-foreground hover:opacity-95"
            onClick={() => {
              stopSpeak();
              finish();
            }}
          >
            Start cooking
          </Button>
        )}
      </div>
    </div>
  );
}
