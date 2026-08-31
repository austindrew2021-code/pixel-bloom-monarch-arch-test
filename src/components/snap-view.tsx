import { Camera, Check, Leaf, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { KitchenHero } from "@/components/kitchen-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { scanPantryPhoto, suggestMealsFromPantry, suggestSubstitutes } from "@/lib/kitchen-ai";
import { mealsFromPantry, type PantryIdea } from "@/lib/pantry-match";
import { RECIPES } from "@/lib/recipes";
import { recipeAllowed, unlockedRecipes, useSpoonful } from "@/lib/spoonful-store";

type Idea = PantryIdea;

type NeedCheck =
  | { kind: "need"; index: number }
  | { kind: "sub"; needIndex: number; options: { name: string; note: string }[]; subIndex: number };

async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image"));
      el.src = url;
    });
    const max = 768;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SnapView() {
  return <SnapFlow />;
}

function SnapFlow() {
  const { user, isPending } = useCurrentUserState();
  const addPantry = useSpoonful((s) => s.addPantry);
  const consumeSnap = useSpoonful((s) => s.consumeSnap);
  const markSnapped = useSpoonful((s) => s.markSnapped);
  const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
  const pantry = useSpoonful((s) => s.pantry);
  const assignCustom = useSpoonful((s) => s.assignCustom);
  const assignMeal = useSpoonful((s) => s.assignMeal);
  const weekStart = useSpoonful((s) => s.weekStart);
  const setTab = useSpoonful((s) => s.setTab);
  const unlocked = useSpoonful((s) => s.unlocked);
  const prefs = useSpoonful((s) => s.prefs);
  const allergies = useSpoonful((s) => s.allergies);
  const hidden = useSpoonful((s) => s.hidden);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"pantry" | "counter">("pantry");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [active, setActive] = useState<Idea | null>(null);
  const [check, setCheck] = useState<NeedCheck | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!user) {
      toast("Sign in to photograph the kitchen");
      return;
    }
    if (!consumeSnap()) {
      toast(hasPlus ? "Snap is busy" : "Free kitchens get 8 photo scans a week. Kitchen+ lifts the cap.");
      return;
    }
    setBusy(true);
    setIdeas([]);
    setActive(null);
    setCheck(null);
    try {
      const image = await compress(file);
      const res = await scanPantryPhoto({ data: { image, hint: mode } });
      if (!res.ok) {
        toast(res.error);
        return;
      }
      markSnapped();
      setItems(res.items);
      if (res.items.length === 0) toast("No food spotted. Try a closer photo, or type items below.");
    } catch {
      toast("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  async function makeIdeas() {
    if (items.length === 0) return;
    setBusy(true);
    setActive(null);
    setCheck(null);
    try {
      const local = mealsFromPantry(
        items,
        unlockedRecipes(unlocked).filter((r) => recipeAllowed(r, prefs, allergies, hidden)),
      );
      setIdeas(local);
      for (const name of items) addPantry(name);
      if (user) {
        const catalog = RECIPES.slice(0, 80).map((r) => r.name);
        const res = await suggestMealsFromPantry({ data: { items, catalog } });
        if (res.ok) {
          const seen = new Set(local.map((i) => i.title.toLowerCase()));
          const extra = res.ideas.filter((i) => !seen.has(i.title.toLowerCase()));
          setIdeas([...local, ...extra].slice(0, 8));
        }
      }
    } catch {
      toast("Could not plate ideas.");
    } finally {
      setBusy(false);
    }
  }

  function startIdea(idea: Idea) {
    setActive(idea);
    setCheck(idea.need.length > 0 ? { kind: "need", index: 0 } : null);
  }

  function nextNeed(fromIndex: number) {
    if (!active) return;
    const next = fromIndex + 1;
    if (next >= active.need.length) {
      setCheck(null);
      return;
    }
    setCheck({ kind: "need", index: next });
  }

  const askingNeed =
    check?.kind === "need" ? active?.need[check.index] : check?.kind === "sub" ? active?.need[check.needIndex] : undefined;
  const askingSub = check?.kind === "sub" ? check.options[check.subIndex] : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Snap</p>
      <h1 className="mt-1 font-display text-3xl">What is in the kitchen?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Photograph a shelf or a pile of ingredients. We list what we see, suggest dinners, then ask yes or
        no for anything missing — and substitutions if you say no.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <div className="mt-5 grid grid-cols-2 gap-2" data-tour="snap-cam">
        <Button
          className="h-28 flex-col rounded-3xl bg-spark text-spark-foreground hover:opacity-95"
          onClick={() => {
            setMode("pantry");
            fileRef.current?.click();
          }}
          disabled={busy || isPending}
        >
          <Camera className="size-6" />
          Pantry photo
        </Button>
        <Button
          variant="secondary"
          className="h-28 flex-col rounded-3xl bg-accent text-accent-foreground"
          onClick={() => {
            setMode("counter");
            fileRef.current?.click();
          }}
          disabled={busy || isPending}
        >
          <Leaf className="size-6" />
          Ingredients together
        </Button>
      </div>
      {!user && !isPending ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Photos need a signed-in cook.{" "}
          <a href="/login" className="font-medium text-spark underline-offset-4 hover:underline">
            Sign in
          </a>{" "}
          — or type what you have below. Catalog matching works either way.
        </p>
      ) : null}
      {busy ? <p className="mt-4 text-sm text-spark">Looking closely…</p> : null}

      <section className="mt-6">
        <h2 className="font-display text-xl">On hand</h2>
        {items.length === 0 ? (
          <KitchenHero plates={["bowl", "skillet", "green"]} className="mx-auto mt-2" />
        ) : null}
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => setItems((list) => list.filter((x) => x !== item))}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-sm text-accent-foreground"
              >
                {item}
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t) return;
            setItems((list) => (list.includes(t) ? list : [...list, t]));
            setDraft("");
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type an item you have" />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
        {pantry.length > 0 && items.length === 0 ? (
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => setItems(pantry.map((p) => p.name))}
          >
            Use my saved pantry
          </Button>
        ) : null}
        <Button className="mt-4 w-full" onClick={() => void makeIdeas()} disabled={busy || items.length === 0}>
          What can I cook?
        </Button>
      </section>

      {ideas.length > 0 && !active ? (
        <section className="mt-8">
          <h2 className="font-display text-xl">Ideas from what you have</h2>
          <ul className="mt-3 space-y-3">
            {ideas.map((idea) => (
              <li key={idea.title}>
                <button
                  type="button"
                  onClick={() => startIdea(idea)}
                  className="w-full rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
                >
                  <p className="font-medium">{idea.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{idea.why}</p>
                  <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                    {idea.minutes} min · {idea.need.length === 0 ? "you have it all" : `${idea.need.length} to check`}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {active ? (
        <section className="mt-8 rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)]">
          <h2 className="font-display text-2xl">{active.title}</h2>
          {check && askingNeed ? (
            <>
              {check.kind === "need" ? (
                <p className="mt-3 text-lg">Do you have {askingNeed}?</p>
              ) : (
                <p className="mt-3 text-lg">
                  Could you use {askingSub?.name ?? "this"} instead of {askingNeed}?
                </p>
              )}
              {check.kind === "sub" && askingSub ? (
                <p className="mt-1 text-sm text-muted-foreground">{askingSub.note}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button
                  className="h-12 flex-1"
                  onClick={() => {
                    if (check.kind === "sub" && askingSub) {
                      addPantry(askingSub.name);
                      setItems((list) => (list.includes(askingSub.name) ? list : [...list, askingSub.name]));
                    }
                    nextNeed(check.kind === "need" ? check.index : check.needIndex);
                  }}
                >
                  <Check /> Yes
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 flex-1"
                  onClick={async () => {
                    if (check.kind === "need") {
                      const res = await suggestSubstitutes({
                        data: { missing: askingNeed, pantry: items },
                      });
                      if (res.ok && res.options.length > 0) {
                        setCheck({
                          kind: "sub",
                          needIndex: check.index,
                          options: res.options,
                          subIndex: 0,
                        });
                        return;
                      }
                      useSpoonful.getState().addExtraGrocery(askingNeed, "Other");
                      toast(`Added ${askingNeed} to the shop list`);
                      nextNeed(check.index);
                      return;
                    }
                    const nextSub = check.subIndex + 1;
                    if (nextSub < check.options.length) {
                      setCheck({ ...check, subIndex: nextSub });
                      return;
                    }
                    useSpoonful.getState().addExtraGrocery(askingNeed, "Other");
                    toast(`Added ${askingNeed} to the shop list`);
                    nextNeed(check.needIndex);
                  }}
                >
                  <X /> No
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                You are ready. Cook it tonight, or save it to the week.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    if (active.recipeId) {
                      assignMeal(weekStart, "dinner", active.recipeId);
                    } else {
                      assignCustom(weekStart, "dinner", {
                        id: `snap-${Date.now()}`,
                        name: active.title,
                        minutes: active.minutes,
                        notes: active.why,
                        ingredients: [
                          ...active.have.map((n) => ({ name: n, qty: 1, unit: "", aisle: "Other" as const })),
                          ...active.need.map((n) => ({ name: n, qty: 1, unit: "", aisle: "Other" as const })),
                        ],
                      });
                    }
                    setTab("plan");
                    toast("Plated on Monday dinner");
                  }}
                >
                  Put on Monday
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setActive(null)}>
                  Back to ideas
                </Button>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
