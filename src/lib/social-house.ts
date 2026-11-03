/** House cooks that ship with the table so People is never an empty room. */

export type HouseAuthor = { id: string; username: string; name: string };

export const HOUSE: HouseAuthor[] = [
  { id: "house-mara", username: "mara", name: "Mara" },
  { id: "house-lee", username: "lee", name: "Lee" },
  { id: "house-nori", username: "nori", name: "Nori" },
  { id: "house-atlas", username: "atlas", name: "Atlas" },
];

export type SocialKind = "photo" | "text" | "reel" | "story";

export type SocialPost = {
  id: string;
  authorId: string;
  kind: SocialKind;
  body: string;
  media?: string;
  at: string;
  baseLikes: number;
  house: boolean;
  visibility: "public" | "private";
};

export type SocialComment = {
  id: string;
  postId: string;
  username: string;
  body: string;
  at: string;
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

export function houseAuthor(id: string): HouseAuthor | undefined {
  return HOUSE.find((a) => a.id === id);
}

export function relTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(s) || s < 0) return "now";
  if (s < 60) return "now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export const PLATE_PICKS = [
  "/food/carbonara.jpg",
  "/food/bibimbap.jpg",
  "/food/ca-fish-tacos.jpg",
  "/food/butter-tarts.jpg",
  "/food/avocado-toast-egg.jpg",
  "/food/beef-chili.jpg",
  "/food/cacio-e-pepe.jpg",
  "/food/blueberry-pancakes.jpg",
];

export function housePosts(): SocialPost[] {
  return [
    {
      id: "house-chili",
      authorId: "house-mara",
      kind: "photo",
      body: "Sunday chili, the long way. The leftovers are the point.",
      media: "/food/beef-chili.jpg",
      at: hoursAgo(2),
      baseLikes: 128,
      house: true,
      visibility: "public",
    },
    {
      id: "house-text-salt",
      authorId: "house-lee",
      kind: "text",
      body: "Unpopular: salt the pasta water until it tastes like the sea. That is the only chance the noodle gets.",
      at: hoursAgo(3),
      baseLikes: 86,
      house: true,
      visibility: "public",
    },
    {
      id: "house-tacos",
      authorId: "house-nori",
      kind: "photo",
      body: "Fish tacos, cabbage cut thin, lime while it is still hot.",
      media: "/food/ca-fish-tacos.jpg",
      at: hoursAgo(5),
      baseLikes: 204,
      house: true,
      visibility: "public",
    },
    {
      id: "house-text-pan",
      authorId: "house-atlas",
      kind: "text",
      body: "If the pan is crowded, you are steaming. Two batches. Gold beats grey.",
      at: hoursAgo(8),
      baseLikes: 64,
      house: true,
      visibility: "public",
    },
    {
      id: "house-cacio",
      authorId: "house-lee",
      kind: "photo",
      body: "Cacio e pepe. Pepper in the fat first, not on the finished plate.",
      media: "/food/cacio-e-pepe.jpg",
      at: hoursAgo(11),
      baseLikes: 311,
      house: true,
      visibility: "public",
    },
    {
      id: "house-toast",
      authorId: "house-mara",
      kind: "photo",
      body: "Breakfast that still counts. Chili oil if the table can take it.",
      media: "/food/avocado-toast-egg.jpg",
      at: hoursAgo(20),
      baseLikes: 97,
      house: true,
      visibility: "public",
    },
  ];
}

export function houseStories(): SocialPost[] {
  return [
    {
      id: "story-mara",
      authorId: "house-mara",
      kind: "story",
      body: "Chili, hour four.",
      media: "/food/beef-chili.jpg",
      at: hoursAgo(1),
      baseLikes: 0,
      house: true,
      visibility: "public",
    },
    {
      id: "story-lee",
      authorId: "house-lee",
      kind: "story",
      body: "Pepper toast.",
      media: "/food/cacio-e-pepe.jpg",
      at: hoursAgo(4),
      baseLikes: 0,
      house: true,
      visibility: "public",
    },
    {
      id: "story-nori",
      authorId: "house-nori",
      kind: "story",
      body: "Market fish.",
      media: "/food/ca-fish-tacos.jpg",
      at: hoursAgo(6),
      baseLikes: 0,
      house: true,
      visibility: "public",
    },
    {
      id: "story-atlas",
      authorId: "house-atlas",
      kind: "story",
      body: "Pancakes for the late table.",
      media: "/food/blueberry-pancakes.jpg",
      at: hoursAgo(9),
      baseLikes: 0,
      house: true,
      visibility: "public",
    },
    {
      id: "story-tarts",
      authorId: "house-mara",
      kind: "story",
      body: "Butter tarts cooled on the rack.",
      media: "/food/butter-tarts.jpg",
      at: hoursAgo(12),
      baseLikes: 0,
      house: true,
      visibility: "public",
    },
  ];
}

export function houseReels(): SocialPost[] {
  return [
    {
      id: "reel-bibimbap",
      authorId: "house-nori",
      kind: "reel",
      body: "Bibimbap. Mix it only when you are ready to eat.",
      media: "/food/bibimbap.jpg",
      at: hoursAgo(1),
      baseLikes: 540,
      house: true,
      visibility: "public",
    },
    {
      id: "reel-carbonara",
      authorId: "house-lee",
      kind: "reel",
      body: "Carbonara. Off the heat before the egg goes in.",
      media: "/food/carbonara.jpg",
      at: hoursAgo(3),
      baseLikes: 890,
      house: true,
      visibility: "public",
    },
    {
      id: "reel-pancakes",
      authorId: "house-atlas",
      kind: "reel",
      body: "Blueberry pancakes. Wait for the bubbles, then flip once.",
      media: "/food/blueberry-pancakes.jpg",
      at: hoursAgo(7),
      baseLikes: 420,
      house: true,
      visibility: "public",
    },
    {
      id: "reel-tarts",
      authorId: "house-mara",
      kind: "reel",
      body: "Butter tarts. The filling should still wobble when it comes out.",
      media: "/food/butter-tarts.jpg",
      at: hoursAgo(14),
      baseLikes: 260,
      house: true,
      visibility: "public",
    },
  ];
}

export function houseComments(): SocialComment[] {
  return [
    { id: "hc1", postId: "house-chili", username: "lee", body: "Saving the pot for Tuesday lunch.", at: hoursAgo(1) },
    { id: "hc2", postId: "house-chili", username: "nori", body: "This is the one. No beans argument today.", at: hoursAgo(1.4) },
    { id: "hc3", postId: "house-tacos", username: "atlas", body: "Cabbage cut that thin is the whole taco.", at: hoursAgo(4) },
    { id: "hc4", postId: "house-cacio", username: "mara", body: "Stole this method. The pepper bloomed.", at: hoursAgo(9) },
    { id: "hc5", postId: "house-text-salt", username: "nori", body: "Correct. A shy pot of water is a bland noodle.", at: hoursAgo(2) },
    { id: "hc6", postId: "reel-carbonara", username: "atlas", body: "The scramble is the lesson nobody wants.", at: hoursAgo(2) },
  ];
}

export function houseThread(authorId: string): { id: string; body: string; mine: boolean; at: string }[] {
  const lines: Record<string, string> = {
    "house-mara": "Chili's on if you're around later. Bring bread, not advice.",
    "house-lee": "You still doing cacio this week or did the pepper run out?",
    "house-nori": "Market had haddock. Tacos if you want in.",
    "house-atlas": "Pancakes happened. There are two left. I'm not promising they'll last.",
  };
  return [
    {
      id: `seed-${authorId}`,
      body: lines[authorId] ?? "You around for dinner?",
      mine: false,
      at: hoursAgo(5),
    },
  ];
}
