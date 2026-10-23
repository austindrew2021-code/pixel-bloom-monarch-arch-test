import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { RECIPES } from "./recipes.ts";
import { formatMinutes } from "./format.ts";
import { CATALOG_DEFAULT_MINUTES, dotJoin, printedMinutes, resolvedTimeLabel, shownMinutes, timeLabel } from "./recipe-time.ts";
import type { Recipe } from "./types";

const base = RECIPES.find((r) => r.source?.book)!;
const book = (steps: string[], minutes = CATALOG_DEFAULT_MINUTES, description = "Ingredients."): Recipe => ({
  ...base, id: "stub-time", name: "Stub Pudding", minutes, steps, description,
});
const isBook = (r: Recipe) => Boolean(r.source?.book);
const get = (id: string) => RECIPES.find((r) => r.id === id)!;

test("printedMinutes reads only a duration the recipe prints for itself", () => {
  const p = (...steps: string[]) => printedMinutes(book(steps));
  assert.equal(p("Bake in a slow oven 25 to 30 minutes."), 30);
  assert.equal(p("Bake about twenty minutes."), 20);
  assert.equal(p("It will be done in about twenty minutes."), null, "no heat named: not a total cooking time (bypass guard)");
  assert.equal(p("Let the dough rise 2 hours."), null, "a rise is not a cooking time");
  assert.equal(p("Simmer 1 hour."), 60);
  assert.equal(p("Simmer 1½ hours."), 90);
  assert.equal(p("Boil for half an hour."), 30);
  assert.equal(p("Cook 5 minutes.", "Then stir.", "Cook 5 minutes more."), null, "two timed instructions: no single total (Oct 17 rule)");
  assert.equal(p("Mix well.", "Pour into a dish."), null);
  assert.equal(p("Heat the oven to 400°.", "Cut into 1-inch pieces."), null);
  assert.equal(p("Cook 5 minutes.", "Bake 40 minutes."), null, "two different times are not one total time");
  assert.equal(p("Refrigerate no longer than 48 hours.", "Bake 30 minutes."), 30);
  assert.equal(p("Keeps up to 2 days.", "Mix well."), null);
});

test("book recipe with the 45 placeholder: chip kept only when it prints one total time", () => {
  assert.equal(timeLabel(book(["Mix.", "Let cook ten minutes."])), "10 min", "prints 10 minutes: chip kept");
  assert.equal(timeLabel(book(["Mix.", "Let boil five hours."])), "5h", "prints 300 minutes: chip kept");
  assert.equal(timeLabel(book(["Mix.", "Bake 45 minutes."])), "45 min", "prints 45: kept");
  assert.equal(timeLabel(book(["Mix.", "Bake until set."])), null, "prints none: hidden");
  assert.equal(timeLabel(book(["Cook 5 minutes.", "Bake 40 minutes."])), null, "two times: hidden");
  assert.equal(shownMinutes(book(["Bake until set."])), null);
});

test("recipes that print their own time keep the chip (live ids)", () => {
  assert.equal(get("fd-jan-25-india-curried-eggs").minutes, 45);
  assert.equal(timeLabel(get("fd-jan-25-india-curried-eggs")), formatMinutes(10));
  assert.equal(timeLabel(get("fd-dec-01-english-plum-pudding")), formatMinutes(300));
});

test("not touched: app-authored recipes, and book recipes whose minutes is not the 45 default", () => {
  const app = { ...book(["Bake until set."]), source: undefined };
  assert.equal(timeLabel(app), "45 min");
  assert.equal(timeLabel(book(["Bake until set."], 30)), "30 min");
  assert.equal(timeLabel(book(["Bake until set."], 120)), "2h");
  for (const r of RECIPES.filter((r) => !isBook(r))) assert.equal(timeLabel(r), formatMinutes(r.minutes), r.id);
  for (const r of RECIPES.filter((r) => isBook(r) && r.minutes !== CATALOG_DEFAULT_MINUTES)) assert.equal(timeLabel(r), formatMinutes(r.minutes), r.id);
});

test("every live book recipe: label is null exactly when no single printed time exists", () => {
  let hidden = 0;
  let kept = 0;
  for (const r of RECIPES.filter((r) => isBook(r) && r.minutes === CATALOG_DEFAULT_MINUTES)) {
    const p = shownMinutes(r);
    if (p === null) { hidden++; assert.equal(timeLabel(r), null, r.id); }
    else { kept++; assert.equal(timeLabel(r), formatMinutes(p), r.id); }
  }
  assert.ok(hidden > 0 && kept > 0);
});

test("a kept chip never shows the placeholder unless the book prints 45", () => {
  for (const r of RECIPES.filter((r) => isBook(r) && r.minutes === CATALOG_DEFAULT_MINUTES)) {
    if (timeLabel(r) === "45 min") assert.equal(shownMinutes(r), 45, r.id);
  }
});

test("plan meals: custom meals, skips and the empty state keep their text; a hidden chip leaves no dangling separator", () => {
  assert.equal(resolvedTimeLabel({ minutes: 45 }), "45 min");
  assert.equal(resolvedTimeLabel({ minutes: 0 }), "0 min");
  assert.equal(resolvedTimeLabel({ minutes: 45, recipe: book(["Bake until set."]) }), null);
  assert.equal(dotJoin("45 min", "Italian"), "45 min · Italian");
  assert.equal(dotJoin(null, "Italian"), "Italian");
  assert.equal(dotJoin(null, null), "");
});

test("one definition: recipe-time re-exports cook-steps.printedMinutes, and the fallback description reads it", async () => {
  const cs = await import("./cook-steps.ts");
  assert.equal(printedMinutes, cs.printedMinutes);
  for (const r of RECIPES.filter(isBook)) assert.equal(shownMinutes(r.minutes === CATALOG_DEFAULT_MINUTES ? r : { ...r, minutes: CATALOG_DEFAULT_MINUTES }), cs.printedMinutes(r), r.id);
});

test("Oct 17: the chip follows the bypass's printed-minutes rule for every id Line listed (fractions of an hour, 1-minute steps, a step time is not the total)", () => {
  const cases = JSON.parse(readFileSync(new URL("./printed-minutes-cases.json", import.meta.url), "utf8")) as { id: string; steps: string[]; printedMinutes: number | null }[];
  assert.ok(cases.length >= 23);
  for (const c of cases) {
    assert.equal(shownMinutes(book(c.steps)), c.printedMinutes, c.id);
    assert.equal(timeLabel(book(c.steps)), c.printedMinutes === null ? null : formatMinutes(c.printedMinutes), c.id);
  }
  assert.equal(timeLabel(book(["Stew moderately two and half hours."])), formatMinutes(150));
});

test("Oct 17: until/till + up to four words + soft, set, thick, thickened, flaky, fragrant is another untimed cook step", () => {
  const p = (...steps: string[]) => printedMinutes(book(steps));
  const chip = (...steps: string[]) => timeLabel(book(steps));
  // htcf-0218 shape: a lone "cook for fifteen minutes" among a sauce cooked "until thick"
  assert.equal(p("Fry onions in butter.", "Cook until thick, stirring constantly.", "Add the eel, cover, and cook for fifteen minutes.", "Serve."), null);
  assert.equal(chip("Fry onions in butter.", "Cook until thick, stirring constantly.", "Add the eel, cover, and cook for fifteen minutes.", "Serve."), null);
  for (const done of ["soft", "set", "thick", "thickened", "flaky", "fragrant", "the sauce is thick", "the custard has set", "very fragrant and soft"]) {
    assert.equal(p(`Stir until ${done}.`, "Cook for ten minutes."), null, `until ${done}`);
    assert.equal(p("Cook for ten minutes.", `Then simmer till ${done}.`), null, `till ${done}`);
  }
  assert.equal(p("Cook ten minutes.", "Stir until a very thick, smooth sauce is formed."), null, "four words between until and thick");
  assert.equal(p("Cook ten minutes.", "Stir until one two three four five thick."), 10, "more than four words: not matched");
  assert.equal(p("Cook ten minutes.", "Stir until thickly coated."), 10, "'thickly' is not 'thick'");
  assert.equal(p("Cook ten minutes.", "Serve until all is gone."), 10);
  // the same exceptions as before: the doneness belongs to the timed step itself, or to a thickening roux
  assert.equal(p("Bake 30 minutes or until golden.", "Serve."), 30);
  assert.equal(p("Cover and simmer about 20 minutes or until soft.", "Season with salt."), 20);
  assert.equal(p("Cover and simmer 20 minutes, until fragrant.", "Season with salt."), 20);
  assert.equal(p("Simmer 40 minutes.", "Thicken with butter blended with flour, and cook until of the proper consistency.", "Serve."), 40);
  assert.equal(p("Simmer 40 minutes.", "Thicken with flour and butter, cook until thick.", "Serve."), 40, "thicken before until: the roux");
  assert.equal(p("Simmer 40 minutes.", "Cook the flour and butter together until thickened and smooth, then add.", "Serve."), null, "no 'thicken' before the until: a doneness step");
  assert.equal(p("Cook 10 minutes.", "Thicken with flour, then cook until set."), 10);
  assert.equal(p("Simmer 20 minutes, then cook until thick.", "Serve."), null, "after a 'then' in the timed sentence");
  // existing doneness words and a plain recipe still behave
  assert.equal(p("Stew till done.", "Then simmer 30 minutes."), null);
  assert.equal(p("Simmer 20 minutes.", "Serve."), 20);
});

test("Oct 17: live ids — htcf-0218 / 0127 / 0959 lose a lone step time; pta-171 keeps its 20", () => {
  for (const id of ["htcf-0218", "htcf-0127", "htcf-0959"]) {
    const r = RECIPES.find((x) => x.id === id);
    if (r) assert.equal(timeLabel(r), null, id);
  }
  const pta = RECIPES.find((x) => x.id === "pta-171");
  if (pta) assert.equal(timeLabel(pta), "20 min");
});
