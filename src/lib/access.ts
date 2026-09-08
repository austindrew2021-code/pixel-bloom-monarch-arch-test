import type { AddonId } from "./types";

const FREE: AddonId[] = [
  "weeknight",
  "protein",
  "batch",
  "bundle",
  "nutrition",
  "midnight",
  "ai-chef",
  "body-sync",
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isUnlocked(
  unlocked: AddonId[],
  id: AddonId,
  opts?: { giftUntil?: string; today?: string },
): boolean {
  if (FREE.includes(id)) return true;
  const gifted = Boolean(opts?.giftUntil && opts.giftUntil >= (opts.today ?? todayIso()));
  const table =
    unlocked.includes("kitchen-table") ||
    unlocked.includes("founder") ||
    unlocked.includes("table-year") ||
    gifted;
  if (id === "kitchen-table" || id === "chef-plus" || id === "family") {
    if (table) return true;
    if (id === "chef-plus" && unlocked.includes("trainer")) return true;
    if (id === "family" && (unlocked.includes("trainer") || unlocked.includes("team-kitchen"))) return true;
    return unlocked.includes(id);
  }
  return unlocked.includes(id);
}

/** Local who-eats seats. Trainer 8, team 12, everyone else 6. */
export function seatCap(unlocked: AddonId[]): number {
  if (unlocked.includes("team-kitchen")) return 12;
  if (unlocked.includes("trainer")) return 8;
  return 6;
}
