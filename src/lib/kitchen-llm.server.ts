/**
 * Server-only kitchen LLM. Groq first for this private test (xAI credits are low).
 * Never import from a React component — only from createServerFn handlers.
 */

if (typeof window !== "undefined") {
  throw new Error("kitchen-llm.server is server-only");
}

type ChatMessage = { role: "system" | "user"; content: unknown };

export type KitchenJson = { ok: true; json: unknown } | { ok: false; error: string };

type Provider = {
  url: string;
  key: string;
  model: string;
  jsonMode: boolean;
};

function groqKey(): string | undefined {
  // Environment only. A literal fallback here is readable by anyone with the
  // repo, so the key it names is public the moment it is committed.
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

function xaiKey(): string | undefined {
  return process.env.XAI_API_KEY;
}

function providers(vision: boolean): Provider[] {
  const list: Provider[] = [];
  const g = groqKey();
  if (g) {
    list.push({
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: g,
      model: vision ? "qwen/qwen3.6-27b" : "openai/gpt-oss-120b",
      jsonMode: !vision,
    });
  }
  const x = xaiKey();
  if (x) {
    list.push({
      url: "https://api.x.ai/v1/chat/completions",
      key: x,
      model: "grok-4.5",
      jsonMode: true,
    });
  }
  return list;
}

function extractJson(text: string): unknown | null {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    return null;
  }
}

async function complete(p: Provider, messages: ChatMessage[], maxTokens: number, temperature: number): Promise<string | null> {
  const body: Record<string, unknown> = {
    model: p.model,
    max_tokens: maxTokens,
    temperature,
    messages,
  };
  if (p.jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch(p.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${p.key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string; reasoning?: string } }[];
  };
  const msg = data.choices?.[0]?.message;
  return (msg?.content || msg?.reasoning || "").trim() || null;
}

export async function kitchenJson(
  system: string,
  user: unknown,
  maxTokens = 700,
  temperature = 0.4,
): Promise<KitchenJson> {
  const vision = Array.isArray(user);
  const chain = providers(vision);
  if (chain.length === 0) return { ok: false, error: "Kitchen AI is unavailable right now." };

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    typeof user === "string" || Array.isArray(user)
      ? { role: "user", content: user }
      : { role: "user", content: user },
  ];

  for (const p of chain) {
    try {
      const text = await complete(p, messages, maxTokens, temperature);
      if (!text) continue;
      const json = extractJson(text);
      if (json != null) return { ok: true, json };
    } catch {
      // try next provider
    }
  }
  return { ok: false, error: "The kitchen could not answer. Try again." };
}
