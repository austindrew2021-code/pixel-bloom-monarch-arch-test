import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { cn as _enum, gn as object, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { r as getSql } from "./db-B0ifYp_W.mjs";
import { t as authMiddleware } from "./middleware-CqXj4VIy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/family-f1SZhSAa.js
function nid() {
	return crypto.randomUUID();
}
function code() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let s = "";
	for (let i = 0; i < 6; i += 1) s += alphabet[Math.floor(Math.random() * 32)];
	return s;
}
var myKitchen_createServerFn_handler = createServerRpc({
	id: "d3f213c14f90e3c76ab52b19c716ab06cdf9fad3a3c8d894ca8685ed3846fc71",
	name: "myKitchen",
	filename: "src/lib/family.ts"
}, (opts) => myKitchen.__executeServer(opts));
var myKitchen = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(myKitchen_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select k.id, k.name, k.invite_code, k.owner_id, m.role
      from kitchen_members m
      join kitchens k on k.id = m.kitchen_id
      where m.user_id = ${context.userId}
      order by m.joined_at desc
      limit 1
    `)[0] ?? null;
});
var listKitchenMembers_createServerFn_handler = createServerRpc({
	id: "6a65fa8286d884bf2e9f788e8f702529a082c4585feb637ff6a28a27c1bcebe4",
	name: "listKitchenMembers",
	filename: "src/lib/family.ts"
}, (opts) => listKitchenMembers.__executeServer(opts));
var listKitchenMembers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listKitchenMembers_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const kitchen = await sql`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
	if (!kitchen[0]) return [];
	return sql`
      select m.user_id, coalesce(p.username, 'cook') as username, m.role
      from kitchen_members m
      left join profiles p on p.user_id = m.user_id
      where m.kitchen_id = ${kitchen[0].kitchen_id}
      order by m.joined_at
    `;
});
var createKitchen_createServerFn_handler = createServerRpc({
	id: "03b30e05f32ad8a757b586f12d8df6a9ee7b8cd798981881be869aea1cbc393a",
	name: "createKitchen",
	filename: "src/lib/family.ts"
}, (opts) => createKitchen.__executeServer(opts));
var createKitchen = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ name: string().trim().min(2).max(40) }).parse(input)).handler(createKitchen_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if ((await sql`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `)[0]) return {
		ok: false,
		error: "You already sit at a family table."
	};
	const id = nid();
	let invite = code();
	for (let i = 0; i < 5; i += 1) {
		if (!(await sql`select id from kitchens where invite_code = ${invite}`)[0]) break;
		invite = code();
	}
	await sql`insert into kitchens (id, name, invite_code, owner_id) values (${id}, ${data.name}, ${invite}, ${context.userId})`;
	await sql`insert into kitchen_members (kitchen_id, user_id, role) values (${id}, ${context.userId}, ${"owner"})`;
	return {
		ok: true,
		id,
		invite
	};
});
var joinKitchen_createServerFn_handler = createServerRpc({
	id: "29e0a390c4749dc7ff41f0ccb2ce38d922943df1f35bf6c6f22f1a8d174970ef",
	name: "joinKitchen",
	filename: "src/lib/family.ts"
}, (opts) => joinKitchen.__executeServer(opts));
var joinKitchen = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ code: string().trim().min(4).max(8) }).parse(input)).handler(joinKitchen_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if ((await sql`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `)[0]) return {
		ok: false,
		error: "Leave your current table first."
	};
	const kitchen = await sql`
      select id, name from kitchens where invite_code = ${data.code.toUpperCase()}
    `;
	if (!kitchen[0]) return {
		ok: false,
		error: "That code is not a kitchen."
	};
	if (((await sql`
      select count(*)::int as n from kitchen_members where kitchen_id = ${kitchen[0].id}
    `)[0]?.n ?? 0) >= 6) return {
		ok: false,
		error: "That table is full (6 seats)."
	};
	await sql`insert into kitchen_members (kitchen_id, user_id, role) values (${kitchen[0].id}, ${context.userId}, ${"cook"})`;
	await sql`insert into kitchen_events (id, kitchen_id, user_id, kind, body)
      values (${nid()}, ${kitchen[0].id}, ${context.userId}, ${"join"}, ${"sat down at the table"})`;
	return {
		ok: true,
		name: kitchen[0].name
	};
});
var leaveKitchen_createServerFn_handler = createServerRpc({
	id: "f7ccdd70f3ccfb7ae46d300c915dcecf49b69e81948222bf713c6ed729097060",
	name: "leaveKitchen",
	filename: "src/lib/family.ts"
}, (opts) => leaveKitchen.__executeServer(opts));
var leaveKitchen = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(leaveKitchen_createServerFn_handler, async ({ context }) => {
	await (await getSql())`delete from kitchen_members where user_id = ${context.userId}`;
	return { ok: true };
});
var postKitchenEvent_createServerFn_handler = createServerRpc({
	id: "b2957448b73877aca87718c1dfb4a976de83d586510ad35fe32da88370f3f0d9",
	name: "postKitchenEvent",
	filename: "src/lib/family.ts"
}, (opts) => postKitchenEvent.__executeServer(opts));
var postKitchenEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	kind: _enum([
		"plated",
		"cooked",
		"shop",
		"note"
	]),
	body: string().trim().min(1).max(160),
	recipeName: string().max(80).optional()
}).parse(input)).handler(postKitchenEvent_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const kitchen = await sql`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
	if (!kitchen[0]) return {
		ok: false,
		error: "Join a family table first."
	};
	await sql`insert into kitchen_events (id, kitchen_id, user_id, kind, body, recipe_name)
      values (${nid()}, ${kitchen[0].kitchen_id}, ${context.userId}, ${data.kind}, ${data.body}, ${data.recipeName ?? null})`;
	const others = await sql`
      select user_id from kitchen_members
      where kitchen_id = ${kitchen[0].kitchen_id} and user_id <> ${context.userId}
    `;
	for (const row of others) await sql`insert into notifications (id, user_id, kind, actor_id, body)
        values (${nid()}, ${row.user_id}, ${"family"}, ${context.userId}, ${data.body})`;
	return { ok: true };
});
var listKitchenEvents_createServerFn_handler = createServerRpc({
	id: "dae4349312ccbfaed104f5bc5419d44aa86dbd42aeb1d5a8a28a87560260db2f",
	name: "listKitchenEvents",
	filename: "src/lib/family.ts"
}, (opts) => listKitchenEvents.__executeServer(opts));
var listKitchenEvents = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listKitchenEvents_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const kitchen = await sql`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
	if (!kitchen[0]) return [];
	return sql`
      select e.id, e.kind, e.body, e.recipe_name, e.created_at, p.username
      from kitchen_events e
      left join profiles p on p.user_id = e.user_id
      where e.kitchen_id = ${kitchen[0].kitchen_id}
      order by e.created_at desc
      limit 30
    `;
});
//#endregion
export { createKitchen_createServerFn_handler, joinKitchen_createServerFn_handler, leaveKitchen_createServerFn_handler, listKitchenEvents_createServerFn_handler, listKitchenMembers_createServerFn_handler, myKitchen_createServerFn_handler, postKitchenEvent_createServerFn_handler };
