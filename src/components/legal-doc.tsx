import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getBearerToken } from "@/lib/auth/client";

export type LegalSection = { heading: string; body: string };

const LINKS = [
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/health", label: "Health" },
  { to: "/data", label: "Data" },
  { to: "/support", label: "Support" },
] as const;

export function LegalDoc({
  kicker,
  title,
  updated,
  sections,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-16 pt-8 text-foreground">
      <Link to="/" className="text-sm text-muted-foreground">
        ← Back to the kitchen
      </Link>
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-spark">{kicker}</p>
      <h1 className="mt-1 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">Updated {updated}</p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Store policies">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-full bg-card px-3 py-2 text-xs shadow-[var(--shadow-border)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 space-y-5">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl">{section.heading}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
      {children}
    </main>
  );
}

export function AccountControls() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-6 space-y-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-xl">This phone and the account</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Clear this phone removes dinners, pantry, and workouts stored on this device. Delete account also removes the sign-in. Messages you sent may remain in the other person's thread as "a cook" once the username is gone.
      </p>
      <Button
        variant="secondary"
        className="w-full"
        disabled={busy}
        onClick={() => {
          window.localStorage.removeItem("spoonful-v1");
          toast("This phone's kitchen is cleared");
          window.location.assign("/");
        }}
      >
        Clear this phone
      </Button>
      <Button
        variant="spark"
        className="w-full"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm("Delete the Spoonful account on this sign-in? This can't be undone.")) return;
          setBusy(true);
          try {
            const headers: Record<string, string> = { "content-type": "application/json" };
            const token = getBearerToken();
            if (token) headers.authorization = `Bearer ${token}`;
            const res = await fetch("/api/auth/delete-user", {
              method: "POST",
              credentials: "include",
              headers,
              body: "{}",
            });
            if (!res.ok) {
              toast("Couldn't delete the account. Clear this phone still works.");
              return;
            }
            window.localStorage.removeItem("spoonful-v1");
            toast("Account deleted");
            window.location.assign("/");
          } catch {
            toast("Couldn't delete the account. Clear this phone still works.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Delete account
      </Button>
    </div>
  );
}
