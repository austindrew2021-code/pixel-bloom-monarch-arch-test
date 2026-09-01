import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import { EXERCISE_CLIPS, exerciseClipSrc } from "./exercise-clips.ts";

const clipsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../public/exercises");

function hashOf(id: string): string {
  const file = path.join(clipsDir, `${id}.mp4`);
  return createHash("md5").update(readFileSync(file)).digest("hex");
}

test("every registered exercise clip resolves to a file on disk", () => {
  for (const id of EXERCISE_CLIPS) {
    const file = path.join(clipsDir, `${id}.mp4`);
    assert.ok(existsSync(file), `missing clip file for "${id}": ${file}`);
  }
});

test("no two registered exercises share the exact same clip content", () => {
  const byHash = new Map<string, string[]>();
  for (const id of EXERCISE_CLIPS) {
    const hash = hashOf(id);
    const ids = byHash.get(hash) ?? [];
    ids.push(id);
    byHash.set(hash, ids);
  }
  const collisions = [...byHash.values()].filter((ids) => ids.length > 1);
  assert.deepEqual(collisions, [], `duplicate clip content shared across ids: ${JSON.stringify(collisions)}`);
});

test("exerciseClipSrc only returns paths for registered ids", () => {
  assert.equal(exerciseClipSrc("bench"), "/exercises/bench.mp4");
  assert.equal(exerciseClipSrc("not-a-real-exercise-id"), null);
});
