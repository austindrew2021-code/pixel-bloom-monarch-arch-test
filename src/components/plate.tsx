import type { PlateKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Plate({
  kind,
  className,
  size = "md",
}: {
  kind: PlateKind;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dim =
    size === "sm" ? "size-11" : size === "lg" ? "size-24" : size === "xl" ? "size-32" : "size-16";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-food-cream shadow-[var(--shadow-border)]",
        dim,
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="size-full">
        <circle cx="32" cy="32" r="30" className="fill-food-cream" />
        {kind === "roast" && (
          <>
            <ellipse cx="32" cy="34" rx="16" ry="12" className="fill-food-crust" />
            <ellipse cx="32" cy="32" rx="12" ry="8" className="fill-food-salmon" />
            <circle cx="22" cy="44" r="5" className="fill-food-herb" />
            <circle cx="42" cy="46" r="4" className="fill-food-leaf" />
          </>
        )}
        {kind === "pasta" && (
          <>
            <path d="M14 30c6-8 30-8 36 0 2 10-8 18-18 18S12 40 14 30Z" className="fill-food-yolk" />
            <path d="M18 32c8-4 20-4 28 2" className="stroke-food-tomato fill-none" strokeWidth="3" />
            <circle cx="40" cy="24" r="4" className="fill-food-herb" />
          </>
        )}
        {kind === "bowl" && (
          <>
            <path d="M12 28h40l-4 16H16Z" className="fill-food-broth" />
            <ellipse cx="32" cy="28" rx="20" ry="6" className="fill-food-yolk" />
            <circle cx="26" cy="30" r="5" className="fill-food-herb" />
            <circle cx="38" cy="32" r="4" className="fill-food-tomato" />
          </>
        )}
        {kind === "fish" && (
          <>
            <ellipse cx="34" cy="32" rx="16" ry="9" className="fill-food-salmon" />
            <path d="M16 32l-6-8v16Z" className="fill-food-salmon" />
            <rect x="40" y="40" width="12" height="6" rx="2" className="fill-food-leaf" />
            <circle cx="42" cy="30" r="1.4" className="fill-food-char" />
          </>
        )}
        {kind === "soup" && (
          <>
            <path d="M14 26h36v4c0 12-8 20-18 20S14 42 14 30Z" className="fill-food-crust" />
            <ellipse cx="32" cy="26" rx="18" ry="6" className="fill-food-broth" />
            <circle cx="26" cy="26" r="3" className="fill-food-tomato" />
            <circle cx="36" cy="24" r="2.5" className="fill-food-herb" />
          </>
        )}
        {kind === "taco" && (
          <>
            <path d="M12 40c0-14 10-24 20-24s20 10 20 24Z" className="fill-food-yolk" />
            <path d="M16 40c2-12 10-20 16-20s14 8 16 20" className="fill-food-herb" />
            <circle cx="28" cy="30" r="3" className="fill-food-tomato" />
            <circle cx="38" cy="32" r="3" className="fill-food-leaf" />
          </>
        )}
        {kind === "green" && (
          <>
            <ellipse cx="32" cy="34" rx="18" ry="14" className="fill-food-leaf" />
            <ellipse cx="28" cy="30" rx="8" ry="6" className="fill-food-herb" />
            <circle cx="40" cy="36" r="5" className="fill-food-tomato" />
            <circle cx="24" cy="40" r="3" className="fill-food-yolk" />
          </>
        )}
        {kind === "skillet" && (
          <>
            <circle cx="32" cy="34" r="16" className="fill-food-char" />
            <circle cx="32" cy="34" r="12" className="fill-food-crust" />
            <circle cx="28" cy="32" r="4" className="fill-food-herb" />
            <circle cx="38" cy="36" r="3.5" className="fill-food-tomato" />
            <rect x="46" y="30" width="12" height="4" rx="2" className="fill-food-char" />
          </>
        )}
        {kind === "curry" && (
          <>
            <path d="M14 30h36l-3 14H17Z" className="fill-food-yolk" />
            <ellipse cx="32" cy="30" rx="18" ry="7" className="fill-food-crust" />
            <circle cx="30" cy="32" r="3" className="fill-food-herb" />
            <circle cx="38" cy="34" r="2.5" className="fill-food-tomato" />
          </>
        )}
        {kind === "toast" && (
          <>
            <rect x="16" y="18" width="32" height="28" rx="4" className="fill-food-crust" />
            <rect x="20" y="22" width="24" height="20" rx="3" className="fill-food-cream" />
            <circle cx="32" cy="32" r="6" className="fill-food-yolk" />
            <circle cx="32" cy="32" r="3" className="fill-food-crust" />
          </>
        )}
        {kind === "dessert" && (
          <>
            <path d="M18 40h28l-4 10H22Z" className="fill-food-crust" />
            <path d="M20 40c4-14 20-14 24 0" className="fill-food-salmon" />
            <ellipse cx="32" cy="26" rx="8" ry="5" className="fill-food-cream" />
            <circle cx="32" cy="20" r="3" className="fill-food-tomato" />
          </>
        )}
      </svg>
    </div>
  );
}
