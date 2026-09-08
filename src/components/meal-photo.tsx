import { useState } from "react";
import { Plate } from "@/components/plate";
import { photoFor } from "@/lib/food-photos";
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
  if (broken) {
    return (
      <div className={cn("meal-photo grid place-items-center overflow-hidden bg-muted", className)}>
        <Plate kind={recipe.plate ?? "bowl"} size="md" />
      </div>
    );
  }
  return (
    <div className={cn("meal-photo overflow-hidden bg-muted", className)}>
      <img
        src={photoFor(recipe)}
        alt={alt ?? recipe.name}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
