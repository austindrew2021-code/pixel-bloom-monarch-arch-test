import { Barcode, Check, Minus, Plus, ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { lookupBarcode, scaleNutrition, type BarcodeProduct } from "@/lib/barcode";
import { isSilentZeroNutrition } from "@/lib/eaten";
import { isoDate } from "@/lib/fuel";
import { requestNativeCamera } from "@/lib/native-health";
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

async function requestCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This phone cannot open a camera here. Type the numbers under the barcode.");
  }
  const tries: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { exact: "environment" } } },
    { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: true },
  ];
  let last: unknown;
  for (const constraints of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      last = err;
    }
  }
  const denied = last instanceof DOMException && (last.name === "NotAllowedError" || last.name === "PermissionDeniedError");
  throw new Error(
    denied
      ? "Allow camera when the phone asks, then tap Scan again. Or type the numbers."
      : "Camera is off. Type the numbers under the barcode instead.",
  );
}

export function BarcodeScanCard({ className }: { className?: string }) {
  const addSnack = useSpoonful((s) => s.addSnack);
  const addPantry = useSpoonful((s) => s.addPantry);
  const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
  const lockKitchen = useSpoonful((s) => s.lockKitchen);
  const unlockKitchen = useSpoonful((s) => s.unlockKitchen);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    let stop = false;
    let raf = 0;
    let attached = false;
    const detector = getDetector();
    const tick = async (video: HTMLVideoElement) => {
      if (stop) return;
      try {
        if (detector && video.readyState >= 2) {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue;
          if (value) {
            stop = true;
            setCamera(false);
            await lookup(value);
            return;
          }
        }
      } catch {
        /* keep looking */
      }
      raf = window.requestAnimationFrame(() => void tick(video));
    };
    const wait = window.setInterval(() => {
      if (stop || attached) return;
      const video = videoRef.current;
      const stream = streamRef.current;
      if (!video || !stream) return;
      attached = true;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      void video.play().catch(() => {});
      void tick(video);
    }, 50);
    return () => {
      stop = true;
      window.clearInterval(wait);
      window.cancelAnimationFrame(raf);
    };
  }, [open, camera]);

  async function startCamera() {
    setOpen(true);
    setError("");
    setDone("");
    setProduct(null);
    requestNativeCamera();
    try {
      const stream = await requestCameraStream();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      setCamera(true);
    } catch (err) {
      setCamera(false);
      setError(err instanceof Error ? err.message : "Camera is off. Type the numbers under the barcode instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setCamera(false);
  }

  async function lookup(code: string) {
    setBusy(true);
    setError("");
    setDone("");
    setProduct(null);
    try {
      const res = await lookupBarcode(code);
      if (!res.ok) {
        setError(res.error);
        setDraftName(`Food ${code.replace(/\D/g, "")}`);
        return;
      }
      if (isSilentZeroNutrition(res.product.nutrition)) {
        setProduct(null);
        setError("That barcode has no calories listed. You can still save the name.");
        setDraftName(res.product.name);
        return;
      }
      setProduct(res.product);
      setServings(1);
      setDraftName(res.product.name);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Done closes the sheet and the log stays: the confirmation moves to the card
   * so the cook can see the food landed. A new scan or lookup clears it.
   */
  function close() {
    stopCamera();
    setOpen(false);
    setBusy(false);
    setDigits("");
    setError("");
    setProduct(null);
    setServings(1);
    setDraftName("");
  }

  const nutrition = product ? scaleNutrition(product.nutrition, servings) : null;
  const label = draftName.trim() || product?.name || "Food";

  function logEaten() {
    if (!product || !nutrition || isSilentZeroNutrition(nutrition)) return;
    addSnack({ date: isoDate(), name: label, nutrition });
    setDone(`${label} logged`);
    toast(`${label} logged`);
  }

  function logAnyway() {
    const name = (draftName.trim() || label || "Food").trim();
    if (!name) return;
    addSnack({
      date: isoDate(),
      name,
      nutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 },
      unknownMacros: true,
    });
    setDone(`${name} saved · calories unknown`);
    toast(`${name} saved · calories unknown`);
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
      <Button className="mt-4 w-full" variant="spark" onClick={() => void startCamera()} data-testid="barcode-scan-open">
        <ScanBarcode />
        Scan barcode
      </Button>
      <Button
        className="mt-2 w-full"
        variant="secondary"
        onClick={() => {
          stopCamera();
          setOpen(true);
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
            The phone should ask to use the camera. Saving stays here.
          </p>

          {camera ? (
            <div className="relative mt-4 overflow-hidden rounded-3xl bg-background" data-testid="barcode-camera">
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
            <Button className="mt-2 w-full" variant="secondary" onClick={() => void startCamera()}>
              <ScanBarcode />
              Use camera
            </Button>
          ) : (
            <Button className="mt-2 w-full" variant="secondary" onClick={stopCamera}>
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
                logAnyway();
              }}
            >
              <p className="text-sm" data-testid="barcode-empty">
                Calories unknown until we find a listing. This is not a finished log yet.
              </p>
              <label className="block text-sm">
                Food name
                <Input
                  className="mt-1.5"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Leftover pasta"
                  data-testid="barcode-anyway-name"
                />
              </label>
              <Button type="submit" className="w-full" variant="spark" data-testid="barcode-anyway">
                Log this anyway
              </Button>
              {done ? (
                <p className="flex items-center gap-2 text-sm font-medium" data-testid="barcode-logged">
                  <Check className="size-4 text-primary" />
                  {done}
                </p>
              ) : null}
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
