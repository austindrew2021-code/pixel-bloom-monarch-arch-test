import assert from "node:assert/strict";
import test from "node:test";
import { buildRecap, recapDue, recapHeadline, recapShareText, type RecapInput } from "./recap.ts";
import { weekDates } from "./week.ts";

const WEEK = "2026-09-07"; // a Monday
const D = weekDates(WEEK);

function night(i: number, over: Partial<RecapInput["nights"][number]> = {}) {
  return { date: D[i]!, title: "Chili", protein: "beef", saved: 14, takeout: false, ...over };
}

test("a recap counts only the nights that were really cooked", () => {
  const recap = buildRecap({
    weekStart: WEEK,
    cookedDates: [D[0]!, D[1]!],
    nights: [night(0), night(1), night(2)], // three planned, two cooked
  });
  assert.equal(recap.plated, 3);
  assert.equal(recap.cooked, 2);
  assert.equal(recap.saved, 28, "a planned-but-skipped night saved nothing");
});

test("takeout counts as takeout and never as savings", () => {
  const recap = buildRecap({
    weekStart: WEEK,
    cookedDates: [D[0]!],
    nights: [night(0), night(1, { takeout: true, saved: 40 })],
  });
  assert.equal(recap.takeout, 1);
  assert.equal(recap.plated, 1);
  assert.equal(recap.saved, 14);
});

test("variety counts distinct proteins, not dishes", () => {
  const recap = buildRecap({
    weekStart: WEEK,
    cookedDates: D.slice(0, 3),
    nights: [
      night(0, { title: "Chili", protein: "beef" }),
      night(1, { title: "Meatballs", protein: "beef" }),
      night(2, { title: "Dal", protein: "veg" }),
    ],
  });
  assert.equal(recap.variety, 2);
});

test("a favourite has to actually repeat", () => {
  const once = buildRecap({
    weekStart: WEEK,
    cookedDates: [D[0]!, D[1]!],
    nights: [night(0, { title: "Chili" }), night(1, { title: "Dal" })],
  });
  assert.equal(once.favourite, null, "two different dinners have no favourite");

  const twice = buildRecap({
    weekStart: WEEK,
    cookedDates: [D[0]!, D[1]!, D[2]!],
    nights: [night(0, { title: "Chili" }), night(1, { title: "Chili" }), night(2, { title: "Dal" })],
  });
  assert.equal(twice.favourite, "Chili");
});

test("last week is measured from last week, not this one", () => {
  const prior = weekDates("2026-08-31");
  const recap = buildRecap({
    weekStart: WEEK,
    cookedDates: [D[0]!, prior[0]!, prior[1]!, prior[2]!],
    nights: [night(0)],
  });
  assert.equal(recap.cooked, 1);
  assert.equal(recap.cookedLastWeek, 3);
});

test("the headline tells the truth on a bad week", () => {
  const empty = buildRecap({ weekStart: WEEK, cookedDates: [], nights: [] });
  assert.equal(recapHeadline(empty), "A week off the stove");
  assert.match(recapShareText(empty), /fresh one/);
  assert.doesNotMatch(recapHeadline(empty), /\bgreat\b|\bamazing\b|\bcrushed\b/i);
});

test("the headline says up, level, or down honestly", () => {
  const base = { weekStart: WEEK, nights: [night(0), night(1), night(2)] };
  const prior = weekDates("2026-08-31");
  const up = buildRecap({ ...base, cookedDates: [D[0]!, D[1]!, D[2]!, prior[0]!] });
  assert.equal(recapHeadline(up), "3 nights — up from 1");

  const level = buildRecap({ ...base, cookedDates: [D[0]!, D[1]!, D[2]!, prior[0]!, prior[1]!, prior[2]!] });
  assert.equal(recapHeadline(level), "3 nights, same as last week");

  const down = buildRecap({
    ...base,
    cookedDates: [D[0]!, ...prior.slice(0, 4)],
  });
  assert.equal(recapHeadline(down), "1 night at the stove");
});

test("the share line is short and carries the real numbers", () => {
  const recap = buildRecap({
    weekStart: WEEK,
    cookedDates: D.slice(0, 4),
    nights: [night(0), night(1), night(2), night(3)],
  });
  const text = recapShareText(recap);
  assert.match(text, /4 nights cooked/);
  assert.match(text, /\$56 kept out of takeout/);
  assert.match(text, /4 nights in a row/);
  assert.ok(text.length <= 120, `share line is ${text.length} chars`);
});

test("the recap shows up Sunday evening and Monday, once", () => {
  const recap = buildRecap({ weekStart: WEEK, cookedDates: [D[0]!], nights: [night(0)] });
  const due = (iso: string, lastSeenWeek = "") =>
    recapDue({ weekStart: WEEK, lastSeenWeek, recap, now: new Date(iso) });

  assert.equal(due("2026-09-13T18:00:00"), true, "Sunday evening");
  assert.equal(due("2026-09-13T09:00:00"), false, "Sunday morning is too early");
  assert.equal(due("2026-09-14T08:00:00"), true, "Monday");
  assert.equal(due("2026-09-10T18:00:00"), false, "midweek");
  assert.equal(due("2026-09-14T08:00:00", WEEK), false, "already seen this week");
});

test("the run is the best one inside the week, not the live streak", () => {
  const D2 = weekDates(WEEK);
  // Cooked Monday through Thursday, then took the weekend off.
  const recap = buildRecap({
    weekStart: WEEK,
    cookedDates: D2.slice(0, 4),
    nights: [night(0), night(1), night(2), night(3)],
  });
  assert.equal(recap.bestRun, 4, "a good week must not report a run of zero");

  // A gap in the middle breaks the run without erasing the week.
  const split = buildRecap({
    weekStart: WEEK,
    cookedDates: [D2[0]!, D2[1]!, D2[4]!],
    nights: [night(0), night(1), night(4)],
  });
  assert.equal(split.cooked, 3);
  assert.equal(split.bestRun, 2);
});

test("a cook who never started is not handed an empty recap", () => {
  const nothing = buildRecap({ weekStart: WEEK, cookedDates: [], nights: [] });
  assert.equal(recapDue({ weekStart: WEEK, lastSeenWeek: "", recap: nothing, now: new Date("2026-09-14T08:00:00") }), false);
});
