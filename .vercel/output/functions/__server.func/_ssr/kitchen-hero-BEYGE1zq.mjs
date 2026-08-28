import "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { l as Slot } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Plate } from "./plate-wzIIVGuN.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow-[var(--shadow-border)] hover:opacity-95",
			spark: "bg-spark text-spark-foreground shadow-[var(--shadow-lift)] hover:opacity-95",
			secondary: "bg-card text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			outline: "bg-transparent text-foreground shadow-[var(--shadow-border)] hover:bg-card",
			ghost: "bg-transparent text-foreground hover:bg-muted",
			destructive: "bg-destructive text-destructive-foreground hover:opacity-95"
		},
		size: {
			default: "h-11 px-5",
			sm: "h-9 px-3.5 text-xs",
			lg: "h-12 px-6",
			icon: "size-11",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function KitchenHero({ plates = [
	"roast",
	"pasta",
	"green"
], className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative isolate h-28 w-full max-w-xs", className),
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-2 top-4 rotate-[-12deg]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
					kind: plates[0] ?? "roast",
					size: "lg"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-[4.5rem] top-0 z-[1] rotate-[6deg] drop-shadow-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
					kind: plates[1] ?? "pasta",
					size: "lg"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-36 top-6 rotate-[16deg]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
					kind: plates[2] ?? "green",
					size: "lg"
				})
			})
		]
	});
}
function Wordmark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex min-w-0 items-center gap-2", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, {
			kind: "pasta",
			size: "sm"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg leading-none tracking-tight sm:text-xl",
			children: "Spoonful"
		})]
	});
}
//#endregion
export { KitchenHero as n, Wordmark as r, Button as t };
