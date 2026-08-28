import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

function nid() {
  return crypto.randomUUID();
}

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i += 1) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export type FamilyKitchen = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  role: string;
};


export const myKitchen = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<FamilyKitchen>`
      select k.id, k.name, k.invite_code, k.owner_id, m.role
      from kitchen_members m
      join kitchens k on k.id = m.kitchen_id
      where m.user_id = ${context.userId}
      order by m.joined_at desc
      limit 1
    `;
    return (rows[0] ?? null) as FamilyKitchen | null;
  });

export const listKitchenMembers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const kitchen = await sql<{ kitchen_id: string }>`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
    if (!kitchen[0]) return [];
    return sql<{ user_id: string; username: string; role: string }>`
      select m.user_id, coalesce(p.username, 'cook') as username, m.role
      from kitchen_members m
      left join profiles p on p.user_id = m.user_id
      where m.kitchen_id = ${kitchen[0].kitchen_id}
      order by m.joined_at
    `;
  });

export const createKitchen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ name: z.string().trim().min(2).max(40) }).parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ kitchen_id: string }>`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
    if (existing[0]) return { ok: false as const, error: "You already sit at a family table." };
    const id = nid();
    let invite = code();
    for (let i = 0; i < 5; i += 1) {
      const clash = await sql<{ id: string }>`select id from kitchens where invite_code = ${invite}`;
      if (!clash[0]) break;
      invite = code();
    }
    await sql`insert into kitchens (id, name, invite_code, owner_id) values (${id}, ${data.name}, ${invite}, ${context.userId})`;
    await sql`insert into kitchen_members (kitchen_id, user_id, role) values (${id}, ${context.userId}, ${"owner"})`;
    return { ok: true as const, id, invite };
  });

export const joinKitchen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ code: z.string().trim().min(4).max(8) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const already = await sql<{ kitchen_id: string }>`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
    if (already[0]) return { ok: false as const, error: "Leave your current table first." };
    const invite = data.code.toUpperCase();
    const kitchen = await sql<{ id: string; name: string }>`
      select id, name from kitchens where invite_code = ${invite}
    `;
    if (!kitchen[0]) return { ok: false as const, error: "That code is not a kitchen." };
    const seats = await sql<{ n: number }>`
      select count(*)::int as n from kitchen_members where kitchen_id = ${kitchen[0].id}
    `;
    if ((seats[0]?.n ?? 0) >= 6) return { ok: false as const, error: "That table is full (6 seats)." };
    await sql`insert into kitchen_members (kitchen_id, user_id, role) values (${kitchen[0].id}, ${context.userId}, ${"cook"})`;
    await sql`insert into kitchen_events (id, kitchen_id, user_id, kind, body)
      values (${nid()}, ${kitchen[0].id}, ${context.userId}, ${"join"}, ${"sat down at the table"})`;
    return { ok: true as const, name: kitchen[0].name };
  });

export const leaveKitchen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from kitchen_members where user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const postKitchenEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        kind: z.enum(["plated", "cooked", "shop", "note"]),
        body: z.string().trim().min(1).max(160),
        recipeName: z.string().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const kitchen = await sql<{ kitchen_id: string }>`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
    if (!kitchen[0]) return { ok: false as const, error: "Join a family table first." };
    await sql`insert into kitchen_events (id, kitchen_id, user_id, kind, body, recipe_name)
      values (${nid()}, ${kitchen[0].kitchen_id}, ${context.userId}, ${data.kind}, ${data.body}, ${data.recipeName ?? null})`;
    const others = await sql<{ user_id: string }>`
      select user_id from kitchen_members
      where kitchen_id = ${kitchen[0].kitchen_id} and user_id <> ${context.userId}
    `;
    for (const row of others) {
      await sql`insert into notifications (id, user_id, kind, actor_id, body)
        values (${nid()}, ${row.user_id}, ${"family"}, ${context.userId}, ${data.body})`;
    }
    return { ok: true as const };
  });

export const listKitchenEvents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const kitchen = await sql<{ kitchen_id: string }>`
      select kitchen_id from kitchen_members where user_id = ${context.userId} limit 1
    `;
    if (!kitchen[0]) return [];
    return sql<{
      id: string;
      kind: string;
      body: string;
      recipe_name: string | null;
      created_at: string;
      username: string | null;
    }>`
      select e.id, e.kind, e.body, e.recipe_name, e.created_at, p.username
      from kitchen_events e
      left join profiles p on p.user_id = e.user_id
      where e.kitchen_id = ${kitchen[0].kitchen_id}
      order by e.created_at desc
      limit 30
    `;
  });
