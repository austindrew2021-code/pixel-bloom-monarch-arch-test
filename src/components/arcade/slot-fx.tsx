import { useEffect, useRef } from "react";
import type { Ambient } from "@/lib/arcade/slots/art";

/**
 * The weather behind the reels, and the burst in front of them.
 *
 * One canvas, two jobs. Ambient particles run continuously and belong to the
 * theme — snow drifts, embers rise, stars wheel, and storm themes throw a
 * forked lightning bolt across the machine every few seconds. Win bursts are
 * fired on demand and spray from the cells that paid.
 *
 * Everything is drawn rather than animated in the DOM: a few hundred particles
 * as elements would thrash layout on a phone, and none of this should ever cost
 * a frame of the spin.
 */

export type Burst = { id: number; x: number; y: number; colour: string; power: number };

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; colour: string; spin: number;
};

type Bolt = { life: number; points: [number, number][]; branches: [number, number][][] };

const AMBIENT_COUNT: Record<Ambient, number> = {
  storm: 14, snow: 46, embers: 34, bubbles: 28, stars: 40, motes: 30, sparks: 26,
};

export function SlotFx({
  ambient,
  glow,
  bursts,
  intense,
}: {
  ambient: Ambient;
  glow: string;
  /** Win bursts to fire; each new id spawns once. */
  bursts: Burst[];
  /** Big-win mode: denser sparks and more frequent lightning. */
  intense?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstsRef = useRef<Burst[]>([]);
  const firedRef = useRef(new Set<number>());
  const stateRef = useRef({ ambient, glow, intense: !!intense });
  stateRef.current = { ambient, glow, intense: !!intense };

  useEffect(() => {
    for (const burst of bursts) {
      if (firedRef.current.has(burst.id)) continue;
      firedRef.current.add(burst.id);
      burstsRef.current.push(burst);
    }
  }, [bursts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let width = 0;
    let height = 0;
    let frame = 0;
    let boltTimer = 90;
    let bolt: Bolt | null = null;
    const particles: Particle[] = [];
    const sparks: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const seedAmbient = () => {
      particles.length = 0;
      if (reduced || width === 0) return;
      const count = AMBIENT_COUNT[stateRef.current.ambient] ?? 24;
      for (let i = 0; i < count; i += 1) particles.push(spawnAmbient(true));
    };

    function spawnAmbient(anywhere: boolean): Particle {
      const kind = stateRef.current.ambient;
      const colour = stateRef.current.glow;
      const base = {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -10,
        vx: 0, vy: 0, life: 1, maxLife: 1,
        size: 1.6, colour, spin: Math.random() * Math.PI * 2,
      };
      switch (kind) {
        case "snow":
          return { ...base, vx: (Math.random() - 0.5) * 0.25, vy: 0.22 + Math.random() * 0.35,
            size: 1 + Math.random() * 2.2, colour: "#e0f2fe" };
        case "embers":
          return { ...base, y: anywhere ? Math.random() * height : height + 10,
            vx: (Math.random() - 0.5) * 0.3, vy: -(0.28 + Math.random() * 0.5),
            size: 1 + Math.random() * 1.8, colour: Math.random() > 0.5 ? "#fb923c" : colour };
        case "bubbles":
          return { ...base, y: anywhere ? Math.random() * height : height + 10,
            vx: (Math.random() - 0.5) * 0.2, vy: -(0.18 + Math.random() * 0.35),
            size: 1.4 + Math.random() * 3, colour };
        case "stars":
          return { ...base, vx: -(0.05 + Math.random() * 0.14), vy: 0.02,
            size: 0.6 + Math.random() * 1.6, colour: Math.random() > 0.7 ? colour : "#cbd5e1" };
        case "sparks":
          return { ...base, y: anywhere ? Math.random() * height : height + 6,
            vx: (Math.random() - 0.5) * 0.7, vy: -(0.5 + Math.random() * 0.8),
            size: 0.8 + Math.random() * 1.3, colour };
        case "storm":
          return { ...base, vx: -(0.4 + Math.random() * 0.7), vy: 0.9 + Math.random() * 1.1,
            size: 0.7 + Math.random() * 1.1, colour: "#93c5fd" };
        default:
          return { ...base, vx: (Math.random() - 0.5) * 0.18, vy: -(0.05 + Math.random() * 0.18),
            size: 0.9 + Math.random() * 1.7, colour };
      }
    }

    /** A forked bolt from the top of the machine to somewhere across it. */
    function makeBolt(): Bolt {
      const points: [number, number][] = [];
      let x = width * (0.2 + Math.random() * 0.6);
      let y = 0;
      while (y < height) {
        points.push([x, y]);
        y += height / (6 + Math.random() * 4);
        x += (Math.random() - 0.5) * width * 0.28;
      }
      points.push([x, height]);
      const branches: [number, number][][] = [];
      for (let i = 1; i < points.length - 1; i += 1) {
        if (Math.random() > 0.55) continue;
        const [bx, by] = points[i]!;
        branches.push([
          [bx, by],
          [bx + (Math.random() - 0.5) * width * 0.3, by + height * 0.14],
        ]);
      }
      return { life: 1, points, branches };
    }

    seedAmbient();

    const render = () => {
      frame = requestAnimationFrame(render);
      if (width === 0 || height === 0) return;
      ctx.clearRect(0, 0, width, height);
      const { ambient: kind, glow: colour, intense: hot } = stateRef.current;

      if (!reduced) {
        // Ambient layer.
        if (particles.length === 0) seedAmbient();
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i]!;
          p.x += p.vx;
          p.y += p.vy;
          p.spin += 0.02;
          const drifted =
            p.y > height + 12 || p.y < -12 || p.x < -12 || p.x > width + 12;
          if (drifted) particles[i] = spawnAmbient(false);

          ctx.globalAlpha = kind === "stars" ? 0.45 + Math.sin(p.spin) * 0.3 : 0.5;
          ctx.fillStyle = p.colour;
          if (kind === "bubbles") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.strokeStyle = p.colour;
            ctx.lineWidth = 1;
            ctx.stroke();
          } else if (kind === "storm") {
            ctx.fillRect(p.x, p.y, 1, p.size * 3);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // Lightning, for storm themes and for any theme during a big win.
        if (kind === "storm" || hot) {
          boltTimer -= 1;
          if (boltTimer <= 0) {
            bolt = makeBolt();
            boltTimer = hot ? 40 + Math.random() * 40 : 150 + Math.random() * 180;
          }
          if (bolt) {
            bolt.life -= 0.07;
            if (bolt.life <= 0) bolt = null;
            else {
              // The flash lights the whole machine, not just the bolt.
              ctx.globalAlpha = bolt.life * 0.14;
              ctx.fillStyle = "#e0f2fe";
              ctx.fillRect(0, 0, width, height);

              ctx.globalAlpha = Math.min(1, bolt.life * 1.4);
              ctx.strokeStyle = "#dbeafe";
              ctx.lineWidth = 2.4;
              ctx.shadowBlur = 18;
              ctx.shadowColor = colour;
              ctx.beginPath();
              bolt.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
              ctx.stroke();
              ctx.lineWidth = 1.2;
              for (const branch of bolt.branches) {
                ctx.beginPath();
                ctx.moveTo(branch[0]![0], branch[0]![1]);
                ctx.lineTo(branch[1]![0], branch[1]![1]);
                ctx.stroke();
              }
              ctx.shadowBlur = 0;
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      // Win bursts.
      while (burstsRef.current.length > 0) {
        const burst = burstsRef.current.pop()!;
        const count = reduced ? 0 : Math.round(10 + burst.power * 22);
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
          const speed = 0.8 + Math.random() * (1.6 + burst.power * 2.2);
          sparks.push({
            x: burst.x, y: burst.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.6,
            life: 1, maxLife: 1, size: 1.2 + Math.random() * 2.2,
            colour: burst.colour, spin: 0,
          });
        }
      }
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i]!;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.045; // gravity, so a burst falls rather than floating away
        s.life -= 0.016;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.colour;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
