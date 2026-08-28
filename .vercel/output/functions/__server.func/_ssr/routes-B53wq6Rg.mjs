import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as signOut, t as authClient } from "./client-B40BzJxt.mjs";
import { t as authMiddleware } from "./middleware-CqXj4VIy.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Plate } from "./plate-wzIIVGuN.mjs";
import { n as KitchenHero, r as Wordmark, t as Button } from "./kitchen-hero-BEYGE1zq.mjs";
import { A as Heart, B as Check, C as Moon, D as Lock, E as MessageCircle, F as Droplets, G as Bell, H as CalendarDays, I as Dices, K as BellOff, L as Copy, M as Footprints, N as Flame, O as Leaf, P as Dumbbell, R as ChevronRight, S as Pause, T as Mic, V as Camera, W as BookOpen, _ as Refrigerator, a as Volume2, b as Play, d as Sun, f as Sparkles, g as Search, h as ShoppingBag, i as VolumeX, j as HeartPulse, k as History, l as Trash2, m as ShoppingBasket, n as Watch, o as UtensilsCrossed, p as Smartphone, q as Ban, r as WandSparkles, t as X, u as Timer, v as RefreshCw, w as Minus, x as Pencil, y as Plus, z as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { $ as leaveKitchen, A as formatHeight, At as sessionSetCount, B as isDessert, Bt as weekPulse, C as cuisineBar, Ct as recipeAllergens, D as enablePush, Dt as recoveryLabel, E as dietFlags, Et as recipeSafe, F as groceryForWeek, Ft as unlockedRecipes, G as isSauceLike, H as isHealthy, I as healthAdvice, It as useSpoonful, J as isVegetarian, K as isSugarFree, L as isBreakfast, Lt as weekDates, M as formatPrice, Mt as shiftWeek, N as formatQty, Nt as skipTitle, O as epley1rm, Ot as resolveMeal, P as formatWeight, Pt as tdeeKcal, Q as lbFromKg, R as isComfort, Rt as weekHeading, S as createSsrRpc, St as rankProgress, T as dayLabel, Tt as recipeById, U as isHighProtein, V as isGlutenFree, Vt as workoutKcal, W as isKeto, X as joinKitchen, Y as isoDate, Z as kgFromLb, _ as applyHealthToFuel, _t as previousLine, a as DEFAULT_BODY, at as menuById, b as cookStreak, bt as rankForFuel, c as LIFT_TEMPLATES, ct as msUntilHour, d as RANKS, dt as nutritionForDate, et as lineVolumeKg, f as RECIPES, ft as packLabel, g as WORKOUTS, gt as postKitchenEvent, h as SNACKS, ht as platesPerSide, i as ALLERGIES, it as matchesDiet, j as formatMinutes, jt as sessionVolumeKg, k as formatElapsed, kt as scaleQty, l as MILESTONES, lt as myKitchen, m as SAUCE_RECIPES, mt as plannedForWeek, n as ADDONS, nt as listKitchenMembers, o as GOAL_KINDS, ot as mondayOf, p as REST_PRESETS, pt as pct, q as isVegan, r as AISLE_ORDER, rt as macrosFromBody, s as LIFT_MOVES, st as moveById, t as ACTIVITY, tt as listKitchenEvents, u as NAV_MENUS, ut as normalizePins, v as bestEpley, vt as proteinDot, w as dayFuel, wt as recipeAllowed, x as createKitchen, xt as rankForXp, y as bmrKcal, yt as pushNote, z as isDairyFree, zt as weekPlanText } from "./format-Bogk4A6f.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B53wq6Rg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CelebrateOverlay() {
	const last = useSpoonful((s) => s.lastCelebrate);
	const clear = useSpoonful((s) => s.clearCelebrate);
	const prefs = useSpoonful((s) => s.notifyPrefs);
	(0, import_react.useEffect)(() => {
		if (!last) return;
		if (prefs.milestones) pushNote(last.title, last.body);
		const id = window.setTimeout(() => clear(), 3200);
		return () => window.clearTimeout(id);
	}, [
		last,
		clear,
		prefs.milestones
	]);
	if (!last) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none chrome-gutter fixed inset-x-0 top-[max(5.5rem,env(safe-area-inset-top))] z-50 flex justify-start pl-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "celebrate-pop w-full max-w-sm rounded-3xl bg-spark px-5 py-5 text-spark-foreground shadow-[var(--shadow-lift)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] opacity-80",
					children: "Milestone"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-3xl leading-tight",
					children: last.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed opacity-90",
					children: last.body
				})
			]
		})
	});
}
function parseStepSeconds(text) {
	const m = text.match(/(\d+)\s*(?:-|–|to\s+\d+\s*)?min/i);
	if (!m) return null;
	const n = Number(m[1]);
	if (!Number.isFinite(n) || n < 1 || n > 180) return null;
	return n * 60;
}
function clock(total) {
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
function CookView({ meal, onClose }) {
	const resolved = resolveMeal(meal);
	const recipe = resolved.recipe;
	const household = useSpoonful((s) => s.household);
	const markCooked = useSpoonful((s) => s.markCooked);
	const saveLeftovers = useSpoonful((s) => s.saveLeftovers);
	const steps = recipe?.steps ?? resolved.custom?.steps ?? (resolved.custom?.notes ? [resolved.custom.notes] : ["Cook it how you like."]);
	const ingredients = recipe?.ingredients ?? resolved.custom?.ingredients ?? [];
	const servings = recipe?.servings ?? household;
	const [step, setStep] = (0, import_react.useState)(0);
	const [have, setHave] = (0, import_react.useState)({});
	const [seconds, setSeconds] = (0, import_react.useState)(resolved.minutes * 60);
	const [ticking, setTicking] = (0, import_react.useState)(false);
	const [speaking, setSpeaking] = (0, import_react.useState)(false);
	const current = steps[step] ?? steps[0];
	const parsed = parseStepSeconds(current ?? "");
	const [stepLeft, setStepLeft] = (0, import_react.useState)(parsed);
	const [stepTicking, setStepTicking] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!ticking) return;
		const id = window.setInterval(() => {
			setSeconds((s) => Math.max(0, s - 1));
		}, 1e3);
		return () => window.clearInterval(id);
	}, [ticking]);
	(0, import_react.useEffect)(() => {
		const next = parseStepSeconds(current ?? "");
		setStepLeft(next);
		setStepTicking(false);
	}, [step, current]);
	(0, import_react.useEffect)(() => {
		if (!stepTicking) return;
		const id = window.setInterval(() => {
			setStepLeft((s) => s === null ? s : Math.max(0, s - 1));
		}, 1e3);
		return () => window.clearInterval(id);
	}, [stepTicking]);
	(0, import_react.useEffect)(() => {
		if (stepLeft !== 0 || !stepTicking) return;
		setStepTicking(false);
		toast("Step timer done");
	}, [stepLeft, stepTicking]);
	(0, import_react.useEffect)(() => {
		return () => window.speechSynthesis?.cancel();
	}, []);
	function speak() {
		const synth = window.speechSynthesis;
		if (!synth) {
			toast("Speaking is not on this device");
			return;
		}
		synth.cancel();
		const u = new SpeechSynthesisUtterance(`Step ${step + 1}. ${current}`);
		u.rate = .92;
		u.onend = () => setSpeaking(false);
		setSpeaking(true);
		synth.speak(u);
	}
	function stopSpeak() {
		window.speechSynthesis?.cancel();
		setSpeaking(false);
	}
	function finish() {
		stopSpeak();
		markCooked(meal.date);
		if (useSpoonful.getState().hasAddon("family")) postKitchenEvent({ data: {
			kind: "cooked",
			body: `cooked ${resolved.title}`,
			recipeName: resolved.title
		} }).catch(() => {});
		toast("Logged as cooked");
		onClose();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex flex-col bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: onClose,
						"aria-label": "Close cook mode",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-base font-medium",
							children: resolved.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: formatMinutes(resolved.minutes)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex size-11 items-center justify-center text-sm tabular-nums text-muted-foreground",
						children: [
							step + 1,
							"/",
							steps.length
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-center gap-2 px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl tabular-nums leading-none",
						children: clock(seconds)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon",
						"aria-label": ticking ? "Pause timer" : "Start timer",
						onClick: () => setTicking((t) => !t),
						children: ticking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon",
						"aria-label": speaking ? "Stop speaking" : "Speak this step",
						onClick: () => speaking ? stopSpeak() : speak(),
						children: speaking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {})
					})
				]
			}),
			stepLeft !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex items-center justify-center px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setStepTicking((v) => !v),
					className: cn("flex h-11 items-center gap-2 rounded-full px-4 text-sm", stepTicking ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-4" }),
						stepTicking ? "Pause step" : "This step",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: clock(stepLeft)
						})
					]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl leading-snug",
						"aria-live": "polite",
						children: current
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "Captions stay on. Speak uses your device voice — nothing is uploaded."
					}),
					step === 0 && ingredients.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
							children: ["On the board · for ", household]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-1",
							children: ingredients.map((ing, i) => {
								const on = Boolean(have[ing.name]);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setHave((h) => ({
										...h,
										[ing.name]: !h[ing.name]
									})),
									className: "flex min-h-12 w-full items-center gap-3 text-left",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("flex size-6 items-center justify-center rounded-md shadow-[var(--shadow-border)]", on && "bg-primary text-primary-foreground shadow-none"),
											children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : null
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("flex-1 text-base", on && "text-muted-foreground line-through"),
											children: ing.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm tabular-nums text-muted-foreground",
											children: formatQty(scaleQty(ing.qty, household, servings), ing.unit)
										})
									]
								}) }, `${ing.name}-${i}`);
							})
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						className: "flex-1",
						disabled: step === 0,
						onClick: () => {
							stopSpeak();
							setStep((s) => Math.max(0, s - 1));
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {}), "Back"]
					}), step < steps.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "spark",
						className: "flex-1",
						onClick: () => {
							stopSpeak();
							setStep((s) => s + 1);
						},
						children: ["Next", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "spark",
						className: "flex-1",
						onClick: finish,
						children: "I cooked this"
					})]
				}), step === steps.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "w-full",
					onClick: () => {
						const ok = saveLeftovers(meal.date);
						toast(ok ? "Leftovers become tomorrow’s lunch" : "No dinner to save");
						finish();
					},
					children: "Save leftovers for tomorrow"
				}) : null]
			})
		]
	});
}
/** Unique file per dish — every recipe has /food/{id}.jpg. */
var BY_ID = {
	"ak-salmon-chowder": "/food/ak-salmon-chowder.jpg",
	"al-white-bbq-chicken": "/food/al-white-bbq-chicken.jpg",
	"alabama-white-sauce": "/food/alabama-white-sauce.jpg",
	"alfredo-sauce": "/food/alfredo-sauce.jpg",
	"aloo-gobi": "/food/aloo-gobi.jpg",
	amatriciana: "/food/amatriciana.jpg",
	"american-goulash": "/food/american-goulash.jpg",
	"apple-crisp": "/food/apple-crisp.jpg",
	"ar-fried-catfish": "/food/ar-fried-catfish.jpg",
	avgolemono: "/food/avgolemono.jpg",
	"avocado-toast-egg": "/food/avocado-toast-egg.jpg",
	"az-navajo-tacos": "/food/az-navajo-tacos.jpg",
	"baked-oatmeal": "/food/baked-oatmeal.jpg",
	baklava: "/food/baklava.jpg",
	"bangers-mash": "/food/bangers-mash.jpg",
	"basil-pesto": "/food/basil-pesto.jpg",
	bearnaise: "/food/bearnaise.jpg",
	"beef-chili": "/food/beef-chili.jpg",
	"beef-stroganoff": "/food/beef-stroganoff.jpg",
	"beef-zucchini-skillet": "/food/beef-zucchini-skillet.jpg",
	bibimbap: "/food/bibimbap.jpg",
	"biscuits-gravy": "/food/biscuits-gravy.jpg",
	"black-bean-tacos": "/food/black-bean-tacos.jpg",
	"blueberry-grunt": "/food/blueberry-grunt.jpg",
	"blueberry-pancakes": "/food/blueberry-pancakes.jpg",
	"breakfast-burrito": "/food/breakfast-burrito.jpg",
	"breakfast-burritos": "/food/breakfast-burritos.jpg",
	"buffalo-sauce": "/food/buffalo-sauce.jpg",
	"butter-tarts": "/food/butter-tarts.jpg",
	"buttermilk-fried-chicken": "/food/buttermilk-fried-chicken.jpg",
	"ca-fish-tacos": "/food/ca-fish-tacos.jpg",
	"cabbage-rolls": "/food/cabbage-rolls.jpg",
	"cacio-e-pepe": "/food/cacio-e-pepe.jpg",
	"cajun-blackening-rub": "/food/cajun-blackening-rub.jpg",
	carbonara: "/food/carbonara.jpg",
	"carolina-vinegar-sauce": "/food/carolina-vinegar-sauce.jpg",
	"chana-masala": "/food/chana-masala.jpg",
	"chia-pudding": "/food/chia-pudding.jpg",
	"chicken-a-la-king": "/food/chicken-a-la-king.jpg",
	"chicken-dumplings": "/food/chicken-dumplings.jpg",
	"chicken-fricot": "/food/chicken-fricot.jpg",
	"chicken-paprikash": "/food/chicken-paprikash.jpg",
	"chicken-pot-pie": "/food/chicken-pot-pie.jpg",
	"chicken-rice-prep": "/food/chicken-rice-prep.jpg",
	"chicken-stir-fry": "/food/chicken-stir-fry.jpg",
	"chicken-tikka-masala": "/food/chicken-tikka-masala.jpg",
	"chicken-tortilla-soup": "/food/chicken-tortilla-soup.jpg",
	"chickpea-curry": "/food/chickpea-curry.jpg",
	chimichurri: "/food/chimichurri.jpg",
	"chip-cookies": "/food/chip-cookies.jpg",
	churros: "/food/churros.jpg",
	"classic-beef-stew": "/food/classic-beef-stew.jpg",
	"co-green-chile-stew": "/food/co-green-chile-stew.jpg",
	"cocktail-sauce": "/food/cocktail-sauce.jpg",
	"cod-au-gratin": "/food/cod-au-gratin.jpg",
	"coffee-cocoa-rub": "/food/coffee-cocoa-rub.jpg",
	colcannon: "/food/colcannon.jpg",
	"come-back-sauce": "/food/come-back-sauce.jpg",
	"coq-au-vin": "/food/coq-au-vin.jpg",
	"corned-beef-hash": "/food/corned-beef-hash.jpg",
	"cottage-egg-toast": "/food/cottage-egg-toast.jpg",
	"crispy-chickpea-wraps": "/food/crispy-chickpea-wraps.jpg",
	"croque-monsieur": "/food/croque-monsieur.jpg",
	"ct-white-clam-pizza": "/food/ct-white-clam-pizza.jpg",
	"dal-tadka": "/food/dal-tadka.jpg",
	"de-scrapple-breakfast": "/food/de-scrapple-breakfast.jpg",
	"donair-sauce-greco": "/food/donair-sauce-greco.jpg",
	"donair-sauce-mom-pop": "/food/donair-sauce-mom-pop.jpg",
	"donair-sauce-pizza-delight": "/food/donair-sauce-pizza-delight.jpg",
	"egg-fried-greens": "/food/egg-fried-greens.jpg",
	"eggplant-parm": "/food/eggplant-parm.jpg",
	"falafel-pita": "/food/falafel-pita.jpg",
	"fiddlehead-saute": "/food/fiddlehead-saute.jpg",
	"figgy-duff": "/food/figgy-duff.jpg",
	"fish-and-brewis": "/food/fish-and-brewis.jpg",
	"fl-key-lime-shrimp": "/food/fl-key-lime-shrimp.jpg",
	flan: "/food/flan.jpg",
	"french-onion": "/food/french-onion.jpg",
	"ga-peach-chicken": "/food/ga-peach-chicken.jpg",
	"garlic-aioli": "/food/garlic-aioli.jpg",
	gemista: "/food/gemista.jpg",
	"gochujang-glaze": "/food/gochujang-glaze.jpg",
	"grain-salad": "/food/grain-salad.jpg",
	"greek-bowls": "/food/greek-bowls.jpg",
	"greek-yogurt-chicken": "/food/greek-yogurt-chicken.jpg",
	gumbo: "/food/gumbo.jpg",
	"halifax-donair": "/food/halifax-donair.jpg",
	"ham-pea-pasta": "/food/ham-pea-pasta.jpg",
	harissa: "/food/harissa.jpg",
	"hi-loco-moco": "/food/hi-loco-moco.jpg",
	"hodge-podge": "/food/hodge-podge.jpg",
	hollandaise: "/food/hollandaise.jpg",
	"honey-garlic-shrimp": "/food/honey-garlic-shrimp.jpg",
	"honey-mustard": "/food/honey-mustard.jpg",
	horiatiki: "/food/horiatiki.jpg",
	"huevos-rancheros": "/food/huevos-rancheros.jpg",
	"ia-loose-meat": "/food/ia-loose-meat.jpg",
	"id-finger-steaks": "/food/id-finger-steaks.jpg",
	"il-italian-beef": "/food/il-italian-beef.jpg",
	"in-pork-tenderloin": "/food/in-pork-tenderloin.jpg",
	"irish-stew": "/food/irish-stew.jpg",
	jambalaya: "/food/jambalaya.jpg",
	"jerk-chicken": "/food/jerk-chicken.jpg",
	"jerk-dry-rub": "/food/jerk-dry-rub.jpg",
	"jiggs-dinner": "/food/jiggs-dinner.jpg",
	"kc-bbq-sauce": "/food/kc-bbq-sauce.jpg",
	kofta: "/food/kofta.jpg",
	"ks-burnt-ends": "/food/ks-burnt-ends.jpg",
	"kung-pao-chicken": "/food/kung-pao-chicken.jpg",
	"ky-hot-brown": "/food/ky-hot-brown.jpg",
	"la-red-beans-rice": "/food/la-red-beans-rice.jpg",
	"lasagna-bolognese": "/food/lasagna-bolognese.jpg",
	"lemon-garlic-chicken": "/food/lemon-garlic-chicken.jpg",
	"lemon-pepper-rub": "/food/lemon-pepper-rub.jpg",
	"lentil-soup": "/food/lentil-soup.jpg",
	"ma-clam-chowder": "/food/ma-clam-chowder.jpg",
	"malpeque-mussels": "/food/malpeque-mussels.jpg",
	"mango-sticky-rice": "/food/mango-sticky-rice.jpg",
	"mapo-tofu": "/food/mapo-tofu.jpg",
	marinara: "/food/marinara.jpg",
	"md-crab-cakes": "/food/md-crab-cakes.jpg",
	"me-lobster-roll": "/food/me-lobster-roll.jpg",
	meatloaf: "/food/meatloaf.jpg",
	"memphis-dry-rub": "/food/memphis-dry-rub.jpg",
	"mi-pasty": "/food/mi-pasty.jpg",
	"miso-butter-cod": "/food/miso-butter-cod.jpg",
	"mn-wild-rice-soup": "/food/mn-wild-rice-soup.jpg",
	"mo-toasted-ravioli": "/food/mo-toasted-ravioli.jpg",
	mojo: "/food/mojo.jpg",
	"molten-chocolate": "/food/molten-chocolate.jpg",
	"montreal-steak-spice": "/food/montreal-steak-spice.jpg",
	"moose-stew": "/food/moose-stew.jpg",
	moussaka: "/food/moussaka.jpg",
	"ms-come-back-shrimp": "/food/ms-come-back-shrimp.jpg",
	"mt-bison-skillet": "/food/mt-bison-skillet.jpg",
	muhammara: "/food/muhammara.jpg",
	mujadara: "/food/mujadara.jpg",
	"mushroom-risotto": "/food/mushroom-risotto.jpg",
	"nanaimo-bars": "/food/nanaimo-bars.jpg",
	"nc-vinegar-pork": "/food/nc-vinegar-pork.jpg",
	"nd-knoephla": "/food/nd-knoephla.jpg",
	"ne-runza": "/food/ne-runza.jpg",
	"nh-maple-pork": "/food/nh-maple-pork.jpg",
	"nj-pork-roll": "/food/nj-pork-roll.jpg",
	"nl-fish-cakes": "/food/nl-fish-cakes.jpg",
	"nm-stacked-enchiladas": "/food/nm-stacked-enchiladas.jpg",
	"ns-lobster-roll": "/food/ns-lobster-roll.jpg",
	"nuoc-cham": "/food/nuoc-cham.jpg",
	"nv-cowboy-ribeye": "/food/nv-cowboy-ribeye.jpg",
	"ny-chopped-cheese": "/food/ny-chopped-cheese.jpg",
	oatcakes: "/food/oatcakes.jpg",
	"oh-cincinnati-chili": "/food/oh-cincinnati-chili.jpg",
	"ok-chicken-fried-steak": "/food/ok-chicken-fried-steak.jpg",
	okonomiyaki: "/food/okonomiyaki.jpg",
	"or-marionberry-pork": "/food/or-marionberry-pork.jpg",
	"osso-buco": "/food/osso-buco.jpg",
	"overnight-oats": "/food/overnight-oats.jpg",
	"pa-cheesesteak": "/food/pa-cheesesteak.jpg",
	"pad-thai": "/food/pad-thai.jpg",
	paella: "/food/paella.jpg",
	"palak-paneer": "/food/palak-paneer.jpg",
	"pan-fried-cod": "/food/pan-fried-cod.jpg",
	pastitsio: "/food/pastitsio.jpg",
	"pea-soup-doughboys": "/food/pea-soup-doughboys.jpg",
	"peanut-noodles": "/food/peanut-noodles.jpg",
	"peanut-sauce": "/food/peanut-sauce.jpg",
	"pei-lobster-supper": "/food/pei-lobster-supper.jpg",
	"pei-potato-scallop": "/food/pei-potato-scallop.jpg",
	"peri-peri-sauce": "/food/peri-peri-sauce.jpg",
	"pesto-gnocchi": "/food/pesto-gnocchi.jpg",
	"pho-bo": "/food/pho-bo.jpg",
	pierogi: "/food/pierogi.jpg",
	ployes: "/food/ployes.jpg",
	ponzu: "/food/ponzu.jpg",
	"porcupine-meatballs": "/food/porcupine-meatballs.jpg",
	"pork-chops-apples": "/food/pork-chops-apples.jpg",
	potstickers: "/food/potstickers.jpg",
	poutine: "/food/poutine.jpg",
	"poutine-gravy": "/food/poutine-gravy.jpg",
	"poutine-rapee": "/food/poutine-rapee.jpg",
	"pozole-rojo": "/food/pozole-rojo.jpg",
	"pulled-pork": "/food/pulled-pork.jpg",
	puttanesca: "/food/puttanesca.jpg",
	"quiche-lorraine": "/food/quiche-lorraine.jpg",
	"ranch-dressing": "/food/ranch-dressing.jpg",
	"rappie-pie": "/food/rappie-pie.jpg",
	ratatouille: "/food/ratatouille.jpg",
	"red-beans-rice": "/food/red-beans-rice.jpg",
	"ri-stuffies": "/food/ri-stuffies.jpg",
	"rice-and-peas": "/food/rice-and-peas.jpg",
	romesco: "/food/romesco.jpg",
	"salisbury-steak": "/food/salisbury-steak.jpg",
	"salmon-asparagus": "/food/salmon-asparagus.jpg",
	"salmon-bagel": "/food/salmon-bagel.jpg",
	"salmon-quinoa": "/food/salmon-quinoa.jpg",
	"salsa-verde": "/food/salsa-verde.jpg",
	"sausage-peppers": "/food/sausage-peppers.jpg",
	"sc-shrimp-grits": "/food/sc-shrimp-grits.jpg",
	"scalloped-ham": "/food/scalloped-ham.jpg",
	schnitzel: "/food/schnitzel.jpg",
	"sd-chislic": "/food/sd-chislic.jpg",
	"sesame-soba": "/food/sesame-soba.jpg",
	shakshuka: "/food/shakshuka.jpg",
	"shakshuka-pepper": "/food/shakshuka-pepper.jpg",
	"shepherds-pie": "/food/shepherds-pie.jpg",
	"shrimp-cauliflower": "/food/shrimp-cauliflower.jpg",
	"sloppy-joes": "/food/sloppy-joes.jpg",
	souvlaki: "/food/souvlaki.jpg",
	"spaghetti-meatballs": "/food/spaghetti-meatballs.jpg",
	spanakopita: "/food/spanakopita.jpg",
	"spanish-tortilla": "/food/spanish-tortilla.jpg",
	"steak-chimichurri": "/food/steak-chimichurri.jpg",
	"steel-cut-porridge": "/food/steel-cut-porridge.jpg",
	"stovetop-mac": "/food/stovetop-mac.jpg",
	"stuffed-peppers": "/food/stuffed-peppers.jpg",
	"sunday-pot-roast": "/food/sunday-pot-roast.jpg",
	"swedish-meatballs": "/food/swedish-meatballs.jpg",
	"sweet-chili-sauce": "/food/sweet-chili-sauce.jpg",
	"sweet-sour-sauce": "/food/sweet-sour-sauce.jpg",
	"tacos-al-pastor": "/food/tacos-al-pastor.jpg",
	"tartar-sauce": "/food/tartar-sauce.jpg",
	"tater-tot-hotdish": "/food/tater-tot-hotdish.jpg",
	"teriyaki-sauce": "/food/teriyaki-sauce.jpg",
	"texas-brisket-rub": "/food/texas-brisket-rub.jpg",
	"thai-green-curry": "/food/thai-green-curry.jpg",
	tiramisu: "/food/tiramisu.jpg",
	"tn-hot-chicken": "/food/tn-hot-chicken.jpg",
	"toad-in-hole": "/food/toad-in-hole.jpg",
	"tofu-power-bowls": "/food/tofu-power-bowls.jpg",
	"tomato-basil-pasta": "/food/tomato-basil-pasta.jpg",
	toum: "/food/toum.jpg",
	tourtiere: "/food/tourtiere.jpg",
	toutons: "/food/toutons.jpg",
	"tuna-casserole": "/food/tuna-casserole.jpg",
	"tuna-melt": "/food/tuna-melt.jpg",
	"tuna-white-bean": "/food/tuna-white-bean.jpg",
	"turkey-chili-bowl": "/food/turkey-chili-bowl.jpg",
	"turkey-meatballs": "/food/turkey-meatballs.jpg",
	"turkey-taco-skillet": "/food/turkey-taco-skillet.jpg",
	"tx-oven-brisket": "/food/tx-oven-brisket.jpg",
	tzatziki: "/food/tzatziki.jpg",
	"ut-funeral-potatoes": "/food/ut-funeral-potatoes.jpg",
	"va-peanut-soup": "/food/va-peanut-soup.jpg",
	"veg-minestrone": "/food/veg-minestrone.jpg",
	"veggie-fried-rice": "/food/veggie-fried-rice.jpg",
	"veggie-omelette": "/food/veggie-omelette.jpg",
	"vt-maple-mac": "/food/vt-maple-mac.jpg",
	"wa-cedar-salmon": "/food/wa-cedar-salmon.jpg",
	"weeknight-mole": "/food/weeknight-mole.jpg",
	"welsh-rarebit": "/food/welsh-rarebit.jpg",
	"wi-beer-brats": "/food/wi-beer-brats.jpg",
	"wv-pepperoni-rolls": "/food/wv-pepperoni-rolls.jpg",
	"wy-chili": "/food/wy-chili.jpg",
	"yogurt-berries": "/food/yogurt-berries.jpg",
	"yum-yum-sauce": "/food/yum-yum-sauce.jpg",
	"zaatar-rub": "/food/zaatar-rub.jpg",
	zhug: "/food/zhug.jpg"
};
var PLATE_PHOTO = {
	roast: "/food/roast.jpg",
	pasta: "/food/pasta.jpg",
	bowl: "/food/bowl.jpg",
	fish: "/food/whitefish.jpg",
	soup: "/food/soup.jpg",
	taco: "/food/taco.jpg",
	green: "/food/green.jpg",
	skillet: "/food/skillet.jpg",
	curry: "/food/curry.jpg",
	toast: "/food/toast.jpg",
	dessert: "/food/pie.jpg"
};
function photoFor(recipe) {
	const idHit = BY_ID[recipe.id];
	if (idHit) return idHit;
	if (recipe.photo) return recipe.photo;
	return PLATE_PHOTO[recipe.plate] ?? "/food/bowl.jpg";
}
function MealPhoto({ recipe, className, alt }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-full w-full overflow-hidden bg-muted", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: photoFor(recipe),
			alt: alt ?? recipe.name,
			className: "block h-full w-full object-cover object-center",
			loading: "lazy",
			decoding: "async"
		})
	});
}
var badgeVariants = cva("inline-flex max-w-full min-w-0 items-center truncate rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-accent text-accent-foreground",
		outline: "shadow-[var(--shadow-border)] text-muted-foreground",
		solid: "bg-primary text-primary-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		suppressHydrationWarning: true,
		className: cn("box-border flex h-12 min-h-12 w-full min-w-0 max-w-full rounded-xl bg-card px-3 text-base leading-normal text-foreground shadow-[var(--shadow-border)] placeholder:text-muted-foreground", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:opacity-50", className),
		...props
	});
}
function Sheet({ open, onOpenChange, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Root, {
		open,
		onOpenChange,
		shouldScaleBackground: false,
		children
	});
}
function SheetContent({ className, children, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
		className: cn("fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] max-w-full flex-col overflow-hidden rounded-t-3xl bg-card text-card-foreground shadow-[var(--shadow-lift)] outline-none", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Title, {
				className: "sr-only",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4",
				children
			})
		]
	})] });
}
/** Regional names, slang, abbreviations, and dish aliases that should still find a recipe. */
var SYNONYMS = {
	scoff: [
		"jiggs dinner",
		"boiled dinner",
		"newfoundland"
	],
	scoffin: ["jiggs dinner"],
	jiggs: ["jiggs dinner", "salt beef"],
	jigs: ["jiggs dinner"],
	"salt beef": ["jiggs dinner", "pea soup"],
	"salt meat": ["jiggs dinner"],
	"boiled dinner": ["jiggs dinner"],
	touton: ["toutons"],
	toutons: ["toutons"],
	brewis: ["fish and brewis"],
	"hard bread": ["fish and brewis"],
	"cod tongues": ["cod au gratin", "fish"],
	doughboy: ["pea soup with doughboys"],
	doughboys: ["pea soup with doughboys"],
	figgy: ["jiggs dinner"],
	bakeapple: ["newfoundland"],
	partridgeberry: ["newfoundland"],
	chk: ["chicken"],
	chix: ["chicken"],
	spud: ["potato", "shepherd's pie"],
	spuds: ["potato"],
	tatties: ["potato", "shepherd's pie"],
	mince: [
		"ground beef",
		"shepherd's pie",
		"cottage pie"
	],
	"ground beef": [
		"meatloaf",
		"chili",
		"shepherd's pie"
	],
	evoo: ["olive oil"],
	parm: ["parmesan"],
	mozz: ["mozzarella"],
	"s&p": ["salt", "pepper"],
	wocest: ["worcestershire"],
	worcester: ["worcestershire"],
	"cottage pie": ["shepherd's pie"],
	"shepards pie": ["shepherd's pie"],
	shepherds: ["shepherd's pie"],
	hotdish: ["tater tot hotdish", "tuna noodle casserole"],
	casserole: [
		"tuna noodle casserole",
		"chicken pot pie",
		"tater tot hotdish"
	],
	"pot pie": ["chicken pot pie"],
	strog: ["beef stroganoff"],
	"greek salad": ["horiatiki"],
	gyro: ["souvlaki"],
	gyros: ["souvlaki"],
	doner: ["halifax donair", "souvlaki"],
	kebab: ["souvlaki", "beef kofta"],
	souvlakia: ["souvlaki"],
	moussaka: ["moussaka"],
	musaka: ["moussaka"],
	spanakopitta: ["spanakopita"],
	"spinach pie": ["spanakopita"],
	cacio: ["cacio e pepe"],
	carbonara: ["carbonara"],
	puttanesca: ["puttanesca"],
	ossobuco: ["osso buco"],
	lasagna: ["lasagna bolognese"],
	lasagne: ["lasagna bolognese"],
	bolognese: ["lasagna bolognese"],
	ragu: ["lasagna bolognese"],
	"al pastor": ["tacos al pastor"],
	tikka: ["chicken tikka masala"],
	ctm: ["chicken tikka masala"],
	"butter chicken": ["chicken tikka masala"],
	chole: ["chana masala"],
	channa: ["chana masala"],
	"chickpea curry": ["chana masala", "chickpea coconut curry"],
	mapo: ["mapo tofu"],
	okonomi: ["okonomiyaki"],
	falafel: ["falafel pita"],
	taameya: ["falafel pita"],
	shakshouka: ["shakshuka"],
	"eggs in purgatory": ["shakshuka"],
	"coq au vin": ["coq au vin"],
	gravy: ["biscuits and sausage gravy", "poutine"],
	"sawmill": ["biscuits and sausage gravy"],
	jerk: ["jerk chicken"],
	"pad thai": ["pad thai"],
	phatthai: ["pad thai"],
	quiche: ["quiche lorraine"],
	"red beans": ["red beans and rice"],
	pastichio: ["pastitsio"],
	"greek lasagna": ["pastitsio"],
	rarebit: ["welsh rarebit"],
	"welsh rabbit": ["welsh rarebit"],
	meatloaf: ["classic meatloaf"],
	"meat loaf": ["classic meatloaf"],
	"pot roast": ["sunday pot roast"],
	fryup: [
		"shakshuka",
		"toutons",
		"biscuits and sausage gravy"
	],
	"fry-up": ["toutons"],
	"old school": [
		"old-school",
		"meatloaf",
		"tuna casserole",
		"shepherd's pie"
	],
	"old fashioned": ["old-school"],
	homestyle: ["old-school", "homestyle"],
	nan: ["naan", "chicken tikka masala"],
	pita: [
		"souvlaki",
		"falafel pita",
		"halifax donair"
	],
	"fish n chips": ["pan-fried cod", "cod au gratin"],
	"fish and chips": ["pan-fried cod", "cod au gratin"],
	bangers: ["bangers and mash"],
	"bangers and mash": ["bangers and mash"],
	"mac n cheese": ["stovetop mac and cheese"],
	macaroni: ["stovetop mac and cheese", "pastitsio"],
	"mac and cheese": ["stovetop mac and cheese"],
	gnoc: ["pesto gnocchi"],
	stirfry: ["ginger chicken stir-fry"],
	"stir fry": ["ginger chicken stir-fry"],
	curry: [
		"chickpea coconut curry",
		"chana masala",
		"chicken tikka masala",
		"thai green curry"
	],
	tacos: ["black bean tacos", "tacos al pastor"],
	soup: [
		"lentil soup",
		"pea soup",
		"minestrone",
		"french onion soup",
		"pho"
	],
	stew: [
		"classic beef stew",
		"jiggs dinner",
		"moose stew",
		"irish stew"
	],
	roast: [
		"lemon garlic roast chicken",
		"sunday pot roast",
		"coq au vin"
	],
	nl: [
		"newfoundland",
		"jiggs dinner",
		"toutons",
		"fish cakes"
	],
	newfoundland: [
		"jiggs dinner",
		"toutons",
		"fish and brewis",
		"cod au gratin",
		"fish cakes"
	],
	"the rock": ["newfoundland"],
	labrador: ["newfoundland"],
	maritimes: [
		"jiggs dinner",
		"fish and brewis",
		"hodge podge",
		"halifax donair"
	],
	bayman: ["newfoundland", "jiggs dinner"],
	townie: ["newfoundland"],
	scoffins: ["jiggs dinner"],
	toutin: ["toutons"],
	toltin: ["toutons"],
	"fish cakes": ["newfoundland fish cakes"],
	"cod cakes": ["newfoundland fish cakes"],
	"figgy duff": ["figgy duff"],
	duff: ["figgy duff"],
	scrunchions: ["toutons"],
	"pease pudding": ["jiggs dinner"],
	"mustard pickles": ["jiggs dinner"],
	donair: [
		"halifax donair",
		"mom-and-pop donair sauce",
		"greco-style donair sauce",
		"pizza delight donair sauce"
	],
	"donair sauce": [
		"mom-and-pop donair sauce",
		"greco-style donair sauce",
		"pizza delight donair sauce",
		"halifax donair"
	],
	greco: ["greco-style donair sauce", "halifax donair"],
	"pizza delight": ["pizza delight donair sauce", "donair pizza"],
	pd: ["pizza delight donair sauce"],
	"mom and pop": ["mom-and-pop donair sauce"],
	"garlic fingers": ["pizza delight donair sauce"],
	rapure: ["rappie pie"],
	râpure: ["rappie pie"],
	fricot: ["chicken fricot"],
	"poutine rapee": ["poutine râpée"],
	ployes: ["ployes"],
	fiddlehead: ["fiddleheads with garlic"],
	malpeque: ["malpeque mussels"],
	pei: [
		"pei scalloped potatoes",
		"malpeque mussels",
		"pei lobster supper"
	],
	"new brunswick": [
		"chicken fricot",
		"poutine râpée",
		"ployes",
		"pizza delight donair sauce"
	],
	"nova scotia": [
		"rappie pie",
		"nova scotia lobster roll",
		"blueberry grunt",
		"cape breton oatcakes",
		"halifax donair"
	],
	atlantic: [
		"jiggs dinner",
		"halifax donair",
		"chicken fricot",
		"malpeque mussels"
	],
	rub: [
		"memphis dry rub",
		"texas brisket rub",
		"montreal steak spice",
		"jerk dry rub",
		"cajun blackening rub"
	],
	"dry rub": ["memphis dry rub", "texas brisket rub"],
	chimichurri: ["chimichurri"],
	hollandaise: ["hollandaise"],
	tzatziki: ["tzatziki"],
	buffalo: ["buffalo sauce"],
	tartar: ["tartar sauce"],
	ranch: ["ranch dressing"],
	teriyaki: ["teriyaki sauce"],
	alabama: ["alabama white bbq chicken", "alabama white sauce"],
	texas: ["texas oven brisket", "texas brisket rub"],
	nashville: ["tennessee hot chicken"],
	philly: ["pennsylvania cheesesteak"],
	"new haven": ["connecticut white clam pizza"],
	locomo: ["hawaii loco moco"],
	"loco moco": ["hawaii loco moco"],
	"hodge podge": ["hodge podge"],
	hodgepodge: ["hodge podge"],
	moose: ["moose stew", "newfoundland"],
	poutine: ["poutine"],
	tourtiere: ["tourtière"],
	"tourtière": ["tourtière"],
	"meat pie": ["tourtière"],
	"toad in the hole": ["toad in the hole"],
	toad: ["toad in the hole"],
	colcannon: ["colcannon"],
	"irish stew": ["irish stew"],
	pierogi: ["pierogi"],
	pyrohy: ["pierogi"],
	vareniki: ["pierogi"],
	perogies: ["pierogi"],
	schnitzel: ["pork schnitzel"],
	wienerschnitzel: ["pork schnitzel"],
	paprikash: ["chicken paprikash"],
	"sloppy joe": ["sloppy joes"],
	"sloppy joes": ["sloppy joes"],
	dumplings: ["chicken and dumplings", "potstickers"],
	"chicken n dumplings": ["chicken and dumplings"],
	salisbury: ["salisbury steak"],
	"swedish meatballs": ["swedish meatballs"],
	goulash: ["hungarian goulash", "american goulash"],
	"chop suey": ["american goulash"],
	beefaroni: ["american goulash"],
	"chili mac": ["american goulash"],
	"scalloped potatoes": ["ham and scalloped potatoes"],
	"stuffed peppers": ["stuffed peppers"],
	"a la king": ["chicken à la king"],
	"cabbage rolls": ["cabbage rolls"],
	holubtsi: ["cabbage rolls"],
	"tuna melt": ["tuna melt"],
	hash: ["corned beef hash"],
	"fried chicken": ["buttermilk fried chicken"],
	gumbo: ["chicken and sausage gumbo"],
	jambalaya: ["jambalaya"],
	pho: ["phở bò"],
	"pho bo": ["phở bò"],
	"green curry": ["thai green curry"],
	"kung pao": ["kung pao chicken"],
	"gong bao": ["kung pao chicken"],
	gyoza: ["potstickers"],
	potstickers: ["potstickers"],
	bibimbap: ["bibimbap"],
	mujadara: ["mujadara"],
	kofta: ["beef kofta"],
	kefte: ["beef kofta"],
	paella: ["weeknight paella"],
	"spanish omelette": ["spanish tortilla"],
	"tortilla espanola": ["spanish tortilla"],
	ratatouille: ["ratatouille"],
	"french onion": ["french onion soup"],
	croque: ["croque monsieur"],
	"croque madame": ["croque monsieur"],
	avgolemono: ["avgolemono"],
	gemista: ["gemista"],
	yemista: ["gemista"],
	amatriciana: ["bucatini all’amatriciana"],
	"eggplant parm": ["eggplant parmesan"],
	parmigiana: ["eggplant parmesan"],
	pozole: ["pozole rojo"],
	posole: ["pozole rojo"],
	huevos: ["huevos rancheros"],
	rancheros: ["huevos rancheros"],
	"saag paneer": ["palak paneer"],
	palak: ["palak paneer"],
	dal: ["dal tadka"],
	daal: ["dal tadka"],
	"aloo gobi": ["aloo gobi"],
	"rice and peas": ["rice and peas"],
	italian: [
		"cacio e pepe",
		"carbonara",
		"puttanesca",
		"osso buco",
		"tomato basil pasta",
		"lasagna"
	],
	greek: [
		"moussaka",
		"souvlaki",
		"spanakopita",
		"horiatiki",
		"pastitsio",
		"greek chicken bowls"
	],
	mexican: [
		"black bean tacos",
		"tacos al pastor",
		"turkey taco skillet",
		"pozole",
		"huevos"
	],
	indian: [
		"chana masala",
		"chicken tikka masala",
		"chickpea coconut curry",
		"palak paneer",
		"dal"
	],
	chinese: [
		"mapo tofu",
		"ginger chicken stir-fry",
		"veggie fried rice",
		"kung pao chicken",
		"potstickers"
	],
	japanese: ["okonomiyaki", "sesame soba"],
	korean: ["bibimbap"],
	thai: ["pad thai", "thai green curry"],
	vietnamese: ["phở bò"],
	french: [
		"coq au vin",
		"quiche lorraine",
		"french onion soup",
		"ratatouille",
		"croque monsieur"
	],
	spanish: ["weeknight paella", "spanish tortilla"],
	caribbean: ["jerk chicken", "rice and peas"],
	cajun: [
		"red beans and rice",
		"gumbo",
		"jambalaya"
	],
	southern: [
		"pot likker",
		"burgoo",
		"spoon bread",
		"pecan pie",
		"hush puppies"
	],
	"pot likker": ["pot likker"],
	burgoo: ["kentucky burgoo"],
	"hush puppy": ["hush puppies"],
	"hush puppies": ["hush puppies"],
	"spoon bread": ["spoon bread"],
	"lady baltimore": ["lady baltimore cake"],
	"chess pie": ["chess pie"],
	"pecan pie": ["white house pecan pie", "pecan pie"],
	praline: ["new orleans pralines"],
	"shortnin": ["shortnin bread"],
	"shortening bread": ["shortnin bread"],
	"hopping john": ["hopping john"],
	"hoppin john": ["hopping john"],
	"smithfield": ["smithfield ham"],
	"mint julep": ["mint julep"],
	"fried chicken maryland": ["fried chicken maryland"],
	parsnips: ["parsnips and salt pork"],
	"salt pork": ["parsnips and salt pork", "pot likker"],
	british: [
		"toad in the hole",
		"bangers and mash",
		"welsh rarebit"
	],
	irish: ["irish stew", "colcannon"],
	canadian: [
		"poutine",
		"tourtière",
		"halifax donair"
	],
	polish: ["pierogi"],
	german: ["pork schnitzel"],
	hungarian: ["chicken paprikash"],
	pesto: ["basil pesto"],
	"salsa verde": ["salsa verde"],
	mole: ["weeknight mole"],
	"peri peri": ["peri-peri sauce"],
	periperi: ["peri-peri sauce"],
	harissa: ["harissa"],
	"nuoc cham": ["nuoc cham"],
	"yum yum": ["yum yum sauce"],
	aioli: ["garlic aioli"],
	bearnaise: ["béarnaise"],
	béarnaise: ["béarnaise"],
	"poutine gravy": ["poutine gravy"],
	gochujang: ["gochujang glaze"],
	zhug: ["zhug"],
	schug: ["zhug"],
	toum: ["toum"],
	ponzu: ["ponzu"],
	muhammara: ["muhammara"],
	mojo: ["mojo"],
	"come back": ["come-back sauce", "mississippi comeback shrimp"],
	marinara: ["marinara"],
	"cocktail sauce": ["cocktail sauce"],
	"honey mustard": ["honey mustard"],
	grunt: ["blueberry grunt"],
	nanaimo: ["nanaimo bars"],
	"butter tart": ["butter tarts"],
	"lava cake": ["molten chocolate cakes"],
	"molten": ["molten chocolate cakes"],
	tiramisu: ["tiramisu"],
	flan: ["vanilla flan"],
	churro: ["churros"],
	baklava: ["baklava"],
	"sticky rice": ["mango sticky rice"],
	chia: ["coconut chia pudding"],
	pancakes: ["blueberry pancakes"],
	"overnight oats": ["overnight oats"],
	porridge: ["steel-cut porridge"],
	"avo toast": ["avocado toast with jammy egg"],
	omelette: ["veggie omelette"],
	omelet: ["veggie omelette"],
	burrito: ["breakfast burrito"],
	"lox": ["smoked salmon bagel"],
	banhmi: ["pork banh mi"],
	"banh mi": ["pork banh mi"],
	laksa: ["chicken laksa"],
	tagine: ["lamb and apricot tagine", "chicken preserved-lemon tagine"],
	empanada: ["beef empanadas"],
	borscht: ["beet borscht"],
	arepa: ["cheese arepas"],
	"khao soi": ["khao soi"],
	"curry goat": ["jamaican curry goat"],
	bobotie: ["bobotie"],
	"soup dumplings": ["pork soup dumplings"],
	xiaolongbao: ["pork soup dumplings"],
	"instant pot": [
		"instant pot chicken and rice",
		"instant pot butter chicken",
		"instant pot chili",
		"instant pot yogurt"
	],
	"pressure cooker": ["instant pot chicken and rice"],
	"slow cooker": [
		"slow-cooker pot roast",
		"slow-cooker pulled pork",
		"slow-cooker chili"
	],
	crockpot: ["slow-cooker pot roast", "slow-cooker chili"],
	"sheet pan": [
		"sheet-pan lemon chicken",
		"sheet-pan salmon and broccoli",
		"sheet-pan sausage and peppers"
	],
	"air fryer": [
		"air-fryer chicken thighs",
		"air-fryer salmon",
		"air-fryer chicken wings"
	],
	cheesecake: ["new york cheesecake", "basque burnt cheesecake"],
	venison: [
		"venison stew",
		"venison medallions",
		"venison bean chili"
	],
	"gluten free": [
		"almond flour orange cake",
		"almond-crusted chicken",
		"quinoa tabbouleh"
	],
	vegan: [
		"lentil bolognese",
		"chickpea tikka masala",
		"west african peanut stew"
	],
	"sugar free": [
		"herb roasted chicken thighs",
		"sugar-free berry parfait",
		"dill baked salmon"
	],
	"dairy free": ["coconut lime chicken", "olive-oil roast salmon"],
	camping: ["campfire foil packets", "dutch-oven berry cobbler"],
	"grilled cheese": ["classic grilled cheese"],
	latkes: ["potato latkes"],
	"koshari": ["koshari"],
	"japchae": ["japchae"],
	"tteokbokki": ["tteokbokki"],
	elote: ["elote grilled corn"],
	"street corn": ["elote grilled corn"],
	cobb: ["cobb salad"],
	"funeral potatoes": ["funeral potatoes"],
	"pimento cheese": ["pimento cheese"],
	dumpcake: ["cherry pineapple dump cake"],
	"dump cake": ["cherry pineapple dump cake"],
	gyudon: ["gyudon beef bowl"],
	oyakodon: ["oyakodon"],
	tonkatsu: ["tonkatsu"],
	"miso soup": ["miso soup with tofu"],
	onigiri: ["onigiri rice balls"],
	yakitori: ["yakitori chicken skewers"],
	dessert: [
		"nanaimo bars",
		"blueberry grunt",
		"butter tarts"
	],
	"fannie farmer": [
		"parker house rolls",
		"boston brown bread",
		"fish chowder"
	],
	farmer: ["parker house rolls", "boston brown bread"],
	"white house": ["sirloin of beef", "white house cook book"],
	"abby fisher": [
		"jumberlie",
		"ochra gumbo",
		"sweet potato pie"
	],
	jumberlie: ["jumberlie a la creole", "jambalaya"],
	"maria gentile": ["risotto milanaise", "gnocchi"],
	"365 foreign": ["austrian goulasch", "east india fish"],
	wartime: ["cornmeal rolls", "spoon bread"],
	"pa dutch": ["chicken corn soup", "pepper cabbage"],
	picayune: ["pompano", "creole"],
	vintage: [
		"fannie farmer",
		"white house",
		"southern cook book"
	],
	breakfast: [
		"overnight oats",
		"blueberry pancakes",
		"avocado toast"
	],
	keto: [
		"cauliflower pizza",
		"zucchini lasagna",
		"bunless burger"
	],
	"low carb": [
		"cauliflower pizza",
		"taco lettuce cups",
		"no-bean chili"
	],
	"high protein": [
		"cottage pancakes",
		"turkey meatloaf",
		"shrimp and edamame"
	],
	birria: ["stovetop birria"],
	"carne asada": ["carne asada"],
	tinga: ["chicken tinga"],
	jollof: ["jollof rice"],
	shawarma: ["chicken shawarma plate"],
	hummus: ["hummus"],
	"baba ganoush": ["baba ganoush"],
	bulgogi: ["beef bulgogi"],
	"tom yum": ["tom yum goong"],
	"pad krapow": ["pad krapow gai"],
	"aglio olio": ["spaghetti aglio e olio"],
	piccata: ["chicken piccata"],
	marsala: ["chicken marsala"],
	"steak frites": ["steak frites"],
	reuben: ["reuben"],
	"po boy": ["shrimp po' boy"],
	muffuletta: ["muffuletta"],
	"french dip": ["french dip"],
	gazpacho: ["gazpacho"],
	"matzo ball": ["matzo ball soup"],
	ramen: ["miso ramen", "upgraded ramen"],
	quesadilla: ["chicken quesadillas", "black bean quesadillas"],
	"date night": ["pan-seared scallops", "filet with red wine shallots"]
};
function normalize(q) {
	return q.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9+& ]/g, " ").replace(/\s+/g, " ").trim();
}
function expandQuery(q) {
	const n = normalize(q);
	if (!n) return [];
	const terms = /* @__PURE__ */ new Set([n, ...n.split(" ").filter((w) => w.length > 1)]);
	for (const [key, vals] of Object.entries(SYNONYMS)) {
		const kn = normalize(key);
		if (n.includes(kn) || kn.includes(n)) for (const v of vals) terms.add(normalize(v));
	}
	return [...terms];
}
function recipeHaystack(recipe) {
	return normalize([
		recipe.name,
		recipe.description,
		recipe.cuisine ?? "",
		...recipe.tags ?? [],
		...recipe.aliases ?? [],
		...recipe.ingredients.map((i) => i.name)
	].join(" "));
}
function searchRecipes(query, pool = RECIPES) {
	const terms = expandQuery(query);
	if (terms.length === 0) return pool;
	return pool.map((recipe) => {
		const hay = recipeHaystack(recipe);
		let score = 0;
		for (const t of terms) {
			if (hay.includes(t)) score += t.length > 3 ? 3 : 1;
			if (normalize(recipe.name).includes(t)) score += 5;
		}
		return {
			recipe,
			score
		};
	}).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.recipe);
}
function railKey(s) {
	return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function recipesByCuisine(cuisine, pool = RECIPES) {
	const key = railKey(cuisine);
	const dashed = key.replace(/\s+/g, "-");
	if (key === "desserts" || key === "dessert") return pool.filter(isDessert);
	if (key === "breakfast") return pool.filter(isBreakfast);
	if (key === "atlantic") return pool.filter((r) => {
		const c = railKey(r.cuisine ?? "");
		if (c === "newfoundland" || c === "nova scotia" || c === "new brunswick" || c === "prince edward island") return true;
		return (r.tags ?? []).some((t) => {
			const tt = railKey(t);
			return tt === "atlantic" || tt === "newfoundland" || tt === "nova scotia" || tt === "new brunswick" || tt === "pei" || tt === "maritimes";
		});
	});
	if (key === "salads" || key === "salad") return pool.filter((r) => r.plate === "green" || (r.tags ?? []).some((t) => railKey(t) === "salad"));
	if (key === "grill") return pool.filter((r) => (r.tags ?? []).some((t) => [
		"grill",
		"bbq",
		"barbecue"
	].includes(railKey(t))));
	if (key === "instant pot") return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "instant pot" || railKey(t) === "pressure cooker"));
	if (key === "slow cooker") return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "slow cooker" || railKey(t) === "crockpot"));
	if (key === "sheet pan") return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "sheet pan"));
	if (key === "air fryer") return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "air fryer"));
	if (key === "camping") return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "camping"));
	if (key === "kid friendly" || key === "kid-friendly") return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "kid friendly"));
	if (key === "dairy free" || key === "dairy-free") return pool.filter((r) => (r.tags ?? []).includes("dairy-free"));
	return pool.filter((r) => {
		const c = railKey(r.cuisine ?? "");
		if (c === key || c.replace(/\s+/g, "-") === dashed) return true;
		return (r.tags ?? []).some((t) => {
			const tt = railKey(t);
			return tt === key || tt.replace(/\s+/g, "-") === dashed;
		});
	});
}
function RecipePicker({ open, onOpenChange, onPick, onCustom, onLocked, onSurprise, onSkip }) {
	const unlocked = useSpoonful((s) => s.unlocked);
	const prefs = useSpoonful((s) => s.prefs);
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const nextGen = useSpoonful((s) => s.nextGen);
	const [query, setQuery] = (0, import_react.useState)("");
	const [customOpen, setCustomOpen] = (0, import_react.useState)(false);
	const available = unlockedRecipes(unlocked);
	const list = (0, import_react.useMemo)(() => {
		const base = query.trim() ? searchRecipes(query, RECIPES) : RECIPES;
		const openRecipes = base.filter((r) => available.some((a) => a.id === r.id) && !hidden.includes(r.id));
		const locked = base.filter((r) => !available.some((a) => a.id === r.id));
		const preferred = openRecipes.filter((r) => recipeAllowed(r, prefs, allergies, hidden));
		const rest = openRecipes.filter((r) => !recipeAllowed(r, prefs, allergies, hidden) && recipeSafe(r, allergies));
		return [
			...preferred,
			...rest,
			...locked.filter((r) => recipeSafe(r, allergies))
		];
	}, [
		query,
		available,
		prefs,
		allergies,
		hidden
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange: (o) => {
			onOpenChange(o);
			if (!o) {
				setQuery("");
				setCustomOpen(false);
			}
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			title: "Choose a recipe",
			children: customOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomForm, {
				onCancel: () => setCustomOpen(false),
				onSave: (c) => {
					onCustom(c);
					setCustomOpen(false);
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Add to the week"
				}),
				onSurprise || onSkip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [
						onSurprise ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "spark",
							className: "w-full",
							onClick: onSurprise,
							children: nextGen ? "Surprise me" : "Pick for me"
						}) : null,
						onSkip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "w-full",
							onClick: () => onSkip("takeout"),
							children: "Eating out"
						}) : null,
						onSkip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "col-span-2 w-full",
							onClick: () => onSkip("rest"),
							children: "Kitchen closed"
						}) : null
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Jiggs, scoff, CTM, donair…",
						className: "pl-10"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "mt-3 w-full",
					onClick: () => setCustomOpen(true),
					children: "Use your own meal"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: list.map((recipe) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeRow, {
						recipe,
						locked: !available.some((a) => a.id === recipe.id),
						onPick,
						onLocked
					}, recipe.id))
				})
			] })
		})
	});
}
function RecipeRow({ recipe, locked, onPick, onLocked }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => locked ? onLocked() : onPick(recipe.id),
		className: cn("flex w-full min-w-0 items-center gap-3 rounded-2xl bg-background p-2 text-left", locked && "opacity-70"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
				recipe,
				className: "size-14 shrink-0 rounded-xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm font-medium",
					children: recipe.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						formatMinutes(recipe.minutes),
						" · ",
						packLabel(recipe.pack)
					]
				})]
			}),
			locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4 text-muted-foreground" }) : null
		]
	});
}
function CustomForm({ onCancel, onSave }) {
	const [name, setName] = (0, import_react.useState)("");
	const [minutes, setMinutes] = (0, import_react.useState)("30");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [lines, setLines] = (0, import_react.useState)("tomatoes, 4\ngarlic, 3 cloves\nolive oil, 2 tbsp");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "flex flex-col gap-3",
		onSubmit: (e) => {
			e.preventDefault();
			if (!name.trim()) return;
			onSave({
				id: `custom-${Date.now()}`,
				name: name.trim(),
				minutes: Number(minutes) || 30,
				notes: notes.trim(),
				ingredients: parseIngredientLines(lines)
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Your own meal"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-sm",
				children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-1.5",
					value: name,
					onChange: (e) => setName(e.target.value),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-sm",
				children: ["Minutes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-1.5",
					inputMode: "numeric",
					value: minutes,
					onChange: (e) => setMinutes(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-sm",
				children: [
					"Ingredients",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: lines,
						onChange: (e) => setLines(e.target.value),
						rows: 5,
						className: "mt-1.5 w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-xs text-muted-foreground",
						children: "One per line. Name, then optional amount — like “onion, 1”."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-sm",
				children: ["Notes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: notes,
					onChange: (e) => setNotes(e.target.value),
					rows: 3,
					className: "mt-1.5 w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					className: "flex-1",
					onClick: onCancel,
					children: "Back"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "flex-1",
					children: "Add to week"
				})]
			})
		]
	});
}
function parseIngredientLines(text) {
	return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
		const [namePart, rest] = line.split(",").map((s) => s.trim());
		const name = namePart || "item";
		if (!rest) return {
			name,
			qty: 1,
			unit: "",
			aisle: "Other"
		};
		const bits = rest.split(/\s+/);
		const qty = Number(bits[0]);
		if (Number.isFinite(qty)) return {
			name,
			qty,
			unit: bits.slice(1).join(" "),
			aisle: "Other"
		};
		return {
			name,
			qty: 1,
			unit: rest,
			aisle: "Other"
		};
	});
}
function RecipeCard({ recipe, locked, nutritionOn, onOpen }) {
	const nextGen = useSpoonful((s) => s.nextGen);
	const favorites = useSpoonful((s) => s.favorites);
	const toggleFavorite = useSpoonful((s) => s.toggleFavorite);
	const loved = favorites.includes(recipe.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onOpen,
		className: "flex w-full items-stretch gap-3 overflow-hidden rounded-3xl bg-card p-2 text-left shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative size-24 shrink-0 overflow-hidden rounded-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
				recipe,
				className: "size-full"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				role: "button",
				tabIndex: 0,
				"aria-label": loved ? "Unsave" : "Save",
				onClick: (e) => {
					e.stopPropagation();
					toggleFavorite(recipe.id);
				},
				onKeyDown: (e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						toggleFavorite(recipe.id);
					}
				},
				className: "absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-card/90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-3.5", loved && "fill-spark text-spark") })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1 py-1 pr-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "min-w-0 truncate font-medium",
						children: recipe.name
					}), locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3.5 shrink-0 text-muted-foreground" }) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground",
					children: recipe.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1.5 flex flex-wrap items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: formatMinutes(recipe.minutes)
						}),
						recipe.cuisine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "max-w-[8.5rem]",
							children: recipe.cuisine
						}) : null,
						recipe.source?.year ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: recipe.source.year
						}) : null,
						dietFlags(recipe).slice(0, 3).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: f === "gluten-free" ? "GF" : f === "sugar-free" ? "SF" : f === "dairy-free" ? "DF" : f
						}, f)),
						(nutritionOn || nextGen) && !locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							children: [recipe.nutrition.protein, "g protein"]
						}) : null
					]
				})
			]
		})]
	});
}
var LOCALES = [
	{
		id: "en",
		label: "English",
		voice: "en-CA"
	},
	{
		id: "fr",
		label: "Français",
		voice: "fr-CA"
	},
	{
		id: "es",
		label: "Español",
		voice: "es-MX"
	}
];
var COUNTRIES = [
	{
		id: "CA",
		label: "Canada",
		hint: "Atlantic catalogs first"
	},
	{
		id: "US",
		label: "United States",
		hint: "State dishes first"
	},
	{
		id: "MX",
		label: "México",
		hint: "Mexican and Spanish first"
	},
	{
		id: "GB",
		label: "United Kingdom",
		hint: "British and Irish"
	},
	{
		id: "FR",
		label: "France",
		hint: "French kitchen first"
	},
	{
		id: "AU",
		label: "Australia",
		hint: "English, metric"
	}
];
var EN = {
	plan: "Plan",
	recipes: "Recipes",
	snap: "Snap",
	sauces: "Sauces",
	desserts: "Desserts",
	shop: "Shop",
	fuel: "Fuel",
	extras: "Extras",
	people: "People",
	simple: "Simple",
	nextGen: "Next Gen",
	signIn: "Sign in",
	all: "All",
	healthy: "Healthy",
	comfort: "Comfort",
	quick: "Quick",
	veg: "Veg",
	dessert: "Dessert",
	tonight: "Tonight",
	language: "Language",
	country: "Country",
	kitchen: "Kitchen",
	privateChat: "Private chat",
	send: "Send",
	writeNote: "Write a private note",
	findCook: "Find someone to message",
	message: "Message",
	following: "Following",
	chats: "Chats",
	noChats: "No private chats yet. Search a username and tap Message — only the two of you can see it.",
	fruit: "Fruit",
	baking: "Baking",
	chilled: "Chilled",
	world: "World",
	plateTonight: "Plate with tonight",
	addGrocery: "Add to grocery",
	cookNow: "Cook now",
	closeExtras: "Close extras",
	breakfast: "Breakfast",
	protein: "Protein",
	saved: "Saved",
	atlantic: "Atlantic",
	usa: "USA",
	southern: "Southern",
	leftovers: "Leftovers",
	vegetarian: "Vegetarian",
	vegan: "Vegan",
	glutenFree: "Gluten-free",
	sugarFree: "Sugar-free",
	dairyFree: "Dairy-free",
	shelves: "Shelves",
	diet: "Diet",
	allDishes: "All dishes",
	sortName: "A–Z",
	sortTime: "Time",
	sortProtein: "Protein",
	languageHint: "Voice search and labels follow this.",
	countryHint: "Catalogs start with dishes from home.",
	addBreakfast: "Add breakfast",
	addLunch: "Add lunch",
	searchShop: "Find an item",
	dietGroup: "Eat by diet",
	methodGroup: "How you cook",
	courseGroup: "Course",
	tableGroup: "Tables",
	themeGroup: "Ingredients & occasions",
	surprise: "Surprise me",
	minutes15: "15 min",
	minutes30: "30 min",
	minutes45: "45 min",
	anyTime: "Any time",
	anyProtein: "Any protein",
	clearFilters: "Clear",
	recent: "Recently opened",
	time: "Time",
	backShelves: "All shelves",
	noDishes: "Nothing in this shelf. Try another filter.",
	cuisineGroup: "Cuisines",
	keto: "Keto",
	highProtein: "High protein",
	tonightPicks: "Tonight",
	allCatalog: "Browse all",
	servings: "Servings",
	addIngredients: "Add ingredients to grocery",
	copyIngredients: "Copy ingredients",
	similar: "More like this",
	fromPantry: "From pantry",
	editPins: "Edit shortcuts",
	donePins: "Done",
	pinHint: "Tap to add or remove. Up to six menus for instant access.",
	autoPlate: "Auto-plate dinner",
	bodySync: "Body Sync",
	recovery: "Recovery",
	stepTimer: "Step timer",
	alwaysAllow: "Always allow",
	alwaysAllowHint: "Keep Fuel current even when Spoonful is closed",
	whileUsing: "While using the app",
	whileUsingHint: "Sync only while this kitchen is open",
	dontAllow: "Don't allow",
	dontAllowHint: "Spoonful will not read this device",
	unlinkDevice: "Unlink",
	changeAccess: "Change access",
	syncAccessTitle: "Allow this device to sync?",
	syncAccessBody: "Spoonful reads steps, rings, heart, sleep, and workouts so tonight can match the day you actually had. Always allow keeps pulling after you leave — the same choice Health Connect and the iPhone give you.",
	alwaysOn: "Always allow is on",
	alwaysOnHint: "Fuel keeps updating after you leave the kitchen.",
	whileOn: "While using the app",
	whileOnHint: "Syncs only with this kitchen open. Switch to Always allow to keep going after you leave."
};
var DICT = {
	en: EN,
	fr: {
		...EN,
		plan: "Menu",
		recipes: "Recettes",
		snap: "Photo",
		sauces: "Sauces",
		desserts: "Desserts",
		shop: "Courses",
		fuel: "Fuel",
		extras: "Extras",
		people: "Gens",
		simple: "Simple",
		nextGen: "Next Gen",
		signIn: "Connexion",
		all: "Tout",
		healthy: "Santé",
		comfort: "Réconfort",
		quick: "Rapide",
		veg: "Végé",
		dessert: "Dessert",
		tonight: "Ce soir",
		language: "Langue",
		country: "Pays",
		kitchen: "Cuisine",
		privateChat: "Discussion privée",
		send: "Envoyer",
		writeNote: "Écrire un mot privé",
		findCook: "Trouver quelqu’un",
		message: "Message",
		following: "Abonnements",
		chats: "Discussions",
		noChats: "Pas encore de discussion. Cherchez un nom et touchez Message — seulement vous deux la voyez.",
		fruit: "Fruits",
		baking: "Pâtisserie",
		chilled: "Froid",
		world: "Monde",
		plateTonight: "Mettre au menu",
		addIngredients: "Ajouter aux courses",
		cookNow: "Cuisiner",
		closeExtras: "Fermer",
		breakfast: "Déjeuner",
		protein: "Protéines",
		saved: "Gardés",
		atlantic: "Atlantique",
		usa: "É.-U.",
		southern: "Sud",
		leftovers: "Restes",
		vegetarian: "Végétarien",
		vegan: "Végan",
		glutenFree: "Sans gluten",
		sugarFree: "Sans sucre",
		dairyFree: "Sans lait",
		shelves: "Rayons",
		diet: "Régime",
		allDishes: "Tous les plats",
		sortName: "A–Z",
		sortTime: "Temps",
		sortProtein: "Protéines",
		languageHint: "La recherche vocale et les titres suivent ceci.",
		countryHint: "Les catalogues commencent par chez vous.",
		addBreakfast: "Ajouter le déjeuner",
		addLunch: "Ajouter le dîner",
		searchShop: "Trouver un article",
		dietGroup: "Par régime",
		methodGroup: "Comment cuisiner",
		courseGroup: "Service",
		tableGroup: "Tables",
		themeGroup: "Ingrédients et occasions",
		surprise: "Surprenez-moi",
		minutes15: "15 min",
		minutes30: "30 min",
		minutes45: "45 min",
		anyTime: "Tout temps",
		anyProtein: "Toute protéine",
		clearFilters: "Effacer",
		recent: "Ouverts récemment",
		time: "Temps",
		backShelves: "Tous les rayons",
		noDishes: "Rien dans ce rayon. Essayez un autre filtre.",
		cuisineGroup: "Cuisines",
		keto: "Keto",
		highProtein: "Protéines",
		tonightPicks: "Ce soir",
		allCatalog: "Tout voir",
		servings: "Portions",
		addGrocery: "Ajouter aux courses",
		copyIngredients: "Copier les ingrédients",
		similar: "Dans le même esprit",
		fromPantry: "Du garde-manger",
		alwaysAllow: "Toujours autoriser",
		alwaysAllowHint: "Garde Fuel à jour même quand Spoonful est fermé",
		whileUsing: "Lorsque l’app est ouverte",
		whileUsingHint: "Synchronise seulement tant que la cuisine est ouverte",
		dontAllow: "Ne pas autoriser",
		dontAllowHint: "Spoonful ne lira pas cet appareil",
		unlinkDevice: "Délier",
		changeAccess: "Modifier l’accès",
		syncAccessTitle: "Autoriser cet appareil à synchroniser ?",
		syncAccessBody: "Spoonful lit les pas, les anneaux, le cœur, le sommeil et les séances pour que ce soir suive la vraie journée. Toujours autoriser continue après votre départ — le même choix que Health Connect et l’iPhone.",
		alwaysOn: "Toujours autoriser est actif",
		alwaysOnHint: "Fuel continue de se mettre à jour après votre départ.",
		whileOn: "Lorsque l’app est ouverte",
		whileOnHint: "Synchronise seulement avec la cuisine ouverte. Passez à Toujours autoriser pour continuer après."
	},
	es: {
		...EN,
		plan: "Plan",
		recipes: "Recetas",
		snap: "Foto",
		sauces: "Salsas",
		desserts: "Postres",
		shop: "Compras",
		fuel: "Fuel",
		extras: "Extras",
		people: "Gente",
		simple: "Simple",
		nextGen: "Next Gen",
		signIn: "Entrar",
		all: "Todo",
		healthy: "Sano",
		comfort: "Reconfortante",
		quick: "Rápido",
		veg: "Veg",
		dessert: "Postre",
		tonight: "Esta noche",
		language: "Idioma",
		country: "País",
		kitchen: "Cocina",
		privateChat: "Chat privado",
		send: "Enviar",
		writeNote: "Escribe un recado privado",
		findCook: "Buscar a alguien",
		message: "Mensaje",
		following: "Siguiendo",
		chats: "Chats",
		noChats: "Aún no hay chats. Busca un usuario y toca Mensaje — solo lo ven ustedes dos.",
		fruit: "Fruta",
		baking: "Horno",
		chilled: "Frío",
		world: "Mundo",
		plateTonight: "Poner en la cena",
		addIngredients: "Añadir a la lista",
		cookNow: "Cocinar",
		closeExtras: "Cerrar extras",
		breakfast: "Desayuno",
		protein: "Proteína",
		saved: "Guardados",
		atlantic: "Atlántico",
		usa: "EE. UU.",
		southern: "Sureño",
		leftovers: "Sobras",
		vegetarian: "Vegetariano",
		vegan: "Vegano",
		glutenFree: "Sin gluten",
		sugarFree: "Sin azúcar",
		dairyFree: "Sin lácteos",
		shelves: "Estantes",
		diet: "Dieta",
		allDishes: "Todos los platos",
		sortName: "A–Z",
		sortTime: "Tiempo",
		sortProtein: "Proteína",
		languageHint: "La búsqueda por voz y las etiquetas siguen esto.",
		countryHint: "Los catálogos empiezan por casa.",
		addBreakfast: "Añadir desayuno",
		addLunch: "Añadir almuerzo",
		searchShop: "Buscar un artículo",
		dietGroup: "Por dieta",
		methodGroup: "Cómo cocinar",
		courseGroup: "Plato",
		tableGroup: "Mesas",
		themeGroup: "Ingredientes y ocasiones",
		surprise: "Sorpréndeme",
		minutes15: "15 min",
		minutes30: "30 min",
		minutes45: "45 min",
		anyTime: "Cualquier tiempo",
		anyProtein: "Cualquier proteína",
		clearFilters: "Limpiar",
		recent: "Vistos hace poco",
		time: "Tiempo",
		backShelves: "Todos los estantes",
		noDishes: "Nada en este estante. Prueba otro filtro.",
		cuisineGroup: "Cocinas",
		keto: "Keto",
		highProtein: "Alta proteína",
		tonightPicks: "Esta noche",
		allCatalog: "Ver todo",
		servings: "Porciones",
		addGrocery: "Añadir a la lista",
		copyIngredients: "Copiar ingredientes",
		similar: "Más como este",
		fromPantry: "De la despensa",
		alwaysAllow: "Permitir siempre",
		alwaysAllowHint: "Mantén Fuel al día aunque Spoonful esté cerrado",
		whileUsing: "Mientras usas la app",
		whileUsingHint: "Sincroniza solo con la cocina abierta",
		dontAllow: "No permitir",
		dontAllowHint: "Spoonful no leerá este dispositivo",
		unlinkDevice: "Desvincular",
		changeAccess: "Cambiar acceso",
		syncAccessTitle: "¿Permitir que este dispositivo sincronice?",
		syncAccessBody: "Spoonful lee pasos, anillos, corazón, sueño y entrenos para que la cena siga el día que tuviste. Permitir siempre sigue tirando cuando te vas — la misma opción que Health Connect y el iPhone.",
		alwaysOn: "Permitir siempre está activo",
		alwaysOnHint: "Fuel sigue actualizándose cuando sales de la cocina.",
		whileOn: "Mientras usas la app",
		whileOnHint: "Sincroniza solo con la cocina abierta. Pasa a Permitir siempre para seguir al salir."
	}
};
function t(locale, key) {
	return DICT[locale]?.[key] ?? EN[key] ?? key;
}
function voiceFor(locale) {
	return LOCALES.find((l) => l.id === locale)?.voice ?? "en-CA";
}
function htmlLang(locale) {
	if (locale === "fr") return "fr";
	if (locale === "es") return "es";
	return "en";
}
var MENUS = [
	{
		id: "all",
		key: "all"
	},
	{
		id: "healthy",
		key: "healthy"
	},
	{
		id: "fruit",
		key: "fruit"
	},
	{
		id: "baking",
		key: "baking"
	},
	{
		id: "chilled",
		key: "chilled"
	},
	{
		id: "world",
		key: "world"
	}
];
function dessertMenu(recipe) {
	const tags = recipe.tags ?? [];
	if (tags.includes("healthy") || isHealthy(recipe)) return "healthy";
	if (tags.includes("fruit")) return "fruit";
	if (tags.includes("chilled")) return "chilled";
	if (tags.includes("world")) return "world";
	if (tags.includes("baking")) return "baking";
	return "baking";
}
function DessertsView() {
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const assignMeal = useSpoonful((s) => s.assignMeal);
	const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
	const setTab = useSpoonful((s) => s.setTab);
	const locale = useSpoonful((s) => s.locale);
	const [query, setQuery] = (0, import_react.useState)("");
	const [menu, setMenu] = (0, import_react.useState)("all");
	const [active, setActive] = (0, import_react.useState)(null);
	const [cooking, setCooking] = (0, import_react.useState)(null);
	const pool = (0, import_react.useMemo)(() => RECIPES.filter(isDessert), []);
	const list = (0, import_react.useMemo)(() => {
		let rows = pool.filter((r) => !hidden.includes(r.id) && recipeSafe(r, allergies));
		if (menu === "healthy") rows = rows.filter((r) => isHealthy(r) || (r.tags ?? []).includes("healthy"));
		else if (menu !== "all") rows = rows.filter((r) => dessertMenu(r) === menu);
		if (query.trim()) rows = searchRecipes(query, rows);
		return rows;
	}, [
		pool,
		menu,
		query,
		hidden,
		allergies
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-32 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: t(locale, "kitchen")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl",
				children: t(locale, "desserts")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-foreground/80",
				children: "Its own menu. Fruit, bakery, chilled, and the world — plus a Healthy toggle that still tastes like dessert."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-4",
				value: query,
				onChange: (e) => setQuery(e.target.value),
				placeholder: "Nanaimo, grunt, flan…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chip-row mt-3",
				children: MENUS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setMenu(m.id),
					className: menu === m.id ? "h-11 shrink-0 rounded-full bg-spark px-4 text-sm text-spark-foreground" : "h-11 shrink-0 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]",
					children: [t(locale, m.key), m.id === "all" ? ` ${pool.length}` : ""]
				}, m.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 space-y-3",
				children: list.map((recipe) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeCard, {
					recipe,
					locked: false,
					nutritionOn: true,
					onOpen: () => setActive(recipe)
				}) }, recipe.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: active !== null,
				onOpenChange: (o) => !o && setActive(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					title: active?.name ?? "Dessert",
					children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
							recipe: active,
							className: "h-44 rounded-2xl"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("mt-4 h-2 w-16 rounded-full", cuisineBar(active.cuisine)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted-foreground",
							children: active.description
						}),
						recipeAllergens(active).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: ["Contains: ", recipeAllergens(active).join(", ")]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm tabular-nums",
							children: [
								formatMinutes(active.minutes),
								" · ",
								active.nutrition.cal,
								" kcal / serving · ",
								active.nutrition.protein,
								"g protein"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-1 text-sm",
							children: active.ingredients.map((ing, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								ing.qty,
								" ",
								ing.unit,
								" ",
								ing.name
							] }, `${ing.name}-${i}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-4 list-decimal space-y-2 pl-4 text-sm leading-relaxed",
							children: active.steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: s }, `step-${i}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									onClick: () => {
										assignMeal(mondayOf(), "dinner", active.id);
										setActive(null);
										setTab("plan");
										toast(`Plated ${active.name}`);
									},
									children: t(locale, "plateTonight")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									className: "w-full",
									onClick: () => {
										addExtraGrocery(active.name, "Bakery");
										toast("Added to this week's shop");
									},
									children: t(locale, "addGrocery")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									className: "w-full",
									onClick: () => {
										setCooking({
											id: `cook-${active.id}`,
											date: mondayOf(),
											slot: "dinner",
											recipeId: active.id
										});
										setActive(null);
									},
									children: t(locale, "cookNow")
								})
							]
						})
					] }) : null
				})
			}),
			cooking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookView, {
				meal: cooking,
				onClose: () => setCooking(null)
			}) : null
		]
	});
}
function nid() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
function LiftSheet({ open, onClose }) {
	const body = useSpoonful((s) => s.body) ?? DEFAULT_BODY;
	const sessions = useSpoonful((s) => s.liftSessions);
	const saveLiftSession = useSpoonful((s) => s.saveLiftSession);
	const imperial = body.units !== "metric";
	const [session, setSession] = (0, import_react.useState)(() => emptySession());
	const [picker, setPicker] = (0, import_react.useState)(false);
	const [history, setHistory] = (0, import_react.useState)(false);
	const [rest, setRest] = (0, import_react.useState)(0);
	const [restPreset, setRestPreset] = (0, import_react.useState)(90);
	const [query, setQuery] = (0, import_react.useState)("");
	const [muscle, setMuscle] = (0, import_react.useState)("all");
	const [now, setNow] = (0, import_react.useState)(Date.now());
	const [platesFor, setPlatesFor] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setSession(emptySession());
		setRest(0);
		setPicker(false);
		setHistory(false);
		setQuery("");
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const id = window.setInterval(() => setNow(Date.now()), 1e3);
		return () => window.clearInterval(id);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (rest <= 0) return;
		const id = window.setInterval(() => setRest((n) => Math.max(0, n - 1)), 1e3);
		return () => window.clearInterval(id);
	}, [rest]);
	const volume = (0, import_react.useMemo)(() => sessionVolumeKg(session), [session]);
	const volumeDisp = imperial ? Math.round(lbFromKg(volume)) : Math.round(volume);
	const moves = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return LIFT_MOVES.filter((m) => {
			if (muscle !== "all" && m.muscle !== muscle) return false;
			if (!q) return true;
			return m.name.toLowerCase().includes(q) || m.muscle.includes(q);
		});
	}, [query, muscle]);
	if (!open) return null;
	function addMove(moveId) {
		const move = moveById(moveId);
		const prev = previousLine(sessions, moveId);
		const defaultKg = move?.bodyweight ? body.weightKg : imperial ? kgFromLb(95) : 40;
		const sets = prev?.sets.slice(0, 4).map((s) => ({
			id: nid(),
			reps: s.reps,
			weightKg: s.weightKg,
			done: false,
			warmup: s.warmup
		})) ?? [{
			id: nid(),
			reps: 8,
			weightKg: defaultKg,
			done: false
		}];
		setSession((cur) => ({
			...cur,
			name: cur.lines.length === 0 ? move?.name ?? "Lift" : cur.name,
			lines: [...cur.lines, {
				id: nid(),
				moveId,
				sets
			}]
		}));
		setPicker(false);
		setQuery("");
	}
	function applyTemplate(id) {
		const tpl = LIFT_TEMPLATES.find((t) => t.id === id);
		if (!tpl) return;
		setSession((cur) => {
			const next = {
				...cur,
				name: tpl.name,
				lines: [...cur.lines]
			};
			for (const moveId of tpl.moves) {
				if (next.lines.some((l) => l.moveId === moveId)) continue;
				const move = moveById(moveId);
				const prev = previousLine(sessions, moveId);
				const defaultKg = move?.bodyweight ? body.weightKg : imperial ? kgFromLb(95) : 40;
				next.lines.push({
					id: nid(),
					moveId,
					sets: prev?.sets.slice(0, 4).map((s) => ({
						id: nid(),
						reps: s.reps,
						weightKg: s.weightKg,
						done: false
					})) ?? [{
						id: nid(),
						reps: 8,
						weightKg: defaultKg,
						done: false
					}]
				});
			}
			return next;
		});
		setPicker(false);
	}
	function patchSet(lineId, setId, patch) {
		setSession((cur) => ({
			...cur,
			lines: cur.lines.map((l) => l.id !== lineId ? l : {
				...l,
				sets: l.sets.map((s) => s.id === setId ? {
					...s,
					...patch
				} : s)
			})
		}));
	}
	function addSet(line, warmup = false) {
		const last = line.sets.filter((s) => warmup ? s.warmup : !s.warmup).at(-1) ?? line.sets.at(-1);
		setSession((cur) => ({
			...cur,
			lines: cur.lines.map((l) => l.id !== line.id ? l : {
				...l,
				sets: [...l.sets, {
					id: nid(),
					reps: last?.reps ?? 8,
					weightKg: warmup ? (last?.weightKg ?? 40) * .5 : last?.weightKg ?? 40,
					done: false,
					warmup
				}]
			})
		}));
	}
	function finish() {
		if (sessionVolumeKg(session) <= 0) {
			toast("Log a working set first");
			return;
		}
		const prs = session.lines.filter((line) => {
			const best = bestEpley(sessions, line.moveId);
			return line.sets.some((s) => s.done && !s.warmup && epley1rm(s.weightKg, s.reps) > best && best > 0);
		});
		saveLiftSession({
			...session,
			finishedAt: Date.now()
		});
		toast(prs.length ? `PR on ${prs.map((l) => moveById(l.moveId)?.name ?? l.moveId).join(", ")} — Fuel updated` : "Lift saved — Fuel updated live");
		onClose();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex flex-col bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "pt-[max(0.75rem,env(safe-area-inset-top))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-stretch",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-14 min-w-0 flex-1 items-center justify-between gap-2 px-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "shrink-0",
								onClick: onClose,
								"aria-label": "Close lift",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-xs font-medium uppercase tracking-[0.16em] text-spark",
									children: formatElapsed(now - session.startedAt)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate font-display text-xl tabular-nums leading-tight",
									children: [
										volumeDisp,
										" ",
										imperial ? "lb" : "kg"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "shrink-0",
								onClick: () => setHistory(true),
								"aria-label": "History",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, {})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pill-slot",
						"aria-hidden": true
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 pb-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "spark",
						className: "w-full",
						onClick: finish,
						children: "Finish"
					})
				})]
			}),
			rest > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-4 mt-3 flex items-center justify-between rounded-2xl bg-spark px-4 py-3 text-spark-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2 text-sm font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-4" }), " Rest"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-2xl tabular-nums",
						children: [rest, "s"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm font-medium",
						onClick: () => setRest(0),
						children: "Skip"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chip-row mx-4 mt-3",
				children: REST_PRESETS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setRestPreset(n),
					className: cn("h-11 shrink-0 rounded-full px-3 text-sm", restPreset === n ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]"),
					children: [n, "s rest"]
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28",
				children: [
					session.lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mb-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl",
								children: "Start with a template"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: "Loads last weights when you have them."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 grid grid-cols-2 gap-2",
								children: LIFT_TEMPLATES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => applyTemplate(t.id),
									className: "rounded-3xl bg-card px-4 py-3 text-left shadow-[var(--shadow-border)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: t.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-xs text-muted-foreground",
										children: t.hint
									})]
								}, t.id))
							})
						]
					}) : null,
					session.lines.map((line) => {
						const move = moveById(line.moveId);
						const prev = previousLine(sessions, line.moveId, session.id);
						const best = bestEpley(sessions, line.moveId);
						const lineVol = lineVolumeKg(line);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mb-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-xl",
										children: move?.name ?? line.moveId
									}), prev ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-xs text-muted-foreground",
										children: [
											"Last",
											" ",
											prev.sets.filter((s) => s.done).map((s) => `${s.warmup ? "W" : ""}${s.reps}×${imperial ? Math.round(lbFromKg(s.weightKg)) : Math.round(s.weightKg)}`).join("  ")
										]
									}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs tabular-nums text-muted-foreground",
										children: [
											imperial ? Math.round(lbFromKg(lineVol)) : Math.round(lineVol),
											" ",
											imperial ? "lb" : "kg"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 space-y-2",
									children: line.sets.map((set, i) => {
										const shown = imperial ? Math.round(lbFromKg(set.weightKg)) : Math.round(set.weightKg * 10) / 10;
										const est = epley1rm(set.weightKg, set.reps);
										const isPr = Boolean(set.done && !set.warmup && best > 0 && est > best);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "grid grid-cols-[1.75rem_minmax(0,4.75rem)_minmax(0,1fr)_auto] items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-center text-xs tabular-nums text-muted-foreground",
													children: set.warmup ? "W" : i + 1
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													className: "h-12 px-2 text-center tabular-nums",
													inputMode: "numeric",
													value: String(set.reps),
													onChange: (e) => patchSet(line.id, set.id, { reps: Number(e.target.value) || 0 }),
													"aria-label": "Reps"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex min-w-0 items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														className: "h-12 min-w-0 px-2 text-center tabular-nums",
														inputMode: "decimal",
														value: String(shown),
														onChange: (e) => {
															const n = Number(e.target.value);
															patchSet(line.id, set.id, { weightKg: imperial ? kgFromLb(n || 0) : n || 0 });
														},
														"aria-label": imperial ? "Pounds" : "Kilograms"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "w-7 shrink-0 text-xs text-muted-foreground",
														onClick: () => setPlatesFor(move?.bar ? set.id : null),
														children: imperial ? "lb" : "kg"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => {
														patchSet(line.id, set.id, { done: !set.done });
														if (!set.done) {
															setRest(restPreset);
															try {
																window.navigator.vibrate?.(40);
															} catch {}
														}
													},
													className: cn("h-12 min-w-16 shrink-0 rounded-full px-3 text-sm font-medium", set.done ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]"),
													children: set.done ? isPr ? "PR" : "Done" : "Log"
												})
											]
										}, set.id);
									})
								}),
								platesFor && line.sets.some((s) => s.id === platesFor) && move?.bar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: [
										"Per side",
										" ",
										platesPerSide(line.sets.find((s) => s.id === platesFor)?.weightKg ?? 0, imperial).map((p) => `${p.count}×${p.plate}`).join(" + ") || "bar only"
									]
								}) : null,
								line.sets.some((s) => s.done && !s.warmup && s.reps > 1) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs tabular-nums text-muted-foreground",
									children: [
										"Est 1RM",
										" ",
										imperial ? Math.round(lbFromKg(Math.max(...line.sets.filter((s) => s.done && !s.warmup).map((s) => epley1rm(s.weightKg, s.reps))))) : Math.round(Math.max(...line.sets.filter((s) => s.done && !s.warmup).map((s) => epley1rm(s.weightKg, s.reps)))),
										" ",
										imperial ? "lb" : "kg",
										best > 0 ? ` · best ${imperial ? Math.round(lbFromKg(best)) : Math.round(best)}` : ""
									]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										onClick: () => addSet(line),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), " Add set"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										onClick: () => addSet(line, true),
										children: "Warm-up"
									})]
								})
							]
						}, line.id);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						className: "w-full",
						onClick: () => setPicker(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), " Add exercise"]
					})
				]
			}),
			picker ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-10 flex flex-col bg-background/95 pt-14",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-stretch",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0 flex-1 px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "mb-3",
								onClick: () => setPicker(false),
								children: "Close"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pill-slot",
							"aria-hidden": true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Squat, bench, pull-up…"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "chip-row mt-2 pb-1",
							children: [
								"all",
								"legs",
								"push",
								"pull",
								"core",
								"full"
							].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMuscle(id),
								className: cn("h-11 shrink-0 rounded-full px-3 text-sm capitalize", muscle === id ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]"),
								children: id
							}, id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-10",
						children: [session.lines.length === 0 ? LIFT_TEMPLATES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "mb-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex min-h-12 w-full items-center justify-between rounded-2xl bg-spark/15 px-4 text-left text-sm",
								onClick: () => applyTemplate(t.id),
								children: [t.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: t.hint
								})]
							})
						}, t.id)) : null, moves.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex min-h-12 w-full items-center justify-between rounded-2xl bg-card px-4 text-left text-sm shadow-[var(--shadow-border)]",
							onClick: () => addMove(m.id),
							children: [m.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs capitalize text-muted-foreground",
								children: m.muscle
							})]
						}) }, m.id))]
					})
				]
			}) : null,
			history ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-10 overflow-y-auto bg-background/95 px-4 pt-14 pb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "mb-3",
						onClick: () => setHistory(false),
						children: "Close"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "History"
					}),
					sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "No sessions yet. Finish one and it lands here."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: [...sessions].reverse().slice(0, 12).map((s) => {
							const vol = sessionVolumeKg(s);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: s.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-0.5 text-xs tabular-nums text-muted-foreground",
									children: [
										s.date,
										" · ",
										sessionSetCount(s),
										" sets · ",
										imperial ? Math.round(lbFromKg(vol)) : Math.round(vol),
										" ",
										imperial ? "lb" : "kg",
										" moved"
									]
								})]
							}, s.id);
						})
					})
				]
			}) : null
		]
	});
}
function emptySession() {
	return {
		id: nid(),
		date: isoDate(),
		name: "Lift",
		lines: [],
		startedAt: Date.now()
	};
}
function MacroBar({ label, value, of, unit = "g" }) {
	const p = pct(value, of);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-2 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "tabular-nums text-muted-foreground",
			children: [
				Math.round(value),
				unit,
				" / ",
				Math.round(of),
				unit
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "meter mt-1.5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn(p > 100 ? "bg-destructive" : "bg-spark"),
			style: { width: `${Math.min(p, 100)}%` }
		})
	})] });
}
var FITNESS_SOURCES = [
	{
		id: "apple",
		label: "Apple Health",
		hint: "iPhone and Apple Watch"
	},
	{
		id: "google",
		label: "Google Fit",
		hint: "Android and Wear OS"
	},
	{
		id: "samsung",
		label: "Samsung Health",
		hint: "Galaxy phones and watches"
	},
	{
		id: "garmin",
		label: "Garmin",
		hint: "Watches and bike computers"
	},
	{
		id: "fitbit",
		label: "Fitbit",
		hint: "Bands and Versa"
	},
	{
		id: "strava",
		label: "Strava",
		hint: "Runs and rides"
	}
];
var SYNC_ACCESS = [{
	id: "always",
	label: "Always allow",
	hint: "Keep Fuel current even when Spoonful is closed"
}, {
	id: "while-using",
	label: "While using the app",
	hint: "Sync only while this kitchen is open"
}];
var TAG = "spoonful-fuel";
var PENDING = "/__spoonful-pending-sync";
var CACHE = "spoonful-sync";
async function registration() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
	try {
		return await navigator.serviceWorker.register("/sync-sw.js", { scope: "/" });
	} catch {
		return null;
	}
}
/** Turn on background pulls — notifications + periodic sync when the OS allows it. */
async function enableAlwaysSync() {
	const push = await enablePush();
	const reg = await registration();
	if (!reg) return push;
	try {
		await reg.update();
	} catch {}
	try {
		await reg.periodicSync?.register(TAG, { minInterval: 9e5 });
	} catch {}
	try {
		await reg.sync?.register(TAG);
	} catch {}
	return push;
}
async function disableAlwaysSync() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
	try {
		await (await navigator.serviceWorker.ready).periodicSync?.unregister(TAG);
	} catch {}
	try {
		await (await caches.open(CACHE)).delete(PENDING);
	} catch {}
}
async function consumePendingSync() {
	if (typeof caches === "undefined") return false;
	try {
		const cache = await caches.open(CACHE);
		if (!await cache.match(PENDING)) return false;
		await cache.delete(PENDING);
		return true;
	} catch {
		return false;
	}
}
function onBackgroundSync(handler) {
	if (typeof navigator === "undefined" || !navigator.serviceWorker) return () => {};
	const onMsg = (event) => {
		if (event.data && event.data.type === "spoonful-sync") handler();
	};
	navigator.serviceWorker.addEventListener("message", onMsg);
	return () => navigator.serviceWorker.removeEventListener("message", onMsg);
}
function FitView({ onOpenStore }) {
	const goal = useSpoonful((s) => s.goal);
	const meals = useSpoonful((s) => s.meals);
	const pantry = useSpoonful((s) => s.pantry);
	const workouts = useSpoonful((s) => s.workouts);
	const stepsByDate = useSpoonful((s) => s.stepsByDate);
	const setSteps = useSpoonful((s) => s.setSteps);
	const addWorkout = useSpoonful((s) => s.addWorkout);
	const removeWorkout = useSpoonful((s) => s.removeWorkout);
	const assignMeal = useSpoonful((s) => s.assignMeal);
	const fillFromFuel = useSpoonful((s) => s.fillFromFuel);
	const setTab = useSpoonful((s) => s.setTab);
	const unlocked = useSpoonful((s) => s.unlocked);
	const prefs = useSpoonful((s) => s.prefs);
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const weekStart = useSpoonful((s) => s.weekStart);
	const snacks = useSpoonful((s) => s.snacks);
	const addSnack = useSpoonful((s) => s.addSnack);
	const removeSnack = useSpoonful((s) => s.removeSnack);
	const xp = useSpoonful((s) => s.xp);
	const body = useSpoonful((s) => s.body);
	const setBody = useSpoonful((s) => s.setBody);
	const applyBodyGoal = useSpoonful((s) => s.applyBodyGoal);
	const fitnessSource = useSpoonful((s) => s.fitnessSource);
	const lastSyncAt = useSpoonful((s) => s.lastSyncAt);
	const liftSessions = useSpoonful((s) => s.liftSessions);
	const weightLog = useSpoonful((s) => s.weightLog) ?? [];
	const syncFitness = useSpoonful((s) => s.syncFitness);
	const healthByDate = useSpoonful((s) => s.healthByDate) ?? {};
	const autoPlate = useSpoonful((s) => s.autoPlate);
	const setAutoPlate = useSpoonful((s) => s.setAutoPlate);
	const logWater = useSpoonful((s) => s.logWater);
	const hasAddon = useSpoonful((s) => s.hasAddon);
	const syncAccess = useSpoonful((s) => s.syncAccess);
	const setSyncAccess = useSpoonful((s) => s.setSyncAccess);
	const today = isoDate();
	const todayWork = workouts.filter((w) => w.date === today);
	const todaySnacks = snacks.filter((s) => s.date === today);
	const eaten = nutritionForDate(meals, today, snacks);
	const health = healthByDate[today];
	const synced = hasAddon("body-sync");
	let fuel = dayFuel({
		goal,
		eaten,
		workouts: todayWork,
		steps: stepsByDate[today] ?? health?.steps ?? 0,
		body
	});
	if (synced && health) fuel = applyHealthToFuel(fuel, health);
	const afterLift = todayWork.some((w) => w.kind === "lift");
	const pool = unlockedRecipes(unlocked).filter((r) => recipeAllowed(r, prefs, allergies, hidden));
	const recovery = health && synced ? recoveryLabel(health) : void 0;
	const ranked = (0, import_react.useMemo)(() => rankForFuel(pool, fuel.remaining, pantry.map((p) => p.name), {
		afterLift,
		recovery
	}).slice(0, 4), [
		pool,
		fuel.remaining,
		pantry,
		afterLift,
		recovery
	]);
	const advice = health ? healthAdvice(health) : null;
	const rank = rankProgress(xp);
	const weekProtein = weekDates(weekStart).reduce((sum, d) => sum + nutritionForDate(meals, d, snacks).protein, 0);
	const [minutes, setMinutes] = (0, import_react.useState)("45");
	const [kind, setKind] = (0, import_react.useState)("run");
	const [distance, setDistance] = (0, import_react.useState)("");
	const [stepDraft, setStepDraft] = (0, import_react.useState)(String(stepsByDate[today] ?? ""));
	const [liftOpen, setLiftOpen] = (0, import_react.useState)(false);
	const [editBody, setEditBody] = (0, import_react.useState)(false);
	const tdee = tdeeKcal(body);
	const bmr = bmrKcal(body);
	const lastLift = liftSessions[liftSessions.length - 1];
	const srcLabel = FITNESS_SOURCES.find((s) => s.id === fitnessSource)?.label;
	const imperial = body.units !== "metric";
	const activity = ACTIVITY.find((a) => a.id === body.activity);
	const access = syncAccess ?? (fitnessSource ? "while-using" : null);
	(0, import_react.useEffect)(() => {
		if (!fitnessSource) return;
		if (!useSpoonful.getState().healthByDate[isoDate()]) {
			const plated = syncFitness({ live: false });
			if (plated) toast(`Plated ${plated} from the watch`);
		}
		if (access === "always") return;
		syncFitness({ live: true });
		const id = window.setInterval(() => {
			if (document.visibilityState !== "visible") return;
			syncFitness({ live: true });
		}, 4e4);
		return () => window.clearInterval(id);
	}, [
		fitnessSource,
		syncFitness,
		access
	]);
	(0, import_react.useEffect)(() => {
		setStepDraft(String(stepsByDate[today] ?? ""));
	}, [stepsByDate, today]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-32 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: "Live Fuel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl leading-tight",
				children: "Fuel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-foreground/80",
				children: "Calories from your body (Mifflin–St Jeor), ACSM METs for cardio, and the actual pounds on the bar for lifts. A linked watch writes the same numbers here, live."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-spark p-4 text-spark-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium uppercase tracking-[0.14em] opacity-80",
							children: "Right now"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-spark-foreground" }), srcLabel ? `${srcLabel} ${access === "always" ? "always" : "live"}` : "Kitchen live"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveStat, {
								label: "Left",
								value: `${Math.round(fuel.remaining.cal)}`,
								hint: "kcal"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveStat, {
								label: "Protein",
								value: `${Math.round(fuel.remaining.protein)}`,
								hint: "g"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveStat, {
								label: "Burned",
								value: `${Math.round(fuel.burn)}`,
								hint: "kcal"
							})
						]
					}),
					lastSyncAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs opacity-80",
						children: [
							access === "always" ? "Always allow · " : "",
							"Last pull ",
							new Date(lastSyncAt).toLocaleTimeString([], {
								hour: "numeric",
								minute: "2-digit"
							})
						]
					}) : null
				]
			}),
			health && fitnessSource ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "From the watch"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: access === "always" ? "Rings, heart, sleep, and water — still pulling after you leave the kitchen." : "Rings, heart, sleep, and water — updates while Fuel is open. Switch to Always allow in Extras to keep going when you leave."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartPulse, { className: "size-5 shrink-0 text-spark" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center justify-center gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ring, {
								label: "Move",
								value: health.activeKcal,
								of: health.moveGoal,
								unit: "kcal"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ring, {
								label: "Exercise",
								value: health.exerciseMin,
								of: health.exerciseGoal,
								unit: "min"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ring, {
								label: "Stand",
								value: health.standHours,
								of: health.standGoal,
								unit: "hr"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Steps",
								value: health.steps.toLocaleString(),
								hint: `${health.distanceKm} km`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Heart",
								value: `${health.heartRate}`,
								hint: `rest ${health.restingHr}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "HRV",
								value: `${health.hrvMs}`,
								hint: "ms"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Sleep",
								value: `${health.sleepHours}h`,
								hint: `score ${health.sleepScore}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "VO₂",
								value: `${health.vo2max}`,
								hint: "ml/kg"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "SpO₂",
								value: `${health.spo2}%`,
								hint: `${health.flights} flights`
							})
						]
					}),
					advice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("mt-4 rounded-2xl px-4 py-3", advice.recovery === "low" ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-[0.14em]",
								children: advice.recovery === "low" ? "Recover" : advice.recovery === "high" ? "Fuel up" : "Steady"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-xl",
								children: advice.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("mt-1 text-sm leading-relaxed", advice.recovery === "low" ? "opacity-90" : "text-muted-foreground"),
								children: advice.body
							}),
							!synced ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs opacity-80",
								children: "Body Sync applies this to tonight automatically. Suggestions below still work — tap to plate."
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: "Water"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs tabular-nums text-muted-foreground",
									children: [health.waterMl, " / 2000 ml"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex h-2 overflow-hidden rounded-full bg-background",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "bg-primary",
									style: { width: `${pct(health.waterMl, 2e3)}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									className: "flex-1",
									onClick: () => {
										logWater(250);
										toast("Glass logged");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplets, {}), "+250 ml"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									onClick: () => {
										logWater(-250);
										toast("Undid a glass");
									},
									children: "Undo"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: access === "always" ? "Always allow" : "While using the app"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-xs text-muted-foreground",
								children: access === "always" ? "Fuel keeps updating after you leave." : "Switch on to sync even when Spoonful is closed."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "switch",
							"aria-checked": access === "always",
							onClick: async () => {
								if (access === "always") {
									setSyncAccess("while-using");
									await disableAlwaysSync();
									toast("Syncs only while this kitchen is open");
									return;
								}
								setSyncAccess("always");
								const ok = await enableAlwaysSync();
								toast(ok ? "Always allow — Fuel keeps updating after you leave" : "Always allow is on. Allow notifications so you hear when dinner plates while you’re away.");
							},
							className: cn("h-11 w-16 shrink-0 rounded-full text-xs font-semibold", access === "always" ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]"),
							children: access === "always" ? "On" : "Off"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: synced ? "Auto-plate dinner" : "Auto-plate is Body Sync"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-xs text-muted-foreground",
								children: synced ? "After each full pull, tonight fills if the slot is empty. Manual stays." : "See every metric for free. One payment lets the kitchen plate from them."
							})]
						}), synced ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "switch",
							"aria-checked": autoPlate,
							onClick: () => setAutoPlate(!autoPlate),
							className: cn("h-11 w-16 shrink-0 rounded-full text-xs font-semibold", autoPlate ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]"),
							children: autoPlate ? "On" : "Off"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "spark",
							className: "shrink-0",
							onClick: () => {
								onOpenStore?.();
							},
							children: "$6.99"
						})]
					})
				]
			}) : fitnessSource ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: "Pulling the watch snapshot…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: "Link Apple Health, Health Connect, Garmin, Fitbit, or Strava in Extras — Fuel fills live. You can still type steps and workouts below."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Rank",
						value: rank.current.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "TDEE",
						value: `${tdee}`,
						hint: "kcal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Weight",
						value: formatWeight(body)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl",
									children: "Body"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: [
										formatHeight(body),
										" · ",
										body.age,
										"y · ",
										body.sex,
										" · ",
										body.goalKind
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs leading-relaxed text-muted-foreground",
									children: [
										"BMR ",
										bmr,
										" kcal (Mifflin–St Jeor) × ",
										activity?.label ?? "Active",
										" ",
										activity?.factor ?? 1.55,
										" = TDEE ",
										tdee,
										". Training today is added on top so it is not counted twice."
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "shrink-0",
							onClick: () => setEditBody((v) => !v),
							children: editBody ? "Close" : "Edit"
						})]
					}),
					editBody ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [["female", "male"].map((sex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setBody({ sex }),
									className: cn("h-11 flex-1 rounded-full text-sm", body.sex === sex ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]"),
									children: sex === "female" ? "Female" : "Male"
								}, sex)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setBody({ units: imperial ? "metric" : "imperial" }),
									className: "h-11 rounded-full bg-background px-4 text-sm shadow-[var(--shadow-border)]",
									children: imperial ? "lb / ft" : "kg / cm"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-2 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-muted-foreground",
										children: ["Age", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											inputMode: "numeric",
											defaultValue: String(body.age),
											onBlur: (e) => setBody({ age: Math.max(16, Math.min(80, Number(e.target.value) || 34)) })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-muted-foreground",
										children: [imperial ? "Weight lb" : "Weight kg", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											inputMode: "decimal",
											defaultValue: String(imperial ? Math.round(lbFromKg(body.weightKg)) : Math.round(body.weightKg)),
											onBlur: (e) => {
												const n = Number(e.target.value);
												setBody({ weightKg: imperial ? kgFromLb(n || 160) : n || 74 });
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-muted-foreground",
										children: [imperial ? "Height in" : "Height cm", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											inputMode: "numeric",
											defaultValue: String(imperial ? Math.round(body.heightCm / 2.54) : Math.round(body.heightCm)),
											onBlur: (e) => {
												const n = Number(e.target.value);
												setBody({ heightCm: imperial ? n * 2.54 : n || 168 });
											}
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-w-0 flex-wrap gap-1.5",
								children: ACTIVITY.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setBody({ activity: a.id }),
									className: cn("h-11 min-w-0 max-w-full truncate rounded-full px-3 text-sm", body.activity === a.id ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
									children: a.label
								}, a.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-1.5",
								children: GOAL_KINDS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setBody({ goalKind: g.id }),
									className: cn("h-11 min-w-0 flex-1 truncate rounded-full px-2 text-sm", body.goalKind === g.id ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]"),
									children: g.label
								}, g.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full",
								onClick: () => {
									applyBodyGoal();
									toast(`Targets set to ${macrosFromBody(useSpoonful.getState().body).cal} kcal`);
									setEditBody(false);
								},
								children: "Recalculate targets"
							})
						]
					}) : null,
					weightLog.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Weight"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex h-16 items-end gap-1",
								children: weightLog.slice(-10).map((w) => {
									const nums = weightLog.map((x) => x.kg);
									const min = Math.min(...nums);
									const max = Math.max(...nums);
									const span = Math.max(1, max - min);
									const h = 24 + (w.kg - min) / span * 40;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex min-w-0 flex-1 flex-col items-center justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-full rounded-t-md bg-spark",
											style: { height: `${h}px` }
										})
									}, w.date);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs tabular-nums text-muted-foreground",
								children: [
									formatWeight({
										...body,
										weightKg: weightLog[0].kg
									}),
									" → ",
									formatWeight(body)
								]
							})
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Today"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroBar, {
								label: "Protein",
								value: fuel.eaten.protein,
								of: fuel.target.protein
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroBar, {
								label: "Carbs",
								value: fuel.eaten.carbs,
								of: fuel.target.carbs
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroBar, {
								label: "Fat",
								value: fuel.eaten.fat,
								of: fuel.target.fat
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroBar, {
								label: "Calories",
								value: fuel.eaten.cal,
								of: fuel.target.cal,
								unit: ""
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: [
							"Week protein ",
							Math.round(weekProtein),
							"g · target ",
							goal.protein * 7,
							"g · TDEE ",
							tdee,
							" before training"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Lift"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Sets, reps, and load. Heavier bar, more burn — volume × range of motion, not a flat 6 kcal/min guess."
					}),
					lastLift ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs tabular-nums text-muted-foreground",
						children: [
							"Last session ",
							Math.round(imperial ? lbFromKg(sessionVolumeKg(lastLift)) : sessionVolumeKg(lastLift)),
							" ",
							imperial ? "lb" : "kg",
							" moved"
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-3 w-full",
						variant: "spark",
						onClick: () => setLiftOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dumbbell, {}), "Start lifting"]
					}),
					liftSessions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1",
						children: [...liftSessions].reverse().slice(0, 4).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between text-xs tabular-nums text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								s.name,
								" · ",
								s.date
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								imperial ? Math.round(lbFromKg(sessionVolumeKg(s))) : Math.round(sessionVolumeKg(s)),
								" ",
								imperial ? "lb" : "kg"
							] })]
						}, s.id))
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Already ate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Closes the gap before dinner. Values are per serving."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-1.5",
						children: SNACKS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								addSnack({
									date: today,
									name: s.name,
									nutrition: s.nutrition
								});
								toast(`${s.name} logged`);
							},
							className: "h-11 rounded-full bg-background px-3.5 text-sm shadow-[var(--shadow-border)]",
							children: [s.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-1 tabular-nums text-muted-foreground",
								children: [s.nutrition.protein, "g"]
							})]
						}, s.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: todaySnacks.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between rounded-2xl bg-background px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									s.name,
									" · ",
									s.nutrition.protein,
									"g · ",
									s.nutrition.cal,
									" kcal"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex size-11 items-center justify-center",
								"aria-label": "Remove snack",
								onClick: () => removeSnack(s.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})]
						}, s.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Cardio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex gap-2",
						onSubmit: (e) => {
							e.preventDefault();
							const n = Number(stepDraft);
							if (!Number.isFinite(n)) return;
							setSteps(today, n);
							toast("Steps saved — burn updated");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "relative min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Steps today"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footprints, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: stepDraft,
									onChange: (e) => setStepDraft(e.target.value),
									inputMode: "numeric",
									placeholder: "Steps today",
									className: "pl-10"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "secondary",
							children: "Save"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-1.5",
						children: WORKOUTS.filter((w) => w.id !== "lift").map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setKind(w.id),
							className: cn("h-11 rounded-full px-3.5 text-sm", kind === w.id ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
							children: w.label
						}, w.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: minutes,
							onChange: (e) => setMinutes(e.target.value),
							inputMode: "numeric",
							placeholder: "Minutes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: distance,
							onChange: (e) => setDistance(e.target.value),
							inputMode: "decimal",
							placeholder: kind === "ride" || kind === "run" || kind === "walk" ? "Km" : "—"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-2 w-full",
						variant: "spark",
						onClick: () => {
							const mins = Number(minutes) || 30;
							const km = Number(distance) || void 0;
							addWorkout({
								date: today,
								kind,
								minutes: mins,
								distanceKm: km
							});
							toast("Logged — remaining macros moved");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Log"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: todayWork.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between rounded-2xl bg-background px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									WORKOUTS.find((x) => x.id === w.kind)?.label,
									" · ",
									w.minutes,
									" min · ",
									workoutKcal(w, body),
									" kcal",
									w.volumeKg ? ` · ${Math.round(imperial ? lbFromKg(w.volumeKg) : w.volumeKg)} ${imperial ? "lb" : "kg"}` : ""
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex size-11 items-center justify-center",
								"aria-label": "Remove workout",
								onClick: () => removeWorkout(w.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})]
						}, w.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Fuel me"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								"Ranked for remaining macros after that work",
								synced && health ? " and tonight’s recovery" : "",
								"."
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-5 text-spark" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: ranked.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								assignMeal(today, "dinner", hit.recipe.id);
								setTab("plan");
								toast(`Plated ${hit.recipe.name} tonight`);
							},
							className: "relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-card p-3 text-left shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-y-3 left-2 w-1 rounded-full", cuisineBar(hit.recipe.cuisine)) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
									kind: hit.recipe.plate,
									className: "ml-2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate font-medium",
											children: hit.recipe.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-0.5 text-xs text-muted-foreground",
											children: hit.why
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs tabular-nums text-muted-foreground",
											children: [
												hit.recipe.nutrition.protein,
												"g protein · ",
												hit.recipe.nutrition.cal,
												" kcal · ",
												formatMinutes(hit.recipe.minutes)
											]
										})
									]
								})
							]
						}) }, hit.recipe.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-4 w-full",
						variant: "secondary",
						onClick: () => {
							const n = fillFromFuel();
							toast(n ? `Fueled ${n} empty night${n === 1 ? "" : "s"}` : "This week is already full");
							setTab("plan");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dumbbell, {}), "Fuel the empty nights"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiftSheet, {
				open: liftOpen,
				onClose: () => setLiftOpen(false)
			})
		]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 overflow-hidden rounded-3xl bg-card px-3 py-3 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 truncate font-display text-xl tabular-nums leading-tight",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: hint
			}) : null
		]
	});
}
function LiveStat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs opacity-80",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 truncate font-display text-2xl tabular-nums leading-tight sm:text-3xl",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs opacity-80",
				children: hint
			}) : null
		]
	});
}
function Ring({ label, value, of, unit }) {
	const p = pct(value, of) / 100;
	const r = 22;
	const c = 2 * Math.PI * r;
	const dash = `${c * p} ${c}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 56 56",
				className: "size-16",
				"aria-hidden": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "28",
					cy: "28",
					r,
					fill: "none",
					className: "stroke-border",
					strokeWidth: "6"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "28",
					cy: "28",
					r,
					fill: "none",
					className: "stroke-spark",
					strokeWidth: "6",
					strokeDasharray: dash,
					strokeLinecap: "round",
					transform: "rotate(-90 28 28)"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs tabular-nums text-muted-foreground",
				children: [
					Math.round(value),
					" ",
					unit
				]
			})
		]
	});
}
var PREFS = [
	{
		id: "vegetarian",
		label: "Vegetarian",
		hint: "No meat or fish"
	},
	{
		id: "vegan",
		label: "Vegan",
		hint: "No animal products"
	},
	{
		id: "pescatarian",
		label: "Pescatarian",
		hint: "Fish is fine"
	},
	{
		id: "gluten-free",
		label: "Gluten-free",
		hint: "No wheat, barley, rye"
	},
	{
		id: "sugar-free",
		label: "Sugar-free",
		hint: "No added sugar"
	},
	{
		id: "quick",
		label: "Weeknights",
		hint: "Under 30 minutes"
	},
	{
		id: "budget",
		label: "Budget",
		hint: "Pantry-first cooking"
	}
];
function Onboarding() {
	const completeOnboarding = useSpoonful((s) => s.completeOnboarding);
	const [household, setHousehold] = (0, import_react.useState)(2);
	const [prefs, setPrefs] = (0, import_react.useState)([]);
	const [allergies, setAllergies] = (0, import_react.useState)([]);
	const [nextGen, setNextGen] = (0, import_react.useState)(false);
	const [body, setBody] = (0, import_react.useState)(DEFAULT_BODY);
	const [locale, setLocale] = (0, import_react.useState)("en");
	const [country, setCountry] = (0, import_react.useState)("CA");
	const macros = (0, import_react.useMemo)(() => macrosFromBody(body), [body]);
	const tdee = (0, import_react.useMemo)(() => tdeeKcal(body), [body]);
	const imperial = body.units !== "metric";
	function toggle(id) {
		setPrefs((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
	}
	function toggleAllergy(id) {
		setAllergies((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
	}
	function finish(sample) {
		completeOnboarding({
			household,
			prefs,
			allergies,
			sample,
			nextGen,
			goal: macros,
			body,
			locale,
			country
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col overflow-x-clip px-6 pb-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chrome-gutter h-14 shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KitchenHero, { className: "mx-auto" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs font-medium uppercase tracking-[0.18em] text-spark",
				children: "Spoonful"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-3 font-display text-5xl leading-[0.95] text-foreground",
				children: [
					"Dinner,",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"decided."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-sm text-base leading-relaxed text-foreground/80",
				children: "Huge plates. One shop. Snap the fridge. Simple for anyone. Next Gen if you train — calories from your actual body."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-medium",
					children: "How you want it"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setNextGen(false),
						className: cn("rounded-3xl px-4 py-4 text-left", !nextGen ? "bg-spark text-spark-foreground" : "bg-card text-foreground shadow-[var(--shadow-border)]"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl leading-tight",
							children: "Simple Kitchen"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-1 text-sm leading-relaxed", !nextGen ? "opacity-90" : "text-muted-foreground"),
							children: "Huge type. Tonight on top. One tap to pick dinner."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setNextGen(true),
						className: cn("rounded-3xl px-4 py-4 text-left", nextGen ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-[var(--shadow-border)]"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl leading-tight",
							children: "Next Gen"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-1 text-sm leading-relaxed", nextGen ? "opacity-90" : "text-muted-foreground"),
							children: "Workouts change dinner. Remaining protein from your weight, height, and what you lifted."
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-medium",
						children: "Your body"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Mifflin–St Jeor BMR. Training added on top. Change anytime in Fuel."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [["female", "male"].map((sex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setBody((b) => ({
								...b,
								sex
							})),
							className: cn("h-11 flex-1 rounded-full text-sm", body.sex === sex ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]"),
							children: sex === "female" ? "Female" : "Male"
						}, sex)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setBody((b) => ({
								...b,
								units: imperial ? "metric" : "imperial"
							})),
							className: "h-11 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]",
							children: imperial ? "lb / in" : "kg / cm"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs text-muted-foreground",
								children: ["Age", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1",
									inputMode: "numeric",
									value: String(body.age || ""),
									onChange: (e) => setBody((b) => ({
										...b,
										age: Number(e.target.value) || 0
									}))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs text-muted-foreground",
								children: [imperial ? "Weight (lb)" : "Weight (kg)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1",
									inputMode: "decimal",
									value: String(imperial ? Math.round(lbFromKg(body.weightKg)) || "" : Math.round(body.weightKg) || ""),
									onChange: (e) => {
										const n = Number(e.target.value);
										setBody((b) => ({
											...b,
											weightKg: imperial ? kgFromLb(n || 0) : n || 0
										}));
									}
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs text-muted-foreground",
								children: [imperial ? "Height (in)" : "Height (cm)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1",
									inputMode: "numeric",
									value: String(imperial ? Math.round(body.heightCm / 2.54) || "" : Math.round(body.heightCm) || ""),
									onChange: (e) => {
										const n = Number(e.target.value);
										setBody((b) => ({
											...b,
											heightCm: imperial ? n * 2.54 : n || 0
										}));
									}
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-1.5",
						children: ACTIVITY.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setBody((b) => ({
								...b,
								activity: a.id
							})),
							className: cn("h-11 rounded-full px-3 text-sm", body.activity === a.id ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]"),
							children: a.label
						}, a.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-1.5",
						children: GOAL_KINDS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setBody((b) => ({
								...b,
								goalKind: g.id
							})),
							className: cn("h-11 min-w-0 flex-1 truncate rounded-full px-2 text-sm", body.goalKind === g.id ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]"),
							children: g.label
						}, g.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm tabular-nums text-foreground",
						children: [
							tdee,
							" kcal TDEE · ",
							macros.cal,
							" kcal target · ",
							macros.protein,
							"g protein"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-medium",
					children: "Who is eating"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-2",
					children: [
						1,
						2,
						3,
						4,
						5,
						6
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setHousehold(n),
						className: cn("flex size-12 items-center justify-center rounded-full text-base font-medium", household === n ? "bg-spark text-spark-foreground" : "bg-card text-foreground shadow-[var(--shadow-border)]"),
						children: n
					}, n))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-medium",
						children: "Skip these"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Kitchen Shield hides them from every suggestion."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: ALLERGIES.map((a) => {
							const on = allergies.includes(a.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => toggleAllergy(a.id),
								className: cn("min-h-16 rounded-2xl px-4 py-3 text-left", on ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: a.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("mt-0.5 text-xs", on ? "opacity-80" : "text-muted-foreground"),
									children: a.hint
								})]
							}, a.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-medium",
						children: "How you like to cook"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Optional. Change later in Extras."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: PREFS.map((pref) => {
							const on = prefs.includes(pref.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => toggle(pref.id),
								className: cn("min-h-16 rounded-2xl px-4 py-3 text-left", on ? "bg-accent text-accent-foreground" : "bg-card shadow-[var(--shadow-border)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: pref.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: pref.hint
								})]
							}, pref.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-medium",
					children: "Language and country"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted-foreground",
						children: ["Language", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "mt-1.5 w-full",
							value: locale,
							onChange: (e) => setLocale(e.target.value),
							children: LOCALES.map((loc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: loc.id,
								children: loc.label
							}, loc.id))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted-foreground",
						children: ["Country", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "mt-1.5 w-full",
							value: country,
							onChange: (e) => setCountry(e.target.value),
							children: COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: c.id,
								children: c.label
							}, c.id))
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					variant: "spark",
					className: "w-full",
					onClick: () => finish(true),
					children: "Fill a sample week"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					variant: "secondary",
					className: "w-full",
					onClick: () => finish(false),
					children: "Start with a blank week"
				})]
			})
		]
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var usernameSchema = string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{2,19}$/, "3–20 letters, numbers, underscores. Start with a letter.");
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1086152078e9105399a098e0916ebee1df42f9fb84f46e13242dab4b7f64bf57"));
var claimUsername = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	username: usernameSchema,
	displayName: string().max(40).optional()
}).parse(input)).handler(createSsrRpc("ba7bab22faaa8d2289cbec7c2ea0a6a0c9ac38dbca5fcf76181340ad27c1a2fb"));
var searchPeople = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ q: string().max(40) }).parse(input)).handler(createSsrRpc("c5ba5231e281610651e5455717aab8baee86c80215d751ba422fe1357b320b0f"));
var toggleFollow = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ userId: string().min(1) }).parse(input)).handler(createSsrRpc("9744b4ae3d4ee5d93fe9acf584683016ecb5fe13ac82f74a0c8b0c676cb4be7d"));
var setNotifyPref = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	followeeId: string(),
	enabled: boolean()
}).parse(input)).handler(createSsrRpc("661493697190ca5a804ade825aa13696900299978645a719fd3fa11cce8de66d"));
var listFollowing = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9e300ca4071d476c019a0eaf45edef11cf59e52e9d3715200001218e1089f9be"));
var saveCommunityRecipe = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().optional(),
	name: string().min(2).max(80),
	description: string().max(400).optional(),
	minutes: number().min(1).max(600),
	servings: number().min(1).max(24),
	cuisine: string().max(40),
	visibility: _enum([
		"private",
		"followers",
		"public"
	]),
	ingredients: array(object({
		name: string(),
		qty: number(),
		unit: string(),
		aisle: string()
	})),
	steps: array(string()),
	aliases: string().max(200).optional()
}).parse(input)).handler(createSsrRpc("5c81af334a11b1e56a474a9c2c1733d1abd361c78205e78363a0415695e7e5b5"));
var listMyRecipes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1f307393bfa8c38646ef74425ed07f758e51172ea8b7b93a699fff3187a027a1"));
var feedRecipes = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ q: string().max(80).optional() }).parse(input ?? {})).handler(createSsrRpc("513c0b2719302555d71dda8ad596276e6b49e25bd32481470888738bd4dec810"));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("118dae8bdb96c610e65feddb021127e23c10f8cb4369dbdc9827af29841bc565"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("8775c9b78e77fedfd0e6ed1e8f1ece53baa9fb2d8d2abf1ccace9ef5fba68030"));
var listConversations = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d4129d70d4ed76cc56f1c957286ba86bcece1f59ceda3ee68392642ea9b5d9ca"));
var openDirectChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ userId: string() }).parse(input)).handler(createSsrRpc("cb4485f14c930b9641ab5a277c7cb28d2c1dd217336e4a151c44a5275058283c"));
var createGroupChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	title: string().min(1).max(40),
	memberIds: array(string()).max(12)
}).parse(input)).handler(createSsrRpc("a09498e615ba9fdc9570c67a55a5b851893362772e4d96a49dc50a3900e19690"));
var listMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ conversationId: string() }).parse(input)).handler(createSsrRpc("27e239d96a633ef7e86d5f7d14281b81a12a9c69ed1582876c5fd81c11deec58"));
var sendMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	conversationId: string(),
	body: string().min(1).max(1e3)
}).parse(input)).handler(createSsrRpc("57a6f61cc3d7edb8cd081cf00a5df78f082f42bc99fbebc9f19961403928c4ab"));
function PeopleView() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-4 pt-8 text-sm text-muted-foreground",
		children: "Loading…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg px-6 pt-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Cooks"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted-foreground",
				children: "Sign in to claim a unique username, post homemade recipes, follow people, and chat."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/login",
				className: "mt-6 inline-flex h-11 items-center rounded-full bg-spark px-5 text-sm font-medium text-spark-foreground",
				children: "Sign in"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleHome, {});
}
function PeopleHome() {
	const [section, setSection] = (0, import_react.useState)("cooks");
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [activeChat, setActiveChat] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		getMyProfile().then((p) => setProfile(p));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-28 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: profile ? `@${profile.username}` : "People"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-3xl",
				children: "Kitchen table"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chip-row mt-4",
				children: [
					["cooks", "Cooks"],
					["table", "Family"],
					["mine", "My recipes"],
					["chat", "Chat"],
					["alerts", "Alerts"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSection(id),
					className: section === id ? "h-9 shrink-0 rounded-full bg-spark px-3.5 text-sm text-spark-foreground" : "h-9 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]",
					children: label
				}, id))
			}),
			section === "cooks" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CooksPane, { onOpenChat: (id) => {
				setActiveChat(id);
				setSection("chat");
			} }) : null,
			section === "mine" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MinePane, {}) : null,
			section === "chat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPane, {
				activeId: activeChat,
				onActiveId: setActiveChat
			}) : null,
			section === "alerts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertsPane, {}) : null,
			section === "table" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FamilyPane, {}) : null
		]
	});
}
function CooksPane({ onOpenChat }) {
	const [q, setQ] = (0, import_react.useState)("");
	const [rows, setRows] = (0, import_react.useState)([]);
	const [following, setFollowing] = (0, import_react.useState)([]);
	async function refresh() {
		const list = await listFollowing();
		setFollowing(list);
		if (q.trim()) setRows(await searchPeople({ data: { q } }));
	}
	(0, import_react.useEffect)(() => {
		refresh();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex min-w-0 gap-2",
				onSubmit: async (e) => {
					e.preventDefault();
					setRows(await searchPeople({ data: { q } }));
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "min-w-0 flex-1",
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Find a username"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "secondary",
					className: "shrink-0",
					children: "Search"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: rows.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex min-w-0 flex-col gap-2 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate font-medium",
							children: ["@", p.username]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: p.display_name
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: async () => {
								const res = await openDirectChat({ data: { userId: p.user_id } });
								if (res.ok) onOpenChat(res.id);
								else toast("Could not open a private chat");
							},
							children: "Message"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: p.following ? "secondary" : "default",
							onClick: async () => {
								await toggleFollow({ data: { userId: p.user_id } });
								await refresh();
								setRows(await searchPeople({ data: { q } }));
							},
							children: p.following ? "Following" : "Follow"
						})]
					})]
				}, p.user_id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl",
				children: "Following"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: following.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-2 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0 flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-medium",
								children: ["@", p.username]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": p.notify ? "Mute recipe alerts" : "Unmute recipe alerts",
							className: "flex size-11 items-center justify-center",
							onClick: async () => {
								await setNotifyPref({ data: {
									followeeId: p.user_id,
									enabled: !p.notify
								} });
								await refresh();
							},
							children: p.notify ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "size-4 text-muted-foreground" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "icon-sm",
							variant: "secondary",
							"aria-label": `Chat with ${p.username}`,
							onClick: async () => {
								const res = await openDirectChat({ data: { userId: p.user_id } });
								if (res.ok) onOpenChat(res.id);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {})
						})
					]
				}, p.user_id))
			})
		]
	});
}
function MinePane() {
	const assignCustom = useSpoonful((s) => s.assignCustom);
	const setTab = useSpoonful((s) => s.setTab);
	const [mine, setMine] = (0, import_react.useState)([]);
	const [feed, setFeed] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	async function refresh() {
		setMine(await listMyRecipes());
		setFeed(await feedRecipes({ data: {} }));
	}
	(0, import_react.useEffect)(() => {
		refresh();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "w-full",
				onClick: () => setOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), " New homemade recipe"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: mine.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: r.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs capitalize text-muted-foreground",
						children: [
							r.visibility,
							" · ",
							r.cuisine
						]
					})]
				}, r.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl",
				children: "From cooks you can see"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: feed.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "w-full rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-border)]",
					onClick: () => {
						const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
						assignCustom(mondayOf(), "dinner", {
							id: r.id,
							name: r.name,
							minutes: r.minutes,
							notes: r.description,
							ingredients: ings.map((i) => ({
								name: String(i.name ?? "item"),
								qty: Number(i.qty) || 1,
								unit: String(i.unit ?? ""),
								aisle: i.aisle || "Other"
							}))
						});
						setTab("plan");
						toast("Added to Monday");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: r.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"@",
							r.username,
							" · ",
							r.cuisine
						]
					})]
				}) }, r.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeForm, {
				open,
				onOpenChange: setOpen,
				onSaved: () => void refresh()
			})
		]
	});
}
function RecipeForm({ open, onOpenChange, onSaved }) {
	const [name, setName] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [minutes, setMinutes] = (0, import_react.useState)("40");
	const [cuisine, setCuisine] = (0, import_react.useState)("Homemade");
	const [visibility, setVisibility] = (0, import_react.useState)("private");
	const [lines, setLines] = (0, import_react.useState)("onion, 1\ngarlic, 3 cloves");
	const [steps, setSteps] = (0, import_react.useState)("");
	const [aliases, setAliases] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			title: "Homemade recipe",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex flex-col gap-3",
				onSubmit: async (e) => {
					e.preventDefault();
					const ingredients = lines.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
						const [n, rest] = line.split(",").map((s) => s.trim());
						const bits = (rest ?? "").split(/\s+/);
						const qty = Number(bits[0]);
						return {
							name: n || "item",
							qty: Number.isFinite(qty) ? qty : 1,
							unit: Number.isFinite(qty) ? bits.slice(1).join(" ") : rest || "",
							aisle: "Other"
						};
					});
					if ((await saveCommunityRecipe({ data: {
						name,
						description,
						minutes: Number(minutes) || 30,
						servings: 4,
						cuisine,
						visibility,
						ingredients,
						steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
						aliases
					} })).ok) {
						toast(visibility === "private" ? "Saved privately" : "Shared");
						onOpenChange(false);
						onSaved();
					}
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Homemade recipe"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "Name",
						required: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: description,
						onChange: (e) => setDescription(e.target.value),
						placeholder: "How you make it",
						rows: 3,
						className: "w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: minutes,
						onChange: (e) => setMinutes(e.target.value),
						placeholder: "Minutes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: cuisine,
						onChange: (e) => setCuisine(e.target.value),
						placeholder: "Cuisine"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: aliases,
						onChange: (e) => setAliases(e.target.value),
						placeholder: "Other names, slang, abbreviations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-sm",
						children: ["Who can see it", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: visibility,
							onChange: (e) => setVisibility(e.target.value),
							className: "mt-1.5 h-11 w-full rounded-xl bg-card px-3 text-sm shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "private",
									children: "Only me"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "followers",
									children: "Followers"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "public",
									children: "Everyone"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: lines,
						onChange: (e) => setLines(e.target.value),
						rows: 4,
						className: "w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)]",
						placeholder: "Ingredients, one per line"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: steps,
						onChange: (e) => setSteps(e.target.value),
						rows: 4,
						className: "w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)]",
						placeholder: "Steps, one per line"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						children: "Save recipe"
					})
				]
			})
		})
	});
}
function ChatPane({ activeId, onActiveId }) {
	const { user } = useCurrentUserState();
	const locale = useSpoonful((s) => s.locale);
	const [convos, setConvos] = (0, import_react.useState)([]);
	const active = activeId;
	const setActive = onActiveId;
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [body, setBody] = (0, import_react.useState)("");
	const [following, setFollowing] = (0, import_react.useState)([]);
	const [groupTitle, setGroupTitle] = (0, import_react.useState)("Kitchen crew");
	const [picked, setPicked] = (0, import_react.useState)([]);
	const [find, setFind] = (0, import_react.useState)("");
	const [hits, setHits] = (0, import_react.useState)([]);
	const [sending, setSending] = (0, import_react.useState)(false);
	async function loadConvos() {
		setConvos(await listConversations());
		setFollowing(await listFollowing());
	}
	(0, import_react.useEffect)(() => {
		loadConvos();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		let live = true;
		const tick = async () => {
			try {
				const rows = await listMessages({ data: { conversationId: active } });
				if (live) setMessages(rows);
			} catch {}
		};
		tick();
		const id = window.setInterval(() => void tick(), 3e3);
		return () => {
			live = false;
			window.clearInterval(id);
		};
	}, [active]);
	if (active) {
		const title = convos.find((c) => c.id === active)?.title ?? "Direct";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setActive(null),
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 truncate text-sm font-medium",
						children: [
							t(locale, "privateChat"),
							" · ",
							title.startsWith("@") || !title ? title : `@${title}`
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 max-h-[50vh] space-y-2 overflow-y-auto",
					children: [messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-2xl bg-card px-3 py-3 text-sm text-muted-foreground",
						children: "Private. Only people in this chat can read it."
					}) : null, messages.map((m) => {
						const mine = user && m.user_id === user.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-[var(--shadow-border)]", mine ? "ml-auto bg-spark text-spark-foreground" : "bg-card"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: cn("text-xs", mine ? "opacity-80" : "text-muted-foreground"),
								children: ["@", m.username ?? "cook"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 break-words",
								children: m.body
							})]
						}, m.id);
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 flex min-w-0 items-center gap-2",
					onSubmit: async (e) => {
						e.preventDefault();
						if (!body.trim() || sending) return;
						setSending(true);
						try {
							const res = await sendMessage({ data: {
								conversationId: active,
								body: body.trim()
							} });
							if (!res.ok) {
								toast(res.error);
								return;
							}
							setBody("");
							setMessages(await listMessages({ data: { conversationId: active } }));
							await loadConvos();
						} catch {
							toast("Message did not send. Try again.");
						} finally {
							setSending(false);
						}
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "min-w-0 flex-1",
						value: body,
						onChange: (e) => setBody(e.target.value),
						placeholder: t(locale, "writeNote"),
						maxLength: 1e3
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "shrink-0",
						disabled: sending,
						children: t(locale, "send")
					})]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl",
				children: t(locale, "privateChat")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-3 flex min-w-0 gap-2",
				onSubmit: async (e) => {
					e.preventDefault();
					setHits(await searchPeople({ data: { q: find } }));
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "min-w-0 flex-1",
					value: find,
					onChange: (e) => setFind(e.target.value),
					placeholder: t(locale, "findCook")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "secondary",
					className: "shrink-0",
					children: "Search"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-2",
				children: hits.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex min-w-0 items-center justify-between gap-2 rounded-2xl bg-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 truncate font-medium",
						children: ["@", p.username]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "shrink-0",
						onClick: async () => {
							const res = await openDirectChat({ data: { userId: p.user_id } });
							if (res.ok) setActive(res.id);
							else toast("Could not open a private chat");
						},
						children: t(locale, "message")
					})]
				}, p.user_id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl",
				children: t(locale, "chats")
			}),
			convos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: t(locale, "noChats")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: convos.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setActive(c.id),
					className: "w-full rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-medium",
						children: c.is_group ? c.title || "Group" : c.title ? `@${c.title}` : "Direct"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-muted-foreground",
						children: c.last_body ?? "No messages yet"
					})]
				}) }, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl",
				children: "New group"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-2",
				value: groupTitle,
				onChange: (e) => setGroupTitle(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: following.map((p) => {
					const on = picked.includes(p.user_id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setPicked((list) => on ? list.filter((id) => id !== p.user_id) : [...list, p.user_id]),
						className: on ? "h-11 rounded-full bg-primary px-3 text-sm text-primary-foreground" : "h-11 rounded-full bg-card px-3 text-sm shadow-[var(--shadow-border)]",
						children: ["@", p.username]
					}, p.user_id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-3 w-full",
				variant: "secondary",
				disabled: picked.length === 0,
				onClick: async () => {
					const res = await createGroupChat({ data: {
						title: groupTitle,
						memberIds: picked
					} });
					if (res.ok) {
						setActive(res.id);
						await loadConvos();
					} else toast("Could not start the group");
				},
				children: "Start group chat"
			})
		]
	});
}
function AlertsPane() {
	const [rows, setRows] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		listNotifications().then(setRows);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			className: "w-full",
			onClick: async () => {
				await markNotificationsRead();
				setRows(await listNotifications());
			},
			children: "Mark all read"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-2",
			children: rows.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl bg-card p-3 text-sm shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-medium",
						children: ["@", n.username ?? "someone"]
					}),
					" ",
					n.body
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						n.read ? "Read" : "New",
						" · ",
						n.kind
					]
				})]
			}, n.id))
		})]
	});
}
function FamilyPane() {
	const hasFamily = useSpoonful((s) => s.hasAddon("family"));
	const awardXp = useSpoonful((s) => s.awardXp);
	const [kitchen, setKitchen] = (0, import_react.useState)(null);
	const [members, setMembers] = (0, import_react.useState)([]);
	const [events, setEvents] = (0, import_react.useState)([]);
	const [name, setName] = (0, import_react.useState)("Our kitchen");
	const [code, setCode] = (0, import_react.useState)("");
	const lastEventId = (0, import_react.useRef)(null);
	async function refresh() {
		const k = await myKitchen();
		setKitchen(k);
		if (k) {
			setMembers(await listKitchenMembers());
			setEvents(await listKitchenEvents());
		} else {
			setMembers([]);
			setEvents([]);
		}
	}
	(0, import_react.useEffect)(() => {
		refresh();
		const id = window.setInterval(() => void refresh(), 12e3);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const newest = events[0];
		if (!newest) return;
		if (lastEventId.current && lastEventId.current !== newest.id) {
			if (useSpoonful.getState().notifyPrefs.family) pushNote("Family table", newest.body);
		}
		lastEventId.current = newest.id;
	}, [events]);
	if (!hasFamily) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "Family table"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted-foreground",
			children: "One kitchen, six seats, live meal pings when someone plates, cooks, or goes to the store. Start Family Table from Extras — $4.99/mo, simulated here."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-5",
		children: kitchen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.14em] text-spark",
				children: "Invite code"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-3xl tracking-wide",
				children: kitchen.invite_code
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					kitchen.name,
					" · ",
					members.length,
					"/6 seats · live"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-1 text-sm",
				children: members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl bg-card px-3 py-2 shadow-[var(--shadow-border)]",
					children: [
						"@",
						m.username,
						" · ",
						m.role
					]
				}, m.user_id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4 w-full",
				variant: "secondary",
				onClick: async () => {
					await postKitchenEvent({ data: {
						kind: "note",
						body: "Heading to the store"
					} });
					toast("Family pinged");
					refresh();
				},
				children: "Ping: heading to the store"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl bg-card px-3 py-2 text-sm shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-medium",
							children: ["@", e.username ?? "cook"]
						}),
						" ",
						e.body
					]
				}, e.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				className: "mt-4 w-full",
				onClick: async () => {
					await leaveKitchen();
					toast("Left the table");
					refresh();
				},
				children: "Leave table"
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				onSubmit: async (e) => {
					e.preventDefault();
					const res = await createKitchen({ data: { name } });
					if (!res.ok) {
						toast(res.error);
						return;
					}
					awardXp(20, "family");
					toast(`Table ready · code ${res.invite}`);
					refresh();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Start a table"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-3",
						value: name,
						onChange: (e) => setName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						type: "submit",
						children: "Create"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				onSubmit: async (e) => {
					e.preventDefault();
					const res = await joinKitchen({ data: { code } });
					if (!res.ok) {
						toast(res.error);
						return;
					}
					awardXp(20, "family");
					toast(`Sat down at ${res.name}`);
					refresh();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Join with a code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-3 uppercase",
						value: code,
						onChange: (e) => setCode(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						variant: "secondary",
						type: "submit",
						children: "Join"
					})
				]
			})]
		})
	});
}
var FREE = [
	"weeknight",
	"protein",
	"batch",
	"bundle",
	"nutrition",
	"midnight",
	"ai-chef"
];
function isUnlocked(unlocked, id) {
	if (FREE.includes(id)) return true;
	return unlocked.includes(id);
}
function norm(s) {
	return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function hits(ingName, pantry) {
	const n = norm(ingName);
	if (!n) return false;
	return pantry.some((p) => {
		if (!p) return false;
		return n.includes(p) || p.includes(n) || n.split(" ").some((w) => w.length > 3 && p.includes(w));
	});
}
/** Local catalog match so Snap still works if the kitchen model is busy. */
function mealsFromPantry(items, pool = RECIPES, limit = 6) {
	const pantry = items.map(norm).filter((s) => s.length > 1);
	if (pantry.length === 0) return [];
	return pool.map((recipe) => {
		const have = [];
		const need = [];
		for (const ing of recipe.ingredients) if (hits(ing.name, pantry)) have.push(ing.name);
		else need.push(ing.name);
		return {
			recipe,
			have,
			need,
			score: have.length / Math.max(1, recipe.ingredients.length)
		};
	}).filter((row) => row.have.length >= 2 && row.score >= .25).sort((a, b) => b.score - a.score || a.need.length - b.need.length).slice(0, limit).map((row) => ({
		title: row.recipe.name,
		why: row.need.length === 0 ? "You already have everything." : `You have ${row.have.slice(0, 3).join(", ")}. Check the rest one by one.`,
		have: row.have,
		need: row.need,
		minutes: row.recipe.minutes,
		recipeId: row.recipe.id
	}));
}
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
var planWeekWithChef = createServerFn({ method: "POST" }).validator((input) => inputSchema.parse(input)).handler(createSsrRpc("c7c1a422e30dc9d469f456d9891ef85eae97e00101c5835da278eaf5d1582df5"));
var SUGGESTIONS = [
	"Georgian khachapuri, vegetarian, under 40 minutes.",
	"Senegalese thieboudienne, no dairy, leftover-friendly.",
	"I lifted heavy. High protein Korean or Peruvian, 30 minutes, not the usual rotation."
];
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
function AiChefSheet({ open, onOpenChange }) {
	const weekStart = useSpoonful((s) => s.weekStart);
	const household = useSpoonful((s) => s.household);
	const unlocked = useSpoonful((s) => s.unlocked);
	const prefs = useSpoonful((s) => s.prefs);
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const assignMeal = useSpoonful((s) => s.assignMeal);
	const assignCustom = useSpoonful((s) => s.assignCustom);
	const consumeChef = useSpoonful((s) => s.consumeChef);
	const chefRemaining = useSpoonful((s) => s.chefRemaining);
	const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
	const goal = useSpoonful((s) => s.goal);
	const body = useSpoonful((s) => s.body);
	const meals = useSpoonful((s) => s.meals);
	const workouts = useSpoonful((s) => s.workouts);
	const stepsByDate = useSpoonful((s) => s.stepsByDate);
	const snacks = useSpoonful((s) => s.snacks);
	const [prompt, setPrompt] = (0, import_react.useState)(SUGGESTIONS[2] ?? SUGGESTIONS[0] ?? "");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [scope, setScope] = (0, import_react.useState)("tonight");
	const today = isoDate();
	const remaining = dayFuel({
		goal,
		eaten: nutritionForDate(meals, today, snacks),
		workouts: workouts.filter((w) => w.date === today),
		steps: stepsByDate[today] ?? 0,
		body
	}).remaining;
	async function run() {
		if (chefRemaining() <= 0) {
			toast(hasPlus ? "Chef is resting this week" : "Free kitchens get 3 chef plates a week. Kitchen+ opens the whole world.");
			return;
		}
		setBusy(true);
		try {
			const recipes = unlockedRecipes(unlocked).filter((r) => recipeAllowed(r, prefs, allergies, hidden)).slice(0, 80).map((r) => ({
				id: r.id,
				name: r.name,
				minutes: r.minutes,
				protein: r.protein,
				tags: r.tags
			}));
			const result = await planWeekWithChef({ data: {
				prompt,
				days: scope === "tonight" ? [today] : weekDates(weekStart),
				household,
				recipes,
				invent: hasPlus,
				allergies,
				prefs,
				remaining,
				body: {
					kcal: goal.cal,
					protein: goal.protein,
					weightKg: body.weightKg
				},
				scope
			} });
			if (!result.ok) {
				toast(result.error);
				return;
			}
			consumeChef();
			for (const day of result.days) if (day.recipeId) assignMeal(day.date, "dinner", day.recipeId);
			else if (day.dish) assignCustom(day.date, "dinner", {
				id: `chef-${day.date}-${Date.now()}`,
				name: day.dish.name,
				minutes: day.dish.minutes,
				notes: `${day.dish.description ?? ""}\n\n${day.dish.steps.join(" ")}`.trim(),
				steps: day.dish.steps,
				ingredients: day.dish.ingredients.map((i) => ({
					name: i.name,
					qty: i.qty,
					unit: i.unit,
					aisle: AISLES.includes(i.aisle) ? i.aisle : "Other"
				})),
				nutrition: day.dish.nutrition
			});
			toast(result.note || `Planned ${result.days.length} dinners`);
			onOpenChange(false);
		} catch {
			toast("The chef is busy. Try again in a moment.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			title: "AI Chef",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
					children: hasPlus ? "Kitchen+ worldwide" : "Library chef"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-2xl",
					children: hasPlus ? "Any plate on earth, fitted to you" : "Tell the kitchen how the week feels"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted-foreground",
					children: [
						hasPlus ? "The chef invents dishes that are not in the catalog — any cuisine on earth, fitted to allergies, remaining protein, and what you lifted. Nutrition is per serving from typical USDA values." : "Free kitchens get 3 plates a week from the library. Kitchen+ lets the chef cook anything imaginable, 40 times a week.",
						" ",
						chefRemaining(),
						" left this week."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: ["tonight", "week"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setScope(id),
						className: scope === id ? "h-11 flex-1 rounded-full bg-spark text-sm text-spark-foreground" : "h-11 flex-1 rounded-full bg-background text-sm shadow-[var(--shadow-border)]",
						children: id === "tonight" ? "Tonight" : "Whole week"
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: prompt,
					onChange: (e) => setPrompt(e.target.value),
					rows: 4,
					maxLength: 500,
					className: "mt-4 w-full rounded-2xl bg-background p-3 text-sm leading-relaxed shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-2",
					children: SUGGESTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setPrompt(s),
						className: "rounded-2xl bg-background px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground",
						children: s
					}, s))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 w-full",
					disabled: busy || !prompt.trim(),
					onClick: () => void run(),
					children: busy ? "Plating…" : hasPlus ? scope === "tonight" ? "Invent tonight" : "Cook the world" : "Plan my dinners"
				})
			]
		})
	});
}
function PlanView({ onOpenStore }) {
	const weekStart = useSpoonful((s) => s.weekStart);
	const setWeekStart = useSpoonful((s) => s.setWeekStart);
	const meals = useSpoonful((s) => s.meals);
	const fillWeek = useSpoonful((s) => s.fillWeek);
	const fillFromFuel = useSpoonful((s) => s.fillFromFuel);
	const undoFill = useSpoonful((s) => s.undoFill);
	const undoMeals = useSpoonful((s) => s.undoMeals);
	const surpriseDinner = useSpoonful((s) => s.surpriseDinner);
	const skipNight = useSpoonful((s) => s.skipNight);
	const unlocked = useSpoonful((s) => s.unlocked);
	const pantry = useSpoonful((s) => s.pantry);
	const setTab = useSpoonful((s) => s.setTab);
	const nextGen = useSpoonful((s) => s.nextGen);
	const goal = useSpoonful((s) => s.goal);
	const workouts = useSpoonful((s) => s.workouts);
	const stepsByDate = useSpoonful((s) => s.stepsByDate);
	const snacks = useSpoonful((s) => s.snacks);
	const cookedDates = useSpoonful((s) => s.cookedDates);
	const household = useSpoonful((s) => s.household);
	const prefs = useSpoonful((s) => s.prefs);
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const xp = useSpoonful((s) => s.xp);
	const chefRemaining = useSpoonful((s) => s.chefRemaining);
	const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
	const body = useSpoonful((s) => s.body);
	const locale = useSpoonful((s) => s.locale);
	const [picker, setPicker] = (0, import_react.useState)(null);
	const [active, setActive] = (0, import_react.useState)(null);
	const [chefOpen, setChefOpen] = (0, import_react.useState)(false);
	const [cooking, setCooking] = (0, import_react.useState)(null);
	const weekMeals = (0, import_react.useMemo)(() => plannedForWeek(meals, weekStart), [meals, weekStart]);
	const dates = weekDates(weekStart);
	const pulse = weekPulse(meals, weekStart, cookedDates, household);
	const nutritionOn = isUnlocked(unlocked, "nutrition") || nextGen;
	const chefOn = isUnlocked(unlocked, "ai-chef");
	const rank = rankForXp(xp);
	const today = isoDate();
	const todayDate = dates.find((d) => dayLabel(d).today);
	const tonight = todayDate ? weekMeals.find((m) => m.date === todayDate && m.slot === "dinner") : void 0;
	const pantryIdea = pantry.length >= 2 ? mealsFromPantry(pantry.map((p) => p.name), unlockedRecipes(unlocked).filter((r) => recipeAllowed(r, prefs, allergies, hidden)), 1)[0] : void 0;
	const fuel = nextGen ? dayFuel({
		goal,
		eaten: nutritionForDate(meals, today, snacks),
		workouts: workouts.filter((w) => w.date === today),
		steps: stepsByDate[today] ?? 0,
		body
	}) : null;
	function pickForMe(date) {
		const recipe = surpriseDinner(date);
		toast(recipe ? `Plated ${recipe.name}` : "Unlock more recipes or loosen Skip these");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-28 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
						children: "This week"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-3xl leading-tight",
						children: weekHeading(weekStart)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon",
						"aria-label": "Previous week",
						onClick: () => setWeekStart(shiftWeek(weekStart, -1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon",
						"aria-label": "Next week",
						onClick: () => setWeekStart(shiftWeek(weekStart, 1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex min-w-0 items-center gap-1.5 overflow-hidden",
				"aria-label": "Protein rainbow",
				children: dates.map((date) => {
					const dinner = weekMeals.find((m) => m.date === date && m.slot === "dinner");
					const protein = dinner && !dinner.skip ? resolveMeal(dinner).recipe?.protein : void 0;
					const cooked = cookedDates.includes(date);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("h-2 min-w-0 flex-1 rounded-full", dinner?.skip ? "bg-muted" : proteinDot(protein), cooked && "ring-1 ring-inset ring-primary"),
						title: dinner ? resolveMeal(dinner).title : "Open"
					}, date);
				})
			}),
			todayDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 overflow-hidden rounded-3xl bg-spark text-spark-foreground shadow-[var(--shadow-lift)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => tonight ? tonight.skip ? setPicker({
						date: todayDate,
						slot: "dinner"
					}) : setActive(tonight) : setPicker({
						date: todayDate,
						slot: "dinner"
					}),
					className: "w-full text-left",
					children: [tonight && !tonight.skip && resolveMeal(tonight).recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
						recipe: resolveMeal(tonight).recipe,
						className: "h-44"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium uppercase tracking-[0.16em] opacity-80",
							children: "Tonight"
						}), tonight && !tonight.skip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-display text-3xl leading-tight",
							children: resolveMeal(tonight).title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm opacity-90",
							children: [formatMinutes(resolveMeal(tonight).minutes), nextGen && resolveMeal(tonight).recipe ? ` · ${resolveMeal(tonight).recipe?.nutrition.protein}g protein` : ""]
						})] }) : tonight?.skip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl leading-tight",
								children: skipTitle(tonight.skip)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm opacity-90",
								children: "Tap to put a plate back on."
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-24 items-center justify-center rounded-full bg-spark-foreground/15",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UtensilsCrossed, { className: "size-8" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl leading-tight",
								children: "Nothing plated yet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm opacity-90",
								children: "One decision. We can pick it for you."
							})] })]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 px-4 pb-4",
					children: tonight && !tonight.skip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full bg-spark-foreground text-spark hover:opacity-95",
						onClick: () => setCooking(tonight),
						children: "Cook now"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "w-full text-spark-foreground hover:bg-spark-foreground/10",
						onClick: () => setPicker({
							date: todayDate,
							slot: "dinner"
						}),
						children: "Swap"
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full bg-spark-foreground text-spark hover:opacity-95",
						onClick: () => pickForMe(todayDate),
						children: nextGen ? "Surprise me" : "Pick for me"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "w-full text-spark-foreground hover:bg-spark-foreground/10",
						onClick: () => skipNight(todayDate, "takeout"),
						children: "Eating out"
					})] })
				})]
			}) : null,
			todayDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					const todayBreakfast = weekMeals.find((m) => m.date === todayDate && m.slot === "breakfast");
					if (todayBreakfast) setActive(todayBreakfast);
					else setPicker({
						date: todayDate,
						slot: "breakfast"
					});
				},
				className: "mt-3 flex min-w-0 items-center gap-3 rounded-3xl bg-card p-3 text-left shadow-[var(--shadow-border)]",
				children: (() => {
					const todayBreakfast = weekMeals.find((m) => m.date === todayDate && m.slot === "breakfast");
					const rec = todayBreakfast ? resolveMeal(todayBreakfast).recipe : void 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [rec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
						recipe: rec,
						className: "size-16 shrink-0 rounded-2xl"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-16 shrink-0 items-center justify-center rounded-2xl bg-background text-sm text-muted-foreground",
						children: "AM"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium uppercase tracking-[0.14em] text-spark",
							children: t(locale, "breakfast")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 truncate font-medium",
							children: todayBreakfast ? resolveMeal(todayBreakfast).title : t(locale, "addBreakfast")
						})]
					})] });
				})()
			}) : null,
			fuel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setTab("fit"),
				className: "mt-3 w-full rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.14em] text-spark",
					children: "Fuel left today"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroBar, {
						label: "Protein",
						value: fuel.eaten.protein,
						of: fuel.target.protein
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroBar, {
						label: "Calories",
						value: fuel.eaten.cal,
						of: fuel.target.cal,
						unit: ""
					})]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-spark px-3 py-1.5 text-spark-foreground",
						children: rank.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums",
						children: [pulse.dinners, "/7 dinners"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums",
						children: [pulse.proteins, " proteins"]
					}),
					pulse.cooked > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums",
						children: [pulse.cooked, " cooked"]
					}) : null,
					pulse.takeout > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)]",
						children: [pulse.takeout, " out"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-card px-3 py-1.5 shadow-[var(--shadow-border)] tabular-nums",
						children: ["~$", pulse.cost]
					})
				]
			}),
			pantryIdea && !tonight ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setTab("snap"),
				className: "mt-4 w-full rounded-3xl bg-accent px-4 py-3 text-left text-accent-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.14em]",
					children: "From the pantry"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-display text-xl leading-tight",
					children: pantryIdea.title
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					className: "flex-1",
					onClick: () => {
						const n = nextGen ? fillFromFuel() || fillWeek(false) : fillWeek(false);
						toast(n ? `Plated ${n} open night${n === 1 ? "" : "s"}` : "This week is already full");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, {}), nextGen ? "Fuel empty" : "Fill empty"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "spark",
					className: "flex-1",
					onClick: () => {
						if (chefRemaining() <= 0) {
							onOpenStore();
							toast(hasPlus ? "Chef is spent this week" : "Free kitchens get 3 chef plates a week. Kitchen+ raises the cap.");
							return;
						}
						if (!chefOn) {
							onOpenStore();
							toast("AI Chef is an add-on");
							return;
						}
						setChefOpen(true);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {}), "AI Chef"]
				})]
			}),
			undoMeals ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 text-sm text-muted-foreground",
				onClick: () => {
					const ok = undoFill();
					toast(ok ? "Fill undone" : "Nothing to undo");
				},
				children: "Undo last fill"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 text-sm text-muted-foreground",
				onClick: async () => {
					try {
						await navigator.clipboard.writeText(weekPlanText(meals, weekStart));
						toast("Week copied");
					} catch {
						toast("Could not copy");
					}
				},
				children: "Copy this week"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 grid gap-3 sm:grid-cols-2",
				children: dates.map((date) => {
					const meta = dayLabel(date);
					const dinner = weekMeals.find((m) => m.date === date && m.slot === "dinner");
					const lunch = weekMeals.find((m) => m.date === date && m.slot === "lunch");
					const breakfast = weekMeals.find((m) => m.date === date && m.slot === "breakfast");
					if (meta.today) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-3xl bg-card p-2 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between px-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-base font-medium",
										children: meta.weekday
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground",
										children: meta.monthDay
									})]
								}), cookedDates.includes(date) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "size-4 text-primary",
									"aria-label": "Cooked"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full", dinner?.skip ? "bg-muted" : proteinDot(resolveMeal(dinner ?? {
									id: "",
									date,
									slot: "dinner"
								}).recipe?.protein)) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaySlot, {
								label: "Dinner",
								meal: dinner,
								onAdd: () => setPicker({
									date,
									slot: "dinner"
								}),
								onOpen: () => {
									if (dinner?.skip) {
										setPicker({
											date,
											slot: "dinner"
										});
										return;
									}
									if (dinner) setActive(dinner);
								}
							}),
							breakfast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaySlot, {
								label: t(locale, "breakfast"),
								meal: breakfast,
								onAdd: () => setPicker({
									date,
									slot: "breakfast"
								}),
								onOpen: () => setActive(breakfast)
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPicker({
									date,
									slot: "breakfast"
								}),
								className: "mt-1 min-h-11 w-full rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground",
								children: t(locale, "addBreakfast")
							}),
							lunch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaySlot, {
								label: "Lunch",
								meal: lunch,
								onAdd: () => setPicker({
									date,
									slot: "lunch"
								}),
								onOpen: () => setActive(lunch)
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPicker({
									date,
									slot: "lunch"
								}),
								className: "mt-1 min-h-11 w-full rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground",
								children: t(locale, "addLunch")
							})
						]
					}, date);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipePicker, {
				open: picker !== null,
				onOpenChange: (o) => !o && setPicker(null),
				onPick: (id) => {
					if (!picker) return;
					useSpoonful.getState().assignMeal(picker.date, picker.slot, id);
					setPicker(null);
				},
				onCustom: (custom) => {
					if (!picker) return;
					useSpoonful.getState().assignCustom(picker.date, picker.slot, custom);
					setPicker(null);
				},
				onSurprise: picker?.slot === "dinner" ? () => {
					if (!picker) return;
					pickForMe(picker.date);
					setPicker(null);
				} : void 0,
				onSkip: picker?.slot === "dinner" ? (kind) => {
					if (!picker) return;
					skipNight(picker.date, kind);
					setPicker(null);
				} : void 0,
				onLocked: () => {
					setPicker(null);
					onOpenStore();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealActions, {
				meal: active,
				onClose: () => setActive(null),
				onCook: () => {
					if (active) setCooking(active);
					setActive(null);
				},
				onSwap: () => {
					if (!active) return;
					setPicker({
						date: active.date,
						slot: active.slot
					});
					setActive(null);
				},
				nutritionOn,
				nextGen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiChefSheet, {
				open: chefOpen,
				onOpenChange: setChefOpen
			}),
			cooking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookView, {
				meal: cooking,
				onClose: () => setCooking(null)
			}) : null
		]
	});
}
function DaySlot({ label, meal, onAdd, onOpen }) {
	if (!meal) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onAdd,
		className: "mt-2 flex min-h-16 w-full items-center rounded-2xl bg-background px-4 text-left text-base text-muted-foreground",
		children: ["Add ", label.toLowerCase()]
	});
	const resolved = resolveMeal(meal);
	if (meal.skip) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: onOpen,
		className: "mt-2 flex min-h-16 w-full items-center rounded-2xl bg-background px-4 text-left",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium",
			children: resolved.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs text-muted-foreground",
			children: [label, " · no grocery"]
		})] })
	});
	const plate = resolved.recipe?.plate ?? "bowl";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onOpen,
		className: "relative mt-2 flex min-h-16 w-full items-center gap-3 overflow-hidden rounded-2xl bg-background px-2 py-2 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-y-2 left-1.5 w-1 rounded-full", cuisineBar(resolved.recipe?.cuisine)) }),
			resolved.recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
				recipe: resolved.recipe,
				className: "size-14 shrink-0 rounded-xl"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
				kind: plate,
				size: "sm",
				className: "ml-1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm font-medium",
					children: resolved.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						label,
						" · ",
						formatMinutes(resolved.minutes)
					]
				})]
			})
		]
	});
}
function MealActions({ meal, onClose, onCook, onSwap, nutritionOn, nextGen }) {
	const removeMeal = useSpoonful((s) => s.removeMeal);
	const toggleFavorite = useSpoonful((s) => s.toggleFavorite);
	const hideRecipe = useSpoonful((s) => s.hideRecipe);
	const skipNight = useSpoonful((s) => s.skipNight);
	const markCooked = useSpoonful((s) => s.markCooked);
	const surpriseDinner = useSpoonful((s) => s.surpriseDinner);
	const favorites = useSpoonful((s) => s.favorites);
	const resolved = meal ? resolveMeal(meal) : null;
	const recipe = meal?.recipeId ? recipeById(meal.recipeId) : resolved?.recipe;
	const loved = recipe ? favorites.includes(recipe.id) : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: meal !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			title: resolved?.title ?? "Meal",
			children: resolved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
					recipe,
					className: "h-44 rounded-2xl"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl leading-tight",
							children: resolved.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [formatMinutes(resolved.minutes), recipe ? ` · ${recipe.servings} servings` : null]
						}),
						(nutritionOn || nextGen) && recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm tabular-nums",
							children: [
								recipe.nutrition.protein,
								"g protein",
								nutritionOn ? ` · ${recipe.nutrition.cal} kcal · ${recipe.nutrition.carbs}g carbs` : ""
							]
						}) : null
					]
				}),
				recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-base leading-relaxed text-foreground/80",
					children: recipe.description
				}) : resolved.custom?.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-base leading-relaxed text-foreground/80",
					children: resolved.custom.notes
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "spark",
							className: "w-full",
							onClick: onCook,
							children: "Cook this"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "w-full",
							onClick: onSwap,
							children: "Swap recipe"
						}),
						meal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "w-full",
							onClick: () => {
								const pick = surpriseDinner(meal.date);
								toast(pick ? `Swapped to ${pick.name}` : "No other match");
								onClose();
							},
							children: "Something else like this"
						}) : null,
						recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full",
							onClick: () => toggleFavorite(recipe.id),
							children: loved ? "Saved to favorites" : "Save to favorites"
						}) : null,
						meal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full",
							onClick: () => {
								markCooked(meal.date);
								toast("Marked as cooked");
								onClose();
							},
							children: "I already ate this"
						}) : null,
						meal?.slot === "dinner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full",
							onClick: () => {
								skipNight(meal.date, "takeout");
								onClose();
							},
							children: "Eating out instead"
						}) : null,
						recipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full",
							onClick: () => {
								hideRecipe(recipe.id);
								toast("Won’t suggest this again");
								onClose();
							},
							children: "Never again"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full text-destructive",
							onClick: () => {
								if (meal) removeMeal(meal.id);
								onClose();
							},
							children: "Remove from week"
						})
					]
				})
			] }) : null
		})
	});
}
function has(recipe, ...needles) {
	const tags = (recipe.tags ?? []).map((t) => t.toLowerCase());
	const cuisine = (recipe.cuisine ?? "").toLowerCase();
	const name = recipe.name.toLowerCase();
	return needles.some((n) => tags.includes(n) || cuisine === n || name.includes(n));
}
var COLLECTIONS = [
	{
		id: "vegetarian",
		label: "Vegetarian",
		hint: "No meat or fish",
		match: (r) => isVegetarian(r)
	},
	{
		id: "vegan",
		label: "Vegan",
		hint: "No animal products",
		match: (r) => isVegan(r)
	},
	{
		id: "gluten-free",
		label: "Gluten-free",
		hint: "No wheat, still dinner",
		match: (r) => isGlutenFree(r)
	},
	{
		id: "dairy-free",
		label: "Dairy-free",
		hint: "No milk, butter, cheese",
		match: (r) => isDairyFree(r)
	},
	{
		id: "sugar-free",
		label: "Sugar-free",
		hint: "No added sugar",
		match: (r) => isSugarFree(r)
	},
	{
		id: "plant-based",
		label: "Plant-based",
		hint: "Vegan plates that satisfy",
		match: (r) => isVegan(r) || has(r, "plant-based", "vegan")
	},
	{
		id: "instant-pot",
		label: "Instant Pot",
		hint: "Pressure-cooker weeknights",
		match: (r) => has(r, "instant-pot", "pressure-cooker")
	},
	{
		id: "slow-cooker",
		label: "Slow cooker",
		hint: "Set it, walk away",
		match: (r) => has(r, "slow-cooker", "crockpot")
	},
	{
		id: "sheet-pan",
		label: "Sheet pan",
		hint: "One tray, hot oven",
		match: (r) => has(r, "sheet-pan")
	},
	{
		id: "air-fryer",
		label: "Air fryer",
		hint: "Crisp without a vat",
		match: (r) => has(r, "air-fryer")
	},
	{
		id: "one-pot",
		label: "One pot",
		hint: "One pan, less washing",
		match: (r) => has(r, "one-pot")
	},
	{
		id: "grill",
		label: "Grill & BBQ",
		hint: "Ribs, elote, smoked",
		match: (r) => has(r, "grill", "bbq", "barbecue")
	},
	{
		id: "baking",
		label: "Baking",
		hint: "Bread, cookies, cobbler",
		match: (r) => has(r, "baking") && !has(r, "cheesecake")
	},
	{
		id: "cookies",
		label: "Cookies & candy",
		hint: "Chips, fudge, shortbread",
		match: (r) => has(r, "cookies") || /\b(cookie|fudge|shortbread|biscotti)\b/.test(r.name.toLowerCase())
	},
	{
		id: "breakfast",
		label: "Breakfast",
		hint: "Oats to omelettes",
		match: (r) => isBreakfast(r)
	},
	{
		id: "salads",
		label: "Salads",
		hint: "Cobb to three-bean",
		match: (r) => has(r, "salad") || r.plate === "green"
	},
	{
		id: "desserts",
		label: "Desserts",
		hint: "Cake, pudding, cobbler",
		match: (r) => isDessert(r)
	},
	{
		id: "sauces",
		label: "Sauces",
		hint: "Gravy, rubs, dressing",
		match: (r) => isSauceLike(r)
	},
	{
		id: "fish",
		label: "Fish & seafood",
		hint: "Salmon, shrimp, trout",
		match: (r) => r.protein === "fish" || r.protein === "seafood" || has(r, "pescatarian")
	},
	{
		id: "southern",
		label: "Southern",
		hint: "Burgoo, pot likker, pie",
		match: (r) => has(r, "southern") || (r.cuisine ?? "").includes("Southern")
	},
	{
		id: "japanese",
		label: "Japanese",
		hint: "Miso, donburi, katsu",
		match: (r) => has(r, "japanese") || (r.cuisine ?? "") === "Japanese"
	},
	{
		id: "international",
		label: "International",
		hint: "Tables from everywhere",
		match: (r) => has(r, "international", "world") || (r.tags ?? []).includes("world")
	},
	{
		id: "hometown",
		label: "Hometown",
		hint: "Church basement classics",
		match: (r) => has(r, "hometown", "community", "old-school")
	},
	{
		id: "holiday",
		label: "Holiday",
		hint: "Christmas table, cocoa, ham",
		match: (r) => has(r, "holiday", "christmas")
	},
	{
		id: "wild-game",
		label: "Wild game",
		hint: "Venison, duck, trout",
		match: (r) => has(r, "wild-game", "game")
	},
	{
		id: "cheesecake",
		label: "Cheesecake",
		hint: "New York to Basque",
		match: (r) => has(r, "cheesecake") || r.name.toLowerCase().includes("cheesecake")
	},
	{
		id: "pumpkin",
		label: "Pumpkin",
		hint: "Soup, bread, seeds",
		match: (r) => has(r, "pumpkin") || r.name.toLowerCase().includes("pumpkin")
	},
	{
		id: "apple",
		label: "Apple",
		hint: "Orchard pies and chops",
		match: (r) => has(r, "apple") || /\bapple/.test(r.name.toLowerCase())
	},
	{
		id: "camping",
		label: "Camping",
		hint: "Foil packs, dutch oven",
		match: (r) => has(r, "camping")
	},
	{
		id: "kid-friendly",
		label: "Kid-friendly",
		hint: "Nuggets, noodles, muffins",
		match: (r) => has(r, "kid-friendly")
	},
	{
		id: "meal-prep",
		label: "Meal prep",
		hint: "Boxes for the week",
		match: (r) => has(r, "meal-prep", "batch")
	},
	{
		id: "vintage",
		label: "Vintage kitchen",
		hint: "From the old books",
		match: (r) => has(r, "vintage")
	},
	{
		id: "colonial",
		label: "1790s–1830s",
		hint: "Simmons, Randolph, Leslie",
		match: (r) => has(r, "era-1790s", "era-1820s", "era-1830s")
	},
	{
		id: "gilded",
		label: "1880s–1890s",
		hint: "White House, Mrs. Fisher",
		match: (r) => has(r, "era-1880s", "era-1890s")
	},
	{
		id: "1900s",
		label: "1900s",
		hint: "Foreign dishes, salads, fish",
		match: (r) => has(r, "era-1900s")
	},
	{
		id: "1910s",
		label: "1910s",
		hint: "Farmer, Gentile, wartime",
		match: (r) => has(r, "era-1910s")
	},
	{
		id: "1920s",
		label: "1920s",
		hint: "Luncheon, Dutch kitchen",
		match: (r) => has(r, "era-1920s")
	},
	{
		id: "1930s",
		label: "1930s",
		hint: "Southern Cook Book, 1935",
		match: (r) => has(r, "era-1930s")
	},
	{
		id: "1940s",
		label: "1940s",
		hint: "USDA wartime leaflets",
		match: (r) => has(r, "era-1940s")
	},
	{
		id: "wartime",
		label: "Wartime kitchen",
		hint: "1918 & 1940s government",
		match: (r) => has(r, "wartime")
	},
	{
		id: "book-farmer",
		label: "Fannie Farmer",
		hint: "Boston Cooking-School, 1918",
		match: (r) => has(r, "book-farmer")
	},
	{
		id: "book-white-house",
		label: "White House Cook Book",
		hint: "Gillette & Ziemann, 1887",
		match: (r) => has(r, "book-white-house")
	},
	{
		id: "book-gentile",
		label: "Italian Cook Book",
		hint: "Maria Gentile, 1919",
		match: (r) => has(r, "book-gentile")
	},
	{
		id: "book-365-foreign",
		label: "365 Foreign Dishes",
		hint: "A dish a day, 1908",
		match: (r) => has(r, "book-365-foreign")
	},
	{
		id: "book-pa-dutch",
		label: "Pennsylvania Dutch",
		hint: "Church-supper classics",
		match: (r) => has(r, "book-pa-dutch")
	},
	{
		id: "book-picayune",
		label: "Picayune Creole",
		hint: "New Orleans, 1910",
		match: (r) => has(r, "book-picayune")
	},
	{
		id: "book-mrs-fisher",
		label: "Abby Fisher, 1881",
		hint: "Old Southern cooking",
		match: (r) => has(r, "book-mrs-fisher")
	},
	{
		id: "book-southern-1935",
		label: "Southern Cook Book 1935",
		hint: "Lustig, Sondheim, Rensel",
		match: (r) => has(r, "book-southern-1935")
	},
	{
		id: "book-kephart",
		label: "Camp & troop",
		hint: "Kephart and Boy Scouts",
		match: (r) => has(r, "book-kephart", "book-scout-camp", "camping")
	},
	{
		id: "book-community",
		label: "Community cookbooks",
		hint: "Ladies' Aid, Suffrage",
		match: (r) => has(r, "book-ladies-aid", "book-suffrage", "community")
	},
	{
		id: "book-hill-salads",
		label: "Hill's salads, 1909",
		hint: "Sandwiches and chafing dishes",
		match: (r) => has(r, "book-hill-salads")
	},
	{
		id: "book-east-asia-vintage",
		label: "Chinese & Japanese, 1914–17",
		hint: "Bosse, Watanna, Chan",
		match: (r) => has(r, "book-chinese-japanese", "book-chan-chinese")
	},
	{
		id: "book-olive-green",
		label: "How to Cook Fish",
		hint: "Olive Green, 1908",
		match: (r) => has(r, "book-olive-green")
	},
	{
		id: "book-jewish-1918",
		label: "Jewish Cook Book, 1918",
		hint: "Florence Greenbaum",
		match: (r) => has(r, "book-jewish-1918")
	},
	{
		id: "book-early-veg",
		label: "Early vegetarian",
		hint: "Fulton, Dwight, Wheldon",
		match: (r) => has(r, "book-fulton-veg", "book-golden-age", "book-no-animal")
	},
	{
		id: "book-365-desserts",
		label: "365 Desserts",
		hint: "A sweet a day, 1900",
		match: (r) => has(r, "book-365-desserts")
	},
	{
		id: "book-virginia",
		label: "Virginia Housewife",
		hint: "Mary Randolph, 1824",
		match: (r) => has(r, "book-virginia")
	},
	{
		id: "keto",
		label: "Keto & low-carb",
		hint: "Under 12g carbs",
		match: (r) => isKeto(r)
	},
	{
		id: "high-protein",
		label: "High protein",
		hint: "32g+ a plate",
		match: (r) => isHighProtein(r)
	},
	{
		id: "soups",
		label: "Soups & stews",
		hint: "Bowls, broths, chili",
		match: (r) => r.plate === "soup" || has(r, "soup", "stew")
	},
	{
		id: "sandwiches",
		label: "Sandwiches",
		hint: "BLT to muffuletta",
		match: (r) => has(r, "sandwich") || r.plate === "toast"
	},
	{
		id: "weeknight",
		label: "Weeknight",
		hint: "On the table in 30",
		match: (r) => r.minutes <= 30 && !isDessert(r) && !isSauceLike(r)
	},
	{
		id: "budget",
		label: "Budget",
		hint: "Pantry, cheap, filling",
		match: (r) => has(r, "budget")
	},
	{
		id: "date-night",
		label: "Date night",
		hint: "A little extra",
		match: (r) => has(r, "date-night")
	},
	{
		id: "mexican",
		label: "Mexican",
		hint: "Tacos, pozole, salsas",
		match: (r) => has(r, "mexican") || (r.cuisine ?? "") === "Mexican"
	},
	{
		id: "italian",
		label: "Italian",
		hint: "Pasta, polenta, pizza",
		match: (r) => has(r, "italian") || (r.cuisine ?? "") === "Italian"
	},
	{
		id: "indian",
		label: "Indian",
		hint: "Dal, tikka, chana",
		match: (r) => has(r, "indian") || (r.cuisine ?? "") === "Indian"
	},
	{
		id: "chinese",
		label: "Chinese",
		hint: "Wontons, mapo, noodles",
		match: (r) => has(r, "chinese") || (r.cuisine ?? "") === "Chinese"
	},
	{
		id: "thai",
		label: "Thai",
		hint: "Curry, larb, tom yum",
		match: (r) => has(r, "thai") || (r.cuisine ?? "") === "Thai"
	},
	{
		id: "korean",
		label: "Korean",
		hint: "Banchan, stew, grill",
		match: (r) => has(r, "korean") || (r.cuisine ?? "") === "Korean"
	},
	{
		id: "mediterranean",
		label: "Mediterranean",
		hint: "Olive oil, lemon, herbs",
		match: (r) => has(r, "mediterranean", "greek") || [
			"Mediterranean",
			"Greek",
			"Spanish"
		].includes(r.cuisine ?? "")
	},
	{
		id: "caribbean",
		label: "Caribbean",
		hint: "Jerk, plantain, rice",
		match: (r) => has(r, "caribbean") || (r.cuisine ?? "") === "Caribbean"
	},
	{
		id: "african",
		label: "African",
		hint: "Jollof, wat, couscous",
		match: (r) => has(r, "african") || (r.cuisine ?? "").includes("African")
	},
	{
		id: "middle-eastern",
		label: "Middle Eastern",
		hint: "Hummus, shawarma, rice",
		match: (r) => has(r, "middle-eastern", "levant") || (r.cuisine ?? "") === "Middle Eastern"
	},
	{
		id: "french",
		label: "French",
		hint: "Onion soup to steak",
		match: (r) => has(r, "french") || (r.cuisine ?? "") === "French"
	}
];
var COLLECTION_GROUPS = [
	{
		id: "diet",
		labelKey: "dietGroup",
		ids: [
			"vegetarian",
			"vegan",
			"gluten-free",
			"dairy-free",
			"sugar-free",
			"keto",
			"plant-based",
			"high-protein"
		]
	},
	{
		id: "method",
		labelKey: "methodGroup",
		ids: [
			"instant-pot",
			"slow-cooker",
			"sheet-pan",
			"air-fryer",
			"one-pot",
			"grill",
			"baking"
		]
	},
	{
		id: "course",
		labelKey: "courseGroup",
		ids: [
			"breakfast",
			"salads",
			"soups",
			"sandwiches",
			"fish",
			"desserts",
			"cookies",
			"sauces"
		]
	},
	{
		id: "cuisine",
		labelKey: "cuisineGroup",
		ids: [
			"mexican",
			"italian",
			"indian",
			"chinese",
			"thai",
			"korean",
			"japanese",
			"mediterranean",
			"caribbean",
			"african",
			"middle-eastern",
			"french",
			"southern"
		]
	},
	{
		id: "era",
		labelKey: "eraGroup",
		ids: [
			"vintage",
			"colonial",
			"gilded",
			"1900s",
			"1910s",
			"1920s",
			"1930s",
			"1940s",
			"wartime"
		]
	},
	{
		id: "books",
		labelKey: "bookGroup",
		ids: [
			"book-farmer",
			"book-white-house",
			"book-gentile",
			"book-365-foreign",
			"book-pa-dutch",
			"book-picayune",
			"book-mrs-fisher",
			"book-southern-1935",
			"book-virginia",
			"book-kephart",
			"book-community",
			"book-hill-salads",
			"book-east-asia-vintage",
			"book-olive-green",
			"book-jewish-1918",
			"book-early-veg",
			"book-365-desserts"
		]
	},
	{
		id: "table",
		labelKey: "tableGroup",
		ids: [
			"hometown",
			"holiday",
			"international"
		]
	},
	{
		id: "theme",
		labelKey: "themeGroup",
		ids: [
			"weeknight",
			"budget",
			"date-night",
			"pumpkin",
			"apple",
			"cheesecake",
			"wild-game",
			"camping",
			"kid-friendly",
			"meal-prep"
		]
	}
];
function recipesInCollection(collectionId, pool) {
	const col = COLLECTIONS.find((c) => c.id === collectionId);
	if (!col) return pool;
	return pool.filter(col.match);
}
function collectionById(id) {
	return COLLECTIONS.find((c) => c.id === id);
}
var scanPantryPhoto = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	image: string().min(40).max(15e5),
	hint: _enum(["pantry", "counter"]).optional()
}).parse(input)).handler(createSsrRpc("8f192f59b71dd4157771b48abf9365086ede9a05d94379ab00e89a8fc287fc8e"));
var suggestMealsFromPantry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	items: array(string()).max(40),
	catalog: array(string()).max(80).optional()
}).parse(input)).handler(createSsrRpc("5388a7a3100aea6c4640e326b36c4d47c0b03937f7540207e987be464907dc59"));
var suggestSubstitutes = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	missing: string().min(1).max(80),
	pantry: array(string()).max(40)
}).parse(input)).handler(createSsrRpc("971386946c24bff1bb9e1c04be4f4b45e259ada213d25eff51bc2cd9988b7106"));
var lookupDish = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ query: string().min(2).max(80) }).parse(input)).handler(createSsrRpc("83479df1b1130146edf7a73c6abf68634895a774d2db0b7fe68ab37e94dcb213"));
var DIET_CHIPS = [
	{
		id: "all",
		key: "all"
	},
	{
		id: "vegetarian",
		key: "vegetarian"
	},
	{
		id: "vegan",
		key: "vegan"
	},
	{
		id: "gluten-free",
		key: "glutenFree"
	},
	{
		id: "sugar-free",
		key: "sugarFree"
	},
	{
		id: "dairy-free",
		key: "dairyFree"
	},
	{
		id: "keto",
		key: "keto"
	},
	{
		id: "healthy",
		key: "healthy"
	},
	{
		id: "quick",
		key: "quick"
	}
];
var MORE_CHIPS = [
	{
		id: "protein",
		key: "highProtein"
	},
	{
		id: "saved",
		key: "saved"
	},
	{
		id: "breakfast",
		key: "breakfast"
	},
	{
		id: "dessert",
		key: "dessert"
	},
	{
		id: "comfort",
		key: "comfort"
	},
	{
		id: "pantry",
		key: "fromPantry"
	}
];
var TIME_CHIPS = [
	{
		id: null,
		key: "anyTime"
	},
	{
		id: 15,
		key: "minutes15"
	},
	{
		id: 30,
		key: "minutes30"
	},
	{
		id: 45,
		key: "minutes45"
	}
];
var PROTEIN_CHIPS = [
	{
		id: null,
		key: "anyProtein"
	},
	{
		id: "chicken",
		key: "chicken"
	},
	{
		id: "beef",
		key: "beef"
	},
	{
		id: "pork",
		key: "pork"
	},
	{
		id: "fish",
		key: "fish"
	},
	{
		id: "veg",
		key: "veg"
	}
];
var RECENT_KEY = "sf-recent-recipes";
function listen(onText, lang) {
	const w = window;
	const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
	if (!Ctor) {
		toast("Voice search is not on this device");
		return;
	}
	const rec = new Ctor();
	rec.lang = lang;
	rec.onresult = (ev) => {
		onText(ev.results[0][0].transcript);
	};
	rec.start();
}
function RecipesView({ onOpenStore }) {
	const unlocked = useSpoonful((s) => s.unlocked);
	const assignCustom = useSpoonful((s) => s.assignCustom);
	const setTab = useSpoonful((s) => s.setTab);
	const favorites = useSpoonful((s) => s.favorites);
	const nextGen = useSpoonful((s) => s.nextGen);
	const consumeLookup = useSpoonful((s) => s.consumeLookup);
	const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const locale = useSpoonful((s) => s.locale);
	const pantry = useSpoonful((s) => s.pantry);
	const available = unlockedRecipes(unlocked);
	const nutritionOn = isUnlocked(unlocked, "nutrition") || nextGen;
	const { user } = useCurrentUserState();
	const [query, setQuery] = (0, import_react.useState)("");
	const [diet, setDiet] = (0, import_react.useState)("all");
	const [more, setMore] = (0, import_react.useState)(null);
	const [rail, setRail] = (0, import_react.useState)(null);
	const [shelf, setShelf] = (0, import_react.useState)(null);
	const [timeMax, setTimeMax] = (0, import_react.useState)(null);
	const [protein, setProtein] = (0, import_react.useState)(null);
	const [sort, setSort] = (0, import_react.useState)("name");
	const [active, setActive] = (0, import_react.useState)(null);
	const [cooking, setCooking] = (0, import_react.useState)(null);
	const [looking, setLooking] = (0, import_react.useState)(false);
	const [showBlocked, setShowBlocked] = (0, import_react.useState)(false);
	const [recent, setRecent] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(RECENT_KEY);
			if (raw) setRecent(JSON.parse(raw));
		} catch {}
	}, []);
	const browsingShelves = !query.trim() && diet === "all" && more === null && rail === null && shelf === null && timeMax === null && protein === null;
	const counts = (0, import_react.useMemo)(() => {
		const map = {};
		for (const c of COLLECTIONS) map[c.id] = 0;
		for (const r of RECIPES) for (const c of COLLECTIONS) if (c.match(r)) map[c.id] += 1;
		return map;
	}, []);
	const tonightPicks = (0, import_react.useMemo)(() => {
		const seed = [...(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)].reduce((a, c) => a + c.charCodeAt(0), 0);
		const pool = RECIPES.filter((r) => r.minutes <= 45 && !isDessert(r) && !isSauceLike(r) && !isBreakfast(r));
		const pick = [];
		for (let i = 0; i < pool.length && pick.length < 6; i++) {
			const recipe = pool[(seed + i * 19) % pool.length];
			if (!pick.some((x) => x.id === recipe.id)) pick.push(recipe);
		}
		return pick;
	}, []);
	const list = (0, import_react.useMemo)(() => {
		let pool = RECIPES;
		if (shelf === "all") pool = RECIPES;
		else if (shelf) pool = recipesInCollection(shelf, pool);
		else if (rail) pool = recipesByCuisine(rail, pool);
		if (query.trim()) pool = searchRecipes(query, pool);
		const pantryIds = more === "pantry" ? new Set(mealsFromPantry(pantry.map((x) => x.name), RECIPES, 40).map((h) => h.recipeId)) : null;
		const copy = [...pool.filter((r) => {
			if (hidden.includes(r.id)) return false;
			if (!showBlocked && allergies.length > 0 && !recipeSafe(r, allergies)) return false;
			if (timeMax !== null && r.minutes > timeMax) return false;
			if (protein === "fish") {
				if (r.protein !== "fish" && r.protein !== "seafood") return false;
			} else if (protein && r.protein !== protein) return false;
			if (diet === "healthy") return isHealthy(r);
			if (diet === "quick") return r.minutes <= 30;
			if (diet !== "all") return matchesDiet(r, diet);
			if (more === "protein") return isHighProtein(r);
			if (more === "pantry") return pantryIds?.has(r.id) ?? false;
			if (more === "saved") return favorites.includes(r.id);
			if (more === "breakfast") return isBreakfast(r);
			if (more === "dessert") return isDessert(r);
			if (more === "comfort") return isComfort(r);
			return true;
		})];
		copy.sort((a, b) => {
			if (sort === "time") return a.minutes - b.minutes;
			if (sort === "protein") return b.nutrition.protein - a.nutrition.protein;
			return a.name.localeCompare(b.name);
		});
		return copy;
	}, [
		query,
		diet,
		more,
		rail,
		shelf,
		favorites,
		hidden,
		allergies,
		showBlocked,
		sort,
		timeMax,
		protein,
		pantry
	]);
	function openRecipe(recipe) {
		setActive(recipe);
		setRecent((prev) => {
			const next = [recipe.id, ...prev.filter((id) => id !== recipe.id)].slice(0, 8);
			try {
				localStorage.setItem(RECENT_KEY, JSON.stringify(next));
			} catch {}
			return next;
		});
	}
	function clearBrowse() {
		setDiet("all");
		setMore(null);
		setRail(null);
		setShelf(null);
		setTimeMax(null);
		setProtein(null);
		setQuery("");
	}
	function surprise() {
		const pool = browsingShelves ? RECIPES.filter((r) => !hidden.includes(r.id)) : list;
		if (pool.length === 0) {
			toast(t(locale, "noDishes"));
			return;
		}
		openRecipe(pool[Math.floor(Math.random() * pool.length)]);
	}
	async function lookUp() {
		if (!user) {
			toast("Sign in to look up dishes that are not in the library");
			return;
		}
		if (!consumeLookup()) {
			toast(hasPlus ? "Look-up is spent this week" : "Free kitchens get 3 look-ups a week. Kitchen+ raises that.");
			return;
		}
		setLooking(true);
		try {
			const res = await lookupDish({ data: { query } });
			if (!res.ok) {
				toast(res.error);
				return;
			}
			assignCustom(mondayOf(), "dinner", {
				id: `lookup-${Date.now()}`,
				name: res.recipe.name,
				minutes: res.recipe.minutes,
				notes: `${res.recipe.description}\n\n${res.recipe.steps.join(" ")}`,
				ingredients: res.recipe.ingredients.map((i) => ({
					name: i.name,
					qty: i.qty,
					unit: i.unit,
					aisle: "Other"
				})),
				nutrition: res.recipe.nutrition,
				steps: res.recipe.steps
			});
			toast(`Found ${res.recipe.name} — plated on Monday`);
			setTab("plan");
		} catch {
			toast("Look-up failed");
		} finally {
			setLooking(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-28 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: t(locale, "kitchen")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl",
				children: t(locale, "recipes")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-foreground/80",
				children: [
					RECIPES.length,
					" dishes, grouped by diet, how you cook, and the table they belong on.",
					allergies.length > 0 ? " Kitchen Shield is on." : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mt-4 min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Vegan chili, GF pizza, Instant Pot, latkes…",
						className: "pl-10 pr-12"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center",
						"aria-label": "Voice search",
						onClick: () => listen(setQuery, voiceFor(locale)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-4" })
					})
				]
			}),
			query.trim() && list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-3 w-full",
				onClick: () => void lookUp(),
				disabled: looking,
				children: looking ? "Looking it up…" : `Look up “${query.trim()}”`
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "spark",
					className: "h-11 flex-1",
					onClick: surprise,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dices, { className: "size-4" }), t(locale, "surprise")]
				}), !browsingShelves ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "h-11",
					onClick: clearBrowse,
					children: t(locale, "clearFilters")
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
				children: t(locale, "diet")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "chip-row mt-2",
				children: [DIET_CHIPS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setDiet(f.id);
						setMore(null);
					},
					className: diet === f.id ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground" : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]",
					children: t(locale, f.key)
				}, f.id)), MORE_CHIPS.filter((f) => f.id !== "pantry" || pantry.length > 0).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setMore(more === f.id ? null : f.id);
						setDiet("all");
					},
					className: more === f.id ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground" : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]",
					children: t(locale, f.key)
				}, f.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
				children: t(locale, "time")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chip-row mt-2",
				children: TIME_CHIPS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTimeMax(f.id),
					className: timeMax === f.id ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground" : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]",
					children: t(locale, f.key)
				}, String(f.id)))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
				children: t(locale, "protein")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chip-row mt-2",
				children: PROTEIN_CHIPS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setProtein(f.id),
					className: protein === f.id ? "h-11 shrink-0 rounded-full bg-primary px-3.5 text-sm text-primary-foreground" : "h-11 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]",
					children: f.id === "veg" ? t(locale, "veg") : f.id ? f.id[0].toUpperCase() + f.id.slice(1) : t(locale, f.key)
				}, String(f.id)))
			}),
			allergies.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 text-xs text-muted-foreground",
				onClick: () => setShowBlocked((v) => !v),
				children: showBlocked ? "Hide blocked dishes" : "Show dishes Kitchen Shield hid"
			}) : null,
			browsingShelves ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
							children: t(locale, "tonightPicks")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "text-xs text-spark",
							onClick: () => setShelf("all"),
							children: [
								t(locale, "allCatalog"),
								" · ",
								RECIPES.length
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex gap-2 overflow-x-auto pb-1",
						children: tonightPicks.map((recipe) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "w-36 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => openRecipe(recipe),
								className: "w-full overflow-hidden rounded-3xl bg-card text-left shadow-[var(--shadow-border)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
									recipe,
									className: "h-20 w-full rounded-none"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate px-2.5 py-2 text-xs font-medium",
									children: recipe.name
								})]
							})
						}, recipe.id))
					})] }),
					recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
						children: t(locale, "recent")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex gap-2 overflow-x-auto pb-1",
						children: recent.map((id) => {
							const recipe = recipeById(id);
							if (!recipe) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "w-36 shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openRecipe(recipe),
									className: "w-full overflow-hidden rounded-3xl bg-card text-left shadow-[var(--shadow-border)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
										recipe,
										className: "h-20 w-full rounded-none"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate px-2.5 py-2 text-xs font-medium",
										children: recipe.name
									})]
								})
							}, id);
						})
					})] }) : null,
					COLLECTION_GROUPS.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
						children: t(locale, group.labelKey)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 grid grid-cols-2 gap-3",
						children: group.ids.map((id) => {
							const c = collectionById(id);
							if (!c) return null;
							const cover = RECIPES.find((r) => c.match(r));
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setShelf(c.id);
									setRail(null);
								},
								className: "w-full overflow-hidden rounded-3xl bg-card text-left shadow-[var(--shadow-border)]",
								children: [cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
									recipe: cover,
									className: "h-28 w-full rounded-none"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 bg-background" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: c.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 text-xs text-muted-foreground",
										children: [
											counts[c.id] ?? 0,
											" · ",
											c.hint
										]
									})]
								})]
							}) }, c.id);
						})
					})] }, group.id))
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: clearBrowse,
						className: "flex h-11 items-center gap-1 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), t(locale, "backShelves")]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium",
						children: shelf === "all" ? t(locale, "allDishes") : shelf ? collectionById(shelf)?.label : rail ? rail : query.trim() ? query.trim() : t(locale, "allDishes")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							list.length,
							" ",
							list.length === 1 ? "dish" : "dishes"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						children: [
							["name", t(locale, "sortName")],
							["time", t(locale, "sortTime")],
							["protein", t(locale, "sortProtein")]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSort(id),
							className: sort === id ? "h-9 rounded-full bg-primary px-3 text-xs text-primary-foreground" : "h-9 rounded-full bg-card px-3 text-xs shadow-[var(--shadow-border)]",
							children: label
						}, id))
					})]
				}),
				list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 text-sm text-muted-foreground",
					children: t(locale, "noDishes")
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: list.map((recipe) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeCard, {
						recipe,
						locked: !available.some((a) => a.id === recipe.id),
						nutritionOn,
						onOpen: () => {
							if (!available.some((a) => a.id === recipe.id)) {
								onOpenStore();
								return;
							}
							openRecipe(recipe);
						}
					}) }, recipe.id))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: active !== null,
				onOpenChange: (o) => !o && setActive(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					title: active?.name ?? "Recipe",
					children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeDetail, {
						recipe: active,
						nutritionOn,
						nextGen,
						onOpen: openRecipe,
						onCook: () => {
							const meal = {
								id: `cook-${active.id}`,
								date: mondayOf(),
								slot: "dinner",
								recipeId: active.id
							};
							setCooking(meal);
							setActive(null);
						},
						onPlan: () => {
							useSpoonful.getState().assignMeal(mondayOf(), "dinner", active.id);
							setActive(null);
							useSpoonful.getState().setTab("plan");
						}
					}, active.id) : null
				})
			}),
			cooking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookView, {
				meal: cooking,
				onClose: () => setCooking(null)
			}) : null
		]
	});
}
function similarTo(recipe) {
	const tags = new Set((recipe.tags ?? []).map((x) => x.toLowerCase()));
	return RECIPES.filter((r) => r.id !== recipe.id).map((r) => {
		let score = 0;
		if (r.cuisine && r.cuisine === recipe.cuisine) score += 5;
		if (r.protein === recipe.protein) score += 2;
		if (r.plate === recipe.plate) score += 1;
		for (const tag of r.tags ?? []) if (tags.has(tag.toLowerCase())) score += 1;
		return {
			r,
			score
		};
	}).filter((x) => x.score >= 4).sort((a, b) => b.score - a.score).slice(0, 4).map((x) => x.r);
}
function RecipeDetail({ recipe, nutritionOn, nextGen, onCook, onPlan, onOpen }) {
	const household = useSpoonful((s) => s.household);
	const hideRecipe = useSpoonful((s) => s.hideRecipe);
	const locale = useSpoonful((s) => s.locale);
	const favorites = useSpoonful((s) => s.favorites);
	const toggleFavorite = useSpoonful((s) => s.toggleFavorite);
	const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
	const loved = favorites.includes(recipe.id);
	const [serves, setServes] = (0, import_react.useState)(household);
	const flags = recipeAllergens(recipe);
	const diets = dietFlags(recipe);
	const related = similarTo(recipe);
	const scaled = recipe.ingredients.map((ing) => ({
		...ing,
		shown: formatQty(scaleQty(ing.qty, serves, recipe.servings), ing.unit)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
			recipe,
			className: "h-44 rounded-2xl"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("mb-2 inline-block h-1.5 w-10 rounded-full", cuisineBar(recipe.cuisine)) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl leading-tight",
						children: recipe.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]",
						"aria-label": loved ? "Unsave" : "Save",
						onClick: () => toggleFavorite(recipe.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-4", loved && "fill-spark text-spark") })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [formatMinutes(recipe.minutes), recipe.cuisine ? ` · ${recipe.cuisine}` : ""]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: packLabel(recipe.pack) }),
						diets.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: f === "gluten-free" ? "GF" : f === "sugar-free" ? "SF" : f === "dairy-free" ? "DF" : f
						}, f)),
						flags.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: f
						}, f))
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-base leading-relaxed text-foreground/80",
			children: recipe.description
		}),
		recipe.source ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 rounded-2xl bg-background px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
			children: [
				recipe.source.book,
				recipe.source.year ? ` (${recipe.source.year})` : "",
				recipe.source.author ? ` · ${recipe.source.author}` : "",
				". ",
				recipe.source.credit
			]
		}) : null,
		nutritionOn || nextGen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
			className: "mt-4 grid grid-cols-4 gap-2 text-center",
			children: [
				["kcal", recipe.nutrition.cal],
				["protein", `${recipe.nutrition.protein}g`],
				["carbs", `${recipe.nutrition.carbs}g`],
				["fat", `${recipe.nutrition.fat}g`]
			].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-background px-2 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-xs uppercase tracking-wider text-muted-foreground",
					children: k
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "mt-1 font-medium tabular-nums",
					children: v
				})]
			}, k))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-medium",
				children: t(locale, "servings")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]",
						"aria-label": "Fewer servings",
						onClick: () => setServes((n) => Math.max(1, n - 1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-8 text-center tabular-nums font-medium",
						children: serves
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]",
						"aria-label": "More servings",
						onClick: () => setServes((n) => Math.min(12, n + 1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 space-y-1.5 text-sm",
			children: scaled.map((ing, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0",
					children: ing.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 tabular-nums text-muted-foreground",
					children: ing.shown
				})]
			}, `${ing.name}-${i}`))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				className: "w-full",
				onClick: () => {
					for (const ing of recipe.ingredients) addExtraGrocery(ing.name, ing.aisle);
					toast("On the grocery list");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-4" }), t(locale, "addIngredients")]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				className: "w-full",
				onClick: async () => {
					const lines = scaled.map((ing) => `${ing.shown} ${ing.name}`.trim()).join("\n");
					try {
						await navigator.clipboard.writeText(`${recipe.name}\n${lines}`);
						toast("Copied");
					} catch {
						toast("Couldn’t copy");
					}
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), t(locale, "copyIngredients")]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mt-6 text-sm font-medium",
			children: "Method"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-2 space-y-2 text-base leading-relaxed text-foreground/80",
			children: recipe.steps.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium tabular-nums text-foreground",
					children: i + 1
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step })]
			}, `step-${i}`))
		}),
		related.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: t(locale, "similar")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 grid grid-cols-2 gap-2",
				children: related.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpen(r),
					className: "w-full overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
						recipe: r,
						className: "h-16 w-full rounded-none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate px-2 py-1.5 text-xs font-medium",
						children: r.name
					})]
				}) }, r.id))
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "spark",
					className: "w-full",
					onClick: onCook,
					children: "Cook this"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "w-full",
					onClick: onPlan,
					children: "Put on Monday dinner"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "w-full",
					onClick: () => {
						hideRecipe(recipe.id);
						toast("Won’t suggest this again");
					},
					children: "Never again"
				})
			]
		})
	] });
}
var SAUCE_MENUS = [
	{
		id: "donair",
		label: "Donair",
		hint: "Mom-and-pop, Greco, Pizza Delight"
	},
	{
		id: "bbq",
		label: "BBQ",
		hint: "Kansas City to Carolina"
	},
	{
		id: "classic",
		label: "Classic",
		hint: "Hollandaise, marinara, pesto"
	},
	{
		id: "world",
		label: "World",
		hint: "Chimichurri, zhug, nuoc cham"
	},
	{
		id: "rub",
		label: "Dry rubs",
		hint: "Memphis, jerk, Montreal"
	},
	{
		id: "dip",
		label: "Dips",
		hint: "Ranch, tzatziki, aioli"
	}
];
function sauceMenuOf(recipe) {
	const blob = `${recipe.name} ${recipe.tags.join(" ")} ${(recipe.aliases ?? []).join(" ")}`.toLowerCase();
	if (blob.includes("donair") || recipe.tags.includes("maritimes")) return "donair";
	if (recipe.tags.includes("dry-rub") || blob.includes("rub") || blob.includes("spice")) return "rub";
	if (/bbq|carolina|alabama|buffalo|kc |kansas|vinegar sauce|come-back/.test(blob)) return "bbq";
	if (/ranch|tzatziki|aioli|tartar|cocktail|dip/.test(blob)) return "dip";
	if (/hollandaise|b[eé]arnaise|marinara|pesto|alfredo|gravy/.test(blob)) return "classic";
	return "world";
}
function saucesIn(id, pool = SAUCE_RECIPES) {
	if (id === "all") return pool;
	return pool.filter((r) => sauceMenuOf(r) === id);
}
function isSauceRecipe(recipe) {
	return recipe.tags.includes("sauce") || recipe.tags.includes("dry-rub");
}
function SaucesView() {
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const assignMeal = useSpoonful((s) => s.assignMeal);
	const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
	const setTab = useSpoonful((s) => s.setTab);
	const [query, setQuery] = (0, import_react.useState)("");
	const [menu, setMenu] = (0, import_react.useState)("all");
	const [active, setActive] = (0, import_react.useState)(null);
	const [cooking, setCooking] = (0, import_react.useState)(null);
	const list = (0, import_react.useMemo)(() => {
		let pool = saucesIn(menu, RECIPES.filter(isSauceRecipe)).filter((r) => !hidden.includes(r.id) && recipeSafe(r, allergies));
		if (query.trim()) pool = searchRecipes(query, pool);
		return pool;
	}, [
		menu,
		query,
		hidden,
		allergies
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-32 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: "Kitchen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl",
				children: "Sauces"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-foreground/80",
				children: "Donair shops, dry rubs, mother sauces, and the rest of the world. Its own menu — not buried in Recipes."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-4",
				value: query,
				onChange: (e) => setQuery(e.target.value),
				placeholder: "Greco, chimichurri, jerk rub…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "chip-row mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setMenu("all"),
					className: menu === "all" ? "h-11 shrink-0 rounded-full bg-spark px-4 text-sm text-spark-foreground" : "h-11 shrink-0 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]",
					children: ["All ", RECIPES.filter(isSauceRecipe).length]
				}), SAUCE_MENUS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					title: m.hint,
					onClick: () => setMenu(m.id),
					className: menu === m.id ? "h-11 shrink-0 rounded-full bg-spark px-4 text-sm text-spark-foreground" : "h-11 shrink-0 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)]",
					children: m.label
				}, m.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 space-y-3",
				children: list.map((recipe) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeCard, {
					recipe,
					locked: false,
					nutritionOn: true,
					onOpen: () => setActive(recipe)
				}) }, recipe.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: active !== null,
				onOpenChange: (o) => !o && setActive(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					title: active?.name ?? "Sauce",
					children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealPhoto, {
							recipe: active,
							className: "h-44 rounded-2xl"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("mt-4 h-2 w-16 rounded-full", cuisineBar(active.cuisine)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted-foreground",
							children: active.description
						}),
						recipeAllergens(active).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: ["Contains: ", recipeAllergens(active).join(", ")]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm tabular-nums",
							children: [
								formatMinutes(active.minutes),
								" · ",
								active.nutrition.cal,
								" kcal / serving"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-1 text-sm",
							children: active.ingredients.map((ing, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								ing.qty,
								" ",
								ing.unit,
								" ",
								ing.name
							] }, `${ing.name}-${i}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-4 list-decimal space-y-2 pl-4 text-sm leading-relaxed",
							children: active.steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: s }, `step-${i}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									onClick: () => {
										assignMeal(mondayOf(), "dinner", active.id);
										setActive(null);
										setTab("plan");
										toast(`Plated ${active.name}`);
									},
									children: "Plate with tonight"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									className: "w-full",
									onClick: () => {
										addExtraGrocery(active.name, "Pantry");
										toast("Added to this week's shop");
									},
									children: "Add to grocery"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									className: "w-full",
									onClick: () => {
										setCooking({
											id: `cook-${active.id}`,
											date: mondayOf(),
											slot: "dinner",
											recipeId: active.id
										});
										setActive(null);
									},
									children: "Cook now"
								})
							]
						})
					] }) : null
				})
			}),
			cooking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookView, {
				meal: cooking,
				onClose: () => setCooking(null)
			}) : null
		]
	});
}
function ShopView() {
	const weekStart = useSpoonful((s) => s.weekStart);
	const meals = useSpoonful((s) => s.meals);
	const extra = useSpoonful((s) => s.extraGrocery);
	const pantry = useSpoonful((s) => s.pantry);
	const checked = useSpoonful((s) => s.checked);
	const toggleChecked = useSpoonful((s) => s.toggleChecked);
	const clearChecked = useSpoonful((s) => s.clearChecked);
	const addExtraGrocery = useSpoonful((s) => s.addExtraGrocery);
	const addPantry = useSpoonful((s) => s.addPantry);
	const removePantry = useSpoonful((s) => s.removePantry);
	const stashCheckedToPantry = useSpoonful((s) => s.stashCheckedToPantry);
	const cookedDates = useSpoonful((s) => s.cookedDates);
	const [hidePantry, setHidePantry] = (0, import_react.useState)(true);
	const [newItem, setNewItem] = (0, import_react.useState)("");
	const [pantryName, setPantryName] = (0, import_react.useState)("");
	const [shopQ, setShopQ] = (0, import_react.useState)("");
	const household = useSpoonful((s) => s.household);
	const weekMeals = plannedForWeek(meals, weekStart);
	const pulse = weekPulse(meals, weekStart, cookedDates, household);
	const lines = (0, import_react.useMemo)(() => groceryForWeek(meals, weekStart, extra, pantry, household), [
		meals,
		weekStart,
		extra,
		pantry,
		household
	]);
	const visible = (hidePantry ? lines.filter((l) => !l.fromPantry) : lines).filter((l) => shopQ.trim() ? l.name.toLowerCase().includes(shopQ.trim().toLowerCase()) : true);
	const groups = AISLE_ORDER.map((aisle) => ({
		aisle,
		items: visible.filter((l) => l.aisle === aisle)
	})).filter((g) => g.items.length > 0);
	const checkKey = (line) => `${weekStart}::${line.key}`;
	const remaining = visible.filter((l) => !checked[checkKey(l)]).length;
	const total = visible.length;
	const progress = total === 0 ? 0 : Math.round((total - remaining) / total * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-28 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: "Groceries"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl",
				children: "Shop"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-foreground/80",
				children: [
					"Built from ",
					weekMeals.filter((m) => !m.skip).length,
					" meal",
					weekMeals.filter((m) => !m.skip).length === 1 ? "" : "s",
					", scaled for ",
					household,
					" ",
					household === 1 ? "person" : "people",
					". Eating-out nights stay off the list. About $",
					pulse.cost,
					" this week."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-medium tabular-nums",
							children: [remaining, " to pick up"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs tabular-nums text-muted-foreground",
							children: [progress, "%"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 h-1.5 overflow-hidden rounded-full bg-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-primary transition-[width] duration-200",
							style: { width: `${progress}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: async () => {
									const text = groups.map((g) => `${g.aisle}\n${g.items.map((i) => `- ${i.name}${i.unit || i.qty ? ` (${formatQty(i.qty, i.unit)})` : ""}`).join("\n")}`).join("\n\n");
									try {
										await navigator.clipboard.writeText(text || "Nothing to shop this week.");
										toast("List copied");
									} catch {
										toast("Could not copy");
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), "Copy list"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: () => {
									const n = stashCheckedToPantry();
									toast(n ? `Moved ${n} to pantry` : "Check items you already bought");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Refrigerator, {}), "Bought → pantry"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: clearChecked,
								children: "Clear checks"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex min-w-0 gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					addExtraGrocery(newItem, "Other");
					setNewItem("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "min-w-0 flex-1",
					value: newItem,
					onChange: (e) => setNewItem(e.target.value),
					placeholder: "Add milk, foil, coffee…"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon",
					className: "shrink-0",
					"aria-label": "Add item",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-3",
				value: shopQ,
				onChange: (e) => setShopQ(e.target.value),
				placeholder: "Find an item on the list"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setHidePantry((v) => !v),
				className: "mt-3 text-xs text-muted-foreground",
				children: hidePantry ? "Show items already in the pantry" : "Hide pantry items"
			}),
			total === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-sm text-muted-foreground",
				children: "Plan a few dinners and the list will fill in here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-6",
				children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
					children: group.aisle
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 divide-y divide-border rounded-2xl bg-card shadow-[var(--shadow-border)]",
					children: group.items.map((line) => {
						const key = checkKey(line);
						const on = Boolean(checked[key]);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => toggleChecked(key),
							className: "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("flex size-5 items-center justify-center rounded-md shadow-[var(--shadow-border)]", on && "bg-primary text-primary-foreground shadow-none"),
									children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : null
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: cn("flex-1 text-sm", on && "text-muted-foreground line-through"),
									children: [line.name, line.fromPantry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 text-xs text-muted-foreground",
										children: "pantry"
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs tabular-nums text-muted-foreground",
									children: formatQty(line.qty, line.unit)
								})
							]
						}) }, line.key);
					})
				})] }, group.aisle))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Pantry"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Things you already have. Matching grocery lines can be hidden."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex gap-2",
						onSubmit: (e) => {
							e.preventDefault();
							addPantry(pantryName);
							setPantryName("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: pantryName,
							onChange: (e) => setPantryName(e.target.value),
							placeholder: "Olive oil, rice, garlic"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "icon",
							variant: "secondary",
							"aria-label": "Add pantry item",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-wrap gap-2",
						children: pantry.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => removePantry(item.id),
							className: "inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-sm shadow-[var(--shadow-border)]",
							children: [item.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5 text-muted-foreground" })]
						}) }, item.id))
					})
				]
			})
		]
	});
}
async function compress(file) {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(/* @__PURE__ */ new Error("image"));
			el.src = url;
		});
		const scale = Math.min(1, 768 / Math.max(img.width, img.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.width * scale));
		canvas.height = Math.max(1, Math.round(img.height * scale));
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("canvas");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", .72);
	} finally {
		URL.revokeObjectURL(url);
	}
}
function SnapView() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnapFlow, {});
}
function SnapFlow() {
	const { user, isPending } = useCurrentUserState();
	const addPantry = useSpoonful((s) => s.addPantry);
	const consumeSnap = useSpoonful((s) => s.consumeSnap);
	const markSnapped = useSpoonful((s) => s.markSnapped);
	const hasPlus = useSpoonful((s) => s.hasAddon("chef-plus"));
	const pantry = useSpoonful((s) => s.pantry);
	const assignCustom = useSpoonful((s) => s.assignCustom);
	const assignMeal = useSpoonful((s) => s.assignMeal);
	const weekStart = useSpoonful((s) => s.weekStart);
	const setTab = useSpoonful((s) => s.setTab);
	const unlocked = useSpoonful((s) => s.unlocked);
	const prefs = useSpoonful((s) => s.prefs);
	const allergies = useSpoonful((s) => s.allergies);
	const hidden = useSpoonful((s) => s.hidden);
	const fileRef = (0, import_react.useRef)(null);
	const [mode, setMode] = (0, import_react.useState)("pantry");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [items, setItems] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [ideas, setIdeas] = (0, import_react.useState)([]);
	const [active, setActive] = (0, import_react.useState)(null);
	const [check, setCheck] = (0, import_react.useState)(null);
	async function onFile(file) {
		if (!file) return;
		if (!user) {
			toast("Sign in to photograph the kitchen");
			return;
		}
		if (!consumeSnap()) {
			toast(hasPlus ? "Snap is busy" : "Free kitchens get 8 photo scans a week. Kitchen+ lifts the cap.");
			return;
		}
		setBusy(true);
		setIdeas([]);
		setActive(null);
		setCheck(null);
		try {
			const res = await scanPantryPhoto({ data: {
				image: await compress(file),
				hint: mode
			} });
			if (!res.ok) {
				toast(res.error);
				return;
			}
			markSnapped();
			setItems(res.items);
			if (res.items.length === 0) toast("No food spotted. Try a closer photo, or type items below.");
		} catch {
			toast("Could not read that photo.");
		} finally {
			setBusy(false);
		}
	}
	async function makeIdeas() {
		if (items.length === 0) return;
		setBusy(true);
		setActive(null);
		setCheck(null);
		try {
			const local = mealsFromPantry(items, unlockedRecipes(unlocked).filter((r) => recipeAllowed(r, prefs, allergies, hidden)));
			setIdeas(local);
			for (const name of items) addPantry(name);
			if (user) {
				const catalog = RECIPES.slice(0, 80).map((r) => r.name);
				const res = await suggestMealsFromPantry({ data: {
					items,
					catalog
				} });
				if (res.ok) {
					const seen = new Set(local.map((i) => i.title.toLowerCase()));
					const extra = res.ideas.filter((i) => !seen.has(i.title.toLowerCase()));
					setIdeas([...local, ...extra].slice(0, 8));
				}
			}
		} catch {
			toast("Could not plate ideas.");
		} finally {
			setBusy(false);
		}
	}
	function startIdea(idea) {
		setActive(idea);
		setCheck(idea.need.length > 0 ? {
			kind: "need",
			index: 0
		} : null);
	}
	function nextNeed(fromIndex) {
		if (!active) return;
		const next = fromIndex + 1;
		if (next >= active.need.length) {
			setCheck(null);
			return;
		}
		setCheck({
			kind: "need",
			index: next
		});
	}
	const askingNeed = check?.kind === "need" ? active?.need[check.index] : check?.kind === "sub" ? active?.need[check.needIndex] : void 0;
	const askingSub = check?.kind === "sub" ? check.options[check.subIndex] : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl px-4 pb-28 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: "Snap"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-3xl",
				children: "What is in the kitchen?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: "Photograph a shelf or a pile of ingredients. We list what we see, suggest dinners, then ask yes or no for anything missing — and substitutions if you say no."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "image/*",
				capture: "environment",
				className: "sr-only",
				onChange: (e) => void onFile(e.target.files?.[0])
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "h-28 flex-col rounded-3xl bg-spark text-spark-foreground hover:opacity-95",
					onClick: () => {
						setMode("pantry");
						fileRef.current?.click();
					},
					disabled: busy || isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-6" }), "Pantry photo"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					className: "h-28 flex-col rounded-3xl bg-accent text-accent-foreground",
					onClick: () => {
						setMode("counter");
						fileRef.current?.click();
					},
					disabled: busy || isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Leaf, { className: "size-6" }), "Ingredients together"]
				})]
			}),
			!user && !isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: [
					"Photos need a signed-in cook.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/login",
						className: "font-medium text-spark underline-offset-4 hover:underline",
						children: "Sign in"
					}),
					" ",
					"— or type what you have below. Catalog matching works either way."
				]
			}) : null,
			busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-spark",
				children: "Looking closely…"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "On hand"
					}),
					items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KitchenHero, {
						plates: [
							"bowl",
							"skillet",
							"green"
						],
						className: "mx-auto mt-2"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-wrap gap-2",
						children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setItems((list) => list.filter((x) => x !== item)),
							className: "inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-sm text-accent-foreground",
							children: [item, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })]
						}) }, item))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex gap-2",
						onSubmit: (e) => {
							e.preventDefault();
							const t = draft.trim();
							if (!t) return;
							setItems((list) => list.includes(t) ? list : [...list, t]);
							setDraft("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft,
							onChange: (e) => setDraft(e.target.value),
							placeholder: "Type an item you have"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "secondary",
							children: "Add"
						})]
					}),
					pantry.length > 0 && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "mt-3 w-full",
						onClick: () => setItems(pantry.map((p) => p.name)),
						children: "Use my saved pantry"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 w-full",
						onClick: () => void makeIdeas(),
						disabled: busy || items.length === 0,
						children: "What can I cook?"
					})
				]
			}),
			ideas.length > 0 && !active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Ideas from what you have"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: ideas.map((idea) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => startIdea(idea),
						className: "w-full rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: idea.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: idea.why
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs tabular-nums text-muted-foreground",
								children: [
									idea.minutes,
									" min · ",
									idea.need.length === 0 ? "you have it all" : `${idea.need.length} to check`
								]
							})
						]
					}) }, idea.title))
				})]
			}) : null,
			active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: active.title
				}), check && askingNeed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					check.kind === "need" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-lg",
						children: [
							"Do you have ",
							askingNeed,
							"?"
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-lg",
						children: [
							"Could you use ",
							askingSub?.name ?? "this",
							" instead of ",
							askingNeed,
							"?"
						]
					}),
					check.kind === "sub" && askingSub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: askingSub.note
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "h-12 flex-1",
							onClick: () => {
								if (check.kind === "sub" && askingSub) {
									addPantry(askingSub.name);
									setItems((list) => list.includes(askingSub.name) ? list : [...list, askingSub.name]);
								}
								nextNeed(check.kind === "need" ? check.index : check.needIndex);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {}), " Yes"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							className: "h-12 flex-1",
							onClick: async () => {
								if (check.kind === "need") {
									const res = await suggestSubstitutes({ data: {
										missing: askingNeed,
										pantry: items
									} });
									if (res.ok && res.options.length > 0) {
										setCheck({
											kind: "sub",
											needIndex: check.index,
											options: res.options,
											subIndex: 0
										});
										return;
									}
									useSpoonful.getState().addExtraGrocery(askingNeed, "Other");
									toast(`Added ${askingNeed} to the shop list`);
									nextNeed(check.index);
									return;
								}
								const nextSub = check.subIndex + 1;
								if (nextSub < check.options.length) {
									setCheck({
										...check,
										subIndex: nextSub
									});
									return;
								}
								useSpoonful.getState().addExtraGrocery(askingNeed, "Other");
								toast(`Added ${askingNeed} to the shop list`);
								nextNeed(check.needIndex);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {}), " No"]
						})]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "You are ready. Cook it tonight, or save it to the week."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: () => {
							if (active.recipeId) assignMeal(weekStart, "dinner", active.recipeId);
							else assignCustom(weekStart, "dinner", {
								id: `snap-${Date.now()}`,
								name: active.title,
								minutes: active.minutes,
								notes: active.why,
								ingredients: [...active.have.map((n) => ({
									name: n,
									qty: 1,
									unit: "",
									aisle: "Other"
								})), ...active.need.map((n) => ({
									name: n,
									qty: 1,
									unit: "",
									aisle: "Other"
								}))]
							});
							setTab("plan");
							toast("Plated on Monday dinner");
						},
						children: "Put on Monday"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "w-full",
						onClick: () => setActive(null),
						children: "Back to ideas"
					})]
				})] })]
			}) : null
		]
	});
}
function SyncPermissionSheet({ open, source, current, locale, onOpenChange, onChoose }) {
	const src = FITNESS_SOURCES.find((s) => s.id === source);
	const linked = Boolean(current);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			title: t(locale, "syncAccessTitle"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
					children: src?.label ?? "Device"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-2xl leading-tight",
					children: linked ? t(locale, "changeAccess") : t(locale, "syncAccessTitle")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted-foreground",
					children: t(locale, "syncAccessBody")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid gap-2",
					children: [SYNC_ACCESS.map((opt) => {
						const Icon = opt.id === "always" ? RefreshCw : Smartphone;
						const on = current === opt.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onChoose(opt.id),
							className: cn("flex min-h-16 items-start gap-3 rounded-2xl px-4 py-3 text-left", on ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mt-0.5 size-5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-semibold",
									children: t(locale, opt.id === "always" ? "alwaysAllow" : "whileUsing")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("mt-0.5 block text-xs leading-relaxed", on ? "opacity-85" : "text-muted-foreground"),
									children: t(locale, opt.id === "always" ? "alwaysAllowHint" : "whileUsingHint")
								})]
							})]
						}, opt.id);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onChoose(null),
						className: "flex min-h-14 items-center gap-3 rounded-2xl bg-background px-4 text-left shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "size-5 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-semibold",
							children: linked ? t(locale, "unlinkDevice") : t(locale, "dontAllow")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs text-muted-foreground",
							children: t(locale, "dontAllowHint")
						})] })]
					})]
				})
			]
		})
	});
}
function StoreView() {
	const unlock = useSpoonful((s) => s.unlock);
	const hasAddon = useSpoonful((s) => s.hasAddon);
	const household = useSpoonful((s) => s.household);
	const setHousehold = useSpoonful((s) => s.setHousehold);
	const nextGen = useSpoonful((s) => s.nextGen);
	const setNextGen = useSpoonful((s) => s.setNextGen);
	const allergies = useSpoonful((s) => s.allergies);
	const toggleAllergy = useSpoonful((s) => s.toggleAllergy);
	const hidden = useSpoonful((s) => s.hidden);
	const unhideRecipe = useSpoonful((s) => s.unhideRecipe);
	const undoFill = useSpoonful((s) => s.undoFill);
	const undoMeals = useSpoonful((s) => s.undoMeals);
	const xp = useSpoonful((s) => s.xp);
	const seenMilestones = useSpoonful((s) => s.seenMilestones);
	const snapped = useSpoonful((s) => s.snapped);
	const chefRemaining = useSpoonful((s) => s.chefRemaining);
	const notifyPrefs = useSpoonful((s) => s.notifyPrefs);
	const setNotifyPrefs = useSpoonful((s) => s.setNotifyPrefs);
	const dinnerHour = useSpoonful((s) => s.dinnerHour);
	const setDinnerHour = useSpoonful((s) => s.setDinnerHour);
	const fitnessSource = useSpoonful((s) => s.fitnessSource);
	const setFitnessSource = useSpoonful((s) => s.setFitnessSource);
	const linkFitness = useSpoonful((s) => s.linkFitness);
	const setSyncAccess = useSpoonful((s) => s.setSyncAccess);
	const syncAccess = useSpoonful((s) => s.syncAccess);
	const importFitness = useSpoonful((s) => s.importFitness);
	const lastSyncAt = useSpoonful((s) => s.lastSyncAt);
	const syncFitness = useSpoonful((s) => s.syncFitness);
	const locale = useSpoonful((s) => s.locale);
	const country = useSpoonful((s) => s.country);
	const setLocale = useSpoonful((s) => s.setLocale);
	const setCountry = useSpoonful((s) => s.setCountry);
	const rank = rankProgress(xp);
	const plus = hasAddon("chef-plus");
	const [buying, setBuying] = (0, import_react.useState)(null);
	const [asking, setAsking] = (0, import_react.useState)(null);
	const paid = ADDONS.filter((a) => a.price > 0);
	const access = syncAccess ?? (fitnessSource ? "while-using" : null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl overflow-x-clip px-4 pb-28 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Kitchen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl",
				children: "Extras"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-sm leading-relaxed text-foreground/80",
				children: "The library, Midnight, nutrition, Kitchen Shield, Sauces, and Next Gen Fuel are free — people would riot if those cost extra. You pay for the chef who can cook anything, a family table, and Body Sync, a one-time unlock that plates dinner from the watch."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.14em] text-spark",
						children: rank.current.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mt-1 font-display text-2xl tabular-nums",
						children: [xp, " XP"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: rank.next ? `${rank.next.xp - xp} XP to ${rank.next.title}` : "Top of the kitchen"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "meter mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bg-spark",
							style: { width: `${rank.pct}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-4 space-y-1",
						children: RANKS.map((r) => {
							const on = r.id === rank.current.id;
							const earned = xp >= r.xp;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: cn("flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm", on ? "bg-spark text-spark-foreground" : earned ? "bg-background" : "text-muted-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: r.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular-nums",
									children: [r.xp, " XP"]
								})]
							}, r.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: MILESTONES.map((m) => {
							const got = seenMilestones.includes(m.id) || m.id === "xp-sous" && xp >= 560 || m.id === "family-1" && hasAddon("family") || m.id === "snap-1" && snapped;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: cn("rounded-2xl px-3 py-2", got ? "bg-primary text-primary-foreground" : "bg-background"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: m.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("mt-0.5 text-xs", got ? "opacity-80" : "text-muted-foreground"),
									children: got ? "Earned" : m.body
								})]
							}, m.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-spark p-4 text-spark-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Kitchen mode"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm opacity-90",
						children: "Simple is large type and Tonight first. Next Gen adds workouts, macros, and fuel-ranked dinners."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 w-full bg-spark-foreground text-spark hover:opacity-95",
						onClick: () => setNextGen(!nextGen),
						children: nextGen ? "Switch to Simple Kitchen" : "Switch to Next Gen"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t(locale, "language")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: t(locale, "languageHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-3 gap-2",
						children: LOCALES.map((loc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setLocale(loc.id);
								toast(loc.label);
							},
							className: cn("h-12 min-w-0 truncate rounded-2xl px-2 text-sm", locale === loc.id ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]"),
							children: loc.label
						}, loc.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-5 font-display text-xl",
						children: t(locale, "country")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: t(locale, "countryHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setCountry(c.id);
								toast(`${c.label} · ${c.hint}`);
							},
							className: cn("min-h-14 rounded-2xl px-3 py-3 text-left", country === c.id ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: c.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("mt-0.5 text-xs", country === c.id ? "opacity-80" : "text-muted-foreground"),
								children: c.hint
							})]
						}, c.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 space-y-3",
				children: paid.map((addon) => {
					const owned = hasAddon(addon.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl leading-tight",
									children: addon.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: addon.tagline
								})] }), owned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "solid",
									children: "On"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm font-medium tabular-nums",
									children: [formatPrice(addon.price), addon.period === "month" ? "/mo" : addon.period === "once" ? " once" : ""]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-relaxed text-muted-foreground",
								children: addon.description
							}),
							addon.id === "chef-plus" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs tabular-nums text-muted-foreground",
								children: [
									chefRemaining(),
									" of ",
									plus ? 40 : 3,
									" chef plates left this week"
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: owned ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-1.5 text-sm text-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), " Ready"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "w-full",
									onClick: () => setBuying(addon),
									children: [
										"Start ",
										formatPrice(addon.price),
										addon.period === "month" ? "/mo" : addon.period === "once" ? " once" : ""
									]
								})
							})
						]
					}, addon.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Devices"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Tap a source. You get the same three choices as Health Connect and the iPhone: Always allow, While using the app, or Don’t allow. Always allow keeps Fuel current after you leave — steps, rings, heart, sleep, a session, the same weight you already entered. Import a JSON export to overwrite with your file."
					}),
					lastSyncAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs tabular-nums text-muted-foreground",
						children: [
							access === "always" ? "Always allow" : "While using",
							" · last pull ",
							new Date(lastSyncAt).toLocaleString()
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-1.5",
						children: FITNESS_SOURCES.map((src) => {
							const on = fitnessSource === src.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAsking(src.id),
								className: cn("h-11 rounded-full px-3.5 text-sm", on ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
								children: src.label
							}, src.id);
						})
					}),
					fitnessSource ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("rounded-2xl px-4 py-3", access === "always" ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium",
										children: access === "always" ? t(locale, "alwaysOn") : t(locale, "whileOn")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: cn("mt-0.5 text-xs leading-relaxed", access === "always" ? "opacity-85" : "text-muted-foreground"),
										children: access === "always" ? t(locale, "alwaysOnHint") : t(locale, "whileOnHint")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: access === "always" ? "secondary" : "spark",
											className: cn("flex-1", access === "always" && "bg-spark-foreground text-spark hover:opacity-95"),
											onClick: async () => {
												if (access === "always") {
													setSyncAccess("while-using");
													await disableAlwaysSync();
													toast("Syncs only while this kitchen is open");
													return;
												}
												setSyncAccess("always");
												const ok = await enableAlwaysSync();
												toast(ok ? "Always allow — Fuel keeps updating after you leave" : "Always allow is on. Allow notifications so you hear when dinner plates while you’re away.");
											},
											children: access === "always" ? t(locale, "whileUsing") : t(locale, "alwaysAllow")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											className: access === "always" ? "text-spark-foreground" : void 0,
											onClick: () => {
												setFitnessSource(null);
												disableAlwaysSync();
												toast("Device unlinked");
											},
											children: t(locale, "unlinkDevice")
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-muted-foreground",
								children: [FITNESS_SOURCES.find((s) => s.id === fitnessSource)?.hint, "."]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-3 w-full",
								variant: "secondary",
								onClick: () => {
									const plated = syncFitness({ live: false });
									toast(plated ? `Pulled again — plated ${plated}` : "Pulled again — Fuel matches the device");
								},
								children: "Refresh now"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Import JSON export"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "application/json,.json",
									className: "mt-2 block w-full text-sm",
									onChange: async (e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										try {
											const raw = JSON.parse(await file.text());
											importFitness({
												steps: raw.steps,
												body: {
													...typeof raw.weightKg === "number" ? { weightKg: raw.weightKg } : {},
													...typeof raw.weightLb === "number" ? { weightKg: raw.weightLb / 2.2046226218 } : {},
													...typeof raw.heightCm === "number" ? { heightCm: raw.heightCm } : {},
													...typeof raw.age === "number" ? { age: raw.age } : {}
												},
												workouts: (raw.workouts ?? []).map((w) => ({
													id: "imp",
													date: w.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
													kind: w.kind ?? "other",
													minutes: w.minutes ?? 30,
													kcal: w.kcal,
													volumeKg: w.volumeKg,
													distanceKm: w.distanceKm
												}))
											});
											toast("Import written to Fuel — body and workouts live");
										} catch {
											toast("That file was not a Spoonful fitness export");
										}
									}
								})]
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/watch",
						className: "mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-background px-4 text-sm shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Watch, { className: "size-4" }), "Open watch face"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "?install=1",
						className: "ml-2 mt-3 inline-flex h-11 items-center rounded-full bg-background px-4 text-sm shadow-[var(--shadow-border)]",
						children: "Add to Home Screen"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Live meal pings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Dinner reminder, family table updates, and milestone pop-ups. Each one can be off."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid gap-2",
						children: [
							["meals", "Tonight changes"],
							["family", "Family table"],
							["milestones", "Ranks and streaks"],
							["dinner", "Dinner-time reminder"]
						].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setNotifyPrefs({ [key]: !notifyPrefs[key] }),
							className: cn("flex min-h-12 items-center justify-between rounded-2xl px-4 text-sm", notifyPrefs[key] ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]"),
							children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								children: notifyPrefs[key] ? "On" : "Off"
							})]
						}, key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex min-w-0 flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm text-muted-foreground",
								htmlFor: "dinner-hour",
								children: "Remind at"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "dinner-hour",
								className: "h-12 min-w-0 flex-1 rounded-xl bg-background px-3 text-base shadow-[var(--shadow-border)]",
								value: dinnerHour,
								onChange: (e) => setDinnerHour(Number(e.target.value) || 18),
								children: Array.from({ length: 8 }, (_, i) => 15 + i).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: h,
									children: [h, ":00"]
								}, h))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								className: "shrink-0",
								onClick: async () => {
									const ok = await enablePush();
									toast(ok ? "Notifications allowed" : "Notifications blocked on this device");
								},
								children: "Allow"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Kitchen Shield"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Hidden from Fill, Surprise me, Fuel, and the recipe library."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: ALLERGIES.map((a) => {
							const on = allergies.includes(a.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => toggleAllergy(a.id),
								className: cn("min-h-14 rounded-2xl px-3 py-3 text-left", on ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: a.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("mt-0.5 text-xs", on ? "opacity-80" : "text-muted-foreground"),
									children: a.hint
								})]
							}, a.id);
						})
					})
				]
			}),
			hidden.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Never again"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1",
					children: hidden.map((id) => {
						const recipe = RECIPES.find((r) => r.id === id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 w-full rounded-2xl bg-background px-3 text-left text-sm",
							onClick: () => unhideRecipe(id),
							children: recipe?.name ?? id
						}) }, id);
					})
				})]
			}) : null,
			undoMeals ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Undo fill"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "mt-3 w-full",
					onClick: () => toast(undoFill() ? "Fill undone" : "Nothing to undo"),
					children: "Undo last fill"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Tour"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "mt-3 w-full",
					onClick: () => useSpoonful.getState().resetWalkthrough(),
					children: "Replay the walkthrough"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Household"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "How many plates you usually set."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-2",
						children: [
							1,
							2,
							3,
							4,
							5,
							6
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setHousehold(n),
							className: household === n ? "flex size-11 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground" : "flex size-11 items-center justify-center rounded-full bg-background text-sm shadow-[var(--shadow-border)]",
							children: n
						}, n))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: buying !== null,
				onOpenChange: (o) => !o && setBuying(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					title: "Confirm",
					children: buying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkout, {
						addon: buying,
						onCancel: () => setBuying(null),
						onConfirm: () => {
							unlock(buying.id);
							const plated = buying.id === "body-sync" ? useSpoonful.getState().meals.find((m) => m.date === isoDate() && m.slot === "dinner") : void 0;
							toast(plated && buying.id === "body-sync" ? `${buying.name} is on — plated from the watch` : `${buying.name} is on`);
							setBuying(null);
						}
					}) : null
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SyncPermissionSheet, {
				open: asking !== null,
				source: asking,
				current: asking && asking === fitnessSource ? access : null,
				locale,
				onOpenChange: (o) => !o && setAsking(null),
				onChoose: async (choice) => {
					const src = asking;
					setAsking(null);
					if (!src) return;
					if (choice === null) {
						if (fitnessSource === src) {
							setFitnessSource(null);
							await disableAlwaysSync();
							toast("Device unlinked");
						} else toast("Not linked");
						return;
					}
					const label = FITNESS_SOURCES.find((s) => s.id === src)?.label ?? src;
					linkFitness(src, choice);
					if (choice === "always") {
						const ok = await enableAlwaysSync();
						toast(ok ? `${label} · Always allow — Fuel keeps updating after you leave` : `${label} · Always allow is on. Allow notifications so you hear when dinner plates while you’re away.`);
						return;
					}
					await disableAlwaysSync();
					toast(`${label} · syncs while this kitchen is open`);
				}
			})
		]
	});
}
function Checkout({ addon, onCancel, onConfirm }) {
	const once = addon.period === "once";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
			children: once ? "One-time" : "Subscription"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-2 font-display text-2xl",
			children: addon.name
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted-foreground",
			children: addon.description
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-4 font-display text-3xl tabular-nums",
			children: [formatPrice(addon.price), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-base font-sans",
				children: once ? " once" : "/mo"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs leading-relaxed text-muted-foreground",
			children: once ? "Simulated here. One payment on the App Store and Play Store — yours to keep. Nothing is charged in this kitchen." : "Simulated here. On the App Store and Play Store this would bill monthly. Cancel any time. Nothing is charged in this kitchen."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: onConfirm,
				children: "Start"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				className: "w-full",
				onClick: onCancel,
				children: "Not now"
			})]
		})
	] });
}
function UsernameGate({ onDone }) {
	const [username, setUsername] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-10 pt-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KitchenHero, { plates: [
				"bowl",
				"green",
				"pasta"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: "One name, yours"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-4xl leading-tight",
				children: "Pick a unique username"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-base leading-relaxed text-muted-foreground",
				children: "This is how cooks find you. Letters, numbers, and underscores. Nobody else can take it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-8 flex flex-col gap-3",
				onSubmit: async (e) => {
					e.preventDefault();
					setBusy(true);
					try {
						const res = await claimUsername({ data: { username } });
						if (!res.ok) {
							toast(res.error);
							return;
						}
						onDone(res.username);
					} catch {
						toast("Could not save. Try again.");
					} finally {
						setBusy(false);
					}
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm font-medium",
					children: ["Username", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1.5",
						value: username,
						onChange: (e) => setUsername(e.target.value),
						autoComplete: "username",
						spellCheck: false,
						placeholder: "kitchen_mae",
						required: true
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full bg-spark text-spark-foreground hover:opacity-95",
					disabled: busy || username.length < 3,
					children: busy ? "Checking…" : "Claim it"
				})]
			})
		]
	});
}
var STEPS = [
	{
		title: "Welcome to Spoonful",
		body: "Plan dinners, shop once, and cook from what you already have. This tour uses large type. Captions stay on for anyone who cannot hear. Tap Speak to hear each step on your device.",
		plates: [
			"roast",
			"pasta",
			"green"
		]
	},
	{
		title: "Simple or Next Gen",
		body: "Simple Kitchen is huge type and Tonight on top. Next Gen adds Fuel: workouts and snacks change dinner. Flip the toggle in the header any time. Midnight theme is free.",
		plates: [
			"skillet",
			"bowl",
			"roast"
		]
	},
	{
		title: "Tonight, decided",
		body: "The paprika card is tonight. Cook now, or tap Pick for me and Spoonful plates a dinner. Eating out takes that night off the grocery list. Fill empty nights uses a protein rainbow so you do not eat chicken four nights running.",
		plates: [
			"roast",
			"skillet",
			"bowl"
		]
	},
	{
		title: "Kitchen Shield",
		body: "Tell Spoonful if gluten, dairy, nuts, shellfish, or spicy food is off the table. Those dishes never show in Fill, Surprise me, or Fuel. Hate a recipe? Never again hides it.",
		plates: [
			"green",
			"soup",
			"toast"
		]
	},
	{
		title: "Snap your kitchen",
		body: "Photograph the pantry, or a pile of ingredients. Spoonful lists what it sees, then suggests meals. For anything missing it asks yes or no. If you say no, it offers substitutions and asks if you have those too.",
		plates: [
			"bowl",
			"skillet",
			"toast"
		]
	},
	{
		title: "Recipes from everywhere",
		body: "Search slang — Jiggs, scoff, CTM. Catalogs cover Atlantic Canada and every USA state. Desserts has its own menu with Healthy, Fruit, Baking. Breakfast plates on the week without crowding dinner. Sauces is its own kitchen. Country in Extras puts home catalogs first. Language switches labels and the mic.",
		plates: [
			"pasta",
			"curry",
			"taco"
		]
	},
	{
		title: "Family, ranks, devices",
		body: "Cook to earn XP. Family Table shares tonight with live pings you can mute. Fuel uses your weight, height, and the pounds on the bar — not a flat guess. Kitchen+ is the chef who can invent any dish on earth. Connect a watch or fitness app in Extras.",
		plates: [
			"skillet",
			"bowl",
			"roast"
		]
	},
	{
		title: "People",
		body: "Claim a unique username. Post homemade recipes as private, followers-only, or public. Follow cooks, mute their notifications with the bell. Private chat is one-to-one: search a username, tap Message — only the two of you can read it. Groups work too.",
		plates: [
			"soup",
			"green",
			"fish"
		]
	},
	{
		title: "Shop",
		body: "The grocery list writes itself from the week, scaled for your household. Eating-out nights stay off it. Copy the list, or move checked items into the pantry so they do not come back next week.",
		plates: [
			"bowl",
			"roast",
			"toast"
		]
	}
];
function Walkthrough() {
	const finish = useSpoonful((s) => s.finishWalkthrough);
	const [step, setStep] = (0, import_react.useState)(0);
	const [speaking, setSpeaking] = (0, import_react.useState)(false);
	const live = (0, import_react.useRef)(null);
	const current = STEPS[step];
	(0, import_react.useEffect)(() => {
		live.current?.focus();
	}, [step]);
	(0, import_react.useEffect)(() => {
		return () => window.speechSynthesis?.cancel();
	}, []);
	function speak() {
		const synth = window.speechSynthesis;
		if (!synth) return;
		synth.cancel();
		const u = new SpeechSynthesisUtterance(`${current.title}. ${current.body}`);
		u.rate = .92;
		u.onend = () => setSpeaking(false);
		setSpeaking(true);
		synth.speak(u);
	}
	function stopSpeak() {
		window.speechSynthesis?.cancel();
		setSpeaking(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex flex-col bg-background text-foreground",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "tour-title",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chrome-gutter pl-4 pt-[max(1rem,env(safe-area-inset-top))]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex h-12 items-center text-sm font-medium uppercase tracking-[0.16em] text-spark",
					children: [
						"Tour ",
						step + 1,
						" of ",
						STEPS.length
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto px-6 py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KitchenHero, { plates: current.plates }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						ref: live,
						tabIndex: -1,
						className: "mt-4 text-base font-medium text-spark",
						"aria-live": "polite",
						children: ["Step ", step + 1]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						id: "tour-title",
						className: "mt-2 font-display text-4xl leading-tight",
						children: current.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-xl leading-relaxed text-foreground",
						children: current.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-12 w-full",
							onClick: speaking ? stopSpeak : speak,
							children: speaking ? "Stop speaking" : "Speak this step"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-base text-muted-foreground",
							children: "Captions are the text above. Speaking uses your device voice — nothing is uploaded."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "h-12 flex-1",
						disabled: step === 0,
						onClick: () => {
							stopSpeak();
							setStep((s) => Math.max(0, s - 1));
						},
						children: "Back"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "h-12 flex-1",
						onClick: finish,
						children: "Skip tour"
					}),
					step < STEPS.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-12 flex-1 bg-spark text-spark-foreground hover:opacity-95",
						onClick: () => {
							stopSpeak();
							setStep((s) => s + 1);
						},
						children: "Next"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-12 flex-1 bg-spark text-spark-foreground hover:opacity-95",
						onClick: () => {
							stopSpeak();
							finish();
						},
						children: "Start cooking"
					})
				]
			})
		]
	});
}
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of).
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
function applyChrome() {
	const { theme, nextGen, locale } = useSpoonful.getState();
	document.documentElement.dataset.theme = theme === "midnight" ? "midnight" : "paper";
	document.documentElement.dataset.ease = nextGen ? "next" : "simple";
	document.documentElement.lang = htmlLang(locale);
}
function SpoonfulApp() {
	const onboarded = useSpoonful((s) => s.onboarded);
	const walkthroughDone = useSpoonful((s) => s.walkthroughDone);
	const tab = useSpoonful((s) => s.tab);
	const setTab = useSpoonful((s) => s.setTab);
	const theme = useSpoonful((s) => s.theme);
	const setTheme = useSpoonful((s) => s.setTheme);
	const nextGen = useSpoonful((s) => s.nextGen);
	const setNextGen = useSpoonful((s) => s.setNextGen);
	const cookedDates = useSpoonful((s) => s.cookedDates);
	const xp = useSpoonful((s) => s.xp);
	const notifyPrefs = useSpoonful((s) => s.notifyPrefs);
	const dinnerHour = useSpoonful((s) => s.dinnerHour);
	const meals = useSpoonful((s) => s.meals);
	const locale = useSpoonful((s) => s.locale);
	const navPins = useSpoonful((s) => s.navPins);
	const { user, isPending } = useCurrentUserState();
	const [profile, setProfile] = (0, import_react.useState)(void 0);
	const [extras, setExtras] = (0, import_react.useState)(false);
	const [editPins, setEditPins] = (0, import_react.useState)(false);
	const [unread, setUnread] = (0, import_react.useState)(0);
	const streak = cookStreak(cookedDates, isoDate());
	const rank = rankForXp(xp);
	const pins = normalizePins(navPins);
	const tabs = nextGen ? [
		{
			id: "plan",
			label: t(locale, "plan"),
			icon: CalendarDays
		},
		{
			id: "recipes",
			label: t(locale, "recipes"),
			icon: BookOpen
		},
		{
			id: "snap",
			label: t(locale, "snap"),
			icon: Camera
		},
		{
			id: "fit",
			label: t(locale, "fuel"),
			icon: Dumbbell
		},
		{
			id: "shop",
			label: t(locale, "shop"),
			icon: ShoppingBasket
		}
	] : [
		{
			id: "plan",
			label: t(locale, "plan"),
			icon: CalendarDays
		},
		{
			id: "recipes",
			label: t(locale, "recipes"),
			icon: BookOpen
		},
		{
			id: "snap",
			label: t(locale, "snap"),
			icon: Camera
		},
		{
			id: "sauces",
			label: t(locale, "sauces"),
			icon: Droplets
		},
		{
			id: "shop",
			label: t(locale, "shop"),
			icon: ShoppingBasket
		}
	];
	(0, import_react.useEffect)(() => {
		Promise.resolve(useSpoonful.persist.rehydrate()).then(async () => {
			const s = useSpoonful.getState();
			if (!s.fitnessSource) return;
			if (!s.syncAccess) s.setSyncAccess("while-using");
			const always = useSpoonful.getState().syncAccess === "always";
			const pending = await consumePendingSync();
			if (always) {
				await enableAlwaysSync();
				const plated = useSpoonful.getState().syncFitness({ live: false });
				if (plated) pushNote("Tonight is plated", plated);
				return;
			}
			if (pending) useSpoonful.getState().syncFitness({ live: false });
		});
	}, []);
	(0, import_react.useEffect)(() => {
		return onBackgroundSync(() => {
			const s = useSpoonful.getState();
			if (!s.fitnessSource || s.syncAccess !== "always") return;
			const plated = s.syncFitness({ live: false });
			if (plated) pushNote("Tonight is plated", plated);
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!onboarded) return;
		const tick = () => {
			const s = useSpoonful.getState();
			if (!s.fitnessSource || s.syncAccess !== "always") return;
			s.syncFitness({ live: true });
		};
		const id = window.setInterval(tick, 4e4);
		const onVis = () => {
			if (document.visibilityState !== "visible") return;
			const s = useSpoonful.getState();
			if (s.fitnessSource && s.syncAccess === "always") s.syncFitness({ live: false });
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [onboarded]);
	(0, import_react.useEffect)(() => {
		applyChrome();
	}, [
		theme,
		nextGen,
		locale
	]);
	(0, import_react.useEffect)(() => {
		if (!notifyPrefs.dinner) return;
		const wait = Math.min(msUntilHour(dinnerHour), 432e5);
		const id = window.setTimeout(() => {
			const today = isoDate();
			const dinner = useSpoonful.getState().meals.find((m) => m.date === today && m.slot === "dinner");
			const title = dinner ? resolveMeal(dinner).title : "Nothing plated yet";
			pushNote("Tonight", title);
		}, wait);
		return () => window.clearTimeout(id);
	}, [
		notifyPrefs.dinner,
		dinnerHour,
		meals
	]);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setProfile(null);
			setUnread(0);
			return;
		}
		getMyProfile().then((p) => setProfile(p)).catch(() => setProfile(null));
		listNotifications().then((rows) => setUnread(rows.filter((n) => !n.read).length)).catch(() => setUnread(0));
	}, [
		user,
		isPending,
		tab
	]);
	if (!onboarded) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboarding, {});
	if (!walkthroughDone) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Walkthrough, {});
	if (user && profile === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsernameGate, { onDone: () => {
		getMyProfile().then((p) => setProfile(p ?? void 0));
	} });
	function goPin(id) {
		if (id === "extras") {
			setExtras(true);
			return;
		}
		setExtras(false);
		setTab(id);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh max-w-full overflow-x-clip bg-transparent text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CelebrateOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "pt-[max(0.5rem,env(safe-area-inset-top))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-2xl items-stretch",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-16 min-w-0 flex-1 items-center px-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pill-slot",
						"aria-hidden": true
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-2xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setTheme(theme === "midnight" ? "paper" : "midnight"),
								className: "flex size-12 shrink-0 items-center justify-center rounded-full bg-card shadow-[var(--shadow-border)]",
								"aria-label": theme === "midnight" ? "Paper kitchen" : "Midnight kitchen",
								children: theme === "midnight" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setNextGen(!nextGen),
								className: cn("flex h-12 min-w-0 flex-1 items-center justify-center rounded-full text-base font-semibold", nextGen ? "bg-primary text-primary-foreground" : "bg-spark text-spark-foreground"),
								"aria-pressed": nextGen,
								children: [nextGen ? t(locale, "nextGen") : t(locale, "simple"), " Kitchen"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-center text-sm font-medium text-spark",
							children: [rank.title, streak > 0 ? ` · ${streak}d` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "mt-1 flex items-center gap-1",
							"aria-label": "Shortcuts",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5",
								children: pins.map((id) => {
									const menu = menuById(id);
									if (!menu) return null;
									const Icon = menu.icon;
									const on = id === "extras" ? extras : tab === id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => goPin(id),
										className: cn("relative flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium", on ? "bg-spark text-spark-foreground" : "text-muted-foreground"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
												className: "size-4",
												strokeWidth: on ? 2.4 : 1.8
											}),
											t(locale, menu.labelKey),
											id === "people" && unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", on ? "bg-spark-foreground" : "bg-spark") }) : null
										]
									}, id);
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setEditPins(true),
								className: "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground",
								"aria-label": t(locale, "editPins"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
							})]
						})
					]
				})]
			}),
			tab === "plan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanView, { onOpenStore: () => setExtras(true) }) : null,
			tab === "recipes" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipesView, { onOpenStore: () => setExtras(true) }) : null,
			tab === "sauces" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaucesView, {}) : null,
			tab === "desserts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DessertsView, {}) : null,
			tab === "snap" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnapView, {}) : null,
			tab === "people" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleView, {}) : null,
			tab === "fit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FitView, { onOpenStore: () => setExtras(true) }) : null,
			tab === "shop" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopView, {}) : null,
			extras ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 overflow-y-auto bg-background",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky top-0 z-10 bg-background/90 backdrop-blur",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto flex max-w-2xl items-stretch",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-14 min-w-0 flex-1 items-center justify-between px-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setExtras(false),
									className: "h-11 text-sm font-medium",
									children: t(locale, "closeExtras")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/login",
									className: "h-11 text-sm font-medium text-spark",
									children: "Sign in"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pill-slot",
							"aria-hidden": true
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreView, {})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: editPins,
				onOpenChange: setEditPins,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					title: t(locale, "editPins"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinEditor, { onDone: () => setEditPins(false) })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
				"aria-label": "Primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mx-auto grid max-w-lg grid-cols-5",
					children: tabs.map((item) => {
						const Icon = item.icon;
						const on = tab === item.id;
						const snap = item.id === "snap";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setTab(item.id),
							className: cn("relative flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold", snap && "nav-snap", on && snap && "text-spark-foreground", on && !snap && "text-primary", !on && snap && "text-spark-foreground", !on && !snap && "text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn(snap && "flex size-12 items-center justify-center rounded-full bg-spark text-spark-foreground"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-5",
									strokeWidth: on ? 2.4 : 1.8
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "max-w-full truncate px-0.5",
								children: item.label
							})]
						}) }, item.id);
					})
				})
			})
		]
	});
}
function PinEditor({ onDone }) {
	const locale = useSpoonful((s) => s.locale);
	const navPins = useSpoonful((s) => s.navPins);
	const togglePin = useSpoonful((s) => s.togglePin);
	const pins = normalizePins(navPins);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pb-4 pt-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.16em] text-spark",
				children: t(locale, "editPins")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-2xl",
				children: "Shortcuts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: t(locale, "pinHint")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs tabular-nums text-muted-foreground",
				children: [pins.length, " / 6"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 grid grid-cols-2 gap-2",
				children: NAV_MENUS.map((menu) => {
					const on = pins.includes(menu.id);
					const Icon = menu.icon;
					const full = !on && pins.length >= 6;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: full,
						onClick: () => togglePin(menu.id),
						className: cn("flex min-h-14 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm", on ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 shrink-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: t(locale, menu.labelKey)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								children: on ? "On" : full ? "Full" : "Add"
							})
						]
					}) }, menu.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5 w-full",
				onClick: onDone,
				children: t(locale, "donePins")
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpoonfulApp, {});
}
//#endregion
export { Home as component };
