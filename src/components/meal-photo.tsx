import { useState } from "react";
import { Plate } from "@/components/plate";
import { photoOrPlate } from "@/lib/food-photos";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MealPhoto({
  recipe,
  className,
  alt,
}: {
  recipe: Pick<Recipe, "id" | "name" | "plate" | "tags"> & { photo?: string };
  className?: string;
  alt?: string;
}) {
  const [broken, setBroken] = useState(false);
  const shot = photoOrPlate(recipe);
  if (broken || shot.kind !== "photo") {
    return (
      <div className={cn("meal-photo grid place-items-center overflow-hidden bg-muted", className)}>
        {/* Scaled off the container's height so the same glyph suits a 56px
            row and a 176px hero without a size prop at seventeen call sites. */}
        <Plate kind={recipe.plate ?? "bowl"} className="h-[58%] w-auto aspect-square" />
      </div>
    );
  }
  return (
    <div className={cn("meal-photo overflow-hidden bg-muted", className)}>
      <img
        src={shot.src}
        alt={alt ?? recipe.name}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
