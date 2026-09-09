import { Check, Copy, Plus, Refrigerator, RotateCcw, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GroceryNearCard } from "@/components/grocery-near";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatQty } from "@/lib/format";
import {
  AISLE_ORDER,
  groceryForWeek,
  resolveMeal,
  savingsSummary,
  useSpoonful,
  weeklySavingsTrend,
  type GroceryLine,
} from "@/lib/spoonful-store";
import { isoDate } from "@/lib/fuel";
import { plateCost } from "@/lib/shield";
import { weekDates } from "@/lib/week";
import { MealPhoto } from "@/components/meal-photo";
import { cn } from "@/lib/utils";

export function ShopView({ onOpenStore }: { onOpenStore: () => void }) {
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
  const shopScope = useSpoonful((s) => s.shopScope);
  const setShopScope = useSpoonful((s) => s.setShopScope);
  const rebuildShopFromTonight = useSpoonful((s) => s.rebuildShopFromTonight);
  const setTab = useSpoonful((s) => s.setTab);
  const [hidePantry, setHidePantry] = useState(true);
  const [hideChecked, setHideChecked] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [pantryName, setPantryName] = useState("");
  const [shopQ, setShopQ] = useState("");

  const household = useSpoonful((s) => s.household);
  const hasKitchenTable = useSpoonful((s) => s.hasAddon("kitchen-table"));
  const weekBudgetCad = useSpoonful((s) => s.weekBudgetCad);
  const setWeekBudget = useSpoonful((s) => s.setWeekBudget);
  const swapDownOverBudget = useSpoonful((s) => s.swapDownOverBudget);
  const leftoverVault = useSpoonful((s) => s.leftoverVault);
  const alwaysHave = useSpoonful((s) => s.alwaysHave);
  const toggleAlwaysHave = useSpoonful((s) => s.toggleAlwaysHave);
  const today = isoDate();
  const tonight = meals.find((m) => m.date === today && m.slot === "dinner" && !m.skip);
  const tonightTitle = tonight ? resolveMeal(tonight).title : null;
  const savings = useMemo(() => savingsSummary(meals, cookedDates, household), [meals, cookedDates, household]);
  const savingsTrend = useMemo(
    () => (hasKitchenTable ? weeklySavingsTrend(meals, cookedDates, household) : []),
    [hasKitchenTable, meals, cookedDates, household],
  );
  const lines = useMemo(
    () =>
      groceryForWeek(meals, weekStart, extra, pantry, household, {
        scope: shopScope,
        date: today,
        alwaysHave,
      }),
    [meals, weekStart, extra, pantry, household, shopScope, today, alwaysHave],
  );
  const listed = (hidePantry ? lines.filter((l) => !l.fromPantry) : lines).filter((l) =>
    shopQ.trim() ? l.name.toLowerCase().includes(shopQ.trim().toLowerCase()) : true,
  );
  const visible = hideChecked ? listed.filter((l) => !checked[`${weekStart}::${l.key}`]) : listed;
  const shopMeals = useMemo(() => {
    const dates = shopScope === "tonight" ? [today] : weekDates(weekStart);
    return meals.filter((m) => dates.includes(m.date) && m.slot === "dinner" && !m.skip);
  }, [meals, shopScope, today, weekStart]);
  const groceryEst = useMemo(
    () =>
      shopMeals.reduce((sum, m) => {
        const rec = resolveMeal(m).recipe;
        return rec ? sum + plateCost(rec, household) : sum;
      }, 0),
    [shopMeals, household],
  );
  const groups = AISLE_ORDER.map((aisle) => ({
    aisle,
    items: visible.filter((l) => l.aisle === aisle),
  })).filter((g) => g.items.length > 0);

  const checkKey = (line: GroceryLine) => `${weekStart}::${line.key}`;
  const remaining = listed.filter((l) => !checked[checkKey(l)]).length;
  const total = listed.length;
  const progress = total === 0 ? 0 : Math.round(((total - remaining) / total) * 100);
  const pantryCount = lines.filter((l) => l.fromPantry).length;
  const shopCount = lines.filter((l) => !l.fromPantry).length;

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Groceries</p>
      <h1 className="mt-1 font-display text-4xl" data-tour="shop-head">Shop</h1>
      <p className="mt-2 text-sm text-foreground/80">
        {shopScope === "tonight"
          ? tonightTitle
            ? `Tonight: ${tonightTitle}. About $${groceryEst.toFixed(0)} of groceries for ${household}.`
            : "Tap From tonight to make a list from dinner."
          : `This week's dinners, for ${household} ${household === 1 ? "person" : "people"}. About $${groceryEst.toFixed(0)} at the store. ${shopCount} to buy${pantryCount ? `, ${pantryCount} already in the pantry` : ""}.`}
      </p>

      <div className="mt-4 flex gap-2">
        <Button
          variant={shopScope === "tonight" ? "spark" : "secondary"}
          className="flex-1"
          onClick={() => rebuildShopFromTonight()}
        >
          <RotateCcw />
          From tonight
        </Button>
        <Button
          variant={shopScope === "week" ? "spark" : "secondary"}
          className="flex-1"
          onClick={() => setShopScope("week")}
        >
          Whole week
        </Button>
      </div>

      <div className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">What's in the cupboard?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check what you already have before Fill cart. Saved to your pantry. Tap again if you ran out — it goes back on the list.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["salt", "black pepper", "olive oil", "oil", "flour", "sugar", "baking powder", "baking soda", "garlic"].map((name) => {
            const on =
              alwaysHave.some((n) => n.toLowerCase() === name) ||
              pantry.some((p) => p.name.toLowerCase() === name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  toggleAlwaysHave(name);
                  toast(
                    on ? `Ran out of ${name} — it's on the list` : `${name} saved to pantry`,
                  );
                }}
                className={cn(
                  "h-10 rounded-full px-3 text-sm",
                  on ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
                )}
              >
                {on ? `Have ${name}` : name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Week budget</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cap the grocery week. Over it, Swap down replaces the pricey dinners with cheaper ones that still fit the table.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[0, 70, 100, 140].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setWeekBudget(n)}
              className={cn(
                "h-10 rounded-full px-3 text-sm",
                weekBudgetCad === n ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
              )}
            >
              {n === 0 ? "Off" : `$${n}`}
            </button>
          ))}
        </div>
        {weekBudgetCad > 0 ? (
          <p className={cn("mt-2 text-sm", groceryEst > weekBudgetCad ? "text-spark" : "text-muted-foreground")}>
            This list is about ${groceryEst.toFixed(0)} of ${weekBudgetCad}.
            {groceryEst > weekBudgetCad ? ` $${Math.round(groceryEst - weekBudgetCad)} over.` : " On track."}
          </p>
        ) : null}
        {weekBudgetCad > 0 && groceryEst > weekBudgetCad ? (
          <Button
            className="mt-3 w-full"
            variant="spark"
            onClick={() => {
              const { swapped, saved } = swapDownOverBudget();
              toast(swapped ? `Swapped ${swapped} dinners, about $${saved} back` : "Already as cheap as the catalog gets");
            }}
          >
            Swap down to fit
          </Button>
        ) : null}
      </div>

      {leftoverVault.length > 0 ? (
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Leftover vault</p>
          <p className="mt-1 text-sm text-muted-foreground">Lunch is already plated from last night. Those lines stay off this list.</p>
          <ul className="mt-2 space-y-1">
            {leftoverVault.slice(0, 5).map((row) => (
              <li key={row.id} className="text-sm">
                {row.title} · lunch from {row.fromDate}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {shopMeals.length > 0 ? (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Shopping for">
          {shopMeals.map((m) => {
            const rec = resolveMeal(m).recipe;
            return (
              <li key={m.id} className="w-24 shrink-0">
                <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
                  {rec ? <MealPhoto recipe={rec} className="h-16 w-full rounded-none" /> : <div className="h-16 bg-muted" />}
                  <p className="truncate px-2 py-1.5 text-[11px] font-medium">{resolveMeal(m).title}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <GroceryNearCard />

      {hasKitchenTable ? (
        savings.count === 0 ? (
          <div className="mt-4 rounded-3xl bg-spark p-4 text-spark-foreground">
            <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">Savings tracker</p>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              Cook your first dinner to start tracking what home cooking is worth versus takeout.
            </p>
          </div>
        ) : (
          <section className="mt-4 rounded-3xl bg-spark p-4 text-spark-foreground">
            <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">Saved vs. takeout</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SavingsStat label="This week" value={`$${savings.week}`} />
              <SavingsStat label="This month" value={`$${savings.month}`} />
              <SavingsStat label="All-time" value={`$${savings.allTime}`} />
            </div>
            {savingsTrend.some((v) => v > 0) ? (
              <div className="mt-4">
                <p className="text-xs opacity-80">Last {savingsTrend.length} weeks</p>
                <div className="mt-2 flex h-16 items-end gap-1">
                  {savingsTrend.map((v, i) => {
                    const max = Math.max(1, ...savingsTrend);
                    const h = 6 + (v / max) * 58;
                    return (
                      <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                        <span className="w-full rounded-t-md bg-spark-foreground/70" style={{ height: `${h}px` }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        )
      ) : (
        <button
          type="button"
          onClick={onOpenStore}
          className="mt-4 w-full rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
        >
          <p className="text-sm font-medium">
            You've saved about ${savings.week} this week cooking instead of ordering in.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Kitchen Table ($7.99/mo) keeps the savings chart, extra chef plates, and family seats — the kitchen itself stays free.
          </p>
        </button>
      )}

      <div className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium tabular-nums">{remaining} to pick up</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {progress}%{groceryEst > 0 ? ` · ~$${groceryEst.toFixed(0)}` : ""}
          </p>
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
              const payload = text || "Nothing to shop this week.";
              try {
                if (navigator.share) {
                  await navigator.share({ title: "Spoonful shop", text: payload });
                  return;
                }
                await navigator.clipboard.writeText(payload);
                toast("List copied");
              } catch {
                try {
                  await navigator.clipboard.writeText(payload);
                  toast("List copied");
                } catch {
                  toast("Could not share");
                }
              }
            }}
          >
            <Share2 />
            Share list
          </Button>
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

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => setHidePantry((v) => !v)}
          className="tap text-xs text-muted-foreground"
        >
          {hidePantry ? "Show items already in the pantry" : "Hide pantry items"}
        </button>
        <button
          type="button"
          onClick={() => setHideChecked((v) => !v)}
          className="tap text-xs text-muted-foreground"
        >
          {hideChecked ? "Show checked" : "Hide what you already grabbed"}
        </button>
      </div>

      {total === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            {shopScope === "tonight" && !tonightTitle
              ? "Tap From tonight after you pick dinner."
              : shopScope === "tonight"
                ? "Tonight has no ingredients yet — add them when you log the meal."
                : "Plan a few dinners and the list will fill in here."}
          </p>
          {!tonightTitle ? (
            <Button className="mt-4" variant="spark" onClick={() => setTab("plan")}>
              Plate tonight
            </Button>
          ) : (
            <Button className="mt-4" variant="spark" onClick={() => rebuildShopFromTonight()}>
              Generate from tonight
            </Button>
          )}
        </div>
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
                          {line.dishes.length > 0 ? (
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {line.dishes.slice(0, 2).join(" · ")}
                              {line.dishes.length > 2 ? ` +${line.dishes.length - 2}` : ""}
                            </span>
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
          Things you already have. Matching grocery lines stay off the list. Tap a chip to say you ran out.
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

function SavingsStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 truncate font-display text-2xl tabular-nums leading-tight sm:text-3xl">{value}</p>
    </div>
  );
}
