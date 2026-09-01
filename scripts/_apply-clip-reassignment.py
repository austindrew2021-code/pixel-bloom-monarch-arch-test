#!/usr/bin/env python3
"""
One-off tool (not part of the app or CI): applies the verified exercise-clip
reassignment worked out by direct frame-by-frame review of every file in
public/exercises/. See the mapping tables below for the full reasoning.

Of the 104 original clip files:
  - 25 already show the exercise their filename claims -> left untouched.
  - 30 show a DIFFERENT exercise that IS in the catalog -> renamed to that id.
  - 49 show content that doesn't clearly match anything in the 113-exercise
    catalog (wrong equipment/muscle/movement with no home found) -> deleted.

Run from the repo root:  python3 scripts/_apply-clip-reassignment.py

Safe to re-run: it snapshots every source file's bytes before writing any
destination, so chained reassignments (A's content -> B, B's content -> C)
never clobber data mid-move. Prints a final report and fails loudly (assert)
if the resulting file set doesn't match expectations, or if any two files
in the final set are byte-identical (would recreate the smith-shrug/
sissy-squat duplicate-video bug this whole reassignment fixes).
"""

import os
import shutil
import hashlib

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(REPO, "public/exercises")
TMP = "/tmp/clip-reassignment-snapshot"

# Exercises whose registered clip already matches their name (verified by
# extracting and viewing an actual frame from each file, not just the id).
KEPT = [
    "ab-wheel", "bike", "cable-crunch", "hanging-leg", "kickback", "pec-deck", "sit-up", "v-up",
    "squat", "decline", "ohp", "hip-adduction", "rear-fly", "row", "chest-supported-row", "curl",
    "ez-curl", "hammer", "tricep", "tricep-kickback", "woodchop", "russian-twist", "hip-thrust",
    "seated-calf", "donkey-kick",
]

# (source_id, destination_id): the video currently filed under source_id
# actually shows destination_id's exercise, so its content is moved there.
RENAMES = [
    ("front-squat", "leg-press"),       # leg-press machine, not front squat
    ("leg-press", "smith-squat"),       # Smith-rack squat, not leg press
    ("smith-squat", "hack-squat"),      # angled hack-squat sled, not Smith squat
    ("split-squat", "leg-ext"),         # leg extension machine, not split squat
    ("leg-ext", "goblet"),              # standing dumbbell-at-chest hold, not leg extension
    ("deadlift", "shrug"),              # standing dumbbell hold/traps, not a deadlift
    ("smith-shrug", "deadlift"),        # bent-over barbell hip hinge, not a shrug
    ("close-grip", "overhead-ext"),     # seated overhead dumbbell extension, not close-grip bench
    ("bench", "chest-press"),           # seated cable chest-press machine, not barbell bench
    ("incline-db", "bench"),            # flat barbell bench press (rack), not incline dumbbell
    ("incline", "db-bench"),            # flat dumbbell bench press, not incline
    ("overhead-ext", "skullcrusher"),   # lying barbell skullcrusher, not overhead extension
    ("t-bar-row", "seated-row"),        # seated cable row, not T-bar row
    ("cable-fly", "cable-crossover"),   # standing wide-arm cable work, not seated machine fly
    ("plank", "glute-bridge"),          # supine hip raise, not a prone plank
    ("glute-bridge", "hip-abduction"),  # standing hip ab/adduction machine, not glute bridge
    ("decline-db", "machine-press"),    # seated shoulder-press machine, not decline dumbbell press
    ("bicycle", "machine-crunch"),      # seated ab-crunch machine, not bicycle crunch
    ("machine-crunch", "bicycle"),      # floor bicycle-crunch pose, not a machine
    ("decline-situp", "reverse-crunch"),# supine straight-leg raise, not decline sit-up
    ("cable-curl", "lat"),              # seated overhead cable pulldown, not cable curl
    ("lat", "straight-arm-pulldown"),   # standing single-cable diagonal pull, not lat pulldown
    ("incline-curl", "preacher-machine"), # seated machine preacher curl, not incline curl
    ("fly", "cable-fly"),               # seated one-arm machine fly, not dumbbell fly
    ("reverse-lunge", "rdl"),           # full barbell hip hinge, not a lunge
    ("reverse-pec-deck", "lateral"),    # dumbbells raised out to sides, not reverse pec deck
    ("spider-curl", "cable-curl"),      # standing single-arm cable curl, not spider curl
    ("sumo-squat", "step-up"),          # box step-up, not sumo squat (was an orphaned file)
    ("machine-press", "farmer"),        # standing holding two dumbbells, not machine press
    ("shrug", "upright-row"),           # cable pull up toward chin/chest, not a shrug
]


def hash_of(path: str) -> str:
    return hashlib.md5(open(path, "rb").read()).hexdigest()


def main() -> None:
    os.makedirs(TMP, exist_ok=True)

    sources = [a for a, _ in RENAMES]
    dests = [b for _, b in RENAMES]
    assert len(KEPT) == len(set(KEPT)) == 25
    assert len(sources) == len(set(sources)) == 30
    assert len(dests) == len(set(dests)) == 30
    assert not (set(KEPT) & set(dests))
    assert not (set(KEPT) & set(sources))

    for src, _ in RENAMES:
        shutil.copyfile(os.path.join(CLIPS, f"{src}.mp4"), os.path.join(TMP, f"{src}.mp4"))
    print(f"snapshotted {len(RENAMES)} source files to {TMP}")

    for src, dst in RENAMES:
        shutil.copyfile(os.path.join(TMP, f"{src}.mp4"), os.path.join(CLIPS, f"{dst}.mp4"))
    print("wrote all destinations")

    final_set = set(KEPT) | set(dests)
    existing = {f[:-4] for f in os.listdir(CLIPS) if f.endswith(".mp4")}
    to_delete = existing - final_set
    for exid in sorted(to_delete):
        os.remove(os.path.join(CLIPS, f"{exid}.mp4"))
    print(f"deleted {len(to_delete)} unused clip files: {sorted(to_delete)}")

    remaining = {f[:-4] for f in os.listdir(CLIPS) if f.endswith(".mp4")}
    assert remaining == final_set, (remaining - final_set, final_set - remaining)
    print(f"final clip set has {len(remaining)} files (expected {len(final_set)})")

    by_hash: dict[str, list[str]] = {}
    for exid in sorted(remaining):
        h = hash_of(os.path.join(CLIPS, f"{exid}.mp4"))
        by_hash.setdefault(h, []).append(exid)
    dupes = [ids for ids in by_hash.values() if len(ids) > 1]
    assert not dupes, f"duplicate clip content shared across ids: {dupes}"
    print("OK: no duplicate content among final clip set")
    print(sorted(remaining))


if __name__ == "__main__":
    main()
