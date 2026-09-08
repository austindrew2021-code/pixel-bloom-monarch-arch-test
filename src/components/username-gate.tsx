import { useState } from "react";
import { toast } from "sonner";
import { KitchenHero } from "@/components/kitchen-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimUsername } from "@/lib/community";

export function UsernameGate({ onDone }: { onDone: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-10 pt-16">
      <KitchenHero plates={["bowl", "green", "pasta"]} />
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-spark">
        One name, yours
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight">Pick a unique username</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        This is how cooks find you. Letters, numbers, and underscores. Nobody else can take it.
      </p>
      <form
        className="mt-8 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const res = await claimUsername({ data: { username } });
            if (!res.ok) {
              toast(res.error);
              return;
            }
            onDone(res.username);
          } catch {
            toast("Could not save. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm font-medium">
          Username
          <Input
            className="mt-1.5"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            placeholder="kitchen_mae"
            required
          />
        </label>
        <Button type="submit" className="w-full bg-spark text-spark-foreground hover:opacity-95" disabled={busy || username.length < 3}>
          {busy ? "Checking…" : "Claim it"}
        </Button>
      </form>
    </main>
  );
}
