import assert from "node:assert/strict";
import test from "node:test";
import {
  COACH_TONES,
  COACH_VOICES,
  coachLine,
  coachPulse,
  coachVoiceById,
  isCoachTone,
  markCoachPing,
  normalizeCoach,
  type CoachEvent,
  type CoachTone,
} from "./coach.ts";

const EVENTS: CoachEvent[] = [
  "mealReminder",
  "workoutReminder",
  "snackReminder",
  "skippedWorkout",
  "missedWorkout",
  "ateOut",
  "loggedLift",
  "cookedDinner",
];

test("every tone has lines for every coach event", () => {
  for (const event of EVENTS) {
    for (const tone of COACH_TONES) {
      const a = coachLine(event, tone.id, 1);
      const b = coachLine(event, tone.id, 2);
      assert.ok(a.length > 8, `${event}/${tone.id}`);
      assert.ok(b.length > 8);
    }
  }
});

test("same salt returns the same line", () => {
  assert.equal(coachLine("ateOut", "roasting", 41), coachLine("ateOut", "roasting", 41));
});

test("tones are distinct enough that raunchy is not classical", () => {
  const raunchy = coachLine("workoutReminder", "raunchy", 3);
  const classical = coachLine("workoutReminder", "classical", 3);
  assert.notEqual(raunchy, classical);
});

test("normalizeCoach fills defaults and rejects junk tone", () => {
  assert.equal(normalizeCoach(null).tone, "normal");
  assert.equal(normalizeCoach({ tone: "feral" }).tone, "normal");
  assert.equal(normalizeCoach({ tone: "hype", vocal: true, on: false }).vocal, true);
  assert.equal(normalizeCoach({ tone: "hype", vocal: true, on: false }).on, false);
  assert.equal(isCoachTone("belittling"), true);
  assert.equal(isCoachTone("mean"), false);
});

test("eight tones ship, including the requested raunchy and classical", () => {
  const ids = COACH_TONES.map((t) => t.id) as CoachTone[];
  for (const need of ["raunchy", "classical", "roasting", "humorous", "belittling", "normal"] as CoachTone[]) {
    assert.ok(ids.includes(need));
  }
});

test("coachPulse fires one reminder a day per slot and stays quiet when off", () => {
  const prefs = normalizeCoach({ on: true, pingDay: "", pinged: [] });
  assert.equal(
    coachPulse({ prefs, day: "2026-09-07", hour: 18, dinnerHour: 18, todayStatus: "planned", hasDinner: true, hasSnack: false }),
    "mealReminder",
  );
  assert.equal(
    coachPulse({ prefs, day: "2026-09-07", hour: 10, dinnerHour: 18, todayStatus: "planned", hasDinner: true, hasSnack: false }),
    "workoutReminder",
  );
  const after = markCoachPing(prefs, "workoutReminder", "2026-09-07");
  assert.equal(
    coachPulse({ prefs: after, day: "2026-09-07", hour: 10, dinnerHour: 18, todayStatus: "planned", hasDinner: false, hasSnack: false }),
    null,
  );
  assert.equal(
    coachPulse({
      prefs: normalizeCoach({ on: false }),
      day: "2026-09-07",
      hour: 10,
      dinnerHour: 18,
      todayStatus: "planned",
      hasDinner: true,
      hasSnack: true,
    }),
    null,
  );
});

test("voice picker ships British, Australian, and Western Cowboy", () => {
  const ids = COACH_VOICES.map((v) => v.id);
  for (const need of ["british", "australian", "american", "cowboy", "irish", "indian"] as const) {
    assert.ok(ids.includes(need), need);
  }
  assert.equal(coachVoiceById("cowboy")?.pitch, 0.72);
  assert.equal(coachVoiceById("british")?.lang, "en-GB");
  assert.equal(normalizeCoach({ vocal: true }).voiceURI, "american");
  assert.equal(normalizeCoach({ voiceURI: "cowboy" }).voiceURI, "cowboy");
});
