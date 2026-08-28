import { Bell, BellOff, MessageCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createGroupChat,
  feedRecipes,
  getMyProfile,
  listConversations,
  listFollowing,
  listMessages,
  listMyRecipes,
  listNotifications,
  markNotificationsRead,
  openDirectChat,
  saveCommunityRecipe,
  searchPeople,
  sendMessage,
  setNotifyPref,
  toggleFollow,
} from "@/lib/community";
import {
  createKitchen,
  joinKitchen,
  leaveKitchen,
  listKitchenEvents,
  listKitchenMembers,
  myKitchen,
  postKitchenEvent,
  type FamilyKitchen,
} from "@/lib/family";
import { GOAL_KINDS, goalLabel, type GoalKind } from "@/lib/body";
import { useSpoonful } from "@/lib/spoonful-store";
import { t } from "@/lib/i18n";
import { mondayOf } from "@/lib/week";
import { pushNote } from "@/lib/notify";
import type { Visibility } from "@/lib/types";
import { cn } from "@/lib/utils";

type Section = "cooks" | "mine" | "chat" | "alerts" | "table";

export function PeopleView() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="px-4 pt-8 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 pt-12">
        <h1 className="font-display text-3xl">Cooks</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sign in to claim a unique username, post homemade recipes, follow people, and chat.
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-spark px-5 text-sm font-medium text-spark-foreground"
        >
          Sign in
        </a>
      </div>
    );
  }
  return <PeopleHome />;
}

function PeopleHome() {
  const [section, setSection] = useState<Section>("cooks");
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  useEffect(() => {
    void getMyProfile().then((p) => setProfile(p));
  }, []);

  return (
    <div className="mx-auto max-w-2xl overflow-x-clip px-4 pb-36 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-spark">
        {profile ? `@${profile.username}` : "People"}
      </p>
      <h1 className="mt-1 font-display text-3xl">Kitchen table</h1>
      <div className="chip-row mt-4">
        {(
          [
            ["cooks", "Cooks"],
            ["table", "Family"],
            ["mine", "My recipes"],
            ["chat", "Chat"],
            ["alerts", "Alerts"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={
              section === id
                ? "h-9 shrink-0 rounded-full bg-spark px-3.5 text-sm text-spark-foreground"
                : "h-9 shrink-0 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]"
            }
          >
            {label}
          </button>
        ))}
      </div>
      {section === "cooks" ? (
        <CooksPane
          onOpenChat={(id) => {
            setActiveChat(id);
            setSection("chat");
          }}
        />
      ) : null}
      {section === "mine" ? <MinePane /> : null}
      {section === "chat" ? <ChatPane activeId={activeChat} onActiveId={setActiveChat} /> : null}
      {section === "alerts" ? <AlertsPane /> : null}
      {section === "table" ? (
        <>
          <SeatsPane />
          <FamilyPane />
        </>
      ) : null}
    </div>
  );
}

function CooksPane({ onOpenChat }: { onOpenChat: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<
    { user_id: string; username: string; display_name: string; bio: string; following: boolean }[]
  >([]);
  const [following, setFollowing] = useState<
    { user_id: string; username: string; display_name: string; notify: boolean }[]
  >([]);

  async function refresh() {
    const list = await listFollowing();
    setFollowing(list);
    if (q.trim()) setRows(await searchPeople({ data: { q } }));
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="mt-5">
      <form
        className="flex min-w-0 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setRows(await searchPeople({ data: { q } }));
        }}
      >
        <Input className="min-w-0 flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a username" />
        <Button type="submit" variant="secondary" className="shrink-0">
          Search
        </Button>
      </form>
      <ul className="mt-4 space-y-2">
        {rows.map((p) => (
          <li key={p.user_id} className="flex min-w-0 flex-col gap-2 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium">@{p.username}</p>
              <p className="truncate text-xs text-muted-foreground">{p.display_name}</p>
            </div>
            <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const res = await openDirectChat({ data: { userId: p.user_id } });
                if (res.ok) onOpenChat(res.id);
                else toast("Could not open a private chat");
              }}
            >
              Message
            </Button>
            <Button
              size="sm"
              variant={p.following ? "secondary" : "default"}
              onClick={async () => {
                await toggleFollow({ data: { userId: p.user_id } });
                await refresh();
                setRows(await searchPeople({ data: { q } }));
              }}
            >
              {p.following ? "Following" : "Follow"}
            </Button>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-xl">Following</h2>
      <ul className="mt-3 space-y-2">
        {following.map((p) => (
          <li key={p.user_id} className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
            <div className="min-w-0 flex-1">
              <p className="font-medium">@{p.username}</p>
            </div>
            <button
              type="button"
              aria-label={p.notify ? "Mute recipe alerts" : "Unmute recipe alerts"}
              className="flex size-11 items-center justify-center"
              onClick={async () => {
                await setNotifyPref({ data: { followeeId: p.user_id, enabled: !p.notify } });
                await refresh();
              }}
            >
              {p.notify ? <Bell className="size-4" /> : <BellOff className="size-4 text-muted-foreground" />}
            </button>
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={`Chat with ${p.username}`}
              onClick={async () => {
                const res = await openDirectChat({ data: { userId: p.user_id } });
                if (res.ok) onOpenChat(res.id);
              }}
            >
              <MessageCircle />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MinePane() {
  const assignCustom = useSpoonful((s) => s.assignCustom);
  const setTab = useSpoonful((s) => s.setTab);
  const [mine, setMine] = useState<Awaited<ReturnType<typeof listMyRecipes>>>([]);
  const [feed, setFeed] = useState<Awaited<ReturnType<typeof feedRecipes>>>([]);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setMine(await listMyRecipes());
    setFeed(await feedRecipes({ data: {} }));
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="mt-5">
      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> New homemade recipe
      </Button>
      <ul className="mt-4 space-y-2">
        {mine.map((r) => (
          <li key={r.id} className="rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
            <p className="font-medium">{r.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{r.visibility} · {r.cuisine}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-xl">From cooks you can see</h2>
      <ul className="mt-3 space-y-2">
        {feed.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="w-full rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
              onClick={() => {
                const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
                assignCustom(mondayOf(), "dinner", {
                  id: r.id,
                  name: r.name,
                  minutes: r.minutes,
                  notes: r.description,
                  ingredients: ings.map((i: { name?: string; qty?: number; unit?: string; aisle?: string }) => ({
                    name: String(i.name ?? "item"),
                    qty: Number(i.qty) || 1,
                    unit: String(i.unit ?? ""),
                    aisle: (i.aisle as "Other") || "Other",
                  })),
                });
                setTab("plan");
                toast("Added to Monday");
              }}
            >
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">@{r.username} · {r.cuisine}</p>
            </button>
          </li>
        ))}
      </ul>
      <RecipeForm open={open} onOpenChange={setOpen} onSaved={() => void refresh()} />
    </div>
  );
}

function RecipeForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("40");
  const [cuisine, setCuisine] = useState("Homemade");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [lines, setLines] = useState("onion, 1\ngarlic, 3 cloves");
  const [steps, setSteps] = useState("");
  const [aliases, setAliases] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Homemade recipe">
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ingredients = lines
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line) => {
                const [n, rest] = line.split(",").map((s) => s.trim());
                const bits = (rest ?? "").split(/\s+/);
                const qty = Number(bits[0]);
                return {
                  name: n || "item",
                  qty: Number.isFinite(qty) ? qty : 1,
                  unit: Number.isFinite(qty) ? bits.slice(1).join(" ") : rest || "",
                  aisle: "Other",
                };
              });
            const res = await saveCommunityRecipe({
              data: {
                name,
                description,
                minutes: Number(minutes) || 30,
                servings: 4,
                cuisine,
                visibility,
                ingredients,
                steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
                aliases,
              },
            });
            if (res.ok) {
              toast(visibility === "private" ? "Saved privately" : "Shared");
              onOpenChange(false);
              onSaved();
            }
          }}
        >
          <h2 className="font-display text-2xl">Homemade recipe</h2>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How you make it"
            rows={3}
            className="w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Input value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="Minutes" />
          <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Cuisine" />
          <Input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="Other names, slang, abbreviations" />
          <label className="text-sm">
            Who can see it
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="mt-1.5 h-11 w-full rounded-xl bg-card px-3 text-sm shadow-[var(--shadow-border)]"
            >
              <option value="private">Only me</option>
              <option value="followers">Followers</option>
              <option value="public">Everyone</option>
            </select>
          </label>
          <textarea
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)]"
            placeholder="Ingredients, one per line"
          />
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-background p-3 text-sm shadow-[var(--shadow-border)]"
            placeholder="Steps, one per line"
          />
          <Button type="submit" className="w-full">
            Save recipe
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ChatPane({
  activeId,
  onActiveId,
}: {
  activeId: string | null;
  onActiveId: (id: string | null) => void;
}) {
  const { user } = useCurrentUserState();
  const locale = useSpoonful((s) => s.locale);
  const [convos, setConvos] = useState<Awaited<ReturnType<typeof listConversations>>>([]);
  const active = activeId;
  const setActive = onActiveId;
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof listMessages>>>([]);
  const [body, setBody] = useState("");
  const [following, setFollowing] = useState<Awaited<ReturnType<typeof listFollowing>>>([]);
  const [groupTitle, setGroupTitle] = useState("Kitchen crew");
  const [picked, setPicked] = useState<string[]>([]);
  const [find, setFind] = useState("");
  const [hits, setHits] = useState<Awaited<ReturnType<typeof searchPeople>>>([]);
  const [sending, setSending] = useState(false);

  async function loadConvos() {
    setConvos(await listConversations());
    setFollowing(await listFollowing());
  }

  useEffect(() => {
    void loadConvos();
  }, []);

  useEffect(() => {
    if (!active) return;
    let live = true;
    const tick = async () => {
      try {
        const rows = await listMessages({ data: { conversationId: active } });
        if (live) setMessages(rows);
      } catch {
        /* keep last */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [active]);

  if (active) {
    const title = convos.find((c) => c.id === active)?.title ?? "Direct";
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => setActive(null)}>
            Back
          </Button>
          <p className="min-w-0 truncate text-sm font-medium">
            {t(locale, "privateChat")} · {title.startsWith("@") || !title ? title : `@${title}`}
          </p>
        </div>
        <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
          {messages.length === 0 ? (
            <li className="rounded-2xl bg-card px-3 py-3 text-sm text-muted-foreground">
              Private. Only people in this chat can read it.
            </li>
          ) : null}
          {messages.map((m) => {
            const mine = user && m.user_id === user.id;
            return (
              <li
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-[var(--shadow-border)]",
                  mine ? "ml-auto bg-spark text-spark-foreground" : "bg-card",
                )}
              >
                <p className={cn("text-xs", mine ? "opacity-80" : "text-muted-foreground")}>@{m.username ?? "cook"}</p>
                <p className="mt-0.5 break-words">{m.body}</p>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-3 flex min-w-0 items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!body.trim() || sending) return;
            setSending(true);
            try {
              const res = await sendMessage({ data: { conversationId: active, body: body.trim() } });
              if (!res.ok) {
                toast(res.error);
                return;
              }
              setBody("");
              setMessages(await listMessages({ data: { conversationId: active } }));
              await loadConvos();
            } catch {
              toast("Message did not send. Try again.");
            } finally {
              setSending(false);
            }
          }}
        >
          <Input
            className="min-w-0 flex-1"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t(locale, "writeNote")}
            maxLength={1000}
          />
          <Button type="submit" className="shrink-0" disabled={sending}>
            {t(locale, "send")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h2 className="font-display text-xl">{t(locale, "privateChat")}</h2>
      <form
        className="mt-3 flex min-w-0 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setHits(await searchPeople({ data: { q: find } }));
        }}
      >
        <Input
          className="min-w-0 flex-1"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          placeholder={t(locale, "findCook")}
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          Search
        </Button>
      </form>
      <ul className="mt-2 space-y-2">
        {hits.map((p) => (
          <li key={p.user_id} className="flex min-w-0 items-center justify-between gap-2 rounded-2xl bg-card p-3">
            <p className="min-w-0 truncate font-medium">@{p.username}</p>
            <Button
              size="sm"
              className="shrink-0"
              onClick={async () => {
                const res = await openDirectChat({ data: { userId: p.user_id } });
                if (res.ok) setActive(res.id);
                else toast("Could not open a private chat");
              }}
            >
              {t(locale, "message")}
            </Button>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-xl">{t(locale, "chats")}</h2>
      {convos.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(locale, "noChats")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {convos.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActive(c.id)}
                className="w-full rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
              >
                <p className="truncate font-medium">
                  {c.is_group ? c.title || "Group" : c.title ? `@${c.title}` : "Direct"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{c.last_body ?? "No messages yet"}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-8 font-display text-xl">New group</h2>
      <Input className="mt-2" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2">
        {following.map((p) => {
          const on = picked.includes(p.user_id);
          return (
            <button
              key={p.user_id}
              type="button"
              onClick={() =>
                setPicked((list) => (on ? list.filter((id) => id !== p.user_id) : [...list, p.user_id]))
              }
              className={
                on
                  ? "h-11 rounded-full bg-primary px-3 text-sm text-primary-foreground"
                  : "h-11 rounded-full bg-card px-3 text-sm shadow-[var(--shadow-border)]"
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
          const res = await createGroupChat({ data: { title: groupTitle, memberIds: picked } });
          if (res.ok) {
            setActive(res.id);
            await loadConvos();
          } else toast("Could not start the group");
        }}
      >
        Start group chat
      </Button>
    </div>
  );
}

function AlertsPane() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listNotifications>>>([]);
  useEffect(() => {
    void listNotifications().then(setRows);
  }, []);
  return (
    <div className="mt-5">
      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          await markNotificationsRead();
          setRows(await listNotifications());
        }}
      >
        Mark all read
      </Button>
      <ul className="mt-4 space-y-2">
        {rows.map((n) => (
          <li key={n.id} className="rounded-2xl bg-card p-3 text-sm shadow-[var(--shadow-border)]">
            <p>
              <span className="font-medium">@{n.username ?? "someone"}</span> {n.body}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{n.read ? "Read" : "New"} · {n.kind}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeatsPane() {
  const seats = useSpoonful((s) => s.seats) ?? [];
  const addSeat = useSpoonful((s) => s.addSeat);
  const updateSeat = useSpoonful((s) => s.updateSeat);
  const removeSeat = useSpoonful((s) => s.removeSeat);
  const body = useSpoonful((s) => s.body);
  const [name, setName] = useState("");
  const [goalKind, setGoalKind] = useState<GoalKind>(body.goalKind);

  return (
    <div className="mt-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl">Who is eating</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Each person can keep a body goal. Dinner follows the strictest Cut fat goal at the table — nobody cutting fat gets hush puppies.
        You are set to {goalLabel(body.goalKind)}.
      </p>
      <ul className="mt-3 space-y-2">
        <li className="rounded-2xl bg-background px-3 py-2 text-sm shadow-[var(--shadow-border)]">
          You · {goalLabel(body.goalKind)}
        </li>
        {seats.map((seat) => (
          <li key={seat.id} className="flex items-center gap-2 rounded-2xl bg-background px-3 py-2 shadow-[var(--shadow-border)]">
            <p className="min-w-0 flex-1 truncate text-sm">{seat.name}</p>
            <select
              className="h-10 rounded-full bg-card px-2 text-xs"
              value={seat.goalKind}
              onChange={(e) => updateSeat(seat.id, { goalKind: e.target.value as GoalKind })}
            >
              {GOAL_KINDS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            <button type="button" className="text-xs text-muted-foreground" onClick={() => removeSeat(seat.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      {seats.length < 6 ? (
        <div className="mt-3 flex flex-col gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <div className="flex flex-wrap gap-1.5">
            {GOAL_KINDS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoalKind(g.id)}
                className={
                  goalKind === g.id
                    ? "h-10 rounded-full bg-primary px-3 text-xs text-primary-foreground"
                    : "h-10 rounded-full bg-background px-3 text-xs shadow-[var(--shadow-border)]"
                }
              >
                {g.label}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              addSeat(name, goalKind);
              setName("");
            }}
          >
            Add a seat
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FamilyPane() {
  const hasFamily = useSpoonful((s) => s.hasAddon("family"));
  const awardXp = useSpoonful((s) => s.awardXp);
  const [kitchen, setKitchen] = useState<FamilyKitchen | null>(null);
  const [members, setMembers] = useState<Awaited<ReturnType<typeof listKitchenMembers>>>([]);
  const [events, setEvents] = useState<Awaited<ReturnType<typeof listKitchenEvents>>>([]);
  const [name, setName] = useState("Our kitchen");
  const [code, setCode] = useState("");
  const lastEventId = useRef<string | null>(null);

  async function refresh() {
    const k = await myKitchen();
    setKitchen(k);
    if (k) {
      setMembers(await listKitchenMembers());
      setEvents(await listKitchenEvents());
    } else {
      setMembers([]);
      setEvents([]);
    }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const newest = events[0];
    if (!newest) return;
    if (lastEventId.current && lastEventId.current !== newest.id) {
      if (useSpoonful.getState().notifyPrefs.family) {
        pushNote("Family table", newest.body);
      }
    }
    lastEventId.current = newest.id;
  }, [events]);

  if (!hasFamily) {
    return (
      <div className="mt-6 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">Family table</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          One kitchen, six seats, live meal pings when someone plates, cooks, or goes to the store. Kitchen Table in Extras is $7.99/mo and includes the Chef — $9.98 if you buy Kitchen+ and Family apart. Each seat can keep its own body goal — the table follows the strictest Cut.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {kitchen ? (
        <>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-spark">Invite code</p>
          <h2 className="mt-1 font-display text-3xl tracking-wide">{kitchen.invite_code}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{kitchen.name} · {members.length}/6 seats · live</p>
          <ul className="mt-4 space-y-1 text-sm">
            {members.map((m) => (
              <li key={m.user_id} className="rounded-2xl bg-card px-3 py-2 shadow-[var(--shadow-border)]">
                @{m.username} · {m.role}
              </li>
            ))}
          </ul>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={async () => {
              await postKitchenEvent({ data: { kind: "note", body: "Heading to the store" } });
              toast("Family pinged");
              void refresh();
            }}
          >
            Ping: heading to the store
          </Button>
          <ul className="mt-4 space-y-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-2xl bg-card px-3 py-2 text-sm shadow-[var(--shadow-border)]">
                <span className="font-medium">@{e.username ?? "cook"}</span> {e.body}
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            className="mt-4 w-full"
            onClick={async () => {
              await leaveKitchen();
              toast("Left the table");
              void refresh();
            }}
          >
            Leave table
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <form
            className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await createKitchen({ data: { name } });
              if (!res.ok) {
                toast(res.error);
                return;
              }
              awardXp(20, "family");
              toast(`Table ready · code ${res.invite}`);
              void refresh();
            }}
          >
            <h2 className="font-display text-xl">Start a table</h2>
            <Input className="mt-3" value={name} onChange={(e) => setName(e.target.value)} />
            <Button className="mt-3 w-full" type="submit">
              Create
            </Button>
          </form>
          <form
            className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await joinKitchen({ data: { code } });
              if (!res.ok) {
                toast(res.error);
                return;
              }
              awardXp(20, "family");
              toast(`Sat down at ${res.name}`);
              void refresh();
            }}
          >
            <h2 className="font-display text-xl">Join with a code</h2>
            <Input className="mt-3 uppercase" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button className="mt-3 w-full" variant="secondary" type="submit">
              Join
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
