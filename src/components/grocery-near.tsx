import { Check, ChevronLeft, Heart, MapPin, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { partnersConfigured, tagOutbound } from "@/lib/partner-links";
import { formatQty } from "@/lib/format";
import { loadStoreOptions } from "@/lib/grocery-live";
import {
  formatPickList,
  matchCart,
  overlaySearchQuery,
  pickKey,
  type GroceryPick,
  type StoreOption,
} from "@/lib/grocery-pick";
import { addToStoreCart, storeCanHoldCart, storeCartOpenUrl } from "@/lib/grocery-cart";
import {
  FALLBACK_COORDS,
  fetchNearbyStores,
  isHeliosStore,
  productPageUrl,
  productSearchUrl,
  readCoords,
  storeLoginUrl,
  type NearbyStore,
} from "@/lib/grocery-stores";
import {
  hasStoreApp,
  isSpoonfulApk,
  notifyNative,
  openStoreApp,
  openStoreCart,
  requestNativeLocation,
  setStoreBag,
  warmStoreCart,
} from "@/lib/native-health";
import { enablePush, pushNote } from "@/lib/notify";
import { groceryForWeek, useSpoonful, type GroceryLine } from "@/lib/spoonful-store";
import { isoDate } from "@/lib/fuel";
import { cn } from "@/lib/utils";

export function GroceryNearCard() {
  const weekStart = useSpoonful((s) => s.weekStart);
  const meals = useSpoonful((s) => s.meals);
  const extra = useSpoonful((s) => s.extraGrocery);
  const pantry = useSpoonful((s) => s.pantry);
  const household = useSpoonful((s) => s.household);
  const shopScope = useSpoonful((s) => s.shopScope);
  const favStore = useSpoonful((s) => s.favStore);
  const favoriteStore = useSpoonful((s) => s.favoriteStore);
  const alwaysHave = useSpoonful((s) => s.alwaysHave);
  const today = isoDate();
  const lines = useMemo(
    () =>
      groceryForWeek(meals, weekStart, extra, pantry, household, {
        scope: shopScope,
        date: today,
        alwaysHave,
      }),
    [meals, weekStart, extra, pantry, household, shopScope, today, alwaysHave],
  );
  const [stores, setStores] = useState<NearbyStore[]>(favStore ? [favStore] : []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<NearbyStore | null>(null);

  async function findStores() {
    setBusy(true);
    setNote("");
    requestNativeLocation();
    try {
      let coords = FALLBACK_COORDS;
      try {
        coords = await readCoords();
      } catch (err) {
        setNote(err instanceof Error ? err.message : "Using nearby stores from this area.");
      }
      const found = await fetchNearbyStores(coords);
      setStores(found);
      if (found.length === 0) setNote("No grocery stores found nearby.");
    } finally {
      setBusy(false);
    }
  }

  const listed = favStore && !stores.some((s) => s.id === favStore.id) ? [favStore, ...stores] : stores;

  return (
    <section className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]" data-testid="grocery-near">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Nearby</p>
      <h2 className="mt-1 font-display text-2xl leading-tight">Send the list to a store</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open a store inside Spoonful. Fill cart packs the bag while you step away, then pings you when it’s ready to review.
      </p>
      {/*
       * Said plainly, once, where the links are — not buried in a policy page.
       * It only appears when a partner id is actually configured, so a build
       * with no partners never claims a cut it does not take.
       */}
      {partnersConfigured() ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Spoonful may earn a small commission when you shop through these links. Your price is the
          store's price — it does not change what you pay.
        </p>
      ) : null}
      {favStore ? (
        <p className="mt-2 text-sm">
          Favorite: <span className="font-medium">{favStore.name}</span>
        </p>
      ) : null}
      <Button
        className="mt-4 w-full"
        variant="spark"
        onClick={() => void findStores()}
        disabled={busy}
        data-testid="grocery-locate"
      >
        <MapPin />
        {busy ? "Finding stores…" : "Use my location"}
      </Button>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
      <ul className="mt-3 space-y-2" data-testid="grocery-store-list">
        {listed.map((store) => (
          <li key={store.id}>
            <div className="flex items-start gap-2 rounded-3xl bg-background p-3">
              <button type="button" className="min-h-11 min-w-0 flex-1 text-left" onClick={() => setPicked(store)}>
                <p className="font-medium">{store.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {store.km} km{store.address ? ` · ${store.address}` : ""}
                </p>
              </button>
              <button
                type="button"
                className="flex size-11 shrink-0 items-center justify-center"
                aria-label={favStore?.id === store.id ? "Unfavorite store" : "Favorite store"}
                data-testid={`grocery-fav-${store.id}`}
                onClick={() => favoriteStore(favStore?.id === store.id ? null : store)}
              >
                <Heart className={cn("size-4", favStore?.id === store.id && "fill-spark text-spark")} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {favStore ? (
        <Button className="mt-3 w-full" variant="secondary" onClick={() => setPicked(favStore)}>
          <ShoppingBag />
          Start order at {favStore.name}
        </Button>
      ) : null}
      <OrderSheet store={picked} lines={lines} onClose={() => setPicked(null)} />
    </section>
  );
}

function OrderSheet({
  store,
  lines,
  onClose,
}: {
  store: NearbyStore | null;
  lines: GroceryLine[];
  onClose: () => void;
}) {
  const cart = useMemo(() => (store ? matchCart(store, lines) : { items: [], totalCad: 0 }), [store, lines]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<Record<string, StoreOption>>({});
  const [viewing, setViewing] = useState<GroceryPick | null>(null);
  const [options, setOptions] = useState<StoreOption[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [storeCartId, setStoreCartId] = useState<string | null>(null);
  const [storeCount, setStoreCount] = useState(0);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    setSent(new Set());
    setChosen({});
    setViewing(null);
    setOptions([]);
    setStoreCartId(null);
    setStoreCount(0);
    setPayOpen(false);
  }, [store?.id]);

  if (!store) return null;
  const picked = store;
  const apk = isSpoonfulApk();
  const leftover = cart.items.filter((item) => !sent.has(pickKey(item)));
  const next = leftover[0];
  const done = cart.items.length > 0 && leftover.length === 0;
  const mem = useSpoonful((s) => s.bagMemory);
  const remembered = leftover.filter((item) => mem[item.name.trim().toLowerCase()]).length;
  const chosenTotal = cart.items.reduce((sum, item) => {
    const pick = chosen[pickKey(item)];
    return sum + (pick?.totalCad ?? item.pickCad);
  }, 0);
  const checkoutHref = storeCartOpenUrl(picked);
  const loginHref = storeLoginUrl(picked);
  const helios = isHeliosStore(picked);
  const pcxApp = helios && hasStoreApp();

  function bagItems(chosenMap: Record<string, StoreOption> = chosen) {
    return cart.items.map((item) => {
      const pick = chosenMap[pickKey(item)];
      const query = overlaySearchQuery(item.name);
      const heliosUrl = helios ? pick?.addUrl ?? item.addUrl : "";
      const url =
        helios && heliosUrl && /^https:\/\//i.test(heliosUrl) ? heliosUrl : productSearchUrl(picked, query);
      return {
        name: item.name,
        query,
        product: pick?.name ?? item.pickName,
        url,
        qty: pick?.packs ?? item.packs,
      };
    });
  }

  function packBag(
    cartId = storeCartId,
    chosenMap: Record<string, StoreOption> = chosen,
    extra: { handsOff?: boolean } = {},
  ) {
    setStoreBag({
      brand: picked.brand,
      storeName: picked.name,
      storeId: picked.pcStoreId || "",
      cartId: cartId || "",
      fill: false,
      handsOff: Boolean(extra.handsOff),
      items: bagItems(chosenMap),
    });
  }

  /**
   * The store URL the cook is actually sent to. Every outbound hop in this
   * screen goes through here, which is what makes the partner tag a single
   * thing to audit rather than a sprinkle across the file.
   */
  function tillUrl(fallback = checkoutHref) {
    if (helios) return tagOutbound(fallback, "fill-cart");
    const first = bagItems()[0];
    if (first?.url && /^https:\/\//i.test(first.url)) return tagOutbound(first.url, "product");
    if (first) return tagOutbound(productSearchUrl(picked, first.query || first.name), "search");
    return tagOutbound(fallback, "fill-cart");
  }

  function mark(item: GroceryPick) {
    setSent((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(pickKey(item));
      return nextSet;
    });
  }

  function markMany(items: GroceryPick[]) {
    setSent((prev) => {
      const nextSet = new Set(prev);
      for (const item of items) nextSet.add(pickKey(item));
      return nextSet;
    });
  }

  async function openOptions(item: GroceryPick) {
    setViewing(item);
    setLoading(true);
    setOptions([]);
    try {
      const result = await loadStoreOptions(picked, item);
      setOptions(result.options);
      setLive(result.live);
    } catch {
      setOptions([]);
      setLive(false);
    } finally {
      setLoading(false);
    }
  }

  function chooseOption(item: GroceryPick, option: StoreOption) {
    const nextMap = { ...chosen, [pickKey(item)]: option };
    setChosen(nextMap);
    mark(item);
    setViewing(null);
    const left = leftover.filter((row) => pickKey(row) !== pickKey(item)).length;
    void pushStore([{ id: option.id, packs: option.packs, addUrl: option.addUrl }], nextMap).then((ok) => {
      toast(
        ok
          ? left > 0
            ? `In the ${picked.name} cart. ${left} left.`
            : `In the ${picked.name} cart. Checkout when you’re ready.`
          : left > 0
            ? `Saved ${option.name}. ${left} left.`
            : `Saved ${option.name}.`,
      );
    });
  }

  async function pushStore(
    items: { id: string; packs: number; addUrl?: string }[],
    chosenMap: Record<string, StoreOption> = chosen,
  ) {
    packBag(storeCartId, chosenMap);
    if (!storeCanHoldCart(picked)) return false;
    const result = await addToStoreCart(picked, items);
    if (result.cartId) {
      setStoreCartId(result.cartId);
      setStoreCount(result.count || 0);
      packBag(result.cartId, chosenMap);
      const openAt = storeCartOpenUrl(picked, productPageUrl(picked, items[0]?.id) || items[0]?.addUrl);
      warmStoreCart(openAt, result.ok ? result.cartId : "");
    }
    return result.ok;
  }

  async function addAll() {
    if (leftover.length === 0 || addingAll) return;
    setAddingAll(true);
    try {
      const nextChosen: Record<string, StoreOption> = {};
      const mem = useSpoonful.getState().bagMemory;
      await Promise.all(
        leftover.map(async (item) => {
          const result = await loadStoreOptions(picked, item);
          const remembered = mem[item.name.trim().toLowerCase()];
          const top =
            (remembered ? result.options.find((o) => o.name === remembered.pickName) : undefined) ?? result.options[0];
          if (top) nextChosen[pickKey(item)] = top;
        }),
      );
      setChosen((prev) => ({ ...prev, ...nextChosen }));
      markMany(leftover);
      const merged = { ...chosen, ...nextChosen };
      const packed = leftover
        .map((item) => nextChosen[pickKey(item)])
        .filter((option): option is StoreOption => Boolean(option))
        .map((option) => ({ id: option.id, packs: option.packs, addUrl: option.addUrl }));
      const ok = packed.length ? await pushStore(packed, merged) : false;
      packBag(storeCartId, merged);
      useSpoonful.getState().rememberBag(
        leftover.map((item) => {
          const opt = nextChosen[pickKey(item)];
          return {
            name: item.name,
            pickName: opt?.name ?? item.pickName,
            packs: opt?.packs ?? item.packs,
            pickCad: opt?.totalCad ?? item.pickCad,
          };
        }),
      );
      toast(
        ok
          ? `${packed.length} packs are in the ${picked.name} cart.`
          : `List packed for ${picked.name}. Pay keeps it on the store screen.`,
      );
    } finally {
      setAddingAll(false);
    }
  }

  async function fillAndNotify() {
    await enablePush();
    notifyNative("Filling your cart", `Spoonful is packing ${picked.name}. We'll ping you when it's ready to review.`);
    pushNote("Filling your cart", `Packing ${picked.name}. We'll ping you when it's ready.`);
    if (helios) {
      await addAll();
      const n = cart.items.length;
      notifyNative("Cart ready to review", `${n} packs are in the ${picked.name} bag. Open Shop when you want to check out.`);
      pushNote("Cart ready to review", `${n} packs at ${picked.name}.`);
      toast("Cart is filling. You can put the phone down — we'll ping you.");
      return;
    }
    packBag(storeCartId, chosen, { handsOff: true });
    if (openStoreCart(tillUrl(checkoutHref), storeCartId || "")) {
      toast("Filling in the background. Sign in on the store if it asks — after that, leave the phone. We'll ping you.");
      return;
    }
    toast("Open the store inside Spoonful on your phone so the bag can fill while you step away.");
  }

  function launchTill(url: string, note: string) {
    packBag();
    if (openStoreCart(tillUrl(url), storeCartId || "")) {
      toast(note);
      return;
    }
    toast("Pay opens the store inside the Spoonful app on your phone.");
  }

  function openCheckout() {
    packBag();
    setPayOpen(true);
  }

  function payAsGuest() {
    setPayOpen(false);
    launchTill(checkoutHref, "Pay as guest on this screen. The bag stays on the store page.");
  }

  function paySignedIn() {
    setPayOpen(false);
    launchTill(loginHref, "Sign in on this screen. The bag stays with you.");
  }

  function payInPcxApp() {
    setPayOpen(false);
    if (openStoreApp()) {
      toast("PC Express is opening. Sign in there — the bag is on your account after you sign in on Superstore once.");
      return;
    }
    paySignedIn();
  }

  async function copyLeftover() {
    const text = formatPickList(picked.name, leftover.length ? leftover : cart.items);
    try {
      await navigator.clipboard.writeText(text);
      toast(leftover.length ? "Leftover list copied" : "List copied");
    } catch {
      toast("Could not copy the list");
    }
  }

  return (
    <Sheet open={Boolean(store)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent title={`Order at ${store.name}`}>
        {viewing ? (
          <OptionsPane
            storeName={store.name}
            item={viewing}
            options={options}
            live={live}
            loading={loading}
            apk={apk}
            onBack={() => setViewing(null)}
            onChoose={(option) => chooseOption(viewing, option)}
          />
        ) : (
          <div data-testid="grocery-order" data-store-cart={storeCartId || ""} data-store-count={storeCount}>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Checkout</p>
            <h2 className="mt-1 font-display text-2xl leading-tight">{store.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap Fill cart and put the phone down. Spoonful packs the bag, then pings you when it’s ready to review. Superstore goes in through the store’s own cart. Co-op, Sobeys, and Walmart stay on one aisle page so the store doesn’t lock a check.
            </p>
            {cart.items.length === 0 ? (
              <p className="mt-4 text-sm">No items yet. Build the shop list from tonight first.</p>
            ) : (
              <>
                <p className="mt-3 text-sm" data-testid="grocery-sent-count">
                  {sent.size} of {cart.items.length} packed
                  {storeCount > 0 ? ` · ${storeCount} in the ${store.name} cart` : ""}
                </p>
                {leftover.length > 0 ? (
                  <Button
                    className="mt-3 w-full"
                    variant="spark"
                    onClick={() => void fillAndNotify()}
                    disabled={addingAll}
                    data-testid="grocery-add-all"
                  >
                    <ShoppingBag />
                    {addingAll
                      ? "Filling the cart…"
                      : remembered > 0
                        ? `Fill like last time — notify me (${remembered} remembered)`
                        : `Fill cart — notify me (${leftover.length})`}
                  </Button>
                ) : null}
                <Button
                  className={leftover.length > 0 ? "mt-2 w-full" : "mt-3 w-full"}
                  variant={leftover.length > 0 ? "secondary" : "spark"}
                  onClick={openCheckout}
                  disabled={cart.items.length === 0}
                  data-testid="grocery-open-cart"
                >
                  <ShoppingBag />
                  Pay at {store.name}
                </Button>
                {payOpen ? (
                  <div className="mt-3 rounded-2xl bg-background p-3 shadow-[var(--shadow-border)]" data-testid="grocery-pay-choice">
                    <p className="text-sm font-medium">How do you want to pay?</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {helios
                        ? "Superstore holds the bag on their cart. Fill cart packs it from here — you can leave, then pay when we ping you."
                        : "Co-op, Sobeys, Walmart, and Voilà open inside Spoonful. Sign in once if the store asks. After the aisle looks like a store, Spoonful fills the cart on that same page and pings you when it’s ready. If a check appears, finish it — we resume on our own."}
                    </p>
                    <Button className="mt-3 w-full" variant="spark" onClick={payAsGuest} data-testid="grocery-pay-guest">
                      Pay as guest
                    </Button>
                    <Button className="mt-2 w-full" variant="secondary" onClick={paySignedIn} data-testid="grocery-pay-signin">
                      Sign in to pay
                    </Button>
                    {pcxApp ? (
                      <Button className="mt-2 w-full" variant="ghost" onClick={payInPcxApp} data-testid="grocery-pay-pcx">
                        Open PC Express
                      </Button>
                    ) : null}
                    {pcxApp ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        PC Express shows your account cart. Sign in on Superstore here once so the bag is on that account.
                      </p>
                    ) : null}
                    <button type="button" className="mt-2 w-full text-xs text-muted-foreground" onClick={() => setPayOpen(false)}>
                      Cancel
                    </button>
                  </div>
                ) : null}
                {next ? (
                  <Button
                    className="mt-2 w-full"
                    variant="secondary"
                    data-testid="grocery-add-next"
                    onClick={() => void openOptions(next)}
                  >
                    View options · {next.pickName}
                  </Button>
                ) : null}
                <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                  {cart.items.map((item) => {
                    const key = pickKey(item);
                    const inCart = sent.has(key);
                    const pick = chosen[key];
                    return (
                      <li key={key} className="flex items-center gap-2 rounded-3xl bg-background p-3">
                        {pick?.imageUrl ? (
                          <img
                            src={pick.imageUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-2xl object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{pick?.name ?? item.pickName}</p>
                          <p className="text-xs text-muted-foreground">
                            Need {formatQty(item.qty, item.unit)}
                            {pick
                              ? ` · buy ${pick.packs}× ${pick.sizeLabel} · $${pick.totalCad.toFixed(2)}`
                              : item.matched
                                ? ` · buy ${item.packs}× ${item.pickSize} · $${item.pickCad.toFixed(2)}`
                                : ""}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid="grocery-pick-why">
                            {pick?.why ?? item.why}
                          </p>
                        </div>
                        {inCart ? (
                          <span className="flex size-11 items-center justify-center text-primary" aria-label="In the cart">
                            <Check className="size-4" />
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="spark"
                            data-testid="grocery-item-options"
                            onClick={() => void openOptions(item)}
                          >
                            View options
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <p className="mt-4 font-display text-2xl tabular-nums">${chosenTotal.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Live shelf prices when the store answers. Otherwise typical packs that still cover dinner.
            </p>
            {leftover.length > 0 && sent.size > 0 ? (
              <Button className="mt-4 w-full" variant="secondary" onClick={() => void copyLeftover()}>
                Copy leftover ({leftover.length})
              </Button>
            ) : leftover.length > 0 || cart.items.length > 0 ? (
              <Button
                className="mt-4 w-full"
                variant="secondary"
                onClick={() => void copyLeftover()}
                disabled={cart.items.length === 0}
                data-testid="grocery-send"
              >
                Copy list
              </Button>
            ) : null}
            <Button
              className="mt-2 w-full"
              variant="secondary"
              onClick={() => window.open(tagOutbound(store.mapsUrl, "map"), "_blank", "noopener,noreferrer")}
            >
              <MapPin />
              Directions
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function OptionsPane({
  storeName,
  item,
  options,
  live,
  loading,
  apk,
  onBack,
  onChoose,
}: {
  storeName: string;
  item: GroceryPick;
  options: StoreOption[];
  live: boolean;
  loading: boolean;
  apk: boolean;
  onBack: () => void;
  onChoose: (option: StoreOption) => void;
}) {
  return (
    <div data-testid="grocery-options">
      <button type="button" className="flex min-h-11 items-center gap-2 text-sm" onClick={onBack}>
        <ChevronLeft className="size-4" />
        Back to the list
      </button>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-spark">
        {live ? `On the shelf at ${storeName}` : `Typical packs at ${storeName}`}
      </p>
      <h2 className="mt-1 font-display text-2xl leading-tight">{item.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Need {formatQty(item.qty, item.unit)}. Five cheapest packs of this ingredient that still cover the meal.
      </p>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Checking the store shelf…</p> : null}
      <ul className="mt-4 space-y-2">
        {options.map((option, index) => (
          <li key={option.id} className="rounded-3xl bg-background p-3" data-testid="grocery-option">
            <div className="flex items-start gap-3">
              {option.imageUrl ? (
                <img
                  src={option.imageUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-2xl object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-card font-display text-lg">
                  {option.name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {index === 0 ? (
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">
                    Cheapest that covers
                    {options[1] && option.totalCad < options[1].totalCad
                      ? ` · save $${(options[1].totalCad - option.totalCad).toFixed(2)} vs next`
                      : ""}
                  </p>
                ) : null}
                <p className="truncate font-medium">{option.name}</p>
                <p className="text-xs text-muted-foreground">
                  {option.packs}× {option.sizeLabel} · ${option.totalCad.toFixed(2)}
                  {option.unitHint ? ` · ${option.unitHint}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {option.inStock ? "In stock" : "May be low"} · {option.why}
                </p>
              </div>
            </div>
            <Button
              className="mt-3 w-full"
              variant={index === 0 ? "spark" : "secondary"}
              size="sm"
              data-testid="grocery-option-add"
              onClick={() => onChoose(option)}
            >
              Add this pack
            </Button>
          </li>
        ))}
      </ul>
      {!loading && options.length === 0 ? (
        <p className="mt-4 text-sm">The store did not return packs. Use the list search instead.</p>
      ) : null}
    </div>
  );
}
