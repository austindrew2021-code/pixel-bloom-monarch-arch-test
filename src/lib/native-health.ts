import type { HealthDay } from "./fitness-sync";
import { isoDate } from "./fuel";

type NativePayload = Partial<HealthDay> & {
  steps?: number;
  heartRate?: number;
  error?: string;
};

declare global {
  interface Window {
    SpoonfulHealth?: {
      readToday?: () => string;
      request?: () => void;
      requestCamera?: () => void;
      requestLocation?: () => void;
      openUrls?: (json: string) => void;
      warmStoreCart?: (url: string, cartId: string) => void;
      openStoreCart?: (url: string, cartId: string) => void;
      setStoreBag?: (json: string) => void;
      notify?: (title: string, body: string) => void;
      hasStoreApp?: () => boolean;
      openStoreApp?: () => void;
      speak?: (text: string, optsJson?: string) => boolean;
      hush?: () => void;
    };
    __spoonfulHealth?: (day: HealthDay) => void;
    __SPOONFUL_APK__?: boolean;
  }
}

export function hasNativeHealth(): boolean {
  return typeof window !== "undefined" && Boolean(window.SpoonfulHealth);
}

export function isSpoonfulApk(): boolean {
  if (typeof window === "undefined") return false;
  if (window.__SPOONFUL_APK__) return true;
  if (window.SpoonfulHealth) return true;
  return false;
}

/** When the kitchen is packed in the APK, API calls still hit the live site. */
export function kitchenApi(path: string): string {
  if (typeof window === "undefined") return path;
  if (isSpoonfulApk() || window.location.protocol === "file:") {
    return `https://pixel-bloom-monarch-arch.grok.me${path}`;
  }
  return path;
}

export function healthFromNative(raw: NativePayload): HealthDay {
  const steps = Math.max(0, Math.round(Number(raw.steps) || 0));
  const hr = Math.max(0, Math.round(Number(raw.heartRate) || 0));
  const date = raw.date || isoDate();
  return {
    date,
    steps,
    distanceKm: raw.distanceKm ?? Math.round((steps / 1280) * 100) / 100,
    flights: raw.flights ?? 0,
    activeKcal: raw.activeKcal ?? 0,
    basalKcal: raw.basalKcal ?? 0,
    exerciseMin: raw.exerciseMin ?? 0,
    standHours: raw.standHours ?? 0,
    moveGoal: raw.moveGoal ?? 500,
    exerciseGoal: raw.exerciseGoal ?? 30,
    standGoal: raw.standGoal ?? 12,
    heartRate: hr,
    restingHr: raw.restingHr ?? 0,
    walkingHrAvg: raw.walkingHrAvg ?? 0,
    hrvMs: raw.hrvMs ?? 0,
    vo2max: raw.vo2max ?? 0,
    spo2: raw.spo2 ?? 0,
    sleepHours: raw.sleepHours ?? 0,
    sleepScore: raw.sleepScore ?? 0,
    waterMl: raw.waterMl ?? 0,
    mindfulMin: raw.mindfulMin ?? 0,
    weightKg: raw.weightKg ?? 0,
  };
}

export function listenNativeHealth(onDay: (day: HealthDay) => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.__spoonfulHealth = onDay;
  try {
    window.SpoonfulHealth?.request?.();
    const snap = window.SpoonfulHealth?.readToday?.();
    if (snap) {
      const parsed = JSON.parse(snap) as NativePayload;
      if (!parsed.error) onDay(healthFromNative(parsed));
    }
  } catch {
    // Native bridge not ready yet.
  }
  return () => {
    if (window.__spoonfulHealth === onDay) delete window.__spoonfulHealth;
  };
}

export function requestNativeHealth(): void {
  try {
    window.SpoonfulHealth?.request?.();
  } catch {
    // ignore
  }
}

export function requestNativeCamera(): void {
  try {
    window.SpoonfulHealth?.requestCamera?.();
  } catch {
    // Browser / PWA — getUserMedia is the prompt.
  }
}

export function requestNativeLocation(): void {
  try {
    window.SpoonfulHealth?.requestLocation?.();
  } catch {
    // Browser / PWA — geolocation is the prompt.
  }
}

export function openNativeUrls(urls: string[]): boolean {
  const clean = urls.filter((u) => /^https:\/\//i.test(u)).slice(0, 20);
  if (!clean.length || typeof window === "undefined") return false;
  try {
    if (window.SpoonfulHealth?.openUrls) {
      window.SpoonfulHealth.openUrls(JSON.stringify(clean));
      return true;
    }
  } catch {
    // Bridge missing on this build.
  }
  return false;
}

export function openStoreAdds(urls: string[]): number {
  const clean = urls.filter((u) => /^https:\/\//i.test(u)).slice(0, 20);
  if (!clean.length || typeof window === "undefined") return 0;
  if (openNativeUrls(clean)) return clean.length;
  if (isSpoonfulApk()) {
    for (const url of clean) {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    return clean.length;
  }
  let opened = 0;
  for (const url of clean) {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) break;
    opened += 1;
  }
  return opened;
}

export function warmStoreCart(url: string, cartId: string): boolean {
  if (!/^https:\/\//i.test(url) || !cartId || typeof window === "undefined") return false;
  try {
    window.SpoonfulHealth?.warmStoreCart?.(url, cartId);
    return Boolean(window.SpoonfulHealth?.warmStoreCart);
  } catch {
    return false;
  }
}

export function openStoreCart(url: string, cartId = ""): boolean {
  if (!/^https:\/\//i.test(url) || typeof window === "undefined") return false;
  const api = window.SpoonfulHealth;
  if (!api) return false;
  try {
    (api as { openStoreCart: (u: string, c: string) => void }).openStoreCart(url, cartId);
    return true;
  } catch {
    try {
      api.openStoreCart?.(url, cartId);
      return true;
    } catch {
      return false;
    }
  }
}

export function setStoreBag(
  payload:
    | { name: string; query?: string; url?: string; qty?: number }[]
    | {
        brand?: string;
        storeName?: string;
        storeId?: string;
        cartId?: string;
        fill?: boolean;
        handsOff?: boolean;
        items: { name: string; query?: string; url?: string; qty?: number; product?: string }[];
      },
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const bag = Array.isArray(payload) ? { items: payload.slice(0, 40) } : { ...payload, items: payload.items.slice(0, 40) };
    window.SpoonfulHealth?.setStoreBag?.(JSON.stringify(bag));
    return Boolean(window.SpoonfulHealth?.setStoreBag);
  } catch {
    return false;
  }
}

export function hasStoreApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.SpoonfulHealth?.hasStoreApp?.());
  } catch {
    return false;
  }
}

export function notifyNative(title: string, body: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.SpoonfulHealth?.notify?.(title, body);
    return Boolean(window.SpoonfulHealth?.notify);
  } catch {
    return false;
  }
}

export function openStoreApp(): boolean {
  if (!hasStoreApp()) return false;
  try {
    window.SpoonfulHealth?.openStoreApp?.();
    return true;
  } catch {
    return false;
  }
}
