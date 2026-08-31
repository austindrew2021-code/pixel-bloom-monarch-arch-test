import { Check, Copy, Plus, Refrigerator, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatQty } from "@/lib/format";
import {
  AISLE_ORDER,
  groceryForWeek,
  plannedForWeek,
  useSpoonful,
  weekPulse,
  type GroceryLine,
} from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

export function ShopView() {
  const weekStart = useSpoonful((s) => s.weekStart);
  const meals = useSpoonful((s) => s.meals);
  const extra = useSpoonful((s) => s.extraGrocery);
  const pantry = useSpoonful((s) => s.pantry);
  const checked = useSpoonful((s) => s.checked);
  const toggleChecked = useSpoonful((s) => s.toggleChecked);
  const clearChecked = useSpoonful((s) => s.clearChecked);
  const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
  const addPantry = useSpoonful((s) => s.addPantry);
  const removePantry = useSpoonful((s) => s.removePantry);
  const stashCheckedToPantry = useSpoonful((s) => s.stashCheckedToPantry);
  const cookedDates = useSpoonful((s) => s.cookedDates);
  const [hidePantry, setHidePantry] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [pantryName, setPantryName] = useState("");
  const [shopQ, setShopQ] = useState("");

  const household = useSpoonful((s) => s.household);
  const weekMeals = plannedForWeek(meals, weekStart);
  const pulse = weekPulse(meals, weekStart, cookedDates, household);
  const lines = useMemo(
    () => groceryForWeek(meals, weekStart, extra, pantry, household),
    [meals, weekStart, extra, pantry, household],
  );
  const visible = (hidePantry ? lines.filter((l) => !l.fromPantry) : lines).filter((l) =>
    shopQ.trim() ? l.name.toLowerCase().includes(shopQ.trim().toLowerCase()) : true,
  );
  const groups = AISLE_ORDER.map((aisle) => ({
    aisle,
    items: visible.filter((l) => l.aisle === aisle),
  })).filter((g) => g.items.length > 0);

  const checkKey = (line: GroceryLine) => `${weekStart}::${line.key}`;
  const remaining = visible.filter((l) => !checked[checkKey(l)]).length;
  const total = visible.length;
  const progress = total === 0 ? 0 : Math.round(((total - remaining) / total) * 100);

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Groceries</p>
      <h1 className="mt-1 font-display text-4xl" data-tour="shop-head">Shop</h1>
      <p className="mt-2 text-sm text-foreground/80">
        Built from {weekMeals.filter((m) => !m.skip).length} meal
        {weekMeals.filter((m) => !m.skip).length === 1 ? "" : "s"}, scaled for {household}{" "}
        {household === 1 ? "person" : "people"}. Eating-out nights stay off the list. About ${pulse.cost} this week.
      </p>

      <div className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium tabular-nums">{remaining} to pick up</p>
          <p className="text-xs tabular-nums text-muted-foreground">{progress}%</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const text = groups
                .map(
                  (g) =>
                    `${g.aisle}\n${g.items
                      .map((i) => `- ${i.name}${i.unit || i.qty ? ` (${formatQty(i.qty, i.unit)})` : ""}`)
                      .join("\n")}`,
                )
                .join("\n\n");
              try {
                await navigator.clipboard.writeText(text || "Nothing to shop this week.");
                toast("List copied");
              } catch {
                toast("Could not copy");
              }
            }}
          >
            <Copy />
            Copy list
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const n = stashCheckedToPantry();
              toast(n ? `Moved ${n} to pantry` : "Check items you already bought");
            }}
          >
            <Refrigerator />
            Bought → pantry
          </Button>
          <Button variant="ghost" size="sm" onClick={clearChecked}>
            Clear checks
          </Button>
        </div>
      </div>

      <form
        className="mt-4 flex min-w-0 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addExtraGrocery(newItem, "Other");
          setNewItem("");
        }}
      >
        <Input
          className="min-w-0 flex-1"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add milk, foil, coffee…"
        />
        <Button type="submit" size="icon" className="shrink-0" aria-label="Add item">
          <Plus />
        </Button>
      </form>
      <Input
        className="mt-3"
        value={shopQ}
        onChange={(e) => setShopQ(e.target.value)}
        placeholder="Find an item on the list"
      />

      <button
        type="button"
        onClick={() => setHidePantry((v) => !v)}
        className="mt-3 text-xs text-muted-foreground"
      >
        {hidePantry ? "Show items already in the pantry" : "Hide pantry items"}
      </button>

      {total === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Plan a few dinners and the list will fill in here.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <section key={group.aisle}>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.aisle}
              </h2>
              <ul className="mt-2 divide-y divide-border rounded-2xl bg-card shadow-[var(--shadow-border)]">
                {group.items.map((line) => {
                  const key = checkKey(line);
                  const on = Boolean(checked[key]);
                  return (
                    <li key={line.key}>
                      <button
                        type="button"
                        onClick={() => toggleChecked(key)}
                        className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left"
                      >
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-md shadow-[var(--shadow-border)]",
                            on && "bg-primary text-primary-foreground shadow-none",
                          )}
                        >
                          {on ? <Check className="size-3.5" /> : null}
                        </span>
                        <span className={cn("flex-1 text-sm", on && "text-muted-foreground line-through")}>
                          {line.name}
                          {line.fromPantry ? (
                            <span className="ml-2 text-xs text-muted-foreground">pantry</span>
                          ) : null}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatQty(line.qty, line.unit)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl">Pantry</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Things you already have. Matching grocery lines can be hidden.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addPantry(pantryName);
            setPantryName("");
          }}
        >
          <Input
            value={pantryName}
            onChange={(e) => setPantryName(e.target.value)}
            placeholder="Olive oil, rice, garlic"
          />
          <Button type="submit" size="icon" variant="secondary" aria-label="Add pantry item">
            <Plus />
          </Button>
        </form>
        <ul className="mt-3 flex flex-wrap gap-2">
          {pantry.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => removePantry(item.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-sm shadow-[var(--shadow-border)]"
              >
                {item.name}
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
