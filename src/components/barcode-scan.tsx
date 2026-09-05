import { Barcode, Check, Minus, Plus, ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { lookupBarcode, scaleNutrition, type BarcodeProduct } from "@/lib/barcode";
import { isoDate } from "@/lib/fuel";
import { useSpoonful } from "@/lib/spoonful-store";
import { cn } from "@/lib/utils";

type DetectedBarcode = { rawValue: string };
type DetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};

function getDetector(): InstanceType<DetectorCtor> | null {
  const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
  } catch {
    return null;
  }
}

export function BarcodeScanCard({ className }: { className?: string }) {
  const addSnack = useSpoonful((s) => s.addSnack);
  const addPantry = useSpoonful((s) => s.addPantry);
  const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
  const lockKitchen = useSpoonful((s) => s.lockKitchen);
  const unlockKitchen = useSpoonful((s) => s.unlockKitchen);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [servings, setServings] = useState(1);
  const [done, setDone] = useState("");
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!open) return;
    lockKitchen();
    return () => unlockKitchen();
  }, [open, lockKitchen, unlockKitchen]);

  useEffect(() => {
    if (!open || !camera) return;
    const video = videoRef.current;
    if (!video) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stop = false;
    const detector = getDetector();
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stop) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (!detector) {
          setError("This phone can still type the numbers. Camera scan needs a Chromium browser.");
          return;
        }
        const tick = async () => {
          if (stop) return;
          try {
            if (video.readyState >= 2) {
              const codes = await detector.detect(video);
              const value = codes[0]?.rawValue;
              if (value) {
                setCamera(false);
                await lookup(value);
                return;
              }
            }
          } catch {
            /* keep looking */
          }
          raf = window.requestAnimationFrame(() => void tick());
        };
        void tick();
      } catch {
        setCamera(false);
        setError("Camera is off. Type the numbers under the barcode instead.");
      }
    })();
    return () => {
      stop = true;
      window.cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
  }, [open, camera]);

  async function lookup(code: string) {
    setBusy(true);
    setError("");
    setDone("");
    try {
      const res = await lookupBarcode(code);
      if (!res.ok) {
        setProduct(null);
        setError(res.error);
        setDraftName("");
        return;
      }
      setProduct(res.product);
      setServings(1);
      setDraftName(res.product.name);
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setCamera(false);
    setBusy(false);
    setDigits("");
    setError("");
    setProduct(null);
    setServings(1);
    setDone("");
    setDraftName("");
  }

  const nutrition = product ? scaleNutrition(product.nutrition, servings) : null;
  const label = draftName.trim() || product?.name || "Food";

  function logEaten() {
    if (!nutrition) {
      addSnack({
        date: isoDate(),
        name: label,
        nutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 },
      });
    } else {
      addSnack({ date: isoDate(), name: label, nutrition });
    }
    setDone(`${label} logged`);
    toast(`${label} logged`);
  }

  return (
    <section
      data-testid="barcode-scan"
      data-tour="barcode-scan"
      className={cn("rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]", className)}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Scan</p>
      <h2 className="mt-1 font-display text-2xl leading-tight">Scan a barcode</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Point the camera at a grocery barcode, or type the numbers. We look up the food and log it.
      </p>
      <Button
        className="mt-4 w-full"
        variant="spark"
        onClick={() => {
          setOpen(true);
          setCamera(true);
        }}
      >
        <ScanBarcode />
        Scan barcode
      </Button>
      <Button
        className="mt-2 w-full"
        variant="secondary"
        onClick={() => {
          setOpen(true);
          setCamera(false);
        }}
      >
        <Barcode />
        Type the numbers
      </Button>
      {done && !open ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium" data-testid="barcode-logged">
          <Check className="size-4 text-primary" />
          {done}
        </p>
      ) : null}

      <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <SheetContent title="Scan a barcode">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">Scan</p>
          <h2 className="mt-1 font-display text-2xl">Scan a barcode</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the camera, or type the numbers printed under the bars. Saving stays here.
          </p>

          {camera ? (
            <div className="relative mt-4 overflow-hidden rounded-3xl bg-background">
              <video ref={videoRef} className="aspect-[3/4] w-full object-cover" playsInline muted autoPlay />
              <span className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-spark" />
              <p className="absolute inset-x-0 bottom-3 text-center text-xs text-spark-foreground">
                Line up the barcode
              </p>
            </div>
          ) : null}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(digits);
            }}
          >
            <Input
              data-testid="barcode-digits"
              inputMode="numeric"
              autoComplete="off"
              value={digits}
              onChange={(e) => setDigits(e.target.value)}
              placeholder="Numbers under the barcode"
              aria-label="Barcode numbers"
            />
            <Button type="submit" variant="spark" disabled={busy}>
              Look up
            </Button>
          </form>
          {!camera ? (
            <Button
              className="mt-2 w-full"
              variant="secondary"
              onClick={() => {
                setError("");
                setCamera(true);
              }}
            >
              <ScanBarcode />
              Use camera
            </Button>
          ) : (
            <Button className="mt-2 w-full" variant="secondary" onClick={() => setCamera(false)}>
              Type instead
            </Button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">No camera? Type the numbers under the bars.</p>

          {busy ? <p className="mt-3 text-sm text-spark">Looking it up…</p> : null}
          {error ? <p className="mt-3 text-sm text-muted-foreground">{error}</p> : null}

          {product && nutrition ? (
            <div className="mt-4 rounded-3xl bg-background p-4" data-testid="barcode-product">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">
                {product.brand ?? "Found"}
              </p>
              <label className="mt-2 block text-sm">
                Name
                <Input className="mt-1.5" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              </label>
              <p className="mt-2 text-sm text-muted-foreground">
                {product.serving}
                {product.per === "100g" ? " · listed per 100 g" : " · per serving"}
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Macro label="Cal" value={nutrition.cal} />
                <Macro label="Protein" value={`${nutrition.protein}g`} />
                <Macro label="Carbs" value={`${nutrition.carbs}g`} />
                <Macro label="Fat" value={`${nutrition.fat}g`} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm">How many servings?</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label="Fewer servings"
                    onClick={() => setServings((n) => Math.max(0.5, n - 0.5))}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm tabular-nums">{servings}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label="More servings"
                    onClick={() => setServings((n) => Math.min(6, n + 0.5))}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <Button className="mt-4 w-full" variant="spark" onClick={logEaten} data-testid="barcode-log">
                <Check />
                Log as eaten
              </Button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    addPantry(label);
                    toast(`${label} saved in pantry`);
                    setDone(`${label} saved in pantry`);
                  }}
                >
                  I have this
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    addExtraGrocery(label, "Other");
                    toast(`${label} added to the shop list`);
                    setDone(`${label} added to the shop list`);
                  }}
                >
                  Add to shop
                </Button>
              </div>
              {done ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium" data-testid="barcode-logged">
                  <Check className="size-4 text-primary" />
                  {done}
                </p>
              ) : null}
            </div>
          ) : error ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draftName.trim()) return;
                addSnack({
                  date: isoDate(),
                  name: draftName.trim(),
                  nutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 },
                });
                setDone(`${draftName.trim()} logged`);
                toast(`${draftName.trim()} logged`);
              }}
            >
              <label className="block text-sm">
                Food name
                <Input
                  className="mt-1.5"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Greek yogurt"
                />
              </label>
              <Button type="submit" className="w-full" variant="spark" disabled={!draftName.trim()}>
                Log this anyway
              </Button>
            </form>
          ) : null}

          <Button className="mt-4 w-full" variant="secondary" onClick={close}>
            <X />
            Done
          </Button>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function Macro({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-card px-2 py-2 shadow-[var(--shadow-border)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}
