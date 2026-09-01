import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/exercises";
import { exerciseClipSrc } from "@/lib/exercise-clips";
import { cn } from "@/lib/utils";

type Pose =
  | "squat"
  | "hinge"
  | "lunge"
  | "hip"
  | "bench"
  | "press"
  | "fly"
  | "dip"
  | "row"
  | "pulldown"
  | "pullup"
  | "curl"
  | "raise"
  | "plank"
  | "machine"
  | "calf"
  | "swing";

const POSE: Record<string, Pose> = {
  squat: "squat",
  "front-squat": "squat",
  goblet: "squat",
  "hack-squat": "squat",
  cossack: "squat",
  "smith-squat": "squat",
  "sumo-squat": "squat",
  "sissy-squat": "squat",
  "pendulum-squat": "squat",
  "jump-squat": "squat",
  rdl: "hinge",
  deadlift: "hinge",
  "good-morning": "hinge",
  "pull-through": "hinge",
  lunge: "lunge",
  "split-squat": "lunge",
  "reverse-lunge": "lunge",
  "step-up": "lunge",
  "high-knees": "lunge",
  burpee: "lunge",
  "hip-thrust": "hip",
  "glute-bridge": "hip",
  "hip-abduction": "hip",
  "hip-adduction": "hip",
  kickback: "hip",
  "donkey-kick": "hip",
  bench: "bench",
  incline: "bench",
  "close-grip": "bench",
  "chest-press": "bench",
  decline: "bench",
  "decline-db": "bench",
  "db-bench": "bench",
  "incline-db": "bench",
  "pec-deck": "fly",
  "cable-fly": "fly",
  fly: "fly",
  pullover: "fly",
  "cable-crossover": "fly",
  ohp: "press",
  arnold: "press",
  "seated-db-press": "press",
  "machine-press": "press",
  "overhead-ext": "press",
  "overhead-cable": "press",
  "tricep-kickback": "press",
  dip: "dip",
  pushup: "dip",
  "bench-dip": "dip",
  row: "row",
  "seated-row": "row",
  "cable-row": "row",
  "rear-fly": "row",
  "one-arm-row": "row",
  "t-bar-row": "row",
  "chest-supported-row": "row",
  "one-arm-cable-row": "row",
  "reverse-pec-deck": "row",
  rower: "row",
  lat: "pulldown",
  "straight-arm-pulldown": "pulldown",
  pullup: "pullup",
  "chin-up": "pullup",
  "hanging-leg": "pullup",
  curl: "curl",
  hammer: "curl",
  preacher: "curl",
  concentration: "curl",
  "cable-curl": "curl",
  "ez-curl": "curl",
  "spider-curl": "curl",
  "incline-curl": "curl",
  "preacher-machine": "curl",
  lateral: "raise",
  "face-pull": "raise",
  shrug: "raise",
  "smith-shrug": "raise",
  "cable-lateral": "raise",
  "front-raise": "raise",
  "upright-row": "raise",
  "battle-rope": "raise",
  tricep: "press",
  skullcrusher: "bench",
  plank: "plank",
  "ab-wheel": "plank",
  crunch: "plank",
  bicycle: "plank",
  "sit-up": "plank",
  "reverse-crunch": "plank",
  "russian-twist": "plank",
  "cable-crunch": "plank",
  "v-up": "plank",
  "flutter-kick": "plank",
  "decline-situp": "plank",
  "machine-crunch": "plank",
  "mountain-climber": "plank",
  woodchop: "raise",
  calf: "calf",
  "seated-calf": "calf",
  "single-calf": "calf",
  swing: "swing",
  farmer: "raise",
  "jump-rope": "swing",
  "jumping-jack": "swing",
  sprint: "swing",
  "leg-press": "machine",
  "leg-curl": "machine",
  "leg-ext": "machine",
  "ham-slide": "machine",
  nordic: "machine",
  "suspension-curl": "machine",
  "seated-leg-curl": "machine",
  bike: "machine",
};

const SIZES = {
  sm: "h-[4.75rem] w-[4.75rem]",
  md: "h-28 w-28",
  lg: "h-52 w-52",
};

function poseOf(id: string): Pose {
  return POSE[id] ?? "press";
}

export function ExerciseFigure({
  exercise,
  size = "md",
  className,
}: {
  exercise: Pick<Exercise, "id" | "primary" | "secondary"> & { name?: string };
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const clip = exerciseClipSrc(exercise.id);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (clip && !failed) {
    return (
      <span
        data-testid="exercise-figure"
        data-exercise-id={exercise.id}
        className={cn(
          SIZES[size],
          "relative inline-block shrink-0 overflow-hidden rounded-2xl bg-background",
          className,
        )}
      >
        <video
          src={clip}
          autoPlay={!reduceMotion}
          loop
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          aria-label={exercise.name ?? "Exercise form"}
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  const pose = poseOf(exercise.id);
  const hot = new Set(exercise.primary);
  const warm = new Set(exercise.secondary);
  return (
    <svg
      data-testid="exercise-figure"
      data-exercise-id={exercise.id}
      viewBox="0 0 160 160"
      className={cn(SIZES[size], "shrink-0", className)}
      role="img"
      aria-hidden
    >
      <rect width="160" height="160" rx="22" fill="var(--color-background)" />
      <g className={HOLD_POSES.has(pose) ? "pose-anim-hold" : "pose-anim-rep"}>
        <PoseBody pose={pose} hot={hot} warm={warm} />
      </g>
    </svg>
  );
}

/** Isometric holds get a slow breathing pulse instead of a rep bob — there's no rep to loop. */
const HOLD_POSES = new Set<Pose>(["plank"]);

function fill(id: string, hot: Set<string>, warm: Set<string>) {
  if (hot.has(id)) return "var(--color-spark)";
  if (warm.has(id)) return "var(--color-primary)";
  return "color-mix(in oklab, var(--color-foreground) 18%, var(--color-card))";
}

function ink() {
  return "color-mix(in oklab, var(--color-foreground) 55%, transparent)";
}

function PoseBody({ pose, hot, warm }: { pose: Pose; hot: Set<string>; warm: Set<string> }) {
  const f = (id: string) => fill(id, hot, warm);
  if (pose === "bench") return <Bench f={f} />;
  if (pose === "hinge") return <Hinge f={f} />;
  if (pose === "lunge") return <Lunge f={f} />;
  if (pose === "hip") return <Hip f={f} />;
  if (pose === "press") return <Press f={f} />;
  if (pose === "fly") return <Fly f={f} />;
  if (pose === "dip") return <Dip f={f} />;
  if (pose === "row") return <Row f={f} />;
  if (pose === "pulldown") return <Pulldown f={f} />;
  if (pose === "pullup") return <Pullup f={f} />;
  if (pose === "curl") return <Curl f={f} />;
  if (pose === "raise") return <Raise f={f} />;
  if (pose === "plank") return <Plank f={f} />;
  if (pose === "machine") return <Machine f={f} />;
  if (pose === "calf") return <Calf f={f} />;
  if (pose === "swing") return <Swing f={f} />;
  return <Squat f={f} />;
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="8.5" fill="color-mix(in oklab, var(--color-foreground) 22%, var(--color-card))" stroke={ink()} strokeWidth="1.2" />;
}

function Bar({ x, y, w = 86 }: { x: number; y: number; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="4" rx="1.5" fill="color-mix(in oklab, var(--color-foreground) 42%, var(--color-muted))" />
      <rect x={x - 6} y={y - 3} width="8" height="10" rx="1" fill="color-mix(in oklab, var(--color-foreground) 55%, var(--color-muted))" />
      <rect x={x + w - 2} y={y - 3} width="8" height="10" rx="1" fill="color-mix(in oklab, var(--color-foreground) 55%, var(--color-muted))" />
    </g>
  );
}

function Squat({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Bar x={37} y={36} />
      <Head cx={80} cy={28} />
      <path d="M68 38h24v10H68z" fill={f("traps")} />
      <path d="M62 46h16v16H62z" fill={f("chest")} />
      <path d="M82 46h16v16H82z" fill={f("chest")} />
      <path d="M72 60h16v16H72z" fill={f("abs")} />
      <path d="M54 48c-6 8-8 16-6 24 6 0 10-8 12-16 1-5-1-8-6-8z" fill={f("triceps")} />
      <path d="M106 48c6 8 8 16 6 24-6 0-10-8-12-16-1-5 1-8 6-8z" fill={f("triceps")} />
      <path d="M62 76h16v18c-6 2-12 1-16-3-3-4-2-10 0-15z" fill={f("glutes")} />
      <path d="M82 76h16c2 5 3 11 0 15-4 4-10 5-16 3V76z" fill={f("glutes")} />
      <path d="M60 92h18v28H62c-3-8-3-20-2-28z" fill={f("quads")} />
      <path d="M82 92h18c1 8 1 20-2 28H82V92z" fill={f("quads")} />
      <path d="M62 118h14v22H64c-2-7-2-16-2-22z" fill={f("calves")} />
      <path d="M84 118h14c0 6 0 15-2 22H84v-22z" fill={f("calves")} />
      <ellipse cx={70} cy={144} rx="10" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
      <ellipse cx={90} cy={144} rx="10" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
    </g>
  );
}

function Hinge({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Bar x={48} y={108} w={70} />
      <Head cx={108} cy={42} />
      <path d="M92 48c8 4 14 10 18 16h-16c-4-6-8-12-12-16z" fill={f("traps")} />
      <path d="M70 62c16-2 30 2 40 10l-10 10c-8-6-20-8-34-6z" fill={f("upper-back")} />
      <path d="M58 70c14 0 28 4 36 12l-12 8c-8-6-18-8-30-6z" fill={f("lats")} />
      <path d="M50 88c8 2 16 2 22-2l4 14c-8 4-18 4-28 0z" fill={f("glutes")} />
      <path d="M48 100c6 2 14 2 20-2v22c-8 4-16 4-22 0z" fill={f("hamstrings")} />
      <path d="M46 120c6 2 14 2 20 0v16H48z" fill={f("calves")} />
      <path d="M88 72c8 8 10 16 8 22-6-2-12-8-16-14z" fill={f("triceps")} />
      <ellipse cx={58} cy={140} rx="11" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
    </g>
  );
}

function Lunge({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Head cx={86} cy={24} />
      <path d="M74 34h24v12H74z" fill={f("chest")} />
      <path d="M78 46h16v14H78z" fill={f("abs")} />
      <path d="M70 60h18v16c-6 2-12 0-16-4-3-4-2-8-2-12z" fill={f("glutes")} />
      <path d="M58 74h22v34H60c-3-10-3-24-2-34z" fill={f("quads")} />
      <path d="M88 62h16v18c2 8 10 18 16 26-6 2-12-2-16-10-4-6-8-16-16-18z" fill={f("hamstrings")} />
      <path d="M58 106h16v24H60c-2-8-2-16-2-24z" fill={f("calves")} />
      <path d="M112 96h14v22c-6 2-12 0-14-4v-18z" fill={f("calves")} />
      <path d="M62 38c-8 10-10 18-8 26 6 0 10-8 12-16 1-6-1-10-4-10z" fill={f("triceps")} />
      <path d="M100 38c8 10 10 18 8 26-6 0-10-8-12-16-1-6 1-10 4-10z" fill={f("triceps")} />
      <ellipse cx={66} cy={134} rx="10" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
      <ellipse cx={122} cy={122} rx="10" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
    </g>
  );
}

function Hip({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <rect x="28" y="78" width="44" height="10" rx="2" fill="color-mix(in oklab, var(--color-foreground) 22%, var(--color-muted))" />
      <Head cx={42} cy={52} />
      <path d="M34 62h20v16H34z" fill={f("upper-back")} />
      <path d="M52 74h36v16c-4 6-16 8-36 4z" fill={f("glutes")} />
      <path d="M86 78h18v16c4 2 10 4 16 4v12c-10 0-20-2-28-8z" fill={f("hamstrings")} />
      <path d="M116 96h16v22c-6 2-12 0-16-4z" fill={f("calves")} />
      <path d="M64 86h28v10H64z" fill={f("quads")} />
      <Bar x={58} y={70} w={48} />
    </g>
  );
}

function Bench({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <rect x="30" y="92" width="100" height="10" rx="2" fill="color-mix(in oklab, var(--color-foreground) 20%, var(--color-muted))" />
      <rect x="48" y="102" width="8" height="28" fill="color-mix(in oklab, var(--color-foreground) 18%, var(--color-muted))" />
      <rect x="104" y="102" width="8" height="28" fill="color-mix(in oklab, var(--color-foreground) 18%, var(--color-muted))" />
      <Head cx={38} cy={78} />
      <path d="M46 74h40v18H46z" fill={f("chest")} />
      <path d="M86 78h22v14H86z" fill={f("abs")} />
      <path d="M104 80h16v14c-2 6-8 10-16 8z" fill={f("quads")} />
      <path d="M42 62c8-10 18-12 28-8 2 8 0 16-6 20-8 2-16 0-22-12z" fill={f("front-delts")} />
      <path d="M70 52c12-4 28-2 40 6-4 8-14 10-24 8-8-1-14-6-16-14z" fill={f("triceps")} />
      <Bar x={48} y={46} w={72} />
    </g>
  );
}

function Press({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Bar x={37} y={22} />
      <Head cx={80} cy={44} />
      <path d="M62 52h16v18H62z" fill={f("front-delts")} />
      <path d="M82 52h16v18H82z" fill={f("front-delts")} />
      <path d="M70 68h20v16H70z" fill={f("chest")} />
      <path d="M74 82h12v16H74z" fill={f("abs")} />
      <path d="M50 34c-4 10-4 20 0 28 6-2 10-10 10-18 0-6-4-10-10-10z" fill={f("triceps")} />
      <path d="M110 34c4 10 4 20 0 28-6-2-10-10-10-18 0-6 4-10 10-10z" fill={f("triceps")} />
      <path d="M64 96h32v12c-4 4-12 4-16 4s-12 0-16-4z" fill={f("glutes")} />
      <path d="M66 108h12v28H68c-2-10-2-20-2-28z" fill={f("quads")} />
      <path d="M82 108h12c0 8 0 18-2 28H82v-28z" fill={f("quads")} />
    </g>
  );
}

function Fly({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <rect x="36" y="86" width="88" height="10" rx="2" fill="color-mix(in oklab, var(--color-foreground) 20%, var(--color-muted))" />
      <Head cx={44} cy={72} />
      <path d="M52 68h44v18H52z" fill={f("chest")} />
      <path d="M96 72h20v14H96z" fill={f("abs")} />
      <path d="M36 58c-8 4-14 12-14 20 8 2 16-2 20-10 2-5 0-9-6-10z" fill={f("front-delts")} />
      <path d="M100 52c10-2 22 2 30 10-4 8-14 10-24 8-6-1-10-8-6-18z" fill={f("front-delts")} />
      <circle cx="22" cy="84" r="6" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" />
      <circle cx="132" cy="64" r="6" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" />
    </g>
  );
}

function Dip({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <rect x="28" y="70" width="18" height="6" rx="1" fill="color-mix(in oklab, var(--color-foreground) 40%, var(--color-muted))" />
      <rect x="114" y="70" width="18" height="6" rx="1" fill="color-mix(in oklab, var(--color-foreground) 40%, var(--color-muted))" />
      <Head cx={80} cy={32} />
      <path d="M64 42h32v18H64z" fill={f("chest")} />
      <path d="M72 58h16v14H72z" fill={f("abs")} />
      <path d="M48 48c-6 8-8 16-4 24 6 0 10-8 12-16 1-5-2-8-8-8z" fill={f("triceps")} />
      <path d="M112 48c6 8 8 16 4 24-6 0-10-8-12-16-1-5 2-8 8-8z" fill={f("triceps")} />
      <path d="M68 72h24v16c-4 6-12 6-24 0z" fill={f("quads")} />
      <path d="M70 86h8v28H72c-2-10-2-20-2-28z" fill={f("calves")} />
      <path d="M82 86h8c0 8 0 18-2 28H82v-28z" fill={f("calves")} />
    </g>
  );
}

function Row({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Bar x={44} y={86} w={72} />
      <Head cx={112} cy={38} />
      <path d="M86 46c12 2 20 8 24 14h-18c-4-6-10-10-16-12z" fill={f("traps")} />
      <path d="M62 58c18 0 34 6 42 16l-14 8c-8-8-20-10-34-8z" fill={f("lats")} />
      <path d="M58 72c14 2 26 6 32 14l-12 8c-8-6-18-8-28-6z" fill={f("upper-back")} />
      <path d="M48 92c8 2 18 0 24-6v22c-8 4-18 4-26 0z" fill={f("hamstrings")} />
      <path d="M92 70c6 8 8 14 4 20-6-2-12-8-16-14z" fill={f("biceps")} />
      <ellipse cx={56} cy={132} rx="11" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
    </g>
  );
}

function Pulldown({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <rect x="72" y="10" width="6" height="22" fill="color-mix(in oklab, var(--color-foreground) 30%, var(--color-muted))" />
      <Bar x={38} y={28} />
      <Head cx={80} cy={52} />
      <path d="M58 60h20v20c-8 2-16 0-20-6-3-5-2-10 0-14z" fill={f("lats")} />
      <path d="M82 60h20c2 4 3 9 0 14-4 6-12 8-20 6V60z" fill={f("lats")} />
      <path d="M72 78h16v16H72z" fill={f("abs")} />
      <path d="M50 40c-4 10-4 20 2 28 6-2 8-10 8-18 0-6-4-10-10-10z" fill={f("biceps")} />
      <path d="M110 40c4 10 4 20-2 28-6-2-8-10-8-18 0-6 4-10 10-10z" fill={f("biceps")} />
      <rect x="48" y="108" width="64" height="10" rx="2" fill="color-mix(in oklab, var(--color-foreground) 20%, var(--color-muted))" />
      <path d="M64 96h32v14H64z" fill={f("quads")} />
    </g>
  );
}

function Pullup({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Bar x={28} y={18} w={104} />
      <Head cx={80} cy={48} />
      <path d="M56 56h22v22c-8 4-18 2-24-6-4-6-2-12 2-16z" fill={f("lats")} />
      <path d="M82 56h22c4 4 6 10 2 16-6 8-16 10-24 6V56z" fill={f("lats")} />
      <path d="M72 76h16v16H72z" fill={f("abs")} />
      <path d="M40 26c-2 12 0 22 6 30 6-4 8-12 6-22-1-5-6-8-12-8z" fill={f("biceps")} />
      <path d="M120 26c2 12 0 22-6 30-6-4-8-12-6-22 1-5 6-8 12-8z" fill={f("biceps")} />
      <path d="M68 92h24v28c-4 8-12 8-24 0z" fill={f("quads")} />
    </g>
  );
}

function Curl({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Head cx={80} cy={26} />
      <path d="M68 36h24v16H68z" fill={f("chest")} />
      <path d="M72 50h16v18H72z" fill={f("abs")} />
      <path d="M50 42c-6 8-6 16-2 24 6 0 10-8 10-16 0-5-3-8-8-8z" fill={f("biceps")} />
      <path d="M110 42c6 8 6 16 2 24-6 0-10-8-10-16 0-5 3-8 8-8z" fill={f("biceps")} />
      <path d="M44 64c-4 8-4 14 0 20 5 0 8-6 8-12 0-5-3-8-8-8z" fill={f("forearms")} />
      <path d="M116 64c4 8 4 14 0 20-5 0-8-6-8-12 0-5 3-8 8-8z" fill={f("forearms")} />
      <circle cx="46" cy="90" r="6" fill="color-mix(in oklab, var(--color-foreground) 32%, var(--color-muted))" />
      <circle cx="114" cy="90" r="6" fill="color-mix(in oklab, var(--color-foreground) 32%, var(--color-muted))" />
      <path d="M66 68h28v12c-4 4-10 4-14 4s-10 0-14-4z" fill={f("glutes")} />
      <path d="M68 80h10v36H70c-2-12-2-24-2-36z" fill={f("quads")} />
      <path d="M82 80h10c0 12 0 24-2 36H82V80z" fill={f("quads")} />
    </g>
  );
}

function Raise({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Head cx={80} cy={36} />
      <path d="M68 46h24v16H68z" fill={f("chest")} />
      <path d="M72 60h16v16H72z" fill={f("abs")} />
      <path d="M42 48c-14-2-24 4-28 12 8 4 18 4 26-2 4-4 4-8 2-10z" fill={f("side-delts")} />
      <path d="M118 48c14-2 24 4 28 12-8 4-18 4-26-2-4-4-4-8-2-10z" fill={f("side-delts")} />
      <path d="M36 58c-8 4-12 10-12 16 6 2 12 0 16-6 3-4 2-8-4-10z" fill={f("traps")} />
      <circle cx="16" cy="64" r="5.5" fill="color-mix(in oklab, var(--color-foreground) 32%, var(--color-muted))" />
      <circle cx="144" cy="64" r="5.5" fill="color-mix(in oklab, var(--color-foreground) 32%, var(--color-muted))" />
      <path d="M66 76h28v12c-4 4-10 4-14 4s-10 0-14-4z" fill={f("glutes")} />
      <path d="M68 88h10v36H70c-2-12-2-24-2-36z" fill={f("quads")} />
      <path d="M82 88h10c0 12 0 24-2 36H82V88z" fill={f("quads")} />
    </g>
  );
}

function Plank({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Head cx={36} cy={70} />
      <path d="M44 68h36v16H44z" fill={f("chest")} />
      <path d="M80 70h28v14H80z" fill={f("abs")} />
      <path d="M108 72h22v14c-2 6-10 8-22 4z" fill={f("glutes")} />
      <path d="M126 78h18v12c2 4 6 8 12 8v8c-10 0-20-4-26-12z" fill={f("quads")} />
      <path d="M28 78c-6 8-8 16-4 22 6 0 10-6 10-14 0-5-2-8-6-8z" fill={f("triceps")} />
      <ellipse cx={28} cy={108} rx="9" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
      <ellipse cx="148" cy="108" rx="9" ry="4" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" stroke="none" />
    </g>
  );
}

function Machine({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <rect x="28" y="54" width="104" height="14" rx="3" fill="color-mix(in oklab, var(--color-foreground) 16%, var(--color-muted))" />
      <rect x="36" y="68" width="10" height="56" fill="color-mix(in oklab, var(--color-foreground) 18%, var(--color-muted))" />
      <rect x="114" y="68" width="10" height="56" fill="color-mix(in oklab, var(--color-foreground) 18%, var(--color-muted))" />
      <Head cx={52} cy={44} />
      <path d="M58 50h40v16H58z" fill={f("glutes")} />
      <path d="M96 58h28v16c-4 8-14 10-28 6z" fill={f("hamstrings")} />
      <path d="M118 72h18v16c-4 6-10 6-18 2z" fill={f("calves")} />
      <path d="M70 62h24v12H70z" fill={f("quads")} />
    </g>
  );
}

function Calf({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Head cx={80} cy={22} />
      <path d="M68 32h24v14H68z" fill={f("chest")} />
      <path d="M72 46h16v18H72z" fill={f("abs")} />
      <path d="M66 64h28v12c-4 4-10 4-14 4s-10 0-14-4z" fill={f("glutes")} />
      <path d="M68 76h10v28H70c-2-10-2-20-2-28z" fill={f("quads")} />
      <path d="M82 76h10c0 8 0 18-2 28H82V76z" fill={f("quads")} />
      <path d="M68 102h10v28H70c-2-8-2-20-2-28z" fill={f("calves")} />
      <path d="M82 102h10c0 8 0 20-2 28H82v-28z" fill={f("calves")} />
      <rect x="58" y="132" width="44" height="6" rx="1" fill="color-mix(in oklab, var(--color-foreground) 28%, var(--color-muted))" />
    </g>
  );
}

function Swing({ f }: { f: (id: string) => string }) {
  return (
    <g stroke={ink()} strokeWidth="1.2" strokeLinejoin="round">
      <Head cx={92} cy={28} />
      <path d="M78 38h24v14H78z" fill={f("chest")} />
      <path d="M80 50h16v14H80z" fill={f("abs")} />
      <path d="M70 62h22v16c-6 4-14 2-20-4-4-4-3-9-2-12z" fill={f("glutes")} />
      <path d="M64 76h18v28H66c-3-8-3-20-2-28z" fill={f("hamstrings")} />
      <path d="M64 102h14v24H66c-2-8-2-16-2-24z" fill={f("calves")} />
      <path d="M102 42c8 10 10 20 4 28-6-2-12-10-14-18-1-5 4-10 10-10z" fill={f("lats")} />
      <path d="M70 108c-12 8-22 22-24 34 8 0 16-8 22-18 4-6 6-12 2-16z" fill={f("forearms")} />
      <path
        d="M44 138c-8 0-14 6-14 10 4 6 16 8 24 4 6-3 8-8 4-12-4-3-8-2-14-2z"
        fill="color-mix(in oklab, var(--color-foreground) 40%, var(--color-muted))"
      />
    </g>
  );
}
