/**
 * Progress photo storage. Photo bytes live in IndexedDB (client-only, ample
 * quota) — never in the zustand-persisted/cloud-synced store state, since
 * kitchen-cloud.ts caps the whole synced payload at 1.5MB and a handful of
 * photos would blow through that instantly. The store only ever holds
 * lightweight metadata (id, date, weight snapshot); see spoonful-store.ts's
 * progressPhotos list.
 */

export type ProgressPhotoMeta = {
  id: string;
  date: string;
  weightKg?: number;
  note?: string;
};

const DB_NAME = "spoonful-photos";
const DB_VERSION = 1;
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

export async function savePhotoBlob(id: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB write failed"));
    });
  } finally {
    db.close();
  }
}

export async function loadPhotoBlob(id: string): Promise<string | null> {
  const db = await openDb();
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("indexedDB read failed"));
    });
  } finally {
    db.close();
  }
}

export async function deletePhotoBlob(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB delete failed"));
    });
  } finally {
    db.close();
  }
}

/** Downscale + re-encode a captured photo before storing it — full-res phone photos are 3-8MB. */
export async function compressPhoto(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image decode failed"));
      el.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * The logged weight closest to a given date — exact match preferred, then
 * the nearest earlier entry, then the nearest later one. Lets a progress
 * photo show "182 lb" even when the weigh-in was a day or two off.
 */
export function nearestWeightForDate(
  weightLog: { date: string; kg: number }[],
  date: string,
): number | undefined {
  if (weightLog.length === 0) return undefined;
  const exact = weightLog.find((w) => w.date === date);
  if (exact) return exact.kg;
  const before = weightLog.filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (before) return before.kg;
  const after = [...weightLog].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  return after?.kg;
}
