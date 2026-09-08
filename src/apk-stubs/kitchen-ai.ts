import { RECIPES } from "@/lib/recipes";
import { localSubs } from "@/lib/substitutions";

type Call<T> = T | { data: T };

function dataOf<T>(arg: Call<T>): T {
  return arg && typeof arg === "object" && "data" in (arg as object) ? (arg as { data: T }).data : (arg as T);
}

export async function scanPantryPhoto(_arg?: Call<{ image: string; hint?: string }>) {
  return {
    ok: false as const,
    error: "On this test phone, type the food you see. Photo reading is saved for the live kitchen so we do not burn credits.",
  };
}

export async function suggestMealsFromPantry(_arg?: Call<{ items: string[]; catalog?: string[] }>) {
  return { ok: true as const, ideas: [] as { title: string; why: string; have: string[]; need: string[]; minutes: number }[] };
}

export async function suggestSubstitutes(arg: Call<{ missing: string; pantry: string[] }>) {
  const data = dataOf(arg);
  const options = localSubs(data.missing ?? "");
  return { ok: true as const, options };
}

export async function lookupDish(arg: Call<{ query: string }>) {
  const q = (dataOf(arg).query ?? "").trim().toLowerCase();
  if (q.length < 2) return { ok: false as const, error: "Type a dish name." };
  const hit =
    RECIPES.find((r) => r.name.toLowerCase() === q) ??
    RECIPES.find((r) => r.name.toLowerCase().includes(q) || (r.aliases ?? []).some((a) => a.toLowerCase().includes(q)));
  if (!hit) return { ok: false as const, error: "Not in this test library. Search Recipes, or try a closer name." };
  return {
    ok: true as const,
    recipe: {
      name: hit.name,
      description: hit.description,
      minutes: hit.minutes,
      servings: hit.servings,
      cuisine: hit.cuisine ?? "Homestyle",
      aliases: hit.aliases ?? [],
      ingredients: hit.ingredients,
      steps: hit.steps,
      nutrition: hit.nutrition,
    },
  };
}
