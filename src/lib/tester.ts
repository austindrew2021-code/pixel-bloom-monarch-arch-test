import {
  isSandboxPreviewGuestHost,
  resolveParentEmbedderOrigin,
} from "./preview-embedder-origin";

declare global {
  interface Window {
    __SPOONFUL_APK__?: boolean;
  }
}

/** Share this only with people you want in the private test. */
export const TESTER_KEY = "PLATE-8F2R";

const STORAGE = "spoonful-tester-v1";

export function normalizeKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function keyMatches(raw: string): boolean {
  return normalizeKey(raw) === normalizeKey(TESTER_KEY);
}

export function inGrokPreview(): boolean {
  if (typeof window === "undefined") return false;
  if (isSandboxPreviewGuestHost(window.location.hostname)) return true;
  const ancestor =
    typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0
      ? location.ancestorOrigins[0]
      : null;
  return (
    resolveParentEmbedderOrigin(
      window.parent === window,
      document.referrer,
      ancestor,
      window.location.hostname,
    ) !== null
  );
}

export function unlockTester(): void {
  try {
    localStorage.setItem(STORAGE, "ok");
  } catch {
    // Private mode can block storage; the session still proceeds.
  }
}

export function isTesterUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  if (window.__SPOONFUL_APK__) {
    unlockTester();
    return true;
  }
  try {
    if (localStorage.getItem(STORAGE) === "ok") return true;
  } catch {
    // ignore
  }
  const params = new URLSearchParams(window.location.search);
  const fromLink = params.get("key") ?? params.get("invite");
  if (fromLink && keyMatches(fromLink)) {
    unlockTester();
    return true;
  }
  if (inGrokPreview()) {
    unlockTester();
    return true;
  }
  return false;
}
