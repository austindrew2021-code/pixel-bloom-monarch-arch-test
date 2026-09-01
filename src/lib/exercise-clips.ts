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
 */
export const EXERCISE_CLIPS = new Set([
  "ab-wheel",
  "bench",
  "bicycle",
  "bike",
  "cable-crossover",
  "cable-crunch",
  "cable-curl",
  "cable-fly",
  "chest-press",
  "chest-supported-row",
  "curl",
  "db-bench",
  "deadlift",
  "decline",
  "donkey-kick",
  "ez-curl",
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
  "machine-press",
  "ohp",
  "overhead-ext",
  "pec-deck",
  "preacher-machine",
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
