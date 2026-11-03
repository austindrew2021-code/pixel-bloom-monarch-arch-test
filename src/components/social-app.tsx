import {
  Bookmark,
  Clapperboard,
  Globe,
  Heart,
  Home,
  Lock,
  MessageCircle,
  Plus,
  Repeat2,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChatPane } from "@/components/chat-pane";
import { FamilyTable } from "@/components/people-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile } from "@/lib/community";
import {
  HOUSE,
  houseAuthor,
  houseComments,
  housePosts,
  houseReels,
  houseStories,
  houseThread,
  PLATE_PICKS,
  relTime,
  type SocialComment,
  type SocialKind,
  type SocialPost,
} from "@/lib/social-house";
import { loadPass, savePass, uid, type PassState } from "@/lib/social-local";
import { commentSocial, loadSocialCloud, publishSocial, setSocialPrivate, toggleSocial } from "@/lib/social";
import { useSpoonful } from "@/lib/spoonful-store";
import { normalizeTheme, themeById } from "@/lib/themes";
import { cn } from "@/lib/utils";

type Pane = "home" | "reels" | "chat" | "table" | "you";

function authorOf(id: string, me: string, myName: string) {
  if (id === "me") return { id, username: myName, name: myName };
  return houseAuthor(id) ?? { id, username: myName, name: myName };
}

export function SocialApp({ onClose }: { onClose: () => void }) {
  const theme = useSpoonful((s) => s.theme);
  const look = themeById(normalizeTheme(theme));
  const { user } = useCurrentUserState();
  const [pane, setPane] = useState<Pane>("home");
  const [pass, setPass] = useState<PassState>(() => loadPass());
  const [myName, setMyName] = useState("you");
  const [chatId, setChatId] = useState<string | null>(null);
  const [localChat, setLocalChat] = useState<string | null>(null);
  const [storyAt, setStoryAt] = useState<number | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<SocialPost | null>(null);
  const [compose, setCompose] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState("");
  const [kind, setKind] = useState<SocialKind>("photo");
  const [media, setMedia] = useState<string>(PLATE_PICKS[0] ?? "");
  const [cloudCounts, setCloudCounts] = useState<Record<string, number>>({});
  const [cloudLikes, setCloudLikes] = useState<string[]>([]);

  useEffect(() => {
    savePass(pass);
  }, [pass]);

  useEffect(() => {
    void getMyProfile()
      .then((p) => {
        if (p?.username) setMyName(p.username);
      })
      .catch(() => {});
    void loadSocialCloud().then((cloud) => {
      if (!cloud) return;
      setCloudLikes(cloud.likes);
      const counts: Record<string, number> = {};
      for (const row of cloud.counts) counts[row.postId] = row.likes;
      setCloudCounts(counts);
      setPass((prev) => ({
        ...prev,
        likes: Array.from(new Set([...prev.likes, ...cloud.likes])),
        saves: Array.from(new Set([...prev.saves, ...cloud.saves])),
        reposts: Array.from(new Set([...prev.reposts, ...cloud.reposts])),
        privateProfile: cloud.privateProfile,
        posts: mergePosts(prev.posts, cloud.posts, myName),
        comments: mergeComments(prev.comments, cloud.comments),
      }));
    });
  }, [myName]);

  const stories = useMemo(
    () => [...pass.posts.filter((p) => p.kind === "story"), ...houseStories()],
    [pass.posts],
  );
  const feed = useMemo(() => {
    const mine = pass.posts.filter((p) => p.kind !== "story" && p.kind !== "reel" && p.visibility === "public");
    return [...mine, ...housePosts()].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [pass.posts]);
  const reels = useMemo(() => {
    const mine = pass.posts.filter((p) => p.kind === "reel");
    return [...mine, ...houseReels()];
  }, [pass.posts]);
  const comments = useMemo(() => {
    const map = new Map<string, SocialComment>();
    for (const c of [...houseComments(), ...pass.comments]) map.set(c.id, c);
    return [...map.values()];
  }, [pass.comments]);

  function likesOf(post: SocialPost) {
    const base = post.house ? post.baseLikes : 0;
    const cloud = cloudCounts[post.id] ?? 0;
    const local = pass.likes.includes(post.id);
    const remote = cloudLikes.includes(post.id);
    return Math.max(0, base + cloud + (local && !remote ? 1 : 0) - (!local && remote ? 1 : 0));
  }

  function flip(list: keyof Pick<PassState, "likes" | "saves" | "reposts">, id: string) {
    setPass((prev) => {
      const has = prev[list].includes(id);
      const next = has ? prev[list].filter((x) => x !== id) : [...prev[list], id];
      return { ...prev, [list]: next };
    });
    const on = !pass[list].includes(id);
    const kind = list === "likes" ? "like" : list === "saves" ? "save" : "repost";
    void toggleSocial({ data: { postId: id, kind, on } }).catch(() => {});
  }

  function like(post: SocialPost) {
    if (!pass.likes.includes(post.id)) {
      setBurst(post.id);
      window.setTimeout(() => setBurst((id) => (id === post.id ? null : id)), 560);
    }
    flip("likes", post.id);
  }

  function openProfile(id: string) {
    setProfileId(id);
  }

  async function publish() {
    const body = draft.trim();
    if (!body && kind !== "photo" && kind !== "reel" && kind !== "story") {
      toast("Write something first");
      return;
    }
    if ((kind === "photo" || kind === "reel" || kind === "story") && !media) {
      toast("Pick a plate");
      return;
    }
    const post: SocialPost = {
      id: uid(),
      authorId: "me",
      kind,
      body: body || "From my kitchen",
      media: kind === "text" ? undefined : media,
      at: new Date().toISOString(),
      baseLikes: 0,
      house: false,
      visibility: pass.privateProfile && kind !== "story" ? "private" : "public",
    };
    setPass((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
    setDraft("");
    setCompose(false);
    toast(kind === "story" ? "Story is up" : "Posted");
    if (kind === "reel") setPane("reels");
    void publishSocial({
      data: {
        id: post.id,
        kind: post.kind,
        body: post.body,
        media: post.media,
        visibility: post.visibility,
      },
    }).catch(() => {});
  }

  function addComment(postId: string) {
    const body = commentDraft.trim();
    if (!body) return;
    const row: SocialComment = {
      id: uid(),
      postId,
      username: myName,
      body,
      at: new Date().toISOString(),
    };
    setPass((prev) => ({ ...prev, comments: [...prev.comments, row] }));
    setCommentDraft("");
    void commentSocial({ data: { id: row.id, postId, body } }).catch(() => {});
  }

  function sendLocal(authorId: string) {
    const body = threadDraft.trim();
    if (!body) return;
    const msg = { id: uid(), body, mine: true, at: new Date().toISOString() };
    setPass((prev) => {
      const existing = prev.threads[authorId] ?? houseThread(authorId);
      return { ...prev, threads: { ...prev.threads, [authorId]: [...existing, msg] } };
    });
    setThreadDraft("");
  }

  function shareInto(authorId: string, post: SocialPost) {
    const who = authorOf(post.authorId, "me", myName);
    const msg = {
      id: uid(),
      body: `Sent a plate from @${who.username}: ${post.body}`,
      mine: true,
      at: new Date().toISOString(),
    };
    setPass((prev) => {
      const existing = prev.threads[authorId] ?? houseThread(authorId);
      return { ...prev, threads: { ...prev.threads, [authorId]: [...existing, msg] } };
    });
    setShareFor(null);
    setLocalChat(authorId);
    setPane("chat");
    toast("Sent in messages");
  }

  const activeStory = storyAt !== null ? stories[storyAt] : undefined;

  return (
    <div className="fixed inset-0 z-[70] flex bg-foreground/45 p-1.5 sm:p-4" role="dialog" aria-label="People">
      <div
        data-testid="social-app"
        className="social-stage mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden rounded-[1.7rem] border-8 shadow-2xl"
        style={{ borderColor: look.swatch[2] }}
      >
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-2">
          <button type="button" onClick={onClose} className="flex h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold">
            <X className="size-4" />
            Back
          </button>
          <p className="font-display text-xl" data-tour="people-head">
            People
          </p>
          <button type="button" className="grid size-11 place-items-center rounded-full" aria-label="New post" onClick={() => setCompose(true)}>
            <Plus className="size-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1">
          {pane === "home" ? (
            <div className="h-full overflow-y-auto">
              <StoryRow
                stories={stories}
                watched={pass.watched}
                myName={myName}
                onOpen={(i) => {
                  setStoryAt(i);
                  const s = stories[i];
                  if (s) setPass((p) => ({ ...p, watched: p.watched.includes(s.id) ? p.watched : [...p.watched, s.id] }));
                }}
                onYou={() => {
                  setKind("story");
                  setCompose(true);
                }}
              />
              <ul>
                {feed.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    myName={myName}
                    liked={pass.likes.includes(post.id)}
                    saved={pass.saves.includes(post.id)}
                    reposted={pass.reposts.includes(post.id)}
                    likes={likesOf(post)}
                    comments={comments.filter((c) => c.postId === post.id).length}
                    burst={burst === post.id}
                    onLike={() => like(post)}
                    onSave={() => flip("saves", post.id)}
                    onRepost={() => flip("reposts", post.id)}
                    onComment={() => setCommentsFor(post.id)}
                    onShare={() => setShareFor(post)}
                    onProfile={() => openProfile(post.authorId)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {pane === "reels" ? (
            <div className="h-full snap-y snap-mandatory overflow-y-auto">
              {reels.map((post) => (
                <article key={post.id} className="relative h-full snap-start snap-always">
                  {post.media ? (
                    <img src={post.media} alt="" className="social-reel-still absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-card" />
                  )}
                  <div className="social-scrim absolute inset-0" />
                  {burst === post.id ? (
                    <Heart className="social-heart social-like pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 fill-current" />
                  ) : null}
                  <div className="social-on-media absolute bottom-4 left-4 right-16">
                    <button type="button" className="text-sm font-semibold" onClick={() => openProfile(post.authorId)}>
                      @{authorOf(post.authorId, "me", myName).username}
                    </button>
                    <p className="mt-1 text-sm leading-snug">{post.body}</p>
                  </div>
                  <div className="social-on-media absolute bottom-6 right-3 flex flex-col items-center gap-4">
                    <Rail icon={Heart} label={String(likesOf(post))} on={pass.likes.includes(post.id)} onClick={() => like(post)} />
                    <Rail
                      icon={MessageCircle}
                      label={String(comments.filter((c) => c.postId === post.id).length)}
                      onClick={() => setCommentsFor(post.id)}
                    />
                    <Rail icon={Send} label="Send" onClick={() => setShareFor(post)} />
                    <Rail icon={Bookmark} label="Save" on={pass.saves.includes(post.id)} onClick={() => flip("saves", post.id)} />
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {pane === "chat" ? (
            <div className="relative h-full overflow-hidden">
              {localChat ? (
                <LocalThread
                  authorId={localChat}
                  myName={myName}
                  messages={pass.threads[localChat] ?? houseThread(localChat)}
                  draft={threadDraft}
                  onDraft={setThreadDraft}
                  onSend={() => sendLocal(localChat)}
                  onBack={() => setLocalChat(null)}
                />
              ) : (
                <div className="h-full overflow-y-auto">
                  <ul className="border-b border-border">
                    {HOUSE.map((a) => {
                      const last = (pass.threads[a.id] ?? houseThread(a.id)).at(-1);
                      return (
                        <li key={a.id}>
                          <button type="button" className="flex w-full items-center gap-3 px-3 py-3 text-left" onClick={() => setLocalChat(a.id)}>
                            <Avatar name={a.username} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">{a.name}</span>
                              <span className="block truncate text-sm text-muted-foreground">{last?.body}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {user ? (
                    <ChatPane activeId={chatId} onActiveId={setChatId} contained={Boolean(chatId)} />
                  ) : (
                    <p className="px-4 py-6 text-sm text-muted-foreground">
                      Sign in to message cooks outside this table. The four above stay on this phone.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {pane === "table" ? (
            <div className="h-full overflow-y-auto">
              <FamilyTable />
            </div>
          ) : null}

          {pane === "you" ? (
            <Profile
              name={myName}
              isMe
              isPrivate={pass.privateProfile}
              posts={[...pass.posts.filter((p) => p.authorId === "me" && p.kind !== "story"), ...[]]}
              saved={[...pass.posts, ...housePosts(), ...houseReels()].filter((p) => pass.saves.includes(p.id))}
              onTogglePrivate={() => {
                const next = !pass.privateProfile;
                setPass((p) => ({ ...p, privateProfile: next }));
                void setSocialPrivate({ data: { isPrivate: next } }).catch(() => {});
              }}
              onOpen={(id) => {
                const post = [...pass.posts, ...housePosts(), ...houseReels()].find((p) => p.id === id);
                if (post?.kind === "reel") setPane("reels");
                else setCommentsFor(id);
              }}
            />
          ) : null}

          {activeStory ? (
            <StoryViewer
              story={activeStory}
              index={storyAt ?? 0}
              total={stories.length}
              myName={myName}
              onClose={() => setStoryAt(null)}
              onPrev={() => setStoryAt((n) => (n && n > 0 ? n - 1 : 0))}
              onNext={() =>
                setStoryAt((n) => {
                  if (n === null) return null;
                  if (n + 1 >= stories.length) return null;
                  const next = stories[n + 1];
                  if (next) setPass((p) => ({ ...p, watched: p.watched.includes(next.id) ? p.watched : [...p.watched, next.id] }));
                  return n + 1;
                })
              }
            />
          ) : null}

          {commentsFor ? (
            <CommentSheet
              postId={commentsFor}
              rows={comments.filter((c) => c.postId === commentsFor)}
              draft={commentDraft}
              onDraft={setCommentDraft}
              onSend={() => addComment(commentsFor)}
              onClose={() => setCommentsFor(null)}
            />
          ) : null}

          {shareFor ? (
            <div className="absolute inset-0 z-20 flex flex-col justify-end bg-foreground/40">
              <div className="rounded-t-3xl bg-card p-4">
                <p className="font-display text-xl">Send</p>
                <div className="mt-3 flex gap-3 overflow-x-auto">
                  {HOUSE.map((a) => (
                    <button key={a.id} type="button" className="w-16 shrink-0 text-center" onClick={() => shareInto(a.id, shareFor)}>
                      <Avatar name={a.username} />
                      <span className="mt-1 block truncate text-xs">{a.name}</span>
                    </button>
                  ))}
                </div>
                <Button
                  className="mt-4 w-full"
                  variant="secondary"
                  onClick={async () => {
                    const who = authorOf(shareFor.authorId, "me", myName);
                    const text = `@${who.username}: ${shareFor.body}`;
                    try {
                      if (navigator.share) await navigator.share({ text });
                      else await navigator.clipboard.writeText(text);
                      toast("Copied");
                    } catch {
                      /* cancelled */
                    }
                    setShareFor(null);
                  }}
                >
                  Copy or share outside
                </Button>
                <Button className="mt-2 w-full" variant="ghost" onClick={() => setShareFor(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}

          {compose ? (
            <div className="absolute inset-0 z-20 flex flex-col bg-background">
              <div className="flex h-14 items-center justify-between px-3">
                <button type="button" className="h-11 text-sm font-semibold" onClick={() => setCompose(false)}>
                  Cancel
                </button>
                <p className="font-display text-lg">New</p>
                <button type="button" className="h-11 text-sm font-semibold text-spark" onClick={() => void publish()}>
                  Post
                </button>
              </div>
              <div className="flex gap-1 px-3">
                {(["photo", "text", "reel", "story"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setKind(id)}
                    className={cn(
                      "h-10 flex-1 rounded-full text-xs font-semibold capitalize",
                      kind === id ? "bg-spark text-spark-foreground" : "bg-card",
                    )}
                  >
                    {id === "photo" ? "Post" : id}
                  </button>
                ))}
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={kind === "text" ? "What's happening in the kitchen?" : "Caption"}
                className="mx-3 mt-3 rounded-2xl bg-card p-3 text-sm outline-none"
              />
              {kind !== "text" ? (
                <div className="mt-3 flex gap-2 overflow-x-auto px-3">
                  {PLATE_PICKS.map((src) => (
                    <button key={src} type="button" onClick={() => setMedia(src)} className={cn("shrink-0 rounded-xl", media === src && "ring-2 ring-spark")}>
                      <img src={src} alt="" className="size-20 rounded-xl object-cover" />
                    </button>
                  ))}
                  <label className="grid size-20 shrink-0 place-items-center rounded-xl bg-card text-xs text-muted-foreground">
                    Camera
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void shrinkImage(file).then(setMedia).catch(() => toast("That photo didn't load"));
                      }}
                    />
                  </label>
                </div>
              ) : null}
              <p className="px-4 py-3 text-xs text-muted-foreground">
                {pass.privateProfile ? "Your kitchen is private. This stays on your profile." : "Public on the table."} Stories disappear from the row when you leave.
              </p>
            </div>
          ) : null}

          {profileId ? (
            <div className="absolute inset-0 z-20 overflow-y-auto bg-background">
              <button type="button" className="flex h-12 items-center gap-1 px-3 text-sm font-semibold" onClick={() => setProfileId(null)}>
                <X className="size-4" /> Back
              </button>
              <Profile
                name={authorOf(profileId, "me", myName).username}
                isMe={profileId === "me"}
                isPrivate={profileId === "me" ? pass.privateProfile : false}
                following={pass.follows.includes(profileId)}
                posts={
                  profileId === "me"
                    ? pass.posts.filter((p) => p.kind !== "story")
                    : [...housePosts(), ...houseReels(), ...houseStories()].filter((p) => p.authorId === profileId && p.kind !== "story")
                }
                saved={[]}
                onFollow={
                  profileId === "me"
                    ? undefined
                    : () =>
                        setPass((p) => ({
                          ...p,
                          follows: p.follows.includes(profileId)
                            ? p.follows.filter((id) => id !== profileId)
                            : [...p.follows, profileId],
                        }))
                }
                onMessage={
                  profileId === "me"
                    ? undefined
                    : () => {
                        setProfileId(null);
                        setLocalChat(profileId);
                        setPane("chat");
                      }
                }
                onTogglePrivate={() => {
                  const next = !pass.privateProfile;
                  setPass((p) => ({ ...p, privateProfile: next }));
                  void setSocialPrivate({ data: { isPrivate: next } }).catch(() => {});
                }}
                onOpen={() => {}}
              />
            </div>
          ) : null}
        </div>

        <nav className="grid h-14 shrink-0 grid-cols-5 border-t border-border bg-card" aria-label="People">
          <Tab icon={Home} label="Home" on={pane === "home"} onClick={() => setPane("home")} />
          <Tab icon={Clapperboard} label="Reels" on={pane === "reels"} onClick={() => setPane("reels")} />
          <Tab icon={MessageCircle} label="Chat" on={pane === "chat"} onClick={() => setPane("chat")} />
          <Tab icon={Users} label="Table" on={pane === "table"} onClick={() => setPane("table")} />
          <Tab icon={UserRound} label="You" on={pane === "you"} onClick={() => setPane("you")} />
        </nav>
      </div>
    </div>
  );
}

function mergePosts(
  local: SocialPost[],
  cloud: {
    id: string;
    userId: string;
    username: string;
    kind: string;
    body: string;
    media: string | null;
    visibility: string;
    at: string;
  }[],
  myName: string,
): SocialPost[] {
  const map = new Map(local.map((p) => [p.id, p]));
  for (const row of cloud) {
    if (map.has(row.id)) continue;
    const kind = (["photo", "text", "reel", "story"] as const).includes(row.kind as SocialKind)
      ? (row.kind as SocialKind)
      : "text";
    map.set(row.id, {
      id: row.id,
      authorId: row.username === myName ? "me" : row.userId,
      kind,
      body: row.body,
      media: row.media ?? undefined,
      at: row.at,
      baseLikes: 0,
      house: false,
      visibility: row.visibility === "private" ? "private" : "public",
    });
  }
  return [...map.values()];
}

function mergeComments(
  local: SocialComment[],
  cloud: { id: string; postId: string; username: string; body: string; at: string }[],
): SocialComment[] {
  const map = new Map(local.map((c) => [c.id, c]));
  for (const row of cloud) {
    if (!map.has(row.id)) map.set(row.id, row);
  }
  return [...map.values()];
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) return <img src={src} alt="" className="size-11 rounded-full object-cover" />;
  return (
    <span className="social-avatar grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold">
      {(name[0] || "?").toUpperCase()}
    </span>
  );
}

function StoryRow({
  stories,
  watched,
  myName,
  onOpen,
  onYou,
}: {
  stories: SocialPost[];
  watched: string[];
  myName: string;
  onOpen: (index: number) => void;
  onYou: () => void;
}) {
  const yours = stories.filter((s) => s.authorId === "me");
  return (
    <div className="flex gap-3 overflow-x-auto px-3 py-3">
      <button type="button" className="w-16 shrink-0 text-center" onClick={onYou}>
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-dashed border-border text-xs">You</span>
        <span className="mt-1 block truncate text-[11px]">{yours.length ? "Your story" : "Add"}</span>
      </button>
      {stories
        .filter((s) => s.authorId !== "me")
        .map((s) => {
          const author = houseAuthor(s.authorId);
          const seen = watched.includes(s.id);
          const index = stories.indexOf(s);
          return (
            <button key={s.id} type="button" className="w-16 shrink-0 text-center" onClick={() => onOpen(index)}>
              <span className={cn("mx-auto grid size-14 place-items-center rounded-full p-0.5", seen ? "social-ring-seen" : "social-ring")}>
                <img src={s.media} alt="" className="size-12 rounded-full object-cover" />
              </span>
              <span className="mt-1 block truncate text-[11px]">{author?.name ?? myName}</span>
            </button>
          );
        })}
    </div>
  );
}

function FeedCard({
  post,
  myName,
  liked,
  saved,
  reposted,
  likes,
  comments,
  burst,
  onLike,
  onSave,
  onRepost,
  onComment,
  onShare,
  onProfile,
}: {
  post: SocialPost;
  myName: string;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  likes: number;
  comments: number;
  burst: boolean;
  onLike: () => void;
  onSave: () => void;
  onRepost: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfile: () => void;
}) {
  const who = authorOf(post.authorId, "me", myName);
  const last = useRef(0);
  return (
    <li className="border-b border-border">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onProfile} className="flex min-w-0 items-center gap-2 text-left">
          <Avatar name={who.username} />
          <span>
            <span className="block text-sm font-semibold">@{who.username}</span>
            <span className="block text-xs text-muted-foreground">{relTime(post.at)}</span>
          </span>
        </button>
      </div>
      {post.kind === "text" ? (
        <p className="px-4 pb-2 text-base leading-relaxed">{post.body}</p>
      ) : (
        <button
          type="button"
          className="relative block w-full"
          onClick={() => {
            const now = Date.now();
            if (now - last.current < 280) onLike();
            last.current = now;
          }}
        >
          {post.media ? <img src={post.media} alt="" className="aspect-[4/5] w-full object-cover" /> : null}
          {burst ? (
            <Heart className="social-heart social-like pointer-events-none absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 fill-current" />
          ) : null}
        </button>
      )}
      {post.kind !== "text" ? <p className="px-3 pt-2 text-sm leading-snug">{post.body}</p> : null}
      <div className="flex items-center gap-1 px-2 py-1">
        <IconBtn label={String(likes)} onClick={onLike}>
          <Heart className={cn("size-6", liked && "social-like fill-current")} />
        </IconBtn>
        <IconBtn label={String(comments)} onClick={onComment}>
          <MessageCircle className="size-6" />
        </IconBtn>
        <IconBtn label="Repost" onClick={onRepost}>
          <Repeat2 className={cn("size-6", reposted && "text-spark")} />
        </IconBtn>
        <IconBtn label="Share" onClick={onShare}>
          <Send className="size-6" />
        </IconBtn>
        <span className="flex-1" />
        <IconBtn label="Save" onClick={onSave}>
          <Bookmark className={cn("size-6", saved && "fill-current")} />
        </IconBtn>
      </div>
      <p className="px-4 pb-3 text-xs text-muted-foreground">{likes} likes</p>
    </li>
  );
}

function IconBtn({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-11 place-items-center">
      {children}
    </button>
  );
}

function Rail({
  icon: Icon,
  label,
  on,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  on?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="grid place-items-center text-xs font-semibold">
      <Icon className={cn("size-7", on && "social-like fill-current")} />
      <span className="mt-0.5">{label}</span>
    </button>
  );
}

function Tab({
  icon: Icon,
  label,
  on,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("flex flex-col items-center justify-center text-[11px] font-semibold", on ? "text-foreground" : "text-muted-foreground")}>
      <Icon className="size-5" />
      {label}
    </button>
  );
}

function StoryViewer({
  story,
  index,
  total,
  myName,
  onClose,
  onPrev,
  onNext,
}: {
  story: SocialPost;
  index: number;
  total: number;
  myName: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const nextRef = useRef(onNext);
  nextRef.current = onNext;
  useEffect(() => {
    const id = window.setTimeout(() => nextRef.current(), 5000);
    return () => window.clearTimeout(id);
  }, [story.id]);
  const who = authorOf(story.authorId, "me", myName);
  return (
    <div className="absolute inset-0 z-30 bg-black">
      {story.media ? <img src={story.media} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="social-on-media absolute inset-x-0 top-0 flex gap-1 p-2">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={cn("h-0.5 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/40")} />
        ))}
      </div>
      <div className="social-on-media absolute inset-x-0 top-4 flex items-center justify-between px-3 pt-3">
        <p className="text-sm font-semibold">@{who.username}</p>
        <button type="button" aria-label="Close story" onClick={onClose} className="grid size-11 place-items-center">
          <X />
        </button>
      </div>
      <p className="social-on-media absolute inset-x-4 bottom-8 text-sm font-medium">{story.body}</p>
      <button type="button" aria-label="Previous story" className="absolute inset-y-0 left-0 w-1/3" onClick={onPrev} />
      <button type="button" aria-label="Next story" className="absolute inset-y-0 right-0 w-1/3" onClick={onNext} />
    </div>
  );
}

function CommentSheet({
  postId,
  rows,
  draft,
  onDraft,
  onSend,
  onClose,
}: {
  postId: string;
  rows: SocialComment[];
  draft: string;
  onDraft: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-foreground/40">
      <div className="flex max-h-[75%] flex-col rounded-t-3xl bg-card">
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="font-display text-xl">Comments</p>
          <button type="button" className="grid size-11 place-items-center" aria-label="Close comments" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {rows.length === 0 ? <li className="text-sm text-muted-foreground">No comments yet.</li> : null}
          {rows.map((c) => (
            <li key={c.id}>
              <p className="text-sm">
                <span className="font-semibold">@{c.username}</span> {c.body}
              </p>
              <p className="text-xs text-muted-foreground">{relTime(c.at)}</p>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <Input value={draft} onChange={(e) => onDraft(e.target.value)} placeholder="Add a comment" aria-label={`Comment on ${postId}`} />
          <Button type="submit" size="icon" variant="spark" className="rounded-full" aria-label="Post comment">
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}

function LocalThread({
  authorId,
  myName,
  messages,
  draft,
  onDraft,
  onSend,
  onBack,
}: {
  authorId: string;
  myName: string;
  messages: { id: string; body: string; mine: boolean; at: string }[];
  draft: string;
  onDraft: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  const who = authorOf(authorId, "me", myName);
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background">
      <div className="flex h-14 items-center gap-2 border-b border-border px-2">
        <button type="button" className="h-11 px-2 text-sm font-semibold" onClick={onBack}>
          Back
        </button>
        <Avatar name={who.username} />
        <div>
          <p className="text-sm font-semibold">{who.name}</p>
          <p className="text-xs text-muted-foreground">On this phone</p>
        </div>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {messages.map((m) => (
          <li key={m.id} className={cn("max-w-[80%] rounded-3xl px-3 py-2 text-sm", m.mine ? "ml-auto rounded-br-md bg-spark text-spark-foreground" : "rounded-bl-md bg-card")}>
            {m.body}
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <Input value={draft} onChange={(e) => onDraft(e.target.value)} placeholder="Message" aria-label="Message" />
        <Button type="submit" size="icon" variant="spark" className="rounded-full" aria-label="Send">
          <Send />
        </Button>
      </form>
    </div>
  );
}

function Profile({
  name,
  isMe,
  isPrivate,
  following,
  posts,
  saved,
  onTogglePrivate,
  onFollow,
  onMessage,
  onOpen,
}: {
  name: string;
  isMe: boolean;
  isPrivate: boolean;
  following?: boolean;
  posts: SocialPost[];
  saved: SocialPost[];
  onTogglePrivate?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onOpen: (id: string) => void;
}) {
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const list = tab === "saved" ? saved : posts;
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-4 px-4 pt-4">
        <span className="social-avatar grid size-20 place-items-center rounded-full text-3xl font-semibold">
          {(name[0] || "?").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl">@{name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {isPrivate ? <Lock className="size-3" /> : <Globe className="size-3" />}
            {isPrivate ? "Private kitchen" : "Public kitchen"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 px-4">
        {isMe && onTogglePrivate ? (
          <Button className="flex-1" variant="secondary" onClick={onTogglePrivate}>
            {isPrivate ? "Make public" : "Make private"}
          </Button>
        ) : null}
        {onFollow ? (
          <Button className="flex-1" variant={following ? "secondary" : "spark"} onClick={onFollow}>
            {following ? "Following" : "Follow"}
          </Button>
        ) : null}
        {onMessage ? (
          <Button className="flex-1" variant="secondary" onClick={onMessage}>
            Message
          </Button>
        ) : null}
      </div>
      {isMe ? (
        <div className="mt-4 grid grid-cols-2 border-y border-border">
          <button type="button" className={cn("h-11 text-sm font-semibold", tab === "posts" && "text-spark")} onClick={() => setTab("posts")}>
            Posts
          </button>
          <button type="button" className={cn("h-11 text-sm font-semibold", tab === "saved" && "text-spark")} onClick={() => setTab("saved")}>
            Saved
          </button>
        </div>
      ) : null}
      {list.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground">{tab === "saved" ? "Save a plate and it lands here." : "Nothing posted yet."}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-0.5 p-0.5">
          {list.map((p) => (
            <li key={p.id}>
              <button type="button" className="block aspect-square w-full bg-card" onClick={() => onOpen(p.id)}>
                {p.media ? (
                  <img src={p.media} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center p-2 text-left text-[11px] leading-snug">{p.body}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 960;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}
