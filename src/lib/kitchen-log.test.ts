import assert from "node:assert/strict";
import test from "node:test";
import { plateChangeKind, plateChangeWhy, whenLabel } from "./kitchen-log.ts";

test("skip and lift get different dinner reasons a parent can read", () => {
  assert.equal(plateChangeKind("skipped", false), "skip");
  assert.equal(plateChangeKind("done", true), "lift");
  assert.match(plateChangeWhy("skip"), /skipped/i);
  assert.match(plateChangeWhy("lift"), /workout/i);
  assert.ok(!/cockpit|fuel rewrite/i.test(plateChangeWhy("fuel")));
});

test("today's plate change says Tonight, not a weekday code", () => {
  const d = new Date();
  const iso = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  assert.equal(whenLabel(iso), "Tonight");
});
