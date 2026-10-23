import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { RECIPES } from "./recipes.ts";

/*
 * No ingredient row may carry qty 0. When the print gives no amount the row is
 * qty 1 with no unit; otherwise it carries the printed amount.
 */
const ROW = /I\((["'])((?:(?!\1)[^\\]|\\.)*)\1,\s*([^,]+),/g;

test("no catalog source row has qty 0", () => {
	const dir = new URL(".", import.meta.url);
	const bad: string[] = [];
	for (const f of readdirSync(dir)) {
		if (!/^catalog.*\.ts$/.test(f) || f.endsWith(".test.ts")) continue;
		const src = readFileSync(new URL(f, dir), "utf8");
		for (const m of src.matchAll(ROW)) {
			const q = Number(m[3].trim());
			if (!Number.isNaN(q) && q === 0) bad.push(`${f}: ${m[2]}`);
		}
	}
	assert.deepEqual(bad, []);
});

test("no live recipe ingredient has qty 0 (or a non-positive / non-finite qty)", () => {
	const bad: string[] = [];
	for (const r of RECIPES) {
		for (const i of r.ingredients) {
			if (!(Number.isFinite(i.qty) && i.qty > 0)) bad.push(`${r.id}: ${i.name} qty=${i.qty}`);
		}
	}
	assert.deepEqual(bad, []);
});
