import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plate-wzIIVGuN.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Plate({ kind, className, size = "md" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("relative shrink-0 overflow-hidden rounded-full bg-food-cream shadow-[var(--shadow-border)]", size === "sm" ? "size-11" : size === "lg" ? "size-24" : size === "xl" ? "size-32" : "size-16", className),
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 64 64",
			className: "size-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "32",
					cy: "32",
					r: "30",
					className: "fill-food-cream"
				}),
				kind === "roast" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "34",
						rx: "16",
						ry: "12",
						className: "fill-food-crust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "32",
						rx: "12",
						ry: "8",
						className: "fill-food-salmon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "22",
						cy: "44",
						r: "5",
						className: "fill-food-herb"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "42",
						cy: "46",
						r: "4",
						className: "fill-food-leaf"
					})
				] }),
				kind === "pasta" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M14 30c6-8 30-8 36 0 2 10-8 18-18 18S12 40 14 30Z",
						className: "fill-food-yolk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M18 32c8-4 20-4 28 2",
						className: "stroke-food-tomato fill-none",
						strokeWidth: "3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "40",
						cy: "24",
						r: "4",
						className: "fill-food-herb"
					})
				] }),
				kind === "bowl" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M12 28h40l-4 16H16Z",
						className: "fill-food-broth"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "28",
						rx: "20",
						ry: "6",
						className: "fill-food-yolk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "26",
						cy: "30",
						r: "5",
						className: "fill-food-herb"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "38",
						cy: "32",
						r: "4",
						className: "fill-food-tomato"
					})
				] }),
				kind === "fish" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "34",
						cy: "32",
						rx: "16",
						ry: "9",
						className: "fill-food-salmon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M16 32l-6-8v16Z",
						className: "fill-food-salmon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "40",
						y: "40",
						width: "12",
						height: "6",
						rx: "2",
						className: "fill-food-leaf"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "42",
						cy: "30",
						r: "1.4",
						className: "fill-food-char"
					})
				] }),
				kind === "soup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M14 26h36v4c0 12-8 20-18 20S14 42 14 30Z",
						className: "fill-food-crust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "26",
						rx: "18",
						ry: "6",
						className: "fill-food-broth"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "26",
						cy: "26",
						r: "3",
						className: "fill-food-tomato"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "36",
						cy: "24",
						r: "2.5",
						className: "fill-food-herb"
					})
				] }),
				kind === "taco" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M12 40c0-14 10-24 20-24s20 10 20 24Z",
						className: "fill-food-yolk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M16 40c2-12 10-20 16-20s14 8 16 20",
						className: "fill-food-herb"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "28",
						cy: "30",
						r: "3",
						className: "fill-food-tomato"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "38",
						cy: "32",
						r: "3",
						className: "fill-food-leaf"
					})
				] }),
				kind === "green" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "34",
						rx: "18",
						ry: "14",
						className: "fill-food-leaf"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "28",
						cy: "30",
						rx: "8",
						ry: "6",
						className: "fill-food-herb"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "40",
						cy: "36",
						r: "5",
						className: "fill-food-tomato"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "24",
						cy: "40",
						r: "3",
						className: "fill-food-yolk"
					})
				] }),
				kind === "skillet" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "32",
						cy: "34",
						r: "16",
						className: "fill-food-char"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "32",
						cy: "34",
						r: "12",
						className: "fill-food-crust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "28",
						cy: "32",
						r: "4",
						className: "fill-food-herb"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "38",
						cy: "36",
						r: "3.5",
						className: "fill-food-tomato"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "46",
						y: "30",
						width: "12",
						height: "4",
						rx: "2",
						className: "fill-food-char"
					})
				] }),
				kind === "curry" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M14 30h36l-3 14H17Z",
						className: "fill-food-yolk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "30",
						rx: "18",
						ry: "7",
						className: "fill-food-crust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "30",
						cy: "32",
						r: "3",
						className: "fill-food-herb"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "38",
						cy: "34",
						r: "2.5",
						className: "fill-food-tomato"
					})
				] }),
				kind === "toast" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "16",
						y: "18",
						width: "32",
						height: "28",
						rx: "4",
						className: "fill-food-crust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "20",
						y: "22",
						width: "24",
						height: "20",
						rx: "3",
						className: "fill-food-cream"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "32",
						cy: "32",
						r: "6",
						className: "fill-food-yolk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "32",
						cy: "32",
						r: "3",
						className: "fill-food-crust"
					})
				] }),
				kind === "dessert" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M18 40h28l-4 10H22Z",
						className: "fill-food-crust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M20 40c4-14 20-14 24 0",
						className: "fill-food-salmon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "32",
						cy: "26",
						rx: "8",
						ry: "5",
						className: "fill-food-cream"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "32",
						cy: "20",
						r: "3",
						className: "fill-food-tomato"
					})
				] })
			]
		})
	});
}
//#endregion
export { cn as n, Plate as t };
