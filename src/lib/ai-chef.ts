import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isBannedDishName, polishSteps } from "./cook-steps";
import { chefGoalRules, fitsInventedGoal } from "./goal-fit";
import type { PlateKind, Protein, Recipe } from "./types";

const PROTEINS = new Set<string>(["chicken", "beef", "pork", "fish", "seafood", "veg", "eggs", "turkey"]);

const AISLES = ["Produce", "Meat & Seafood", "Dairy & Eggs", "Pantry", "Bakery", "Frozen", "Herbs & Spices", "Other"] as const;

const dishSchema = z.object({
  name: z.string(),
  minutes: z.number(),
  description: z.string().optional(),
  protein: z.string().optional(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      unit: z.string(),
      aisle: z.string(),
    }),
  ),
  steps: z.array(z.string()),
  nutrition: z.object({
    cal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
});

const inputSchema = z.object({
  prompt: z.string().min(1).max(500),
  days: z.array(z.string()),
  household: z.number().min(1).max(8),
  invent: z.boolean().optional(),
  allergies: z.array(z.string()).optional(),
  prefs: z.array(z.string()).optional(),
  remaining: z
    .object({
      cal: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
    .optional(),
  body: z
    .object({
      kcal: z.number(),
      protein: z.number(),
      weightKg: z.number().optional(),
      goalKind: z.string().optional(),
      bodyFatPct: z.number().optional(),
      leanKg: z.number().optional(),
    })
    .optional(),
  recipes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      minutes: z.number(),
      protein: z.string(),
      tags: z.array(z.string()),
    }),
  ),
  scope: z.enum(["week", "tonight"]).optional(),
});

export type ChefDish = z.infer<typeof dishSchema>;

function plateFromInvented(name: string, steps: string[]): PlateKind {
  const b = `${name} ${steps.join(" ")}`.toLowerCase();
  if (/cake|pie|cookie|pudding|ice cream|affogato|custard|mousse|tiramisu|panna cotta/.test(b)) return "dessert";
  if (/pasta|spaghetti|linguine|penne|noodle|lasagna|macaroni|gnocchi/.test(b)) return "pasta";
  if (/soup|stew|chowder|gumbo|bisque|broth/.test(b)) return "soup";
  if (/taco|burrito|quesadilla/.test(b)) return "taco";
  if (/\bsalad\b|aspic/.test(b)) return "green";
  if (/curry/.test(b)) return "curry";
  if (/toast|sandwich|open-?face|tartine/.test(b)) return "toast";
  if (/\b(salmon|cod|trout|halibut|mackerel|fish fillet|sea bass|snapper)\b/.test(b)) return "fish";
  if (/roast|whole chicken|baked ham/.test(b)) return "roast";
  return "skillet";
}

function cacheKey(data: z.infer<typeof inputSchema>): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        prompt: data.prompt.trim().toLowerCase(),
        days: data.days,
        household: data.household,
        invent: Boolean(data.invent),
        allergies: data.allergies ?? [],
        prefs: data.prefs ?? [],
        remaining: data.remaining ?? null,
        goalKind: data.body?.goalKind ?? "",
        kcal: data.body?.kcal ?? 0,
        protein: data.body?.protein ?? 0,
        scope: data.scope ?? "tonight",
      }),
    )
    .digest("hex");
}

type ChefOk = {
  ok: true;
  days: { date: string; recipeId?: string; dish?: ChefDish }[];
  note: string;
};

async function readChefCache(key: string): Promise<ChefOk | null> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from chef_cache where prompt_key = ${key} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    if (payload && typeof payload === "object" && (payload as ChefOk).ok && Array.isArray((payload as ChefOk).days)) {
      return payload as ChefOk;
    }
  } catch {
    /* cache is optional */
  }
  return null;
}

async function writeChefCache(key: string, payload: ChefOk): Promise<void> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const json = JSON.stringify(payload);
    await sql`
      insert into chef_cache (prompt_key, payload, created_at)
      values (${key}, ${json}::jsonb, now())
      on conflict (prompt_key) do update set payload = excluded.payload, created_at = now()
    `;
  } catch {
    /* cache is optional */
  }
}

const STEP_RULE =
  "Steps: as many full sentences as the dish actually needs (usually 4–12). Yeast bread, gumbo, beans, and braises need more than 5. A salad or sauce may need fewer. Never pad with dummy lines like 'taste for salt'. Never stop early if the food still has a rise, a second cook, or a rest.";

export const planWeekWithChef = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { kitchenJson } = await import("./kitchen-llm.server");

    const key = cacheKey(data);
    const cached = await readChefCache(key);
    if (cached) return cached;

    const catalog = data.recipes
      .slice(0, 80)
      .map((r) => `${r.id} | ${r.name} | ${r.minutes}m | ${r.protein} | ${r.tags.join(",")}`)
      .join("\n");

    const invent = Boolean(data.invent);
    const tonight = data.scope === "tonight" || data.days.length === 1;
    const goalLine = chefGoalRules(data.body?.goalKind);
    const system = invent
      ? tonight
        ? `You are Spoonful's executive chef. Invent ONE real homemade dish from anywhere on earth that matches the request — any country, grandmother food, restaurant food cooked at home. Do not limit yourself to the catalog. Honor allergies as hard bans. ${goalLine} Hit the remaining protein and calories as closely as a home cook can. Nutrition per serving from typical USDA FoodData Central values, integers. JSON only: {"days":[{"date":"YYYY-MM-DD","dish":{"name":"","minutes":30,"description":"why this plate","protein":"chicken","ingredients":[{"name":"","qty":1,"unit":"","aisle":"Produce"}],"steps":["..."],"nutrition":{"cal":0,"protein":0,"carbs":0,"fat":0}}}],"note":"one short sentence"}. The dish name must be the real food name people would search (never "Ingredients", "Directions", or "Recipe"). Ingredients 6–12. ${STEP_RULE}`
        : `You are Spoonful's executive chef. You may pick a catalog id OR invent any real homemade dish from anywhere in the world — Japan, Peru, Senegal, Georgia, Korea, the Maritimes, grandmother food, restaurant food cooked at home. Never invent a catalog id. Honor allergies as hard bans. ${goalLine} Match the eater's remaining protein/calories when given. Nutrition must be per serving, estimated from typical USDA FoodData Central values, integers. JSON only: {"days":[{"date":"YYYY-MM-DD","recipeId":"optional-catalog-id","dish":{"name":"","minutes":30,"description":"","protein":"chicken","ingredients":[{"name":"","qty":1,"unit":"","aisle":"Produce"}],"steps":["..."],"nutrition":{"cal":0,"protein":0,"carbs":0,"fat":0}}}],"note":"one short sentence"}. Cover every date. Prefer inventing when the catalog cannot meet the request. Dish names must be real food names (never "Ingredients" or "Directions"). Keep ingredients 6–12. ${STEP_RULE}`
      : `You are Spoonful's kitchen planner. Pick dinner recipes from the catalog only. Never invent ids. ${goalLine} Avoid repeating the same protein two nights in a row when possible. Reply with JSON only: {"days":[{"date":"YYYY-MM-DD","recipeId":"id"}],"note":"one short sentence"}. Cover every date given.`;

    const fatBit =
      typeof data.body?.bodyFatPct === "number"
        ? ` Body fat ${data.body.bodyFatPct}%${data.body.leanKg ? `, lean mass ${Math.round(data.body.leanKg)} kg` : ""}.`
        : "";
    const user = [
      `Household of ${data.household}.`,
      `Dates: ${data.days.join(", ")}.`,
      data.allergies?.length ? `Allergies (never use): ${data.allergies.join(", ")}.` : "",
      data.prefs?.length ? `Prefs: ${data.prefs.join(", ")}.` : "",
      data.body
        ? `Daily target ~${data.body.kcal} kcal, ${data.body.protein}g protein.${fatBit} Goal: ${data.body.goalKind ?? "maintain"}.`
        : "",
      data.remaining ? `Tonight still needs about ${data.remaining.protein}g protein and ${data.remaining.cal} kcal.` : "",
      `Request: ${data.prompt}`,
      invent ? "Catalog (optional picks — already filtered to the body goal):" : "Catalog (already filtered to the body goal):",
      catalog,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await kitchenJson(system, user, invent ? (tonight ? 2000 : 2800) : 700, invent ? 0.7 : 0.6);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    try {
      const parsed = result.json as {
        days?: { date: string; recipeId?: string; dish?: unknown }[];
        note?: string;
      };
      const allowed = new Set(data.recipes.map((r) => r.id));
      const days: { date: string; recipeId?: string; dish?: ChefDish }[] = [];
      const used = new Set<string>();
      for (const d of parsed.days ?? []) {
        if (!data.days.includes(d.date)) continue;
        if (d.recipeId && allowed.has(d.recipeId)) {
          days.push({ date: d.date, recipeId: d.recipeId });
          used.add(d.recipeId);
          continue;
        }
        if (invent && d.dish) {
          const dish = dishSchema.safeParse({
            ...(d.dish as object),
            ingredients: Array.isArray((d.dish as { ingredients?: unknown }).ingredients)
              ? (d.dish as { ingredients: { name: string; qty: number; unit: string; aisle: string }[] }).ingredients.map(
                  (ing) => ({
                    ...ing,
                    aisle: AISLES.includes(ing.aisle as (typeof AISLES)[number]) ? ing.aisle : "Other",
                  }),
                )
              : [],
          });
          if (dish.success) {
            if (isBannedDishName(dish.data.name)) continue;
            if (!fitsInventedGoal(dish.data, data.body?.goalKind)) continue;
            const steps = polishSteps({
              name: dish.data.name,
              minutes: dish.data.minutes,
              protein: (PROTEINS.has(dish.data.protein ?? "") ? dish.data.protein : "veg") as Protein,
              plate: plateFromInvented(dish.data.name, dish.data.steps),
              tags: [],
              ingredients: dish.data.ingredients as Recipe["ingredients"],
              steps: dish.data.steps,
            });
            days.push({ date: d.date, dish: { ...dish.data, name: dish.data.name.trim(), steps } });
          }
        }
      }
      const covered = new Set(days.map((d) => d.date));
      for (const date of data.days) {
        if (covered.has(date)) continue;
        const fallback = data.recipes.find((r) => !used.has(r.id));
        if (!fallback) continue;
        days.push({ date, recipeId: fallback.id });
        used.add(fallback.id);
      }
      if (days.length === 0) {
        return { ok: false as const, error: "No matching recipes came back. Try a broader request." };
      }
      const ok: ChefOk = {
        ok: true as const,
        days,
        note: typeof parsed.note === "string" ? parsed.note.slice(0, 180) : "",
      };
      void writeChefCache(key, ok);
      return ok;
    } catch {
      return { ok: false as const, error: "The chef's notes were scrambled. Try again." };
    }
  });
