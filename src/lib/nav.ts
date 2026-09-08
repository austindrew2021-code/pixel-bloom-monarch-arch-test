import {
  BookOpen,
  CalendarDays,
  Camera,
  CakeSlice,
  Dumbbell,
  Droplets,
  Flame,
  Moon,
  ShoppingBasket,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavPinId =
  | "plan"
  | "recipes"
  | "snap"
  | "people"
  | "shop"
  | "fit"
  | "train"
  | "sauces"
  | "desserts"
  | "extras"
  | "sky";

export type NavMenu = {
  id: NavPinId;
  labelKey: string;
  icon: LucideIcon;
};

export const NAV_MENUS: NavMenu[] = [
  { id: "plan", labelKey: "plan", icon: CalendarDays },
  { id: "recipes", labelKey: "recipes", icon: BookOpen },
  { id: "snap", labelKey: "snap", icon: Camera },
  { id: "train", labelKey: "train", icon: Dumbbell },
  { id: "fit", labelKey: "fuel", icon: Flame },
  { id: "shop", labelKey: "shop", icon: ShoppingBasket },
  { id: "sauces", labelKey: "sauces", icon: Droplets },
  { id: "desserts", labelKey: "desserts", icon: CakeSlice },
  { id: "people", labelKey: "people", icon: Users },
  { id: "extras", labelKey: "extras", icon: Sparkles },
  { id: "sky", labelKey: "sky", icon: Moon },
];

export const DEFAULT_NAV_PINS: NavPinId[] = ["train", "fit", "people", "sky"];

export function menuById(id: NavPinId): NavMenu | undefined {
  return NAV_MENUS.find((m) => m.id === id);
}

export function normalizePins(pins: NavPinId[] | undefined): NavPinId[] {
  const seen = new Set<NavPinId>();
  const out: NavPinId[] = [];
  for (const id of pins ?? DEFAULT_NAV_PINS) {
    if (!NAV_MENUS.some((m) => m.id === id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  if (out.length === 0) return [...DEFAULT_NAV_PINS];
  return out.slice(0, 6);
}
