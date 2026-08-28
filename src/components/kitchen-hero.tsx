import { Plate } from "@/components/plate";
import type { PlateKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KitchenHero({
  plates = ["roast", "pasta", "green"],
  className,
}: {
  plates?: PlateKind[];
  className?: string;
}) {
  return (
    <div className={cn("relative isolate h-28 w-full max-w-xs", className)} aria-hidden>
      <div className="absolute left-2 top-4 rotate-[-12deg]">
        <Plate kind={plates[0] ?? "roast"} size="lg" />
      </div>
      <div className="absolute left-[4.5rem] top-0 z-[1] rotate-[6deg] drop-shadow-sm">
        <Plate kind={plates[1] ?? "pasta"} size="lg" />
      </div>
      <div className="absolute left-36 top-6 rotate-[16deg]">
        <Plate kind={plates[2] ?? "green"} size="lg" />
      </div>
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Plate kind="pasta" size="sm" />
      <p className="font-display text-lg leading-none tracking-tight sm:text-xl">Spoonful</p>
    </div>
  );
}
