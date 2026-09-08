import assert from "node:assert/strict";
import test from "node:test";
import { isUnlocked, seatCap } from "./access.ts";

test("founder kitchen is Table for life", () => {
  assert.equal(isUnlocked(["founder"], "kitchen-table"), true);
  assert.equal(isUnlocked(["founder"], "chef-plus"), true);
  assert.equal(isUnlocked(["founder"], "family"), true);
  assert.equal(isUnlocked([], "kitchen-table"), false);
});

test("a year of Table is still Table", () => {
  assert.equal(isUnlocked(["table-year"], "kitchen-table"), true);
  assert.equal(isUnlocked(["table-year"], "chef-plus"), true);
});

test("Kitchen+ alone is still plus, not the whole table", () => {
  assert.equal(isUnlocked(["chef-plus"], "chef-plus"), true);
  assert.equal(isUnlocked(["chef-plus"], "kitchen-table"), false);
  assert.equal(isUnlocked(["chef-plus"], "family"), false);
});

test("a gift month is Table until the date, not after", () => {
  assert.equal(isUnlocked([], "kitchen-table", { giftUntil: "2026-10-07", today: "2026-09-08" }), true);
  assert.equal(isUnlocked([], "kitchen-table", { giftUntil: "2026-09-01", today: "2026-09-08" }), false);
});

test("trainer kitchen is Chef + family, 8 seats, not lifetime Table", () => {
  assert.equal(isUnlocked(["trainer"], "chef-plus"), true);
  assert.equal(isUnlocked(["trainer"], "family"), true);
  assert.equal(isUnlocked(["trainer"], "kitchen-table"), false);
  assert.equal(seatCap(["trainer"]), 8);
});

test("team kitchen is 12 seats and a live table, not 40 chef plates", () => {
  assert.equal(isUnlocked(["team-kitchen"], "family"), true);
  assert.equal(isUnlocked(["team-kitchen"], "chef-plus"), false);
  assert.equal(seatCap(["team-kitchen"]), 12);
  assert.equal(seatCap([]), 6);
});
