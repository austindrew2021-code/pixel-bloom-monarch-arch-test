import { useState } from "react";
import { toast } from "sonner";
import {
  COACH_TONES,
  COACH_VOICES,
  coachLine,
  speakCoach,
  type CoachPrefs,
  type CoachTone,
  type CoachVoiceId,
} from "@/lib/coach";
import { enablePush } from "@/lib/notify";
import { cn } from "@/lib/utils";

export function CoachCard({
  coach,
  onChange,
  locale = "en",
}: {
  coach: CoachPrefs;
  onChange: (patch: Partial<CoachPrefs>) => void;
  locale?: string;
}) {
  const [heard, setHeard] = useState(false);

  function pickTone(id: CoachTone) {
    onChange({ tone: id });
    const line = coachLine("workoutReminder", id, Date.now());
    toast(line);
    if (coach.vocal) speakCoach(line, coach.voiceURI, locale);
  }

  function pickVoice(id: CoachVoiceId) {
    onChange({ voiceURI: id, vocal: true });
    setHeard(true);
    const ok = speakCoach(coachLine("loggedLift", coach.tone, 9), id, locale);
    if (!ok) toast("This phone has no spoken voice yet. Install a text-to-speech engine in Android settings, then tap again.");
  }

  return (
    <section className="hud-panel mt-5 p-4" data-testid="coach-card">
      <p className="hud-kicker">Auto coach</p>
      <h2 className="mt-1 font-display text-2xl leading-tight">A voice on the plan</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Pings for meals, snacks, and training. Miss, skip, or eat out and the tone you pick answers. Vocal uses a
        real phone voice — British, Australian, cowboy, and the rest — off if you want text only.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={coach.on}
          onClick={() => {
            const next = !coach.on;
            onChange({ on: next });
            if (next) void enablePush();
          }}
          className={cn("hud-btn h-11 flex-1 px-4 text-sm font-semibold", coach.on ? "hud-btn-on" : "")}
        >
          Coach {coach.on ? "on" : "off"}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={coach.vocal}
          onClick={() => onChange({ vocal: !coach.vocal })}
          className={cn("hud-btn h-11 flex-1 px-4 text-sm font-semibold", coach.vocal ? "hud-btn-on" : "")}
        >
          Voice {coach.vocal ? "on" : "off"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {COACH_TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            onClick={() => pickTone(tone.id)}
            className={cn("hud-chip min-h-14 px-3 py-2 text-left", coach.tone === tone.id && "hud-chip-on")}
          >
            <p className="text-sm font-medium">{tone.label}</p>
            <p className={cn("mt-0.5 text-xs", coach.tone === tone.id ? "opacity-80" : "text-muted-foreground")}>
              {tone.hint}
            </p>
          </button>
        ))}
      </div>
      {coach.on ? (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Voice</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {COACH_VOICES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => pickVoice(v.id)}
                className={cn(
                  "hud-chip min-h-14 px-3 py-2 text-left",
                  coach.voiceURI === v.id && "hud-chip-on",
                )}
              >
                <p className="text-sm font-medium">{v.label}</p>
                <p className={cn("mt-0.5 text-xs", coach.voiceURI === v.id ? "opacity-80" : "text-muted-foreground")}>
                  {v.hint}
                </p>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="hud-btn mt-2 h-11 w-full text-sm font-semibold"
            onClick={() => {
              onChange({ vocal: true });
              setHeard(true);
              const ok = speakCoach(coachLine("workoutReminder", coach.tone), coach.voiceURI, locale);
              if (!ok) toast("This phone has no spoken voice yet. Install a text-to-speech engine in Android settings, then tap again.");
            }}
          >
            {heard ? "Hear another line" : "Hear a line"}
          </button>
        </div>
      ) : null}
    </section>
  );
}