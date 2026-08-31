import { ArrowLeftRight, ChevronDown, ChevronUp, History, Pause, Play, Plus, Timer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExerciseFigure } from "@/components/exercise-figure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BODY, kgFromLb, lbFromKg } from "@/lib/body";
import { exerciseById, substituteMoves } from "@/lib/exercises";
import { isoDate } from "@/lib/fuel";
import {
  LIFT_MOVES,
  LIFT_TEMPLATES,
  REST_PRESETS,
  beatsPrevious,
  bestEpley,
  displayStep,
  epley1rm,
  formatElapsed,
  ghostSet,
  isUnilateral,
  lastFinishedSession,
  lineVolumeKg,
  logUnit,
  moveById,
  platesPerSide,
  previousLine,
  previousSessionForMove,
  sessionSetCount,
  sessionVolumeKg,
  suggestNextKg,
  volumeChangePct,
  warmupLoads,
  type LiftLine,
  type LiftSession,
  type LiftSet,
  type Muscle,
  type SessionFeel,
} from "@/lib/lift";
import { useSpoonful } from "@/lib/spoonful-store";
import { isPreviewChrome } from "@/lib/preview-chrome";
import { cn } from "@/lib/utils";

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export type LiftSeed = {
  name: string;
  moveIds: string[];
  date?: string;
};

export function LiftSheet({ open, onClose, seed }: { open: boolean; onClose: () => void; seed?: LiftSeed }) {
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
  const [tickOf, setTickOf] = useState<{ lineId: string; setId: string } | null>(null);
  const [swapOf, setSwapOf] = useState<string | null>(null);
  const [restHold, setRestHold] = useState(false);
  const [restMove, setRestMove] = useState<string | null>(null);
  const restWas = useRef(0);
  const skipChime = useRef(false);

  useEffect(() => {
    if (!open) return;
    setSession(seed?.moveIds.length ? sessionFromSeed(seed, sessions, body.weightKg, imperial) : emptySession());
    setRest(0);
    setRestHold(false);
    setRestMove(null);
    setPicker(false);
    setHistory(false);
    setQuery("");
    setTickOf(null);
  }, [open, seed?.name, seed?.date, seed?.moveIds?.join(",")]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (rest <= 0 || restHold) return;
    const id = window.setInterval(() => setRest((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(id);
  }, [rest, restHold]);

  useEffect(() => {
    if (restWas.current > 0 && rest === 0) {
      const skipped = skipChime.current;
      skipChime.current = false;
      if (!skipped) {
        try {
          window.navigator.vibrate?.([40, 40, 80]);
        } catch {
          /* ignore */
        }
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          /* ignore */
        }
        toast("Rest's up");
      }
    }
    restWas.current = rest;
  }, [rest]);

  useEffect(() => {
    if (!open || !tickOf) return;
    const id = window.setInterval(() => {
      setSession((cur) => ({
        ...cur,
        lines: cur.lines.map((l) =>
          l.id !== tickOf.lineId
            ? l
            : {
                ...l,
                sets: l.sets.map((s) => (s.id !== tickOf.setId ? s : { ...s, reps: s.reps + 1 })),
              },
        ),
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, tickOf]);

  useEffect(() => {
    if (!open) return;
    let lock: WakeLockSentinel | undefined;
    const request = () => {
      void navigator.wakeLock
        ?.request("screen")
        .then((s) => {
          lock = s;
        })
        .catch(() => {
          /* unsupported or denied */
        });
    };
    request();
    const onVis = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release();
    };
  }, [open]);

  const volume = useMemo(() => sessionVolumeKg(session), [session]);
  const volumeDisp = imperial ? Math.round(lbFromKg(volume)) : Math.round(volume);
  const lastSession = useMemo(() => lastFinishedSession(sessions, session.id), [sessions, session.id]);
  const volDelta = useMemo(() => volumeChangePct(session, lastSession), [session, lastSession]);
  const setProgress = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const line of session.lines) {
      for (const s of line.sets) {
        if (s.warmup) continue;
        total += 1;
        if (s.done) done += 1;
      }
    }
    return { done, total };
  }, [session]);
  const restCue = restMove ? exerciseById(restMove)?.cues[0] : undefined;
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
    const prevSess = previousSessionForMove(sessions, moveId);
    const defaultKg = move?.bodyweight ? body.weightKg : imperial ? kgFromLb(95) : 40;
    const suggested = suggestNextKg(prev, prevSess?.feel);
    const unit = logUnit(moveId);
    const defaultReps = unit === "sec" ? 40 : unit === "m" ? 30 : 8;
    const sets: LiftSet[] = prev?.sets.slice(0, 4).map((s, i) => ({
      id: nid(),
      reps: s.reps,
      weightKg: !s.warmup && i === (prev.sets.findIndex((x) => !x.warmup) ?? 0) && suggested ? suggested : s.weightKg,
      done: false,
      warmup: s.warmup,
    })) ?? [{ id: nid(), reps: defaultReps, weightKg: defaultKg, done: false }];
    setSession((cur) => ({
      ...cur,
      name: cur.lines.length === 0 ? (move?.name ?? "Lift") : cur.name,
      lines: [...cur.lines, { id: nid(), moveId, sets, note: prev?.note }],
    }));
    setPicker(false);
    setQuery("");
  }

  function repeatLast() {
    const last = lastFinishedSession(sessions);
    if (!last) {
      toast("No session to copy yet");
      return;
    }
    setSession(sessionFromSeed({ name: last.name, moveIds: last.lines.map((l) => l.moveId) }, sessions, body.weightKg, imperial));
    toast(`Copied ${last.name}`);
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
    const side =
      !warmup && isUnilateral(line.moveId) ? (last?.side === "L" ? "R" : "L") : last?.side;
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
                  side,
                },
              ],
            },
      ),
    }));
  }

  function addLadder(line: LiftLine) {
    const work = line.sets.find((s) => !s.warmup);
    const kg = work?.weightKg ?? 40;
    const reps = work?.reps ?? 5;
    const loads = warmupLoads(kg);
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) =>
        l.id !== line.id
          ? l
          : {
              ...l,
              sets: [
                ...loads.map((weightKg) => ({
                  id: nid(),
                  reps,
                  weightKg,
                  done: false,
                  warmup: true as const,
                })),
                ...l.sets.filter((s) => !s.warmup),
              ],
            },
      ),
    }));
  }

  function fillRest(line: LiftLine) {
    const last = line.sets.filter((s) => s.done && !s.warmup).at(-1);
    if (!last) {
      toast("Log a set first");
      return;
    }
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) =>
        l.id !== line.id
          ? l
          : {
              ...l,
              sets: l.sets.map((s) =>
                s.done || s.warmup ? s : { ...s, reps: last.reps, weightKg: last.weightKg },
              ),
            },
      ),
    }));
  }

  function moveLine(lineId: string, dir: -1 | 1) {
    setSession((cur) => {
      const i = cur.lines.findIndex((l) => l.id === lineId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.lines.length) return cur;
      const lines = [...cur.lines];
      const [row] = lines.splice(i, 1);
      lines.splice(j, 0, row!);
      return { ...cur, lines };
    });
  }

  function swapMoveOnLine(lineId: string, toId: string) {
    const prev = previousLine(sessions, toId);
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) =>
        l.id !== lineId
          ? l
          : {
              ...l,
              moveId: toId,
              note: prev?.note ?? l.note,
              sets: l.sets.map((s, i) => ({
                ...s,
                weightKg: prev?.sets[i]?.weightKg ?? s.weightKg,
                reps: prev?.sets[i]?.reps ?? s.reps,
                done: false,
              })),
            },
      ),
    }));
    setSwapOf(null);
  }

  function bumpWeight(lineId: string, setId: string, dir: 1 | -1) {
    const step = imperial ? kgFromLb(displayStep(true)) : displayStep(false);
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) =>
        l.id !== lineId
          ? l
          : {
              ...l,
              sets: l.sets.map((s) =>
                s.id === setId ? { ...s, weightKg: Math.max(0, Math.round((s.weightKg + dir * step) * 4) / 4) } : s,
              ),
            },
      ),
    }));
  }

  function logSet(line: LiftLine, set: LiftSet) {
    if (tickOf?.setId === set.id) setTickOf(null);
    const nextDone = !set.done;
    patchSet(line.id, set.id, { done: nextDone });
    if (!nextDone) return;
    const partner = line.pairId ? session.lines.find((l) => l.pairId === line.pairId && l.id !== line.id) : undefined;
    const idx = line.sets.findIndex((s) => s.id === set.id);
    const partnerReady = !partner || Boolean(partner.sets[idx]?.done) || set.warmup;
    if (!partnerReady) {
      toast("Hit the paired move");
      return;
    }
    const restSec = exerciseById(line.moveId)?.restSec ?? restPreset;
    setRestHold(false);
    setRestMove(line.moveId);
    setRest(set.warmup ? Math.min(60, restSec) : restSec);
    try {
      window.navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
  }

  function setFeel(feel: SessionFeel) {
    setSession((cur) => ({ ...cur, feel: cur.feel === feel ? undefined : feel }));
  }

  function startHold(line: LiftLine, set: LiftSet) {
    if (tickOf?.setId === set.id) {
      setTickOf(null);
      return;
    }
    patchSet(line.id, set.id, { reps: 0, done: false });
    setTickOf({ lineId: line.id, setId: set.id });
  }

  function pairLine(line: LiftLine) {
    const idx = session.lines.findIndex((l) => l.id === line.id);
    const next = session.lines[idx + 1];
    if (!next) {
      toast("Add the next exercise, then pair");
      return;
    }
    const pid = line.pairId ?? nid();
    setSession((cur) => ({
      ...cur,
      lines: cur.lines.map((l) => (l.id === line.id || l.id === next.id ? { ...l, pairId: pid } : l)),
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
                {volDelta != null && volume > 0 ? (
                  <span className="ml-1 text-sm font-sans font-medium text-muted-foreground">
                    {volDelta > 0 ? "↑" : volDelta < 0 ? "↓" : "·"}
                    {volDelta === 0 ? "same" : `${Math.abs(volDelta)}%`}
                  </span>
                ) : null}
              </p>
              {setProgress.total > 0 ? (
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {setProgress.done}/{setProgress.total} sets
                </p>
              ) : null}
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
          {session.lines.some((l) => l.sets.some((s) => s.done && !s.warmup)) ? (
            <div className="mt-2 flex gap-1">
              {(["easy", "right", "grind"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFeel(id)}
                  className={cn(
                    "h-11 flex-1 rounded-full text-sm capitalize",
                    session.feel === id ? "bg-spark text-spark-foreground" : "bg-card shadow-[var(--shadow-border)]",
                  )}
                >
                  {id === "right" ? "On it" : id}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {rest > 0 ? (
        <div className="mx-4 mt-3 rounded-2xl bg-spark px-3 py-3 text-spark-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Timer className="size-4" /> {restHold ? "Paused" : "Rest"}
            </span>
            <span className="font-display text-2xl tabular-nums">{rest}s</span>
            <div className="flex items-center gap-1">
              <button type="button" className="h-11 min-w-11 rounded-full text-sm font-medium" onClick={() => setRest((n) => Math.max(0, n - 15))}>
                −15
              </button>
              <button
                type="button"
                className="flex h-11 min-w-11 items-center justify-center rounded-full"
                onClick={() => setRestHold((h) => !h)}
                aria-label={restHold ? "Resume rest" : "Pause rest"}
              >
                {restHold ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              <button
                type="button"
                className="h-11 min-w-11 rounded-full text-sm font-medium"
                onClick={() => {
                  skipChime.current = true;
                  setRestHold(false);
                  setRest(0);
                }}
              >
                Skip
              </button>
              <button type="button" className="h-11 min-w-11 rounded-full text-sm font-medium" onClick={() => setRest((n) => n + 15)}>
                +15
              </button>
            </div>
          </div>
          {restCue ? <p className="mt-2 text-xs leading-relaxed opacity-90">{restCue}</p> : null}
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
            {sessions.some((s) => s.lines.some((l) => l.sets.some((x) => x.done))) ? (
              <Button variant="secondary" className="mt-3 w-full" onClick={repeatLast}>
                Repeat last session
              </Button>
            ) : null}
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
          const ex = exerciseById(line.moveId);
          const prev = previousLine(sessions, line.moveId, session.id);
          const prevSess = previousSessionForMove(sessions, line.moveId, session.id);
          const best = bestEpley(sessions, line.moveId);
          const lineVol = lineVolumeKg(line);
          const unit = logUnit(line.moveId);
          const nextKg = suggestNextKg(prev, prevSess?.feel);
          const paired = line.pairId ? session.lines.find((l) => l.pairId === line.pairId && l.id !== line.id) : undefined;
          return (
            <section key={line.id} className="mb-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start gap-3">
                {ex ? <ExerciseFigure exercise={ex} size="sm" className="h-14 w-14 rounded-xl" /> : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1">
                    <h2 className="min-w-0 flex-1 font-display text-xl leading-tight">{move?.name ?? line.moveId}</h2>
                    <button
                      type="button"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                      onClick={() => moveLine(line.id, -1)}
                      aria-label="Move exercise up"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                      onClick={() => moveLine(line.id, 1)}
                      aria-label="Move exercise down"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  {paired ? (
                    <p className="mt-0.5 text-xs font-medium text-spark">Superset with {moveById(paired.moveId)?.name}</p>
                  ) : null}
                  {prev ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last{" "}
                      {prev.sets
                        .filter((s) => s.done)
                        .map((s) => {
                          const w = imperial ? Math.round(lbFromKg(s.weightKg)) : Math.round(s.weightKg);
                          const rir = s.rir != null ? `@${s.rir}` : "";
                          return `${s.warmup ? "W" : ""}${s.reps}${unit === "reps" ? "×" : unit === "sec" ? "s " : "m "}${w}${rir}`;
                        })
                        .join("  ")}
                      {nextKg && nextKg !== prev.sets.filter((s) => s.done && !s.warmup).at(-1)?.weightKg
                        ? ` · try ${imperial ? Math.round(lbFromKg(nextKg)) : nextKg}`
                        : ""}
                      {prevSess?.feel ? ` · felt ${prevSess.feel === "right" ? "on it" : prevSess.feel}` : ""}
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
                  const workIndex = line.sets.filter((s, j) => j < i && !s.warmup).length;
                  const ghost = set.warmup ? undefined : ghostSet(prev, workIndex);
                  const beat = !set.warmup && beatsPrevious(set, prev, workIndex);
                  const ticking = tickOf?.setId === set.id;
                  return (
                    <li key={set.id}>
                      <div className="grid grid-cols-[1.75rem_minmax(0,3.6rem)_minmax(0,1fr)_auto] items-center gap-1.5">
                        <span className="text-center text-xs tabular-nums text-muted-foreground">
                          {set.warmup ? "W" : set.kind === "drop" ? "D" : set.kind === "fail" ? "F" : workIndex + 1}
                        </span>
                        {unit === "sec" ? (
                          <button
                            type="button"
                            className={cn(
                              "h-12 rounded-full px-1 text-center text-sm tabular-nums",
                              ticking ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                            )}
                            onClick={() => startHold(line, set)}
                            aria-label={ticking ? "Stop timer" : "Start timer"}
                          >
                            {ticking ? set.reps : set.reps || "Go"}
                          </button>
                        ) : (
                          <Input
                            className="h-12 px-1 text-center tabular-nums"
                            inputMode="numeric"
                            value={String(set.reps)}
                            onChange={(e) => patchSet(line.id, set.id, { reps: Number(e.target.value) || 0 })}
                            aria-label={unit === "m" ? "Meters" : "Reps"}
                          />
                        )}
                        <div className="flex min-w-0 items-center">
                          <button
                            type="button"
                            className="flex h-12 w-9 shrink-0 items-center justify-center rounded-l-full bg-background text-lg leading-none shadow-[var(--shadow-border)]"
                            onClick={() => bumpWeight(line.id, set.id, -1)}
                            aria-label="Decrease weight"
                          >
                            −
                          </button>
                          <Input
                            className="h-12 min-w-0 rounded-none px-1 text-center tabular-nums shadow-none"
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
                            className="flex h-12 w-9 shrink-0 items-center justify-center rounded-r-full bg-background text-lg leading-none shadow-[var(--shadow-border)]"
                            onClick={() => bumpWeight(line.id, set.id, 1)}
                            aria-label="Increase weight"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => logSet(line, set)}
                          className={cn(
                            "h-12 min-w-14 shrink-0 rounded-full px-3 text-sm font-medium",
                            set.done
                              ? "bg-primary text-primary-foreground"
                              : beat
                                ? "bg-spark text-spark-foreground"
                                : "bg-background shadow-[var(--shadow-border)]",
                          )}
                        >
                          {set.done ? (isPr ? "PR" : "Done") : beat ? "Beat" : "Log"}
                        </button>
                      </div>
                      {ghost && !set.done ? (
                        <p className="mt-0.5 pl-8 text-xs tabular-nums text-muted-foreground">
                          last {ghost.reps}
                          {unit === "reps" ? " × " : unit === "sec" ? "s @ " : "m @ "}
                          {imperial ? Math.round(lbFromKg(ghost.weightKg)) : Math.round(ghost.weightKg * 10) / 10}
                          {ghost.rir != null ? ` @${ghost.rir}` : ""}
                        </p>
                      ) : null}
                      {isUnilateral(line.moveId) ? (
                        <div className="mt-1 flex items-center gap-1 pl-8">
                          {(["L", "R"] as const).map((side) => (
                            <button
                              key={side}
                              type="button"
                              onClick={() => patchSet(line.id, set.id, { side })}
                              className={cn(
                                "h-8 min-w-8 rounded-full px-2 text-xs font-medium",
                                set.side === side ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                              )}
                            >
                              {side}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {set.done && !set.warmup ? (
                        <div className="mt-1 flex items-center gap-1 pl-8">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">RIR</span>
                          {[4, 3, 2, 1, 0].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => patchSet(line.id, set.id, { rir: n })}
                              className={cn(
                                "h-8 min-w-8 rounded-full px-2 text-xs tabular-nums",
                                set.rir === n ? "bg-spark text-spark-foreground" : "bg-background shadow-[var(--shadow-border)]",
                              )}
                            >
                              {n}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              patchSet(line.id, set.id, { kind: set.kind === "drop" ? "work" : "drop" })
                            }
                            className={cn(
                              "ml-auto h-8 rounded-full px-2 text-[10px] uppercase tracking-wide",
                              set.kind === "drop" ? "bg-spark text-spark-foreground" : "text-muted-foreground",
                            )}
                          >
                            Drop
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchSet(line.id, set.id, { kind: set.kind === "fail" ? "work" : "fail" })
                            }
                            className={cn(
                              "h-8 rounded-full px-2 text-[10px] uppercase tracking-wide",
                              set.kind === "fail" ? "bg-spark text-spark-foreground" : "text-muted-foreground",
                            )}
                          >
                            Fail
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {move?.bar ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Per side{" "}
                  {platesPerSide(
                    Math.max(0, ...line.sets.filter((s) => !s.warmup).map((s) => s.weightKg)),
                    imperial,
                  )
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
              <Input
                className="mt-2 h-11"
                value={line.note ?? ""}
                placeholder="Note for next time"
                onChange={(e) =>
                  setSession((cur) => ({
                    ...cur,
                    lines: cur.lines.map((l) => (l.id === line.id ? { ...l, note: e.target.value } : l)),
                  }))
                }
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => addSet(line)}>
                  <Plus /> Add set
                </Button>
                <Button variant="ghost" onClick={() => addLadder(line)}>
                  Warm-up
                </Button>
                <Button variant="ghost" onClick={() => pairLine(line)}>
                  Pair
                </Button>
                <Button variant="ghost" onClick={() => fillRest(line)}>
                  Fill rest
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSwapOf(swapOf === line.id ? null : line.id)}
                >
                  <ArrowLeftRight /> Swap
                </Button>
              </div>
              {swapOf === line.id ? (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {substituteMoves(line.moveId, 6).map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => swapMoveOnLine(line.id, alt.id)}
                      className="rounded-2xl bg-background px-3 py-2 text-left text-sm shadow-[var(--shadow-border)]"
                    >
                      {alt.name}
                    </button>
                  ))}
                </div>
              ) : null}
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

function sessionFromSeed(
  seed: LiftSeed,
  sessions: LiftSession[],
  bodyKg: number,
  imperial: boolean,
): LiftSession {
  const lines: LiftLine[] = [];
  for (const moveId of seed.moveIds) {
    const move = moveById(moveId);
    if (!move) continue;
    const prev = previousLine(sessions, moveId);
    const prevSess = previousSessionForMove(sessions, moveId);
    const defaultKg = move.bodyweight ? bodyKg : imperial ? kgFromLb(95) : 40;
    const suggested = suggestNextKg(prev, prevSess?.feel);
    const unit = logUnit(moveId);
    const defaultReps = unit === "sec" ? 40 : unit === "m" ? 30 : 8;
    lines.push({
      id: nid(),
      moveId,
      note: prev?.note,
      sets:
        prev?.sets.slice(0, 4).map((s, i) => ({
          id: nid(),
          reps: s.reps,
          weightKg: !s.warmup && i === (prev.sets.findIndex((x) => !x.warmup) ?? 0) && suggested ? suggested : s.weightKg,
          done: false,
          warmup: s.warmup,
        })) ?? [{ id: nid(), reps: defaultReps, weightKg: defaultKg, done: false }],
    });
  }
  return {
    id: nid(),
    date: seed.date || isoDate(),
    name: seed.name || "Lift",
    lines,
    startedAt: Date.now(),
  };
}
