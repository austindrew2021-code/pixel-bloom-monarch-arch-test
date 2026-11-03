import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export type CloudSocial = {
  likes: string[];
  saves: string[];
  reposts: string[];
  privateProfile: boolean;
  posts: {
    id: string;
    userId: string;
    username: string;
    kind: string;
    body: string;
    media: string | null;
    visibility: string;
    at: string;
  }[];
  comments: { id: string; postId: string; username: string; body: string; at: string }[];
  counts: { postId: string; likes: number; saves: number; reposts: number }[];
};

export const loadSocialCloud = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CloudSocial | null> => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const me = context.userId;
      const profile = await sql<{ is_private: boolean; username: string }>`
        select is_private, username from profiles where user_id = ${me} limit 1
      `;
      const likes = await sql<{ post_id: string }>`select post_id from social_likes where user_id = ${me}`;
      const saves = await sql<{ post_id: string }>`select post_id from social_saves where user_id = ${me}`;
      const reposts = await sql<{ post_id: string }>`select post_id from social_reposts where user_id = ${me}`;
      const posts = await sql<{
        id: string;
        user_id: string;
        username: string | null;
        kind: string;
        body: string;
        media: string | null;
        visibility: string;
        created_at: string;
      }>`
        select p.id, p.user_id, pr.username, p.kind, p.body, p.media, p.visibility, p.created_at
        from social_posts p
        left join profiles pr on pr.user_id = p.user_id
        where p.visibility = 'public' or p.user_id = ${me}
        order by p.created_at desc
        limit 80
      `;
      const comments = await sql<{
        id: string;
        post_id: string;
        username: string | null;
        body: string;
        created_at: string;
      }>`
        select c.id, c.post_id, pr.username, c.body, c.created_at
        from social_comments c
        left join profiles pr on pr.user_id = c.user_id
        order by c.created_at desc
        limit 200
      `;
      const counts = await sql<{ post_id: string; likes: number; saves: number; reposts: number }>`
        select p.id as post_id,
          (select count(*)::int from social_likes l where l.post_id = p.id) as likes,
          (select count(*)::int from social_saves s where s.post_id = p.id) as saves,
          (select count(*)::int from social_reposts r where r.post_id = p.id) as reposts
        from social_posts p
        order by p.created_at desc
        limit 80
      `;
      return {
        likes: likes.map((r) => r.post_id),
        saves: saves.map((r) => r.post_id),
        reposts: reposts.map((r) => r.post_id),
        privateProfile: Boolean(profile[0]?.is_private),
        posts: posts.map((p) => ({
          id: p.id,
          userId: p.user_id,
          username: p.username ?? "cook",
          kind: p.kind,
          body: p.body,
          media: p.media,
          visibility: p.visibility,
          at: p.created_at,
        })),
        comments: comments.map((c) => ({
          id: c.id,
          postId: c.post_id,
          username: c.username ?? "cook",
          body: c.body,
          at: c.created_at,
        })),
        counts: counts.map((c) => ({
          postId: c.post_id,
          likes: c.likes,
          saves: c.saves,
          reposts: c.reposts,
        })),
      };
    } catch {
      return null;
    }
  });

const postSchema = z.object({
  id: z.string().min(8).max(80),
  kind: z.enum(["photo", "text", "reel", "story"]),
  body: z.string().max(500),
  media: z.string().max(1_500_000).optional(),
  visibility: z.enum(["public", "private"]),
});

export const publishSocial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => postSchema.parse(input))
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await sql`insert into social_posts (id, user_id, kind, body, media, visibility)
        values (${data.id}, ${context.userId}, ${data.kind}, ${data.body}, ${data.media ?? null}, ${data.visibility})
        on conflict (id) do nothing`;
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export const toggleSocial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ postId: z.string().max(80), kind: z.enum(["like", "save", "repost"]), on: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const postId = data.postId;
      const userId = context.userId;
      if (data.kind === "like") {
        if (data.on) await sql`insert into social_likes (post_id, user_id) values (${postId}, ${userId}) on conflict do nothing`;
        else await sql`delete from social_likes where post_id = ${postId} and user_id = ${userId}`;
      } else if (data.kind === "save") {
        if (data.on) await sql`insert into social_saves (post_id, user_id) values (${postId}, ${userId}) on conflict do nothing`;
        else await sql`delete from social_saves where post_id = ${postId} and user_id = ${userId}`;
      } else if (data.on) {
        await sql`insert into social_reposts (post_id, user_id) values (${postId}, ${userId}) on conflict do nothing`;
      } else {
        await sql`delete from social_reposts where post_id = ${postId} and user_id = ${userId}`;
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export const commentSocial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(8).max(80), postId: z.string().max(80), body: z.string().min(1).max(400) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await sql`insert into social_comments (id, post_id, user_id, body)
        values (${data.id}, ${data.postId}, ${context.userId}, ${data.body})`;
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export const setSocialPrivate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ isPrivate: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await sql`update profiles set is_private = ${data.isPrivate} where user_id = ${context.userId}`;
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });
