import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { useSpoonful, type TabId } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

type TourStep = {
  id: string;
  tab?: TabId;
  extras?: boolean;
  target: string;
  title: string;
  body: string;
  nextGen?: boolean;
};

const STEPS: TourStep[] = [
  {
    id: "mode",
    tab: "plan",
    target: "kitchen-mode",
    title: "Simple or Next Gen",
    body: "Simple is dinner only. Next Gen adds workouts — finish, skip, or miss a session and tonight's dinner updates to match.",
  },
  {
    id: "theme",
    tab: "plan",
    target: "theme",
    title: "Pick your look",
    body: "Six kitchen skins — warm paper, midnight, brass, neon, nebula, phosphor. Tap to swap anytime.",
  },
  {
    id: "tonight",
    tab: "plan",
    target: "tonight",
    title: "Tonight is dinner",
    body: "That card is dinner tonight. Tap it to read the steps, swap the dish, or mark that you already cooked.",
  },
  {
    id: "cook",
    tab: "plan",
    target: "cook",
    title: "Cook now",
    body: "When you are at the stove, this walks the method one step at a time. Each step names the food, the pan, and how long.",
  },
  {
    id: "recipes",
    tab: "recipes",
    target: "nav-recipes",
    title: "Recipes",
    body: "The whole catalog lives here. Search, filter by diet, or tap Surprise me if you do not want to choose.",
  },
  {
    id: "recipes-search",
    tab: "recipes",
    target: "recipes-search",
    title: "Find a dish",
    body: "Type a name, a diet, or a pan. Voice search works too. Tap a card to plate it tonight or cook it now.",
  },
  {
    id: "snap",
    tab: "snap",
    target: "nav-snap",
    title: "Snap",
    body: "Write what you ate, take a photo of the fridge, or scan a barcode. Saving stays on this screen.",
  },
  {
    id: "snap-cam",
    tab: "snap",
    target: "snap-cam",
    title: "Take the photo",
    body: "Photo of my fridge for a shelf. Photo of ingredients for a pile on the counter. You can also type what you have.",
  },
  {
    id: "barcode",
    tab: "snap",
    target: "barcode-scan",
    title: "Scan a barcode",
    body: "Point the camera at a grocery barcode, or type the numbers. Spoonful looks up the food and logs it.",
  },
  {
    id: "shop",
    tab: "shop",
    target: "nav-shop",
    title: "Shop",
    body: "The grocery list starts from tonight's dinner. Rebuild it in one tap. The rest of the week stays off the list until you ask.",
  },
  {
    id: "shop-list",
    tab: "shop",
    target: "shop-head",
    title: "Check things off",
    body: "Tap a line when it is in the basket. Hide what is already in the pantry so the list stays short in the aisle.",
  },
  {
    id: "people",
    tab: "people",
    target: "people-head",
    title: "People",
    body: "Find other cooks, add family, and send private messages. Family members can keep their own goals.",
  },
  {
    id: "desserts",
    tab: "desserts",
    target: "desserts-head",
    title: "Desserts",
    body: "Sweets live here so they don't mix in with dinner. Fruit, bakery, or chilled.",
  },
  {
    id: "extras",
    extras: true,
    target: "extras-head",
    title: "Extras",
    body: "Ranks, add-ons, language, and Replay the walkthrough live here. Close it when you are done.",
  },
  {
    id: "fuel",
    tab: "fit",
    target: "nav-fit",
    title: "Fuel + Train",
    body: "Calories and protein live here. Finish, skip, or miss a workout and tonight's dinner updates to match.",
    nextGen: true,
  },
  {
    id: "fuel-now",
    tab: "fit",
    target: "fuel-now",
    title: "What is left today",
    body: "The red card is calories, protein, and burn right now. Log a lift and these numbers move.",
    nextGen: true,
  },
  {
    id: "train",
    tab: "fit",
    target: "train-pane",
    title: "Train or Body",
    body: "Train is this week's workouts. Body is your height, weight, and the goal that writes the week.",
    nextGen: true,
  },
  {
    id: "week",
    tab: "fit",
    target: "week",
    title: "The week strip",
    body: "Seven days. Tap one to open it. Rest days stay rest — a lift day is where you start the session.",
    nextGen: true,
  },
  {
    id: "start",
    tab: "fit",
    target: "start-session",
    title: "Log a set in one tap",
    body: "Last time’s numbers sit under the row. Log, then tap how many reps you had in reserve. Rest starts on its own.",
    nextGen: true,
  },
  {
    id: "library",
    tab: "fit",
    target: "library",
    title: "Form clips",
    body: "The library is looping form videos. The name is the movement in the clip — tap a card to see cues and last loads.",
    nextGen: true,
  },
  {
    id: "shortcuts",
    tab: "plan",
    target: "shortcuts",
    title: "Shortcuts",
    body: "Desserts, People, and Extras live up here so the bottom bar stays five taps. Pencil lets you pin what you use.",
  },
];

export function Walkthrough({
  onExtras,
}: {
  onExtras?: (open: boolean) => void;
}) {
  const finish = useSpoonful((s) => s.finishWalkthrough);
  const setTab = useSpoonful((s) => s.setTab);
  const nextGen = useSpoonful((s) => s.nextGen);
  const steps = useMemo(() => STEPS.filter((s) => !s.nextGen || nextGen), [nextGen]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[index];

  useEffect(() => {
    if (!step) return;
    if (step.tab) setTab(step.tab);
    onExtras?.(Boolean(step.extras));
    let tries = 0;
    let timer = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
        return;
      }
      setRect(null);
      if (tries < 14) {
        tries += 1;
        timer = window.setTimeout(measure, 90);
      }
    };
    timer = window.setTimeout(measure, 120);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [step, setTab, onExtras]);

  if (!step) return null;

  const pad = 8;
  const hole = rect
    ? {
        top: Math.max(4, rect.top - pad),
        left: Math.max(4, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;
  const cardLow = !hole || hole.top < (typeof window !== "undefined" ? window.innerHeight * 0.42 : 300);

  function go(next: number) {
    if (next < 0) return;
    if (next >= steps.length) {
      finish();
      return;
    }
    setIndex(next);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {hole ? (
        <>
          <button
            type="button"
            className="pointer-events-auto absolute inset-x-0 top-0 bg-foreground/50"
            style={{ height: hole.top }}
            aria-label="Next tip"
            onClick={() => go(index + 1)}
          />
          <button
            type="button"
            className="pointer-events-auto absolute inset-x-0 bg-foreground/50"
            style={{ top: hole.top + hole.height, bottom: 0 }}
            aria-label="Next tip"
            onClick={() => go(index + 1)}
          />
          <button
            type="button"
            className="pointer-events-auto absolute bg-foreground/50"
            style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }}
            aria-label="Next tip"
            onClick={() => go(index + 1)}
          />
          <button
            type="button"
            className="pointer-events-auto absolute bg-foreground/50"
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              right: 0,
              height: hole.height,
            }}
            aria-label="Next tip"
            onClick={() => go(index + 1)}
          />
          <div
            className="pointer-events-none absolute rounded-2xl ring-2 ring-spark"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
            }}
          />
        </>
      ) : (
        <button type="button" className="pointer-events-auto absolute inset-0 bg-foreground/50" aria-label="Next tip" onClick={() => go(index + 1)} />
      )}

      <div
        className={cn(
          "pointer-events-auto absolute inset-x-0 z-[71] px-4",
          cardLow ? "bottom-[max(5.5rem,env(safe-area-inset-bottom))]" : "top-[max(1rem,env(safe-area-inset-top))]",
        )}
      >
        {isPreviewChrome() && !cardLow ? <div className="chrome-gutter mb-2" /> : null}
        <div className="mx-auto max-w-lg rounded-3xl bg-card p-4 text-foreground shadow-[var(--shadow-lift)]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">
            Tour {index + 1} of {steps.length}
          </p>
          <h2 id="tour-title" className="mt-1 font-display text-2xl leading-tight">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="h-12 flex-1" disabled={index === 0} onClick={() => go(index - 1)}>
              Back
            </Button>
            <Button variant="ghost" className="h-12 flex-1" onClick={finish}>
              Skip
            </Button>
            <Button
              className="h-12 flex-1 bg-spark text-spark-foreground hover:opacity-95"
              onClick={() => go(index + 1)}
            >
              {index === steps.length - 1 ? "Got it" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
