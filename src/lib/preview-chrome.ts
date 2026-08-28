/** Grok live-preview remix pill. Empty on the published kitchen and on the APK. */
export function isPreviewChrome(): boolean {
  if (typeof window === "undefined") return false;
  if ((window as { __SPOONFUL_APK__?: boolean }).__SPOONFUL_APK__) return false;
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}
