import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { localSubs } from "./substitutions";

async function grokJson(system: string, user: unknown, maxTokens = 700) {
  const { kitchenJson } = await import("./kitchen-llm.server");
  return kitchenJson(system, user, maxTokens);
}

export const scanPantryPhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        image: z.string().min(40).max(1_500_000),
        hint: z.enum(["pantry", "counter"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const scene =
      data.hint === "counter"
        ? "This is ingredients gathered on a counter, not a full pantry."
        : "This is a pantry, fridge, or cupboard photo.";
    const result = await grokJson(
      `Identify every distinct food ingredient in the photo. ${scene} Use common grocery names. JSON only: {"items":["name"]}. Empty list if no food.`,
      [
        { type: "text", text: "What food is in this photo?" },
        { type: "image_url", image_url: { url: data.image } },
      ],
      400,
    );
    if (!result.ok) return result;
    const items = Array.isArray((result.json as { items?: unknown }).items)
      ? (result.json as { items: unknown[] }).items
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 40)
      : [];
    return { ok: true as const, items };
  });

export const suggestMealsFromPantry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        items: z.array(z.string()).max(40),
        catalog: z.array(z.string()).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const result = await grokJson(
      'Suggest 4 realistic dinners from the pantry. Prefer catalog titles when they fit. JSON only: {"ideas":[{"title":"","why":"","have":[""],"need":[""],"minutes":30}]}',
      `Pantry: ${data.items.join(", ")}\nCatalog titles: ${(data.catalog ?? []).join("; ")}`,
      800,
    );
    if (!result.ok) return result;
    const ideas = Array.isArray((result.json as { ideas?: unknown }).ideas)
      ? (result.json as { ideas: unknown[] }).ideas
          .map((raw) => {
            const x = raw as Record<string, unknown>;
            return {
              title: String(x.title ?? "").slice(0, 80),
              why: String(x.why ?? "").slice(0, 180),
              have: Array.isArray(x.have) ? x.have.map(String).slice(0, 20) : [],
              need: Array.isArray(x.need) ? x.need.map(String).slice(0, 16) : [],
              minutes: Number(x.minutes) || 30,
            };
          })
          .filter((i) => i.title)
          .slice(0, 4)
      : [];
    return { ok: true as const, ideas };
  });

export const suggestSubstitutes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        missing: z.string().min(1).max(80),
        pantry: z.array(z.string()).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const local = localSubs(data.missing);
    const result = await grokJson(
      'Give up to 3 kitchen substitutions. JSON only: {"options":[{"name":"","note":""}]}',
      `Missing: ${data.missing}. Pantry: ${data.pantry.join(", ") || "unknown"}. Prefer pantry items.`,
      300,
    );
    let options = local;
    if (result.ok) {
      const extra = Array.isArray((result.json as { options?: unknown }).options)
        ? (result.json as { options: { name?: string; note?: string }[] }).options
            .map((o) => ({
              name: String(o.name ?? "").slice(0, 60),
              note: String(o.note ?? "").slice(0, 120),
            }))
            .filter((o) => o.name)
        : [];
      const seen = new Set(options.map((o) => o.name.toLowerCase()));
      for (const o of extra) {
        if (!seen.has(o.name.toLowerCase())) options = [...options, o];
      }
    }
    return { ok: true as const, options: options.slice(0, 4) };
  });

export const lookupDish = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ query: z.string().min(2).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const result = await grokJson(
      'Return one homemade recipe for this dish name or slang. JSON only: {"name":"","description":"","minutes":30,"servings":4,"cuisine":"","aliases":[""],"ingredients":[{"name":"","qty":1,"unit":"","aisle":"Produce"}],"steps":[""],"nutrition":{"cal":0,"protein":0,"carbs":0,"fat":0}}. Aisle must be one of Produce, Meat & Seafood, Dairy & Eggs, Pantry, Bakery, Frozen, Herbs & Spices, Other. Nutrition is per serving, integers, estimated from typical USDA FoodData Central values.',
      data.query,
      900,
    );
    if (!result.ok) return result;
    const x = result.json as Record<string, unknown>;
    const name = String(x.name ?? "").trim();
    if (!name) return { ok: false as const, error: "No recipe came back. Try another name." };
    const ingredients = Array.isArray(x.ingredients)
      ? (x.ingredients as Record<string, unknown>[]).map((ing) => ({
          name: String(ing.name ?? "item"),
          qty: Number(ing.qty) || 1,
          unit: String(ing.unit ?? ""),
          aisle: String(ing.aisle ?? "Other"),
        }))
      : [];
    const steps = Array.isArray(x.steps) ? x.steps.map(String).slice(0, 12) : [];
    return {
      ok: true as const,
      recipe: {
        name: name.slice(0, 80),
        description: String(x.description ?? "").slice(0, 200),
        minutes: Number(x.minutes) || 30,
        servings: Number(x.servings) || 4,
        cuisine: String(x.cuisine ?? "Homestyle").slice(0, 40),
        aliases: Array.isArray(x.aliases) ? x.aliases.map(String).slice(0, 8) : [],
        ingredients: ingredients.slice(0, 24),
        steps,
        nutrition: {
          cal: Math.max(0, Math.round(Number((x.nutrition as { cal?: number } | undefined)?.cal) || 0)),
          protein: Math.max(0, Math.round(Number((x.nutrition as { protein?: number } | undefined)?.protein) || 0)),
          carbs: Math.max(0, Math.round(Number((x.nutrition as { carbs?: number } | undefined)?.carbs) || 0)),
          fat: Math.max(0, Math.round(Number((x.nutrition as { fat?: number } | undefined)?.fat) || 0)),
        },
      },
    };
  });
