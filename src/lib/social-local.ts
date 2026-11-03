import type { SocialComment, SocialPost } from "./social-house";

const KEY = "spoonful-pass-v1";

export type LocalThreadMsg = { id: string; body: string; mine: boolean; at: string };

export type PassState = {
  likes: string[];
  saves: string[];
  reposts: string[];
  follows: string[];
  watched: string[];
  privateProfile: boolean;
  posts: SocialPost[];
  comments: SocialComment[];
  threads: Record<string, LocalThreadMsg[]>;
};

const EMPTY: PassState = {
  likes: [],
  saves: [],
  reposts: [],
  follows: [],
  watched: [],
  privateProfile: false,
  posts: [],
  comments: [],
  threads: {},
};

export function loadPass(): PassState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<PassState>;
    return {
      ...EMPTY,
      ...parsed,
      likes: parsed.likes ?? [],
      saves: parsed.saves ?? [],
      reposts: parsed.reposts ?? [],
      follows: parsed.follows ?? [],
      watched: parsed.watched ?? [],
      posts: parsed.posts ?? [],
      comments: parsed.comments ?? [],
      threads: parsed.threads ?? {},
    };
  } catch {
    return { ...EMPTY };
  }
}

export function savePass(state: PassState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode or full storage */
  }
}

export function uid(): string {
  return crypto.randomUUID();
}
