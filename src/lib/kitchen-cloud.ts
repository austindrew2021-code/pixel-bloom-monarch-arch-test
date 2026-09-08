import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const loadKitchenState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: unknown; updated_at: string }>`
      select payload, updated_at
      from kitchen_state
      where user_id = ${context.userId}
      limit 1
    `;
    const row = rows[0];
    if (!row) return { json: "" as const, updatedAt: "" as const };
    const json = typeof row.payload === "string" ? row.payload : JSON.stringify(row.payload ?? {});
    return { json, updatedAt: row.updated_at };
  });

export const saveKitchenState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ json: z.string().max(1_500_000) }).parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into kitchen_state (user_id, payload, updated_at)
      values (${context.userId}, ${data.json}::jsonb, now())
      on conflict (user_id)
      do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
