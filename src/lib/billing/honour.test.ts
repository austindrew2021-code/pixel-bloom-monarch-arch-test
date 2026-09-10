import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * The honour-system unlock must not outlive the test kitchen.
 *
 * "I've sent it" grants the add-on on trust, which is right while there is no
 * card rail and the sheet says plainly that nothing is charged. Switch Stripe
 * on without changing that, and the same button hands every paid add-on out
 * for free — Kitchen Table, Founder, the plate packs, all of it.
 *
 * This reads the source rather than rendering, because the thing being guarded
 * is a branch that only exists in the confirm handler.
 */
const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../components/store-view.tsx"),
  "utf8",
);

test("the confirm handler is told whether cards are live", () => {
  assert.match(source, /onConfirm:\s*\(cardLive: boolean\) => void/, "Checkout must report the card state");
  assert.match(source, /onClick=\{\(\) => onConfirm\(card\)\}/, "the confirm button must pass it");
});

test("nothing unlocks on trust once cards answer", () => {
  const handler = source.slice(source.indexOf("onConfirm={(cardLive)"), source.indexOf("onConfirm={(cardLive)") + 900);
  assert.ok(handler.length > 100, "confirm handler not found");
  const guard = handler.indexOf("if (cardLive)");
  const grant = handler.indexOf("unlock(buying.id)");
  assert.ok(guard >= 0, "the card-live guard is missing");
  assert.ok(grant >= 0, "the unlock is missing");
  assert.ok(guard < grant, "the guard must come before the unlock");
  assert.match(handler.slice(guard, grant), /return;/, "the guard must return before unlocking");
});
