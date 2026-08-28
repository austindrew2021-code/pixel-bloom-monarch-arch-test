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

export function isUnlocked(unlocked: AddonId[], id: AddonId): boolean {
  if (FREE.includes(id)) return true;
  if ((id === "chef-plus" || id === "family") && unlocked.includes("kitchen-table")) return true;
  return unlocked.includes(id);
}
