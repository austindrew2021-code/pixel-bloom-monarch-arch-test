import { useState, type FormEvent } from "react";
import { KitchenHero } from "@/components/kitchen-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { keyMatches, unlockTester } from "@/lib/tester";
import { isPreviewChrome } from "@/lib/preview-chrome";

export function TesterGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!keyMatches(value)) {
      setWrong(true);
      return;
    }
    unlockTester();
    onUnlock();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col overflow-x-clip px-6 pb-10">
      {isPreviewChrome() ? <div className="chrome-gutter h-14 shrink-0" /> : <div className="h-8 shrink-0" />}
      <KitchenHero className="mx-auto" />
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-spark">Private testing</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95] text-foreground">
        This kitchen
        <br />
        is closed.
      </h1>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-foreground/80">
        Spoonful is in a private test. Enter the kitchen key from the person who invited you. Without it, nothing inside opens.
      </p>
      <form onSubmit={submit} className="mt-8">
        <label htmlFor="tester-key" className="text-sm font-medium">
          Kitchen key
        </label>
        <Input
          id="tester-key"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          placeholder="PLATE-····"
          className="mt-2 tracking-[0.18em]"
          aria-invalid={wrong}
        />
        {wrong ? (
          <p className="mt-2 text-sm text-destructive">That key doesn’t open this kitchen.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Ask the cook. Don’t post the key in public.</p>
        )}
        <Button type="submit" className="mt-6 w-full" variant="spark">
          Open kitchen
        </Button>
      </form>
    </main>
  );
}
