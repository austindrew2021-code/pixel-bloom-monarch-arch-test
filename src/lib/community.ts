import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z][A-Za-z0-9_]{2,19}$/, "3–20 letters, numbers, underscores. Start with a letter.");

function nid() {
  return crypto.randomUUID();
}

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
};

type RecipeRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  minutes: number;
  servings: number;
  cuisine: string;
  visibility: string;
  ingredients: { name: string; qty: number; unit: string; aisle: string }[];
  steps: string[];
  aliases: string;
  created_at: string;
  username?: string;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select user_id, username, display_name, bio from profiles where user_id = ${context.userId}
    `;
    return rows[0] ?? null;
  });

export const claimUsername = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ username: usernameSchema, displayName: z.string().max(40).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const name = data.username.toLowerCase();
    const existing = await sql<{ user_id: string }>`
      select user_id from profiles where lower(username) = ${name}
    `;
    if (existing[0] && existing[0].user_id !== context.userId) {
      return { ok: false as const, error: "That username is taken." };
    }
    const mine = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${context.userId}`;
    const display = (data.displayName ?? data.username).slice(0, 40);
    if (mine[0]) {
      await sql`update profiles set username = ${name}, display_name = ${display} where user_id = ${context.userId}`;
    } else {
      await sql`insert into profiles (user_id, username, display_name) values (${context.userId}, ${name}, ${display})`;
    }
    return { ok: true as const, username: name };
  });

export const searchPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ q: z.string().max(40) }).parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const q = `%${data.q.trim().toLowerCase()}%`;
    const rows = await sql<ProfileRow & { following: boolean }>`
      select p.user_id, p.username, p.display_name, p.bio,
        exists(select 1 from follows f where f.follower_id = ${context.userId} and f.followee_id = p.user_id) as following
      from profiles p
      where p.user_id <> ${context.userId}
        and (lower(p.username) like ${q} or lower(p.display_name) like ${q})
      order by p.username
      limit 20
    `;
    return rows;
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ userId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    if (data.userId === context.userId) return { ok: false as const, error: "You already know you." };
    const sql = await getSql();
    const has = await sql<{ follower_id: string }>`
      select follower_id from follows where follower_id = ${context.userId} and followee_id = ${data.userId}
    `;
    if (has[0]) {
      await sql`delete from follows where follower_id = ${context.userId} and followee_id = ${data.userId}`;
      return { ok: true as const, following: false };
    }
    await sql`insert into follows (follower_id, followee_id) values (${context.userId}, ${data.userId})`;
    await sql`insert into notification_prefs (user_id, followee_id, enabled)
      values (${context.userId}, ${data.userId}, true)
      on conflict (user_id, followee_id) do nothing`;
    await sql`insert into notifications (id, user_id, kind, actor_id, body)
      values (${nid()}, ${data.userId}, 'follow', ${context.userId}, 'started following you')`;
    return { ok: true as const, following: true };
  });

export const setNotifyPref = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ followeeId: z.string(), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`insert into notification_prefs (user_id, followee_id, enabled)
      values (${context.userId}, ${data.followeeId}, ${data.enabled})
      on conflict (user_id, followee_id) do update set enabled = ${data.enabled}`;
    return { ok: true as const };
  });

export const listFollowing = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<ProfileRow & { notify: boolean }>`
      select p.user_id, p.username, p.display_name, p.bio,
        coalesce(np.enabled, true) as notify
      from follows f
      join profiles p on p.user_id = f.followee_id
      left join notification_prefs np on np.user_id = ${context.userId} and np.followee_id = p.user_id
      where f.follower_id = ${context.userId}
      order by p.username
    `;
  });

export const saveCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().optional(),
        name: z.string().min(2).max(80),
        description: z.string().max(400).optional(),
        minutes: z.number().min(1).max(600),
        servings: z.number().min(1).max(24),
        cuisine: z.string().max(40),
        visibility: z.enum(["private", "followers", "public"]),
        ingredients: z.array(
          z.object({
            name: z.string(),
            qty: z.number(),
            unit: z.string(),
            aisle: z.string(),
          }),
        ),
        steps: z.array(z.string()),
        aliases: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = data.id ?? nid();
    const ingredients = JSON.stringify(data.ingredients);
    const steps = JSON.stringify(data.steps);
    const desc = data.description ?? "";
    const aliases = data.aliases ?? "";
    const existing = await sql<{ id: string }>`
      select id from community_recipes where id = ${id} and user_id = ${context.userId}
    `;
    if (existing[0]) {
      await sql`update community_recipes set
        name = ${data.name}, description = ${desc}, minutes = ${data.minutes},
        servings = ${data.servings}, cuisine = ${data.cuisine}, visibility = ${data.visibility},
        ingredients = ${ingredients}::jsonb, steps = ${steps}::jsonb, aliases = ${aliases},
        updated_at = now()
        where id = ${id} and user_id = ${context.userId}`;
    } else {
      await sql`insert into community_recipes
        (id, user_id, name, description, minutes, servings, cuisine, visibility, ingredients, steps, aliases)
        values (${id}, ${context.userId}, ${data.name}, ${desc}, ${data.minutes}, ${data.servings},
          ${data.cuisine}, ${data.visibility}, ${ingredients}::jsonb, ${steps}::jsonb, ${aliases})`;
    }
    if (data.visibility !== "private") {
      const followers = await sql<{ follower_id: string }>`
        select f.follower_id from follows f
        left join notification_prefs np on np.user_id = f.follower_id and np.followee_id = ${context.userId}
        where f.followee_id = ${context.userId} and coalesce(np.enabled, true) = true
      `;
      for (const row of followers) {
        await sql`insert into notifications (id, user_id, kind, actor_id, recipe_id, body)
          values (${nid()}, ${row.follower_id}, 'new_recipe', ${context.userId}, ${id}, ${data.name})`;
      }
    }
    return { ok: true as const, id };
  });

export const listMyRecipes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<RecipeRow>`
      select id, user_id, name, description, minutes, servings, cuisine, visibility, ingredients, steps, aliases, created_at
      from community_recipes where user_id = ${context.userId} order by updated_at desc
    `;
  });

export const feedRecipes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ q: z.string().max(80).optional() }).parse(input ?? {}))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const q = data.q?.trim() ? `%${data.q.trim().toLowerCase()}%` : null;
    const rows = await sql<RecipeRow>`
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
    return rows;
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      kind: string;
      actor_id: string;
      recipe_id: string | null;
      body: string;
      read: boolean;
      created_at: string;
      username: string | null;
    }>`
      select n.id, n.kind, n.actor_id, n.recipe_id, n.body, n.read, n.created_at, p.username
      from notifications n
      left join profiles p on p.user_id = n.actor_id
      where n.user_id = ${context.userId}
      order by n.created_at desc
      limit 40
    `;
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`update notifications set read = true where user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      is_group: boolean;
      title: string;
      last_body: string | null;
      last_at: string | null;
    }>`
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

export const openDirectChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ userId: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ conversation_id: string }>`
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
    if (existing[0]) return { ok: true as const, id: existing[0].conversation_id };
    const id = nid();
    await sql`insert into conversations (id, is_group, title, created_by)
      values (${id}, false, '', ${context.userId})`;
    await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${context.userId})`;
    await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${data.userId})`;
    return { ok: true as const, id };
  });

export const createGroupChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ title: z.string().min(1).max(40), memberIds: z.array(z.string()).max(12) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = nid();
    await sql`insert into conversations (id, is_group, title, created_by)
      values (${id}, true, ${data.title}, ${context.userId})`;
    const members = Array.from(new Set([context.userId, ...data.memberIds]));
    for (const uid of members) {
      await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${uid})`;
    }
    return { ok: true as const, id };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ conversationId: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const member = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
    `;
    if (!member[0]) return [];
    return sql<{ id: string; user_id: string; body: string; created_at: string; username: string | null }>`
      select m.id, m.user_id, m.body, m.created_at, p.username
      from messages m
      left join profiles p on p.user_id = m.user_id
      where m.conversation_id = ${data.conversationId}
      order by m.created_at asc
      limit 100
    `;
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ conversationId: z.string(), body: z.string().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const member = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
    `;
    if (!member[0]) return { ok: false as const, error: "Not in this chat." };
    const id = nid();
    await sql`insert into messages (id, conversation_id, user_id, body)
      values (${id}, ${data.conversationId}, ${context.userId}, ${data.body})`;
    const others = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id <> ${context.userId}
    `;
    for (const row of others) {
      await sql`insert into notifications (id, user_id, kind, actor_id, body)
        values (${nid()}, ${row.user_id}, 'message', ${context.userId}, ${data.body.slice(0, 80)})`;
    }
    return { ok: true as const, id };
  });
