import { History, Plus, Timer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BODY, kgFromLb, lbFromKg } from "@/lib/body";
import { isoDate } from "@/lib/fuel";
import {
  LIFT_MOVES,
  LIFT_TEMPLATES,
  REST_PRESETS,
  bestEpley,
  epley1rm,
  formatElapsed,
  lineVolumeKg,
  moveById,
  platesPerSide,
  previousLine,
  sessionSetCount,
  sessionVolumeKg,
  type LiftLine,
  type LiftSession,
  type LiftSet,
  type Muscle,
} from "@/lib/lift";
import { useSpoonful } from "@/lib/spoonful-store";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { cn } from "@/lib/utils";

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function LiftSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const body = useSpoonful((s) => s.body) ?? DEFAULT_BODY;
  const sessions = useSpoonful((s) => s.liftSessions);
  const saveLiftSession = useSpoonful((s) => s.saveLiftSession);
  const imperial = body.units !== "metric";
  const [session, setSession] = useState<LiftSession>(() => emptySession());
  const [picker, setPicker] = useState(false);
  const [history, setHistory] = useState(false);
  const [rest, setRest] = useState(0);
  const [restPreset, setRestPreset] = useState(90);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<"all" | Muscle>("all");
  const [now, setNow] = useState(Date.now());
  const [platesFor, setPlatesFor] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSession(emptySession());
    setRest(0);
    setPicker(false);
    setHistory(false);
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (rest <= 0) return;
    const id = window.setInterval(() => setRest((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(id);
  }, [rest]);

  const volume = useMemo(() => sessionVolumeKg(session), [session]);
  const volumeDisp = imperial ? Math.round(lbFromKg(volume)) : Math.round(volume);
  const moves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIFT_MOVES.filter((m) => {
      if (muscle !== "all" && m.muscle !== muscle) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.muscle.includes(q);
    });
  }, [query, muscle]);

  if (!open) return null;

  function addMove(moveId: string) {
    const move = moveById(moveId);
    const prev = previousLine(sessions, moveId);
    const defaultKg = move?.bodyweight ? body.weightKg : imperial ? kgFromLb(95) : 40;
    const sets: LiftSet[] = prev?.sets.slice(0, 4).map((s) => ({
      id: nid(),
      reps: s.reps,
      weightKg: s.weightKg,
      done: false,
      warmup: s.warmup,
    })) ?? [{ id: nid(), reps: 8, weightKg: defaultKg, done: false }];
    setSession((cur) => ({
      ...cur,
      name: cur.lines.length === 0 ? (move?.name ?? "Lift") : cur.name,
      lines: [...cur.lines, { id: nid(), moveId, sets }],
    }));
    setPicker(false);
    setQuery("");
  }

  function applyTemplate(id: string) {
    const tpl = LIFT_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setSession((cur) => {
      const next = { ...cur, name: tpl.name, lines: [...cur.lines] };
      for (const moveId of tpl.moves) {
        if (next.lines.some((l) => l.moveId === moveId)) continue;
        const move = moveById(moveId);
        const prev = previousLine(sessions, moveId);
        const defaultKg = move?.bodyweight ? body.weightKg : imperial ? kgFromLb(95) : 40;
        next.lines.push({
          id: nid(),
          moveId,
          sets:
            prev?.sets.slice(0, 4).map((s) => ({
              id: nid(),
              reps: s.reps,
              weightKg: s.weightKg,
              done: false,
            })) ?? [{ id: nid(), reps: 8, weightKg: defaultKg, done: false }],
        });
      }
      return next;
    });
    setPicker(false);
  }

  function patchSet(lineId: string, setId: string, patch: Partial<LiftSet>) {
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) =>
        l.id !== lineId ? l : { ...l, sets: l.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
      ),
    }));
  }

  function addSet(line: LiftLine, warmup = false) {
    const last = line.sets.filter((s) => (warmup ? s.warmup : !s.warmup)).at(-1) ?? line.sets.at(-1);
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) =>
        l.id !== line.id
          ? l
          : {
              ...l,
              sets: [
                ...l.sets,
                {
                  id: nid(),
                  reps: last?.reps ?? 8,
                  weightKg: warmup ? (last?.weightKg ?? 40) * 0.5 : (last?.weightKg ?? 40),
                  done: false,
                  warmup,
                },
              ],
            },
      ),
    }));
  }

  function finish() {
    if (sessionVolumeKg(session) <= 0) {
      toast("Log a working set first");
      return;
    }
    const prs = session.lines.filter((line) => {
      const best = bestEpley(sessions, line.moveId);
      return line.sets.some((s) => s.done && !s.warmup && epley1rm(s.weightKg, s.reps) > best && best > 0);
    });
    saveLiftSession({ ...session, finishedAt: Date.now() });
    toast(
      prs.length
        ? `PR on ${prs.map((l) => moveById(l.moveId)?.name ?? l.moveId).join(", ")} — Fuel updated`
        : "Lift saved — Fuel updated live",
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-stretch">
          <div className="flex h-14 min-w-0 flex-1 items-center justify-between gap-2 px-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close lift">
              <X />
            </Button>
            <div className="min-w-0 text-center">
              <p className="truncate text-xs font-medium uppercase tracking-[0.16em] text-spark">
                {formatElapsed(now - session.startedAt)}
              </p>
              <p className="truncate font-display text-xl tabular-nums leading-tight">
                {volumeDisp} {imperial ? "lb" : "kg"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setHistory(true)} aria-label="History">
              <History />
            </Button>
          </div>
          {isPreviewChrome() ? <div className="pill-slot" aria-hidden /> : null}
        </div>
        <div className="px-4 pb-1">
          <Button variant="spark" className="w-full" onClick={finish}>
            Finish
          </Button>
        </div>
      </header>

      {rest > 0 ? (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-2xl bg-spark px-4 py-3 text-spark-foreground">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Timer className="size-4" /> Rest
          </span>
          <span className="font-display text-2xl tabular-nums">{rest}s</span>
          <button type="button" className="text-sm font-medium" onClick={() => setRest(0)}>
            Skip
          </button>
        </div>
      ) : (
        <div className="chip-row mx-4 mt-3">
          {REST_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRestPreset(n)}
              className={cn(
                "h-11 shrink-0 rounded-full px-3 text-sm",
                restPreset === n ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {n}s rest
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28">
        {session.lines.length === 0 ? (
          <section className="mb-4">
            <h2 className="font-display text-xl">Start with a template</h2>
            <p className="mt-1 text-sm text-muted-foreground">Loads last weights when you have them.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LIFT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="rounded-3xl bg-card px-4 py-3 text-left shadow-[var(--shadow-border)]"
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {session.lines.map((line) => {
          const move = moveById(line.moveId);
          const prev = previousLine(sessions, line.moveId, session.id);
          const best = bestEpley(sessions, line.moveId);
          const lineVol = lineVolumeKg(line);
          return (
            <section key={line.id} className="mb-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl">{move?.name ?? line.moveId}</h2>
                  {prev ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last{" "}
                      {prev.sets
                        .filter((s) => s.done)
                        .map((s) => `${s.warmup ? "W" : ""}${s.reps}×${imperial ? Math.round(lbFromKg(s.weightKg)) : Math.round(s.weightKg)}`)
                        .join("  ")}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {imperial ? Math.round(lbFromKg(lineVol)) : Math.round(lineVol)} {imperial ? "lb" : "kg"}
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {line.sets.map((set, i) => {
                  const shown = imperial ? Math.round(lbFromKg(set.weightKg)) : Math.round(set.weightKg * 10) / 10;
                  const est = epley1rm(set.weightKg, set.reps);
                  const isPr = Boolean(set.done && !set.warmup && best > 0 && est > best);
                  return (
                    <li
                      key={set.id}
                      className="grid grid-cols-[1.75rem_minmax(0,4.75rem)_minmax(0,1fr)_auto] items-center gap-2"
                    >
                      <span className="text-center text-xs tabular-nums text-muted-foreground">
                        {set.warmup ? "W" : i + 1}
                      </span>
                      <Input
                        className="h-12 px-2 text-center tabular-nums"
                        inputMode="numeric"
                        value={String(set.reps)}
                        onChange={(e) => patchSet(line.id, set.id, { reps: Number(e.target.value) || 0 })}
                        aria-label="Reps"
                      />
                      <div className="flex min-w-0 items-center gap-1">
                        <Input
                          className="h-12 min-w-0 px-2 text-center tabular-nums"
                          inputMode="decimal"
                          value={String(shown)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            patchSet(line.id, set.id, { weightKg: imperial ? kgFromLb(n || 0) : n || 0 });
                          }}
                          aria-label={imperial ? "Pounds" : "Kilograms"}
                        />
                        <button
                          type="button"
                          className="w-7 shrink-0 text-xs text-muted-foreground"
                          onClick={() => setPlatesFor(move?.bar ? set.id : null)}
                        >
                          {imperial ? "lb" : "kg"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          patchSet(line.id, set.id, { done: !set.done });
                          if (!set.done) {
                            setRest(restPreset);
                            try {
                              window.navigator.vibrate?.(40);
                            } catch {
                              /* ignore */
                            }
                          }
                        }}
                        className={cn(
                          "h-12 min-w-16 shrink-0 rounded-full px-3 text-sm font-medium",
                          set.done ? "bg-primary text-primary-foreground" : "bg-background shadow-[var(--shadow-border)]",
                        )}
                      >
                        {set.done ? (isPr ? "PR" : "Done") : "Log"}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {platesFor && line.sets.some((s) => s.id === platesFor) && move?.bar ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Per side{" "}
                  {platesPerSide(line.sets.find((s) => s.id === platesFor)?.weightKg ?? 0, imperial)
                    .map((p) => `${p.count}×${p.plate}`)
                    .join(" + ") || "bar only"}
                </p>
              ) : null}
              {line.sets.some((s) => s.done && !s.warmup && s.reps > 1) ? (
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  Est 1RM{" "}
                  {imperial
                    ? Math.round(lbFromKg(Math.max(...line.sets.filter((s) => s.done && !s.warmup).map((s) => epley1rm(s.weightKg, s.reps)))))
                    : Math.round(Math.max(...line.sets.filter((s) => s.done && !s.warmup).map((s) => epley1rm(s.weightKg, s.reps))))}{" "}
                  {imperial ? "lb" : "kg"}
                  {best > 0
                    ? ` · best ${imperial ? Math.round(lbFromKg(best)) : Math.round(best)}`
                    : ""}
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" onClick={() => addSet(line)}>
                  <Plus /> Add set
                </Button>
                <Button variant="ghost" onClick={() => addSet(line, true)}>
                  Warm-up
                </Button>
              </div>
            </section>
          );
        })}
        <Button variant="secondary" className="w-full" onClick={() => setPicker(true)}>
          <Plus /> Add exercise
        </Button>
      </div>

      {picker ? (
        <div className="absolute inset-0 z-10 flex flex-col bg-background/95 pt-14">
          <div className="flex items-stretch">
            <div className="min-w-0 flex-1 px-4">
              <Button variant="ghost" className="mb-3" onClick={() => setPicker(false)}>
                Close
              </Button>
            </div>
            {isPreviewChrome() ? <div className="pill-slot" aria-hidden /> : null}
          </div>
          <div className="px-4">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Squat, bench, pull-up…" />
            <div className="chip-row mt-2 pb-1">
              {(["all", "legs", "push", "pull", "core", "full"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMuscle(id)}
                  className={cn(
                    "h-11 shrink-0 rounded-full px-3 text-sm capitalize",
                    muscle === id ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-10">
            {session.lines.length === 0
              ? LIFT_TEMPLATES.map((t) => (
                  <li key={t.id} className="mb-1">
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-spark/15 px-4 text-left text-sm"
                      onClick={() => applyTemplate(t.id)}
                    >
                      {t.name}
                      <span className="text-xs text-muted-foreground">{t.hint}</span>
                    </button>
                  </li>
                ))
              : null}
            {moves.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-card px-4 text-left text-sm shadow-[var(--shadow-border)]"
                  onClick={() => addMove(m.id)}
                >
                  {m.name}
                  <span className="text-xs capitalize text-muted-foreground">{m.muscle}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {history ? (
        <div className="absolute inset-0 z-10 overflow-y-auto bg-background/95 px-4 pt-14 pb-10">
          <Button variant="ghost" className="mb-3" onClick={() => setHistory(false)}>
            Close
          </Button>
          <h2 className="font-display text-2xl">History</h2>
          {sessions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No sessions yet. Finish one and it lands here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {[...sessions].reverse().slice(0, 12).map((s) => {
                const vol = sessionVolumeKg(s);
                return (
                  <li key={s.id} className="rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)]">
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {s.date} · {sessionSetCount(s)} sets · {imperial ? Math.round(lbFromKg(vol)) : Math.round(vol)}{" "}
                      {imperial ? "lb" : "kg"} moved
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function emptySession(): LiftSession {
  return {
    id: nid(),
    date: isoDate(),
    name: "Lift",
    lines: [],
    startedAt: Date.now(),
  };
}
