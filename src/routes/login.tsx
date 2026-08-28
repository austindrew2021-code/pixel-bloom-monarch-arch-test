import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KitchenHero } from "@/components/kitchen-hero";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name || email.split("@")[0]! });
        if (res.error) {
          toast(res.error.message || "Could not create that kitchen account.");
          return;
        }
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          toast(res.error.message || "That email or password did not match.");
          return;
        }
      }
      window.location.assign("/");
    } catch {
      toast("Sign-in is busy. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 pt-16 text-foreground">
      <div className="w-full max-w-sm">
        <KitchenHero plates={["pasta", "taco", "curry"]} />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-spark">Spoonful</p>
        <h1 className="mt-3 font-display text-4xl leading-tight">Sign in so the kitchen follows you</h1>
        <p className="mt-3 text-base leading-relaxed text-foreground/80">
          Unique username, homemade recipes, follows, pantry photos, kitchen chat, and family table. Sign in also saves your week, Fuel, and body goal to your account — so a new phone does not wipe dinner.
        </p>
        <div className="mt-6 space-y-2">
          {authEnabled ? (
            <>
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="spark"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
              <p className="pt-3 text-center text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                or email
              </p>
              <form className="space-y-2" onSubmit={(e) => void onEmail(e)}>
                {mode === "up" ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                ) : null}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Opening…" : mode === "up" ? "Create account" : "Sign in with email"}
                </Button>
              </form>
              <button
                type="button"
                className="w-full pt-1 text-sm text-muted-foreground"
                onClick={() => setMode(mode === "up" ? "in" : "up")}
              >
                {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
          )}
        </div>
        <a href="/" className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
          Back to the kitchen
        </a>
      </div>
    </main>
  );
}
