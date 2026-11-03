import { ArrowLeft, Send, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createGroupChat,
  listConversations,
  listFollowing,
  listMessages,
  openDirectChat,
  searchPeople,
  sendMessage,
} from "@/lib/community";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { useSpoonful } from "@/lib/spoonful-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Convo = Awaited<ReturnType<typeof listConversations>>[number];
type Msg = Awaited<ReturnType<typeof listMessages>>[number];
type Person = Awaited<ReturnType<typeof searchPeople>>[number];

function chatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initial(name: string): string {
  const clean = name.replace(/^@/, "").trim();
  return (clean[0] || "?").toUpperCase();
}

export function ChatPane({
  activeId,
  onActiveId,
  contained = false,
}: {
  activeId: string | null;
  onActiveId: (id: string | null) => void;
  contained?: boolean;
}) {
  const { user } = useCurrentUserState();
  const locale = useSpoonful((s) => s.locale);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [following, setFollowing] = useState<Awaited<ReturnType<typeof listFollowing>>>([]);
  const [groupTitle, setGroupTitle] = useState("Kitchen crew");
  const [picked, setPicked] = useState<string[]>([]);
  const [find, setFind] = useState("");
  const [hits, setHits] = useState<Person[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  async function loadConvos() {
    try {
      setConvos(await listConversations());
      setFollowing(await listFollowing());
      setError("");
    } catch {
      setError("Couldn't load chats. Check that you're signed in, then try again.");
    }
  }

  useEffect(() => {
    void loadConvos();
    const id = window.setInterval(() => void loadConvos(), 8000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let live = true;
    const tick = async () => {
      try {
        const rows = await listMessages({ data: { conversationId: activeId } });
        if (live) setMessages(rows);
      } catch {
        if (live) setError("Couldn't refresh this thread.");
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2500);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [activeId]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, activeId]);

  async function openPerson(person: Person) {
    try {
      const res = await openDirectChat({ data: { userId: person.user_id } });
      if (!res.ok) {
        toast("Could not open a private chat");
        return;
      }
      setComposing(false);
      onActiveId(res.id);
      await loadConvos();
    } catch {
      toast("Could not open a private chat");
    }
  }

  if (activeId) {
    const title = convos.find((c) => c.id === activeId)?.title ?? "Chat";
    const label = title.startsWith("@") || !title ? title : title;
    return (
      <div
        className={cn(
          "flex flex-col bg-background text-foreground",
          contained ? "absolute inset-0 z-10" : "fixed inset-0 z-40",
        )}
      >
        <header className="border-b border-border pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-stretch">
            <div className="flex h-14 min-w-0 flex-1 items-center gap-2 px-2">
              <Button variant="ghost" size="icon" aria-label="Back to chats" onClick={() => onActiveId(null)}>
                <ArrowLeft />
              </Button>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-spark text-sm font-semibold text-spark-foreground">
                {initial(label)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{label.startsWith("@") ? label : label}</p>
                <p className="truncate text-xs text-muted-foreground">Private · only people in this chat</p>
              </div>
            </div>
            {isPreviewChrome() ? <div className="pill-slot" aria-hidden /> : null}
          </div>
        </header>
        <div ref={scroller} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {messages.length === 0 ? (
            <p className="mx-auto max-w-xs pt-16 text-center text-sm text-muted-foreground">
              Say what's for dinner. Nothing here is public.
            </p>
          ) : null}
          {messages.map((m, i) => {
            const mine = Boolean(user && m.user_id === user.id);
            const prev = messages[i - 1];
            const showName = !mine && prev?.user_id !== m.user_id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%]", mine ? "items-end" : "items-start")}>
                  {showName ? (
                    <p className="mb-0.5 px-1 text-[11px] text-muted-foreground">@{m.username ?? "cook"}</p>
                  ) : null}
                  <div
                    className={cn(
                      "px-3 py-2 text-sm leading-snug break-words",
                      mine
                        ? "rounded-2xl rounded-br-md bg-spark text-spark-foreground"
                        : "rounded-2xl rounded-bl-md bg-card shadow-[var(--shadow-border)]",
                    )}
                  >
                    {m.body}
                  </div>
                  <p className={cn("mt-0.5 px-1 text-[10px] text-muted-foreground", mine && "text-right")}>
                    {chatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <form
          className="flex items-end gap-2 border-t border-border px-3 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={async (e) => {
            e.preventDefault();
            const text = body.trim();
            if (!text || sending) return;
            setSending(true);
            try {
              const res = await sendMessage({ data: { conversationId: activeId, body: text } });
              if (!res.ok) {
                toast(res.error);
                return;
              }
              setBody("");
              setMessages(await listMessages({ data: { conversationId: activeId } }));
              await loadConvos();
            } catch {
              toast("Message did not send. Try again.");
            } finally {
              setSending(false);
            }
          }}
        >
          <Input
            className="min-w-0 flex-1 rounded-full"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message"
            maxLength={1000}
            aria-label="Message"
          />
          <Button type="submit" size="icon" variant="spark" className="shrink-0 rounded-full" disabled={sending || !body.trim()} aria-label={t(locale, "send")}>
            <Send />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-4" data-testid="chat-inbox">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl">Messages</h2>
        <Button type="button" size="sm" variant="secondary" onClick={() => setComposing((v) => !v)}>
          <Users />
          New
        </Button>
      </div>
      <form
        className="mt-3 flex min-w-0 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setHits(await searchPeople({ data: { q: find } }));
            setError("");
          } catch {
            toast("Search didn't go through. Try again.");
          }
        }}
      >
        <Input
          className="min-w-0 flex-1 rounded-full"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          placeholder="Search cooks"
          aria-label={t(locale, "findCook")}
        />
        <Button type="submit" variant="secondary" className="shrink-0 rounded-full">
          Search
        </Button>
      </form>
      {hits.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
          {hits.map((p) => (
            <li key={p.user_id} className="border-b border-border last:border-0">
              <button type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => void openPerson(p)}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-spark text-sm font-semibold text-spark-foreground">
                  {initial(p.username)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">@{p.username}</span>
                  <span className="block truncate text-xs text-muted-foreground">Message</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{error}</p>
      ) : convos.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          No messages yet. Search a cook and say hello. Chats stay private to the people in them.
        </p>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
          {convos.map((c) => {
            const name = c.is_group ? c.title || "Group" : c.title ? `@${c.title}` : "Direct";
            return (
              <li key={c.id} className="border-b border-border last:border-0">
                <button type="button" onClick={() => onActiveId(c.id)} className="flex w-full items-center gap-3 px-3 py-3 text-left">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-background text-sm font-semibold">
                    {c.is_group ? <Users className="size-4" /> : initial(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{chatTime(c.last_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {c.last_body ?? "No messages yet"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {composing ? (
        <div className="mt-4 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
          <p className="text-sm font-semibold">New group</p>
          <p className="mt-1 text-xs text-muted-foreground">Pick people you follow. They have to already be on Spoonful.</p>
          <Input className="mt-2" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} aria-label="Group name" />
          <div className="mt-2 flex flex-wrap gap-2">
            {following.length === 0 ? (
              <p className="text-xs text-muted-foreground">Follow a cook first, then they show up here.</p>
            ) : null}
            {following.map((p) => {
              const on = picked.includes(p.user_id);
              return (
                <button
                  key={p.user_id}
                  type="button"
                  onClick={() => setPicked((list) => (on ? list.filter((id) => id !== p.user_id) : [...list, p.user_id]))}
                  className={
                    on
                      ? "h-11 rounded-full bg-primary px-3 text-sm text-primary-foreground"
                      : "h-11 rounded-full bg-background px-3 text-sm shadow-[var(--shadow-border)]"
                  }
                >
                  @{p.username}
                </button>
              );
            })}
          </div>
          <Button
            className="mt-3 w-full"
            variant="secondary"
            disabled={picked.length === 0}
            onClick={async () => {
              try {
                const res = await createGroupChat({ data: { title: groupTitle, memberIds: picked } });
                if (res.ok) {
                  setComposing(false);
                  setPicked([]);
                  onActiveId(res.id);
                  await loadConvos();
                } else toast("Could not start the group");
              } catch {
                toast("Could not start the group");
              }
            }}
          >
            Start group
          </Button>
        </div>
      ) : null}
    </div>
  );
}
