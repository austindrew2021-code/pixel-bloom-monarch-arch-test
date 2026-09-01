/**
 * Looping form clips for the library. Missing ids fall back to the pose figure.
 *
 * This set was rebuilt by scripts/_apply-clip-reassignment.py from a
 * frame-by-frame review of every clip on disk: 25 ids already showed the
 * exercise their filename claimed, 30 showed a different exercise that IS
 * in the catalog (and were renamed to the correct id), and 49 showed content
 * that didn't clearly match anything in the catalog (wrong equipment, wrong
 * movement pattern) and were removed rather than left mislabeled — those
 * exercises fall back to the SVG pose figure, which is always at least
 * generically correct for the movement category.
 *
 * That pass matched on movement pattern (is this a press? a row?) without
 * checking equipment specifically. Two follow-up equipment-only audits (see
 * scripts/_qa-equipment-audit.mjs) found four more: "machine-press" shows a
 * dumbbell overhead press, and "ez-curl" / "cable-curl" / "preacher-machine"
 * all show the same generic two-dumbbell curl regardless of their actual
 * bar/cable/machine equipment. All four removed for the same reason — the
 * SVG fallback (exercise-figure.tsx) is equipment-aware for exactly this,
 * so it draws the right implement (or none, for cable/machine) instead.
 */
export const EXERCISE_CLIPS = new Set([
  "ab-wheel",
  "bench",
  "bicycle",
  "bike",
  "cable-crossover",
  "cable-crunch",
  "cable-fly",
  "chest-press",
  "chest-supported-row",
  "curl",
  "db-bench",
  "deadlift",
  "decline",
  "donkey-kick",
  "farmer",
  "glute-bridge",
  "goblet",
  "hack-squat",
  "hammer",
  "hanging-leg",
  "hip-abduction",
  "hip-adduction",
  "hip-thrust",
  "kickback",
  "lat",
  "lateral",
  "leg-ext",
  "leg-press",
  "machine-crunch",
  "ohp",
  "overhead-ext",
  "pec-deck",
  "rdl",
  "rear-fly",
  "reverse-crunch",
  "row",
  "russian-twist",
  "seated-calf",
  "seated-row",
  "shrug",
  "sit-up",
  "skullcrusher",
  "smith-squat",
  "squat",
  "step-up",
  "straight-arm-pulldown",
  "tricep",
  "tricep-kickback",
  "upright-row",
  "v-up",
  "woodchop",
]);

export function exerciseClipSrc(id: string): string | null {
  return EXERCISE_CLIPS.has(id) ? `/exercises/${id}.mp4` : null;
}
