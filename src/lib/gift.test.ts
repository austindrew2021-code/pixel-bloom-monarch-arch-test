import assert from "node:assert/strict";
import test from "node:test";
import { giftUntilFrom, interacMemo, isGiftCode, mintGiftCode, normalizeGiftCode } from "./gift.ts";

test("minted gift codes verify, junk does not", () => {
  const code = mintGiftCode();
  assert.match(code, /^GIFT-[A-Z0-9]{5}$/);
  assert.equal(isGiftCode(code), true);
  assert.equal(isGiftCode(code.toLowerCase()), true);
  assert.equal(isGiftCode("GIFT-AAAAA"), false);
  assert.equal(isGiftCode("PLATE-8F2R"), false);
});

test("30 days from a Monday is still a calendar date", () => {
  assert.equal(giftUntilFrom("2026-09-07", 30), "2026-10-07");
});

test("Interac memo is pasteable", () => {
  assert.equal(interacMemo("Founder kitchen", "PLATE-8F2R"), "SPOONFUL FOUNDER-KITCHEN PLATE-8F2R");
  assert.equal(normalizeGiftCode(" gift-ab "), "GIFT-AB");
});
