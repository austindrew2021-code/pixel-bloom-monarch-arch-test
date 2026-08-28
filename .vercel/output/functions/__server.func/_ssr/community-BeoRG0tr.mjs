import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { r as getSql } from "./db-B0ifYp_W.mjs";
import { t as authMiddleware } from "./middleware-CqXj4VIy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/community-BeoRG0tr.js
var usernameSchema = string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{2,19}$/, "3–20 letters, numbers, underscores. Start with a letter.");
function nid() {
	return crypto.randomUUID();
}
var getMyProfile_createServerFn_handler = createServerRpc({
	id: "1086152078e9105399a098e0916ebee1df42f9fb84f46e13242dab4b7f64bf57",
	name: "getMyProfile",
	filename: "src/lib/community.ts"
}, (opts) => getMyProfile.__executeServer(opts));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyProfile_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select user_id, username, display_name, bio from profiles where user_id = ${context.userId}
    `)[0] ?? null;
});
var claimUsername_createServerFn_handler = createServerRpc({
	id: "ba7bab22faaa8d2289cbec7c2ea0a6a0c9ac38dbca5fcf76181340ad27c1a2fb",
	name: "claimUsername",
	filename: "src/lib/community.ts"
}, (opts) => claimUsername.__executeServer(opts));
var claimUsername = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	username: usernameSchema,
	displayName: string().max(40).optional()
}).parse(input)).handler(claimUsername_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const name = data.username.toLowerCase();
	const existing = await sql`
      select user_id from profiles where lower(username) = ${name}
    `;
	if (existing[0] && existing[0].user_id !== context.userId) return {
		ok: false,
		error: "That username is taken."
	};
	const mine = await sql`select user_id from profiles where user_id = ${context.userId}`;
	const display = (data.displayName ?? data.username).slice(0, 40);
	if (mine[0]) await sql`update profiles set username = ${name}, display_name = ${display} where user_id = ${context.userId}`;
	else await sql`insert into profiles (user_id, username, display_name) values (${context.userId}, ${name}, ${display})`;
	return {
		ok: true,
		username: name
	};
});
var searchPeople_createServerFn_handler = createServerRpc({
	id: "c5ba5231e281610651e5455717aab8baee86c80215d751ba422fe1357b320b0f",
	name: "searchPeople",
	filename: "src/lib/community.ts"
}, (opts) => searchPeople.__executeServer(opts));
var searchPeople = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ q: string().max(40) }).parse(input)).handler(searchPeople_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const q = `%${data.q.trim().toLowerCase()}%`;
	return await sql`
      select p.user_id, p.username, p.display_name, p.bio,
        exists(select 1 from follows f where f.follower_id = ${context.userId} and f.followee_id = p.user_id) as following
      from profiles p
      where p.user_id <> ${context.userId}
        and (lower(p.username) like ${q} or lower(p.display_name) like ${q})
      order by p.username
      limit 20
    `;
});
var toggleFollow_createServerFn_handler = createServerRpc({
	id: "9744b4ae3d4ee5d93fe9acf584683016ecb5fe13ac82f74a0c8b0c676cb4be7d",
	name: "toggleFollow",
	filename: "src/lib/community.ts"
}, (opts) => toggleFollow.__executeServer(opts));
var toggleFollow = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ userId: string().min(1) }).parse(input)).handler(toggleFollow_createServerFn_handler, async ({ context, data }) => {
	if (data.userId === context.userId) return {
		ok: false,
		error: "You already know you."
	};
	const sql = await getSql();
	if ((await sql`
      select follower_id from follows where follower_id = ${context.userId} and followee_id = ${data.userId}
    `)[0]) {
		await sql`delete from follows where follower_id = ${context.userId} and followee_id = ${data.userId}`;
		return {
			ok: true,
			following: false
		};
	}
	await sql`insert into follows (follower_id, followee_id) values (${context.userId}, ${data.userId})`;
	await sql`insert into notification_prefs (user_id, followee_id, enabled)
      values (${context.userId}, ${data.userId}, true)
      on conflict (user_id, followee_id) do nothing`;
	await sql`insert into notifications (id, user_id, kind, actor_id, body)
      values (${nid()}, ${data.userId}, 'follow', ${context.userId}, 'started following you')`;
	return {
		ok: true,
		following: true
	};
});
var setNotifyPref_createServerFn_handler = createServerRpc({
	id: "661493697190ca5a804ade825aa13696900299978645a719fd3fa11cce8de66d",
	name: "setNotifyPref",
	filename: "src/lib/community.ts"
}, (opts) => setNotifyPref.__executeServer(opts));
var setNotifyPref = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	followeeId: string(),
	enabled: boolean()
}).parse(input)).handler(setNotifyPref_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`insert into notification_prefs (user_id, followee_id, enabled)
      values (${context.userId}, ${data.followeeId}, ${data.enabled})
      on conflict (user_id, followee_id) do update set enabled = ${data.enabled}`;
	return { ok: true };
});
var listFollowing_createServerFn_handler = createServerRpc({
	id: "9e300ca4071d476c019a0eaf45edef11cf59e52e9d3715200001218e1089f9be",
	name: "listFollowing",
	filename: "src/lib/community.ts"
}, (opts) => listFollowing.__executeServer(opts));
var listFollowing = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listFollowing_createServerFn_handler, async ({ context }) => {
	return (await getSql())`
      select p.user_id, p.username, p.display_name, p.bio,
        coalesce(np.enabled, true) as notify
      from follows f
      join profiles p on p.user_id = f.followee_id
      left join notification_prefs np on np.user_id = ${context.userId} and np.followee_id = p.user_id
      where f.follower_id = ${context.userId}
      order by p.username
    `;
});
var saveCommunityRecipe_createServerFn_handler = createServerRpc({
	id: "5c81af334a11b1e56a474a9c2c1733d1abd361c78205e78363a0415695e7e5b5",
	name: "saveCommunityRecipe",
	filename: "src/lib/community.ts"
}, (opts) => saveCommunityRecipe.__executeServer(opts));
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
}).parse(input)).handler(saveCommunityRecipe_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const id = data.id ?? nid();
	const ingredients = JSON.stringify(data.ingredients);
	const steps = JSON.stringify(data.steps);
	const desc = data.description ?? "";
	const aliases = data.aliases ?? "";
	if ((await sql`
      select id from community_recipes where id = ${id} and user_id = ${context.userId}
    `)[0]) await sql`update community_recipes set
        name = ${data.name}, description = ${desc}, minutes = ${data.minutes},
        servings = ${data.servings}, cuisine = ${data.cuisine}, visibility = ${data.visibility},
        ingredients = ${ingredients}::jsonb, steps = ${steps}::jsonb, aliases = ${aliases},
        updated_at = now()
        where id = ${id} and user_id = ${context.userId}`;
	else await sql`insert into community_recipes
        (id, user_id, name, description, minutes, servings, cuisine, visibility, ingredients, steps, aliases)
        values (${id}, ${context.userId}, ${data.name}, ${desc}, ${data.minutes}, ${data.servings},
          ${data.cuisine}, ${data.visibility}, ${ingredients}::jsonb, ${steps}::jsonb, ${aliases})`;
	if (data.visibility !== "private") {
		const followers = await sql`
        select f.follower_id from follows f
        left join notification_prefs np on np.user_id = f.follower_id and np.followee_id = ${context.userId}
        where f.followee_id = ${context.userId} and coalesce(np.enabled, true) = true
      `;
		for (const row of followers) await sql`insert into notifications (id, user_id, kind, actor_id, recipe_id, body)
          values (${nid()}, ${row.follower_id}, 'new_recipe', ${context.userId}, ${id}, ${data.name})`;
	}
	return {
		ok: true,
		id
	};
});
var listMyRecipes_createServerFn_handler = createServerRpc({
	id: "1f307393bfa8c38646ef74425ed07f758e51172ea8b7b93a699fff3187a027a1",
	name: "listMyRecipes",
	filename: "src/lib/community.ts"
}, (opts) => listMyRecipes.__executeServer(opts));
var listMyRecipes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyRecipes_createServerFn_handler, async ({ context }) => {
	return (await getSql())`
      select id, user_id, name, description, minutes, servings, cuisine, visibility, ingredients, steps, aliases, created_at
      from community_recipes where user_id = ${context.userId} order by updated_at desc
    `;
});
var feedRecipes_createServerFn_handler = createServerRpc({
	id: "513c0b2719302555d71dda8ad596276e6b49e25bd32481470888738bd4dec810",
	name: "feedRecipes",
	filename: "src/lib/community.ts"
}, (opts) => feedRecipes.__executeServer(opts));
var feedRecipes = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ q: string().max(80).optional() }).parse(input ?? {})).handler(feedRecipes_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const q = data.q?.trim() ? `%${data.q.trim().toLowerCase()}%` : null;
	return await sql`
      select r.id, r.user_id, r.name, r.description, r.minutes, r.servings, r.cuisine, r.visibility,
        r.ingredients, r.steps, r.aliases, r.created_at, p.username
      from community_recipes r
      join profiles p on p.user_id = r.user_id
      where (
        r.visibility = 'public'
        or r.user_id = ${context.userId}
        or (r.visibility = 'followers' and exists (
          select 1 from follows f where f.follower_id = ${context.userId} and f.followee_id = r.user_id
        ))
      )
      and (
        ${q}::text is null
        or lower(r.name) like ${q}
        or lower(r.aliases) like ${q}
        or lower(r.cuisine) like ${q}
      )
      order by r.created_at desc
      limit 40
    `;
});
var listNotifications_createServerFn_handler = createServerRpc({
	id: "118dae8bdb96c610e65feddb021127e23c10f8cb4369dbdc9827af29841bc565",
	name: "listNotifications",
	filename: "src/lib/community.ts"
}, (opts) => listNotifications.__executeServer(opts));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotifications_createServerFn_handler, async ({ context }) => {
	return (await getSql())`
      select n.id, n.kind, n.actor_id, n.recipe_id, n.body, n.read, n.created_at, p.username
      from notifications n
      left join profiles p on p.user_id = n.actor_id
      where n.user_id = ${context.userId}
      order by n.created_at desc
      limit 40
    `;
});
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "8775c9b78e77fedfd0e6ed1e8f1ece53baa9fb2d8d2abf1ccace9ef5fba68030",
	name: "markNotificationsRead",
	filename: "src/lib/community.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(markNotificationsRead_createServerFn_handler, async ({ context }) => {
	await (await getSql())`update notifications set read = true where user_id = ${context.userId}`;
	return { ok: true };
});
var listConversations_createServerFn_handler = createServerRpc({
	id: "d4129d70d4ed76cc56f1c957286ba86bcece1f59ceda3ee68392642ea9b5d9ca",
	name: "listConversations",
	filename: "src/lib/community.ts"
}, (opts) => listConversations.__executeServer(opts));
var listConversations = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listConversations_createServerFn_handler, async ({ context }) => {
	return (await getSql())`
      select c.id, c.is_group,
        case
          when c.is_group then c.title
          else coalesce((
            select p.username from conversation_members cm2
            join profiles p on p.user_id = cm2.user_id
            where cm2.conversation_id = c.id and cm2.user_id <> ${context.userId}
            limit 1
          ), 'Direct')
        end as title,
        (select m.body from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_body,
        (select m.created_at from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_at
      from conversations c
      join conversation_members cm on cm.conversation_id = c.id
      where cm.user_id = ${context.userId}
      order by last_at desc nulls last
    `;
});
var openDirectChat_createServerFn_handler = createServerRpc({
	id: "cb4485f14c930b9641ab5a277c7cb28d2c1dd217336e4a151c44a5275058283c",
	name: "openDirectChat",
	filename: "src/lib/community.ts"
}, (opts) => openDirectChat.__executeServer(opts));
var openDirectChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ userId: string() }).parse(input)).handler(openDirectChat_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const existing = await sql`
      select cm.conversation_id
      from conversation_members cm
      join conversations c on c.id = cm.conversation_id
      where c.is_group = false
        and cm.conversation_id in (
          select conversation_id from conversation_members where user_id = ${context.userId}
        )
        and cm.user_id = ${data.userId}
      limit 1
    `;
	if (existing[0]) return {
		ok: true,
		id: existing[0].conversation_id
	};
	const id = nid();
	await sql`insert into conversations (id, is_group, title, created_by)
      values (${id}, false, '', ${context.userId})`;
	await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${context.userId})`;
	await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${data.userId})`;
	return {
		ok: true,
		id
	};
});
var createGroupChat_createServerFn_handler = createServerRpc({
	id: "a09498e615ba9fdc9570c67a55a5b851893362772e4d96a49dc50a3900e19690",
	name: "createGroupChat",
	filename: "src/lib/community.ts"
}, (opts) => createGroupChat.__executeServer(opts));
var createGroupChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	title: string().min(1).max(40),
	memberIds: array(string()).max(12)
}).parse(input)).handler(createGroupChat_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const id = nid();
	await sql`insert into conversations (id, is_group, title, created_by)
      values (${id}, true, ${data.title}, ${context.userId})`;
	const members = Array.from(/* @__PURE__ */ new Set([context.userId, ...data.memberIds]));
	for (const uid of members) await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${uid})`;
	return {
		ok: true,
		id
	};
});
var listMessages_createServerFn_handler = createServerRpc({
	id: "27e239d96a633ef7e86d5f7d14281b81a12a9c69ed1582876c5fd81c11deec58",
	name: "listMessages",
	filename: "src/lib/community.ts"
}, (opts) => listMessages.__executeServer(opts));
var listMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ conversationId: string() }).parse(input)).handler(listMessages_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (!(await sql`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
    `)[0]) return [];
	return sql`
      select m.id, m.user_id, m.body, m.created_at, p.username
      from messages m
      left join profiles p on p.user_id = m.user_id
      where m.conversation_id = ${data.conversationId}
      order by m.created_at asc
      limit 100
    `;
});
var sendMessage_createServerFn_handler = createServerRpc({
	id: "57a6f61cc3d7edb8cd081cf00a5df78f082f42bc99fbebc9f19961403928c4ab",
	name: "sendMessage",
	filename: "src/lib/community.ts"
}, (opts) => sendMessage.__executeServer(opts));
var sendMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	conversationId: string(),
	body: string().min(1).max(1e3)
}).parse(input)).handler(sendMessage_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (!(await sql`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
    `)[0]) return {
		ok: false,
		error: "Not in this chat."
	};
	const id = nid();
	await sql`insert into messages (id, conversation_id, user_id, body)
      values (${id}, ${data.conversationId}, ${context.userId}, ${data.body})`;
	const others = await sql`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id <> ${context.userId}
    `;
	for (const row of others) await sql`insert into notifications (id, user_id, kind, actor_id, body)
        values (${nid()}, ${row.user_id}, 'message', ${context.userId}, ${data.body.slice(0, 80)})`;
	return {
		ok: true,
		id
	};
});
//#endregion
export { claimUsername_createServerFn_handler, createGroupChat_createServerFn_handler, feedRecipes_createServerFn_handler, getMyProfile_createServerFn_handler, listConversations_createServerFn_handler, listFollowing_createServerFn_handler, listMessages_createServerFn_handler, listMyRecipes_createServerFn_handler, listNotifications_createServerFn_handler, markNotificationsRead_createServerFn_handler, openDirectChat_createServerFn_handler, saveCommunityRecipe_createServerFn_handler, searchPeople_createServerFn_handler, sendMessage_createServerFn_handler, setNotifyPref_createServerFn_handler, toggleFollow_createServerFn_handler };
