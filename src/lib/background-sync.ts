import { enablePush } from "./notify";

const TAG = "spoonful-fuel";
const PENDING = "/__spoonful-pending-sync";
const CACHE = "spoonful-sync";

type PeriodicSyncRegistration = ServiceWorkerRegistration & {
  periodicSync?: {
    register: (tag: string, options?: { minInterval: number }) => Promise<void>;
    unregister: (tag: string) => Promise<void>;
  };
  sync?: {
    register: (tag: string) => Promise<void>;
  };
};

async function registration(): Promise<PeriodicSyncRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.register("/sync-sw.js", { scope: "/" })) as PeriodicSyncRegistration;
  } catch {
    return null;
  }
}

/** Turn on background pulls — notifications + periodic sync when the OS allows it. */
export async function enableAlwaysSync(): Promise<boolean> {
  const push = await enablePush();
  const reg = await registration();
  if (!reg) return push;
  try {
    await reg.update();
  } catch {
    /* already registered */
  }
  try {
    await reg.periodicSync?.register(TAG, { minInterval: 15 * 60 * 1000 });
  } catch {
    /* Chrome only grants this on an installed PWA with engagement. */
  }
  try {
    await reg.sync?.register(TAG);
  } catch {
    /* Background Sync is optional. */
  }
  return push;
}

export async function disableAlwaysSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const ready = (await navigator.serviceWorker.ready) as PeriodicSyncRegistration;
    await ready.periodicSync?.unregister(TAG);
  } catch {
    /* not registered */
  }
  try {
    const cache = await caches.open(CACHE);
    await cache.delete(PENDING);
  } catch {
    /* ignore */
  }
}

export async function consumePendingSync(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(PENDING);
    if (!hit) return false;
    await cache.delete(PENDING);
    return true;
  } catch {
    return false;
  }
}

export function onBackgroundSync(handler: () => void): () => void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return () => {};
  const onMsg = (event: MessageEvent) => {
    if (event.data && event.data.type === "spoonful-sync") handler();
  };
  navigator.serviceWorker.addEventListener("message", onMsg);
  return () => navigator.serviceWorker.removeEventListener("message", onMsg);
}
