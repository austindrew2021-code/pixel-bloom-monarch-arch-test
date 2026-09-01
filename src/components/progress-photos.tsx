import { useEffect, useRef, useState } from "react";
import { Camera, Columns2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatWeight } from "@/lib/body";
import { isoDate } from "@/lib/fuel";
import {
  compressPhoto,
  deletePhotoBlob,
  loadPhotoBlob,
  nearestWeightForDate,
  savePhotoBlob,
  type ProgressPhotoMeta,
} from "@/lib/progress-photos";
import { useSpoonful } from "@/lib/spoonful-store";

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * A photo every week or two shows what the scale alone can't. Bytes live in
 * IndexedDB (see progress-photos.ts) — private to this device, never synced
 * to the cloud payload or shared. Side-by-side compare is a Kitchen Table
 * perk; adding and viewing individual photos always stays free.
 */
export function ProgressPhotos({ onOpenStore }: { onOpenStore: () => void }) {
  const body = useSpoonful((s) => s.body);
  const weightLog = useSpoonful((s) => s.weightLog) ?? [];
  const photos = useSpoonful((s) => s.progressPhotos);
  const addProgressPhoto = useSpoonful((s) => s.addProgressPhoto);
  const removeProgressPhoto = useSpoonful((s) => s.removeProgressPhoto);
  const hasKitchenTable = useSpoonful((s) => s.hasAddon("kitchen-table"));
  const fileRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<ProgressPhotoMeta | null>(null);
  const [comparing, setComparing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const missing = photos.filter((p) => !thumbs[p.id]);
    if (missing.length === 0) return;
    void (async () => {
      for (const p of missing) {
        const data = await loadPhotoBlob(p.id).catch(() => null);
        if (cancelled || !data) continue;
        setThumbs((cur) => (cur[p.id] ? cur : { ...cur, [p.id]: data }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run whenever the photo list changes; thumbs is read, not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressPhoto(file);
      const id = nid();
      await savePhotoBlob(id, dataUrl);
      const date = isoDate();
      addProgressPhoto({ id, date, weightKg: nearestWeightForDate(weightLog, date) });
      setThumbs((cur) => ({ ...cur, [id]: dataUrl }));
      toast("Photo saved");
    } catch {
      toast("Could not save that photo");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onDelete(id: string) {
    await deletePhotoBlob(id).catch(() => {});
    removeProgressPhoto(id);
    setThumbs((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
    setViewing(null);
    toast("Photo removed");
  }

  const camInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      onChange={(e) => void onFile(e.target.files?.[0])}
    />
  );

  if (photos.length === 0) {
    return (
      <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Progress photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A photo every week or two shows what the scale can't. Private to this device — nothing is shared.
        </p>
        {camInput}
        <Button className="mt-3 w-full" variant="spark" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Camera /> {busy ? "Saving…" : "Add first photo"}
        </Button>
      </section>
    );
  }

  const first = photos[0]!;
  const latest = photos[photos.length - 1]!;

  return (
    <section className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl">Progress photos</h2>
        {camInput}
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          aria-label="Add photo"
        >
          <Camera />
        </Button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setViewing(p)}
            className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-background shadow-[var(--shadow-border)]"
          >
            {thumbs[p.id] ? (
              <img src={thumbs[p.id]} alt={p.date} className="h-full w-full object-cover" />
            ) : null}
            <span className="absolute inset-x-0 bottom-0 bg-foreground/60 px-1 py-0.5 text-center text-[10px] text-background">
              {p.date.slice(5)}
            </span>
          </button>
        ))}
      </div>
      {photos.length >= 2 ? (
        hasKitchenTable ? (
          <Button className="mt-3 w-full" variant="secondary" onClick={() => setComparing(true)}>
            <Columns2 /> Compare first vs. latest
          </Button>
        ) : (
          <button
            type="button"
            onClick={onOpenStore}
            className="mt-3 w-full rounded-2xl bg-background px-4 py-3 text-left text-xs text-muted-foreground shadow-[var(--shadow-border)]"
          >
            Kitchen Table unlocks a side-by-side before/after compare.
          </button>
        )
      ) : null}

      <Sheet open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent title="Photo">
          {viewing ? (
            <div>
              {thumbs[viewing.id] ? (
                <img src={thumbs[viewing.id]} alt={viewing.date} className="w-full rounded-2xl object-cover" />
              ) : null}
              <p className="mt-3 font-display text-xl">{viewing.date}</p>
              {viewing.weightKg != null ? (
                <p className="text-sm text-muted-foreground">{formatWeight({ ...body, weightKg: viewing.weightKg })}</p>
              ) : null}
              <Button className="mt-4 w-full" variant="secondary" onClick={() => void onDelete(viewing.id)}>
                <Trash2 /> Delete photo
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={comparing} onOpenChange={setComparing}>
        <SheetContent title="Compare">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Before → after</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[first, latest].map((p) => (
              <div key={p.id}>
                {thumbs[p.id] ? (
                  <img src={thumbs[p.id]} alt={p.date} className="w-full rounded-2xl object-cover" />
                ) : null}
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {p.date}
                  {p.weightKg != null ? ` · ${formatWeight({ ...body, weightKg: p.weightKg })}` : ""}
                </p>
              </div>
            ))}
          </div>
          {first.weightKg != null && latest.weightKg != null && first.id !== latest.id ? (
            <p className="mt-3 text-center text-sm font-medium">{weightDeltaLabel(body, first.weightKg, latest.weightKg)}</p>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function weightDeltaLabel(body: { units: string }, fromKg: number, toKg: number): string {
  const deltaKg = toKg - fromKg;
  if (Math.abs(deltaKg) < 0.1) return "No change on the scale";
  const imperial = body.units === "imperial";
  const shown = imperial ? Math.round(Math.abs(deltaKg) * 2.2046226218) : Math.round(Math.abs(deltaKg) * 10) / 10;
  const unit = imperial ? "lb" : "kg";
  return `${deltaKg < 0 ? "Down" : "Up"} ${shown} ${unit}`;
}
