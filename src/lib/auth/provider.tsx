import type { ReactNode } from "react";
import { Toaster } from "sonner";

/**
 * App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
 *
 *   <AuthProvider><Outlet /></AuthProvider>
 *
 * Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
 * its `useSession()` works standalone — so this is a passthrough today. It's
 * kept as the single, stable mount point for any future client-side providers
 * (e.g. a toast or theme provider) without churning the root shell.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/*
        * Toasts sit above the bottom nav, not over the header. At the top they
        * covered the header's controls for the four seconds they were up — and
        * on the training HUD they landed squarely on its only close button, so
        * "log a plate, then leave" was a dead tap. Down here they clear both the
        * nav (z-40, ~70px plus the safe area) and everything a cook taps.
        */}
      <Toaster
        position="bottom-center"
        offset="calc(5.25rem + env(safe-area-inset-bottom))"
        // Below 600px wide sonner uses mobileOffset instead, and this app is
        // phone-first — without it every toast lands back on top of the nav.
        mobileOffset="calc(5.25rem + env(safe-area-inset-bottom))"
        toastOptions={{
          classNames: {
            toast:
              "bg-card text-card-foreground shadow-[var(--shadow-lift)] border-border font-sans",
          },
        }}
      />
    </>
  );
}
