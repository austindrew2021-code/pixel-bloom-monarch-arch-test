import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Plate } from "./plate-wzIIVGuN.mjs";
import { It as useSpoonful, Ot as resolveMeal, St as rankProgress, Y as isoDate, dt as nutritionForDate, j as formatMinutes, w as dayFuel } from "./format-Bogk4A6f.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watch-DxnNzNI_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WatchFace() {
	const meals = useSpoonful((s) => s.meals);
	const goal = useSpoonful((s) => s.goal);
	const workouts = useSpoonful((s) => s.workouts);
	const stepsByDate = useSpoonful((s) => s.stepsByDate);
	const snacks = useSpoonful((s) => s.snacks);
	const xp = useSpoonful((s) => s.xp);
	const onboarded = useSpoonful((s) => s.onboarded);
	const body = useSpoonful((s) => s.body);
	(0, import_react.useEffect)(() => {
		const done = useSpoonful.persist.rehydrate();
		Promise.resolve(done).then(() => {
			const theme = useSpoonful.getState().theme;
			document.documentElement.dataset.theme = theme === "midnight" ? "midnight" : "paper";
		});
	}, []);
	const today = isoDate();
	const dinner = meals.find((m) => m.date === today && m.slot === "dinner");
	const resolved = dinner ? resolveMeal(dinner) : null;
	const fuel = dayFuel({
		goal,
		eaten: nutritionForDate(meals, today, snacks),
		workouts: workouts.filter((w) => w.date === today),
		steps: stepsByDate[today] ?? 0,
		body
	});
	const rank = rankProgress(xp);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-6 text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.18em] text-spark",
				children: "Watch face"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-center text-xs text-muted-foreground",
				children: "Apple Watch · Wear OS · phone"
			}),
			!onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-center text-sm text-muted-foreground",
				children: "Open Spoonful on your phone and plate tonight first."
			}) : resolved && !resolved.skip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
					kind: resolved.recipe?.plate ?? "bowl",
					size: "lg",
					className: "mt-4"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 text-center font-display text-3xl leading-tight",
					children: resolved.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: formatMinutes(resolved.minutes)
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 text-center font-display text-3xl",
				children: "Nothing plated"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 font-display text-2xl tabular-nums",
				children: Math.round(fuel.remaining.cal)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"kcal left · ",
					fuel.remaining.protein,
					"g protein"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm font-medium",
				children: rank.current.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/",
				className: "mt-6 text-sm text-spark",
				children: "Open kitchen"
			})
		]
	});
}
//#endregion
export { WatchFace as component };
