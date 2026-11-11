import assert from "node:assert/strict";
import test from "node:test";
import { giftUntilFrom, interacMemo, isGiftCode, mintGiftCode, normalizeGiftCode } from "./gift.ts";
import { TESTER_KEY } from "./tester.ts";

test("minted gift codes verify, junk does not", () => {
  const code = mintGiftCode();
  assert.match(code, /^GIFT-[A-Z0-9]{5}$/);
  assert.equal(isGiftCode(code), true);
  assert.equal(isGiftCode(code.toLowerCase()), true);
  assert.equal(isGiftCode("GIFT-AAAAA"), false);
  assert.equal(isGiftCode(TESTER_KEY), false);
});

test("30 days from a Monday is still a calendar date", () => {
  assert.equal(giftUntilFrom("2026-09-07", 30), "2026-10-07");
});

test("Interac memo is pasteable and does not contain the tester key", () => {
  const memo = interacMemo("Founder kitchen");
  assert.equal(memo, "SPOONFUL FOUNDER-KITCHEN");
  assert.equal(memo.includes(TESTER_KEY), false);
  assert.equal(normalizeGiftCode(" gift-ab "), "GIFT-AB");
});
