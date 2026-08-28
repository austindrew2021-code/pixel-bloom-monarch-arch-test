import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-chef-XZ61Q3bn.js
var AISLES = [
	"Produce",
	"Meat & Seafood",
	"Dairy & Eggs",
	"Pantry",
	"Bakery",
	"Frozen",
	"Herbs & Spices",
	"Other"
];
var dishSchema = object({
	name: string(),
	minutes: number(),
	description: string().optional(),
	protein: string().optional(),
	ingredients: array(object({
		name: string(),
		qty: number(),
		unit: string(),
		aisle: string()
	})),
	steps: array(string()),
	nutrition: object({
		cal: number(),
		protein: number(),
		carbs: number(),
		fat: number()
	})
});
var inputSchema = object({
	prompt: string().min(1).max(500),
	days: array(string()),
	household: number().min(1).max(8),
	invent: boolean().optional(),
	allergies: array(string()).optional(),
	prefs: array(string()).optional(),
	remaining: object({
		cal: number(),
		protein: number(),
		carbs: number(),
		fat: number()
	}).optional(),
	body: object({
		kcal: number(),
		protein: number(),
		weightKg: number().optional()
	}).optional(),
	recipes: array(object({
		id: string(),
		name: string(),
		minutes: number(),
		protein: string(),
		tags: array(string())
	})),
	scope: _enum(["week", "tonight"]).optional()
});
var planWeekWithChef_createServerFn_handler = createServerRpc({
	id: "c7c1a422e30dc9d469f456d9891ef85eae97e00101c5835da278eaf5d1582df5",
	name: "planWeekWithChef",
	filename: "src/lib/ai-chef.ts"
}, (opts) => planWeekWithChef.__executeServer(opts));
var planWeekWithChef = createServerFn({ method: "POST" }).validator((input) => inputSchema.parse(input)).handler(planWeekWithChef_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI Chef is unavailable right now."
	};
	const catalog = data.recipes.slice(0, 80).map((r) => `${r.id} | ${r.name} | ${r.minutes}m | ${r.protein} | ${r.tags.join(",")}`).join("\n");
	const invent = Boolean(data.invent);
	const tonight = data.scope === "tonight" || data.days.length === 1;
	const system = invent ? tonight ? `You are Spoonful's executive chef. Invent ONE real homemade dish from anywhere on earth that matches the request — any country, grandmother food, restaurant food cooked at home. Do not limit yourself to the catalog. Honor allergies as hard bans. Hit the remaining protein and calories as closely as a home cook can. Nutrition per serving from typical USDA FoodData Central values, integers. JSON only: {"days":[{"date":"YYYY-MM-DD","dish":{"name":"","minutes":30,"description":"why this plate","protein":"chicken","ingredients":[{"name":"","qty":1,"unit":"","aisle":"Produce"}],"steps":["..."],"nutrition":{"cal":0,"protein":0,"carbs":0,"fat":0}}}],"note":"one short sentence"}. Ingredients ≤12, steps ≤8.` : `You are Spoonful's executive chef. You may pick a catalog id OR invent any real homemade dish from anywhere in the world — Japan, Peru, Senegal, Georgia, Korea, the Maritimes, grandmother food, restaurant food cooked at home. Never invent a catalog id. Honor allergies as hard bans. Match the eater's remaining protein/calories when given. Nutrition must be per serving, estimated from typical USDA FoodData Central values, integers. JSON only: {"days":[{"date":"YYYY-MM-DD","recipeId":"optional-catalog-id","dish":{"name":"","minutes":30,"description":"","protein":"chicken","ingredients":[{"name":"","qty":1,"unit":"","aisle":"Produce"}],"steps":["..."],"nutrition":{"cal":0,"protein":0,"carbs":0,"fat":0}}}],"note":"one short sentence"}. Cover every date. Prefer inventing when the catalog cannot meet the request. Keep ingredients ≤12 and steps ≤6.` : `You are Spoonful's kitchen planner. Pick dinner recipes from the catalog only. Never invent ids. Avoid repeating the same protein two nights in a row when possible. Reply with JSON only: {"days":[{"date":"YYYY-MM-DD","recipeId":"id"}],"note":"one short sentence"}. Cover every date given.`;
	const user = [
		`Household of ${data.household}.`,
		`Dates: ${data.days.join(", ")}.`,
		data.allergies?.length ? `Allergies (never use): ${data.allergies.join(", ")}.` : "",
		data.prefs?.length ? `Prefs: ${data.prefs.join(", ")}.` : "",
		data.body ? `Daily target ~${data.body.kcal} kcal, ${data.body.protein}g protein.` : "",
		data.remaining ? `Tonight still needs about ${data.remaining.protein}g protein and ${data.remaining.cal} kcal.` : "",
		`Request: ${data.prompt}`,
		invent ? "Catalog (optional picks):" : "Catalog:",
		catalog
	].filter(Boolean).join("\n");
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: invent ? tonight ? 1200 : 2200 : 700,
			temperature: invent ? .7 : .6,
			response_format: { type: "json_object" },
			messages: [{
				role: "system",
				content: system
			}, {
				role: "user",
				content: user
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: "The chef could not reach the kitchen. Try again."
	};
	const match = ((await res.json()).choices[0]?.message.content ?? "").match(/\{[\s\S]*\}/);
	if (!match) return {
		ok: false,
		error: "The chef answered in a language we could not plate."
	};
	try {
		const parsed = JSON.parse(match[0]);
		const allowed = new Set(data.recipes.map((r) => r.id));
		const days = [];
		for (const d of parsed.days ?? []) {
			if (!data.days.includes(d.date)) continue;
			if (d.recipeId && allowed.has(d.recipeId)) {
				days.push({
					date: d.date,
					recipeId: d.recipeId
				});
				continue;
			}
			if (invent && d.dish) {
				const dish = dishSchema.safeParse({
					...d.dish,
					ingredients: Array.isArray(d.dish.ingredients) ? d.dish.ingredients.map((ing) => ({
						...ing,
						aisle: AISLES.includes(ing.aisle) ? ing.aisle : "Other"
					})) : []
				});
				if (dish.success) days.push({
					date: d.date,
					dish: dish.data
				});
			}
		}
		if (days.length === 0) return {
			ok: false,
			error: "No matching recipes came back. Try a broader request."
		};
		return {
			ok: true,
			days,
			note: typeof parsed.note === "string" ? parsed.note.slice(0, 180) : ""
		};
	} catch {
		return {
			ok: false,
			error: "The chef's notes were scrambled. Try again."
		};
	}
});
//#endregion
export { planWeekWithChef_createServerFn_handler };
