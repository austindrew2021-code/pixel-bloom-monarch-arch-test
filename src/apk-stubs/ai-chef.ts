type CatalogItem = {
  id: string;
  name: string;
  minutes: number;
  protein: string;
  tags: string[];
};

type Call = {
  data: {
    prompt: string;
    days: string[];
    household: number;
    recipes: CatalogItem[];
    invent?: boolean;
    allergies?: string[];
    prefs?: string[];
    scope?: "week" | "tonight";
  };
};

function score(prompt: string, r: CatalogItem) {
  const words = prompt.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  let n = 0;
  const name = r.name.toLowerCase();
  const tags = r.tags.map((t) => t.toLowerCase());
  for (const w of words) {
    if (name.includes(w)) n += 4;
    if (tags.some((t) => t.includes(w))) n += 2;
    if (r.protein.toLowerCase().includes(w)) n += 2;
  }
  return n;
}

export async function planWeekWithChef(arg: Call) {
  const data = arg.data;
  const catalog = data.recipes ?? [];
  if (!catalog.length || !data.days?.length) {
    return { ok: false as const, error: "No recipes to plate from." };
  }
  const ranked = [...catalog].sort((a, b) => score(data.prompt ?? "", b) - score(data.prompt ?? "", a));
  const used = new Set<string>();
  const days = data.days.map((date, i) => {
    const pick =
      ranked.find((r) => !used.has(r.protein)) ?? ranked[i % ranked.length]!;
    used.add(pick.protein);
    return { date, recipeId: pick.id };
  });
  return {
    ok: true as const,
    days,
    note: "Plated from your library on this test phone — no extra credits spent.",
  };
}

export type ChefDish = {
  name: string;
  minutes: number;
  description?: string;
  protein?: string;
  ingredients: { name: string; qty: number; unit: string; aisle: string }[];
  steps: string[];
  nutrition: { cal: number; protein: number; carbs: number; fat: number };
};
