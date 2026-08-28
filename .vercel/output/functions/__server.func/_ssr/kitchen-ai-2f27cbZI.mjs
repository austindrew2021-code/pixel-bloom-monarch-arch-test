import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { cn as _enum, gn as object, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { t as authMiddleware } from "./middleware-CqXj4VIy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kitchen-ai-2f27cbZI.js
var TABLE = {
	buttermilk: [{
		name: "milk + vinegar",
		note: "1 cup milk + 1 tbsp vinegar, rest 5 minutes"
	}, {
		name: "yogurt",
		note: "Thin with a splash of water"
	}],
	"heavy cream": [{
		name: "milk + butter",
		note: "¾ cup milk + ¼ cup melted butter"
	}, {
		name: "evaporated milk",
		note: "Use 1:1 in sauces"
	}],
	egg: [{
		name: "flax egg",
		note: "1 tbsp ground flax + 3 tbsp water"
	}, {
		name: "mashed banana",
		note: "¼ cup per egg in baking"
	}],
	butter: [{
		name: "olive oil",
		note: "Use ¾ the amount in savory cooking"
	}, {
		name: "ghee",
		note: "1:1"
	}],
	"sour cream": [{
		name: "Greek yogurt",
		note: "1:1"
	}, {
		name: "crème fraîche",
		note: "1:1"
	}],
	shallot: [{
		name: "onion",
		note: "Use a little less; milder if you rinse"
	}],
	"fresh herbs": [{
		name: "dried herbs",
		note: "Use ⅓ the amount"
	}],
	wine: [{
		name: "stock + splash of vinegar",
		note: "For deglazing"
	}, {
		name: "grape juice + vinegar",
		note: "Non-alcoholic"
	}],
	"chicken broth": [{
		name: "vegetable broth",
		note: "1:1"
	}, {
		name: "bouillon + water",
		note: "Follow the jar"
	}],
	"salt beef": [{
		name: "corned beef",
		note: "Close cousin; still soak"
	}],
	"salt pork": [{
		name: "bacon",
		note: "For scrunchions, chop and fry"
	}],
	"hard bread": [{
		name: "stale hardtack or ship's biscuit",
		note: "Soak well"
	}],
	pecorino: [{
		name: "parmesan",
		note: "A bit milder and less salty"
	}],
	guanciale: [{
		name: "pancetta",
		note: "Classic stand-in"
	}, {
		name: "thick bacon",
		note: "Pat off extra smoke"
	}],
	"scotch bonnet": [{
		name: "habanero",
		note: "Same heat family; use less"
	}],
	tamarind: [{
		name: "lime + brown sugar",
		note: "Sour-sweet approximation"
	}],
	tahini: [{
		name: "peanut butter",
		note: "Different, but creamy and nutty"
	}],
	"coconut milk": [{
		name: "cream + a drop of coconut extract",
		note: "If you must"
	}],
	eggplant: [{
		name: "zucchini",
		note: "For moussaka layers, salt first"
	}],
	phyllo: [{
		name: "puff pastry",
		note: "Heavier, still crisp"
	}],
	cod: [{
		name: "haddock",
		note: "1:1"
	}, {
		name: "pollock",
		note: "1:1"
	}],
	mozzarella: [{
		name: "provolone",
		note: "Melts well"
	}],
	"ground beef": [{
		name: "ground turkey",
		note: "A little drier; add oil"
	}, {
		name: "lentils",
		note: "For sauce and chili"
	}],
	pancetta: [{
		name: "thick bacon",
		note: "Pat off extra smoke"
	}],
	"gochujang": [{
		name: "sriracha + miso",
		note: "Heat plus fermented depth"
	}],
	"fish sauce": [{
		name: "soy sauce + pinch of salt",
		note: "Missing the funk, still salty"
	}],
	"paneer": [{
		name: "firm tofu",
		note: "Press well, fry first"
	}],
	"cheese curds": [{
		name: "torn mozzarella",
		note: "Won't squeak, still melts"
	}],
	"andouille sausage": [{
		name: "smoked sausage",
		note: "Add extra paprika"
	}],
	"arborio rice": [{
		name: "short-grain rice",
		note: "Stir a little more"
	}]
};
function localSubs(ingredient) {
	const n = ingredient.toLowerCase();
	for (const [key, opts] of Object.entries(TABLE)) if (n.includes(key) || key.includes(n)) return opts;
	return [];
}
async function grokJson(system, user, maxTokens = 700) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Kitchen AI is unavailable right now."
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: maxTokens,
			temperature: .4,
			response_format: { type: "json_object" },
			messages: [{
				role: "system",
				content: system
			}, typeof user === "string" ? {
				role: "user",
				content: user
			} : {
				role: "user",
				content: user
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: "The kitchen could not answer. Try again."
	};
	const match = ((await res.json()).choices[0]?.message.content ?? "").match(/\{[\s\S]*\}|\[[\s\S]*\]/);
	if (!match) return {
		ok: false,
		error: "Could not read the reply."
	};
	try {
		return {
			ok: true,
			json: JSON.parse(match[0])
		};
	} catch {
		return {
			ok: false,
			error: "Could not read the reply."
		};
	}
}
var scanPantryPhoto_createServerFn_handler = createServerRpc({
	id: "8f192f59b71dd4157771b48abf9365086ede9a05d94379ab00e89a8fc287fc8e",
	name: "scanPantryPhoto",
	filename: "src/lib/kitchen-ai.ts"
}, (opts) => scanPantryPhoto.__executeServer(opts));
var scanPantryPhoto = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	image: string().min(40).max(15e5),
	hint: _enum(["pantry", "counter"]).optional()
}).parse(input)).handler(scanPantryPhoto_createServerFn_handler, async ({ data }) => {
	const result = await grokJson(`Identify every distinct food ingredient in the photo. ${data.hint === "counter" ? "This is ingredients gathered on a counter, not a full pantry." : "This is a pantry, fridge, or cupboard photo."} Use common grocery names. JSON only: {"items":["name"]}. Empty list if no food.`, [{
		type: "text",
		text: "What food is in this photo?"
	}, {
		type: "image_url",
		image_url: { url: data.image }
	}], 400);
	if (!result.ok) return result;
	return {
		ok: true,
		items: Array.isArray(result.json.items) ? result.json.items.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean).slice(0, 40) : []
	};
});
var suggestMealsFromPantry_createServerFn_handler = createServerRpc({
	id: "5388a7a3100aea6c4640e326b36c4d47c0b03937f7540207e987be464907dc59",
	name: "suggestMealsFromPantry",
	filename: "src/lib/kitchen-ai.ts"
}, (opts) => suggestMealsFromPantry.__executeServer(opts));
var suggestMealsFromPantry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	items: array(string()).max(40),
	catalog: array(string()).max(80).optional()
}).parse(input)).handler(suggestMealsFromPantry_createServerFn_handler, async ({ data }) => {
	const result = await grokJson("Suggest 4 realistic dinners from the pantry. Prefer catalog titles when they fit. JSON only: {\"ideas\":[{\"title\":\"\",\"why\":\"\",\"have\":[\"\"],\"need\":[\"\"],\"minutes\":30}]}", `Pantry: ${data.items.join(", ")}\nCatalog titles: ${(data.catalog ?? []).join("; ")}`, 800);
	if (!result.ok) return result;
	return {
		ok: true,
		ideas: Array.isArray(result.json.ideas) ? result.json.ideas.map((raw) => {
			const x = raw;
			return {
				title: String(x.title ?? "").slice(0, 80),
				why: String(x.why ?? "").slice(0, 180),
				have: Array.isArray(x.have) ? x.have.map(String).slice(0, 20) : [],
				need: Array.isArray(x.need) ? x.need.map(String).slice(0, 16) : [],
				minutes: Number(x.minutes) || 30
			};
		}).filter((i) => i.title).slice(0, 4) : []
	};
});
var suggestSubstitutes_createServerFn_handler = createServerRpc({
	id: "971386946c24bff1bb9e1c04be4f4b45e259ada213d25eff51bc2cd9988b7106",
	name: "suggestSubstitutes",
	filename: "src/lib/kitchen-ai.ts"
}, (opts) => suggestSubstitutes.__executeServer(opts));
var suggestSubstitutes = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	missing: string().min(1).max(80),
	pantry: array(string()).max(40)
}).parse(input)).handler(suggestSubstitutes_createServerFn_handler, async ({ data }) => {
	const local = localSubs(data.missing);
	const result = await grokJson("Give up to 3 kitchen substitutions. JSON only: {\"options\":[{\"name\":\"\",\"note\":\"\"}]}", `Missing: ${data.missing}. Pantry: ${data.pantry.join(", ") || "unknown"}. Prefer pantry items.`, 300);
	let options = local;
	if (result.ok) {
		const extra = Array.isArray(result.json.options) ? result.json.options.map((o) => ({
			name: String(o.name ?? "").slice(0, 60),
			note: String(o.note ?? "").slice(0, 120)
		})).filter((o) => o.name) : [];
		const seen = new Set(options.map((o) => o.name.toLowerCase()));
		for (const o of extra) if (!seen.has(o.name.toLowerCase())) options = [...options, o];
	}
	return {
		ok: true,
		options: options.slice(0, 4)
	};
});
var lookupDish_createServerFn_handler = createServerRpc({
	id: "83479df1b1130146edf7a73c6abf68634895a774d2db0b7fe68ab37e94dcb213",
	name: "lookupDish",
	filename: "src/lib/kitchen-ai.ts"
}, (opts) => lookupDish.__executeServer(opts));
var lookupDish = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ query: string().min(2).max(80) }).parse(input)).handler(lookupDish_createServerFn_handler, async ({ data }) => {
	const result = await grokJson("Return one homemade recipe for this dish name or slang. JSON only: {\"name\":\"\",\"description\":\"\",\"minutes\":30,\"servings\":4,\"cuisine\":\"\",\"aliases\":[\"\"],\"ingredients\":[{\"name\":\"\",\"qty\":1,\"unit\":\"\",\"aisle\":\"Produce\"}],\"steps\":[\"\"],\"nutrition\":{\"cal\":0,\"protein\":0,\"carbs\":0,\"fat\":0}}. Aisle must be one of Produce, Meat & Seafood, Dairy & Eggs, Pantry, Bakery, Frozen, Herbs & Spices, Other. Nutrition is per serving, integers, estimated from typical USDA FoodData Central values.", data.query, 900);
	if (!result.ok) return result;
	const x = result.json;
	const name = String(x.name ?? "").trim();
	if (!name) return {
		ok: false,
		error: "No recipe came back. Try another name."
	};
	const ingredients = Array.isArray(x.ingredients) ? x.ingredients.map((ing) => ({
		name: String(ing.name ?? "item"),
		qty: Number(ing.qty) || 1,
		unit: String(ing.unit ?? ""),
		aisle: String(ing.aisle ?? "Other")
	})) : [];
	const steps = Array.isArray(x.steps) ? x.steps.map(String).slice(0, 12) : [];
	return {
		ok: true,
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
				cal: Math.max(0, Math.round(Number(x.nutrition?.cal) || 0)),
				protein: Math.max(0, Math.round(Number(x.nutrition?.protein) || 0)),
				carbs: Math.max(0, Math.round(Number(x.nutrition?.carbs) || 0)),
				fat: Math.max(0, Math.round(Number(x.nutrition?.fat) || 0))
			}
		}
	};
});
//#endregion
export { lookupDish_createServerFn_handler, scanPantryPhoto_createServerFn_handler, suggestMealsFromPantry_createServerFn_handler, suggestSubstitutes_createServerFn_handler };
