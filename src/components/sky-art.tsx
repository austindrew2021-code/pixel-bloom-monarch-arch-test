import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  rgb: [number, number, number];
  phase: number;
  speed: number;
  spike: boolean;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStars(count: number, seed: number, high: boolean): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const mag = rand() ** 2.1;
    const r = high ? 1.15 + mag * 2.6 : 0.35 + mag * 1.8;
    const hot = rand();
    const rgb: [number, number, number] =
      hot < 0.18 ? [255, 214, 170] : hot > 0.78 ? [186, 210, 255] : [236, 240, 255];
    stars.push({
      x: rand(),
      y: high ? rand() * 0.52 : rand(),
      r,
      rgb,
      phase: rand() * Math.PI * 2,
      speed: high ? 0.08 + rand() * 0.22 : 0.22 + rand() * 0.5,
      spike: high ? mag > 0.22 : mag > 0.55,
    });
  }
  return stars;
}

/** Quiet, photographic starfield. Most lights stay put; a few breathe. */
export function Starfield({ seed = 7, count = 160, high = false }: { seed?: number; count?: number; high?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const stars = makeStars(count, seed, high);
    let frame = 0;
    let running = true;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(0);
    };

    const paint = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const x = s.x * w;
        const y = s.y * h;
        const [r, gch, b] = s.rgb;
        const tw = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        if (s.r < 1.15 && !s.spike) {
          ctx.fillStyle = `rgba(${r},${gch},${b},${0.55 * tw})`;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        const rad = s.r * 1.7;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 4.2);
        g.addColorStop(0, `rgba(${r},${gch},${b},${0.95 * tw})`);
        g.addColorStop(0.22, `rgba(${r},${gch},${b},${0.42 * tw})`);
        g.addColorStop(1, `rgba(${r},${gch},${b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad * 4.2, 0, Math.PI * 2);
        ctx.fill();
        if (s.spike) {
          ctx.strokeStyle = `rgba(${r},${gch},${b},${0.32 * tw})`;
          ctx.lineWidth = 0.55;
          ctx.beginPath();
          ctx.moveTo(x, y - rad * 8);
          ctx.lineTo(x, y + rad * 8);
          ctx.moveTo(x - rad * 5.5, y);
          ctx.lineTo(x + rad * 5.5, y);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      if (!running) return;
      frame = requestAnimationFrame(loop);
      paint(now / 1000);
    };


    fit();
    frame = requestAnimationFrame(loop);
    window.addEventListener("resize", fit);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, [count, seed, high]);

  return <canvas ref={canvasRef} className="theme-art__svg" aria-hidden />;
}

export function SpinningMoon({ className = "" }: { className?: string }) {
  return (
    <svg className={`theme-art__moon ${className}`.trim()} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <clipPath id="sf-moon-clip">
          <circle cx="100" cy="100" r="88" />
        </clipPath>
        <radialGradient id="sf-moon-body" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#f6f1e8" />
          <stop offset="55%" stopColor="#d9d0c4" />
          <stop offset="100%" stopColor="#8a8074" />
        </radialGradient>
        <radialGradient id="sf-moon-shade" cx="78%" cy="58%">
          <stop offset="0%" stopColor="#1a1420" stopOpacity="0" />
          <stop offset="70%" stopColor="#1a1420" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0c0810" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <g clipPath="url(#sf-moon-clip)">
        <circle cx="100" cy="100" r="88" fill="url(#sf-moon-body)" />
        <g className="theme-art__spin theme-art__spin--cw-slow" style={{ transformOrigin: "100px 100px" }}>
          <circle cx="62" cy="70" r="18" fill="#c4b8aa" opacity="0.55" />
          <circle cx="118" cy="48" r="11" fill="#b7aa9c" opacity="0.5" />
          <circle cx="142" cy="112" r="22" fill="#c9bdae" opacity="0.4" />
          <circle cx="78" cy="138" r="14" fill="#b1a496" opacity="0.45" />
          <circle cx="40" cy="108" r="8" fill="#cfc3b6" opacity="0.4" />
          <circle cx="160" cy="72" r="7" fill="#d2c6b8" opacity="0.35" />
        </g>
        <circle cx="100" cy="100" r="88" fill="url(#sf-moon-shade)" />
      </g>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#fff6ea" strokeOpacity="0.18" strokeWidth="1.2" />
    </svg>
  );
}

export function DriftPlanet() {
  return (
    <svg className="theme-art__planet" viewBox="0 0 160 160" aria-hidden>
      <defs>
        <radialGradient id="sf-planet" cx="34%" cy="30%">
          <stop offset="0%" stopColor="#f0d8c4" />
          <stop offset="50%" stopColor="#c47a4a" />
          <stop offset="100%" stopColor="#5a2a18" />
        </radialGradient>
      </defs>
      <g className="theme-art__spin theme-art__spin--ccw" style={{ transformOrigin: "80px 80px" }}>
        <ellipse cx="80" cy="80" rx="70" ry="14" fill="none" stroke="#e8c9a0" strokeWidth="4" opacity="0.55" />
        <ellipse cx="80" cy="80" rx="70" ry="14" fill="none" stroke="#8a5a32" strokeWidth="1.2" opacity="0.7" />
      </g>
      <circle cx="80" cy="80" r="28" fill="url(#sf-planet)" />
    </svg>
  );
}
