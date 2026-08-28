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
    };
    __spoonfulHealth?: (day: HealthDay) => void;
  }
}

export function hasNativeHealth(): boolean {
  return typeof window !== "undefined" && Boolean(window.SpoonfulHealth);
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
