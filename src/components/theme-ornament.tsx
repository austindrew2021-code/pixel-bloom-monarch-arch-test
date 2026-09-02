import type { ThemeId } from "@/lib/themes";

/**
 * Per-theme decorative art, drawn once behind the whole app.
 *
 * Palette tokens alone make a theme a recolour; this is where a theme gets a
 * face. The layer is fixed, `aria-hidden` and `pointer-events-none`, so it
 * can never take a tap, shift layout or reach a screen reader — and every
 * motion here is decoration, so it all stops under prefers-reduced-motion
 * (see `.theme-art` in styles.css).
 */

/** Gear outlines, generated as alternating tooth/valley rings on a 200x200 box. */
const GEAR_12 =
  "M99.95,3.14L97.36,22.84L76.59,23.12L70.50,37.80L84.99,52.70L72.90,68.45L54.76,58.32L42.16,67.99L47.26,88.13L28.90,95.73L18.27,77.89L2.51,79.96L-3.14,99.95L-22.84,97.36L-23.12,76.59L-37.80,70.50L-52.70,84.99L-68.45,72.90L-58.32,54.76L-67.99,42.16L-88.13,47.26L-95.73,28.90L-77.89,18.27L-79.96,2.51L-99.95,-3.14L-97.36,-22.84L-76.59,-23.12L-70.50,-37.80L-84.99,-52.70L-72.90,-68.45L-54.76,-58.32L-42.16,-67.99L-47.26,-88.13L-28.90,-95.73L-18.27,-77.89L-2.51,-79.96L3.14,-99.95L22.84,-97.36L23.12,-76.59L37.80,-70.50L52.70,-84.99L68.45,-72.90L58.32,-54.76L67.99,-42.16L88.13,-47.26L95.73,-28.90L77.89,-18.27L79.96,-2.51Z";
const GEAR_16 =
  "M99.97,2.36L98.51,17.19L81.98,18.32L78.34,30.31L91.46,40.43L84.43,53.58L68.72,48.30L60.78,57.98L69.03,72.36L57.50,81.81L45.01,70.92L33.96,76.83L36.08,93.26L21.81,97.59L14.44,82.75L1.98,83.98L-2.36,99.97L-17.19,98.51L-18.32,81.98L-30.31,78.34L-40.43,91.46L-53.58,84.43L-48.30,68.72L-57.98,60.78L-72.36,69.03L-81.81,57.50L-70.92,45.01L-76.83,33.96L-93.26,36.08L-97.59,21.81L-82.75,14.44L-83.98,1.98L-99.97,-2.36L-98.51,-17.19L-81.98,-18.32L-78.34,-30.31L-91.46,-40.43L-84.43,-53.58L-68.72,-48.30L-60.78,-57.98L-69.03,-72.36L-57.50,-81.81L-45.01,-70.92L-33.96,-76.83L-36.08,-93.26L-21.81,-97.59L-14.44,-82.75L-1.98,-83.98L2.36,-99.97L17.19,-98.51L18.32,-81.98L30.31,-78.34L40.43,-91.46L53.58,-84.43L48.30,-68.72L57.98,-60.78L72.36,-69.03L81.81,-57.50L70.92,-45.01L76.83,-33.96L93.26,-36.08L97.59,-21.81L82.75,-14.44L83.98,-1.98Z";

/** [x%, y%, radius, opacity, animation-delay] — fixed so SSR and the client agree. */
const STARS: [number, number, number, number, number][] = [
  [3.7,68,1.73,0.7,2.4],
  [77.7,83.3,1.32,0.32,3],
  [24.4,4.5,1.06,0.33,5.7],
  [52.7,17.3,0.79,0.39,1.2],
  [23.2,37.5,1.31,0.32,4.5],
  [75.1,94,1.03,0.47,5.8],
  [15.1,28.6,1.39,0.78,4],
  [23.6,36.2,0.54,0.48,3.5],
  [34.9,21.7,0.97,0.56,3.7],
  [39,24.6,1.41,0.64,2.1],
  [36.6,39.2,0.57,0.65,4.5],
  [9.9,48.9,1.7,0.46,2],
  [17.9,38.8,0.65,0.5,5.8],
  [39,76.1,0.48,0.33,1.6],
  [9,91.2,1.47,0.65,5.9],
  [94.9,54.5,1.18,0.26,6],
  [28.5,72.9,0.63,0.43,1],
  [50.5,26.9,0.67,0.56,4.3],
  [92.7,40.7,1.18,0.47,4.1],
  [70.1,99.4,1.45,0.4,3.8],
  [79.8,9.3,1.55,0.79,1.8],
  [50.9,0.3,1.69,0.51,1.5],
  [17.3,94.7,1.17,0.49,4],
  [12.5,28.9,0.82,0.42,0.1],
  [88.7,21.5,1.51,0.31,4.3],
  [44.4,95.9,1.19,0.32,3.4],
  [88.3,8.7,1.23,0.63,3],
  [87.4,21.3,1.19,0.34,4.2],
  [11.3,55,1.17,0.3,4.3],
  [63.2,59.9,1.2,0.38,0.7],
  [8.9,41,0.9,0.39,2],
  [88.7,56.4,1.54,0.71,3.8],
  [70.3,30.4,1.03,0.58,4.6],
  [91,87.7,0.65,0.74,2.9],
  [54.3,93.2,1.68,0.42,2.8],
  [95.8,87.6,0.82,0.46,0.3],
  [47.1,85.7,1.67,0.47,5.8],
  [57.6,37.7,1.12,0.28,5.8],
  [70.9,17.3,0.73,0.43,3.6],
  [10,86.5,1.71,0.7,1.2],
  [92.7,51.4,0.78,0.33,1.9],
  [45.6,99.1,0.99,0.3,3.4],
  [61.6,26.9,1.64,0.46,0.2],
  [87.7,12.6,1.29,0.48,5.4],
  [53.5,16.1,1.53,0.34,1],
  [86.3,51.9,0.93,0.79,3.9],
  [51.4,36.8,1.76,0.63,4.4],
  [48.7,76.5,0.87,0.46,2.4],
  [14.8,73.2,0.94,0.28,3],
  [87.7,87.4,0.85,0.43,1.7],
  [84.1,12,0.89,0.38,0.5],
  [50.5,23.5,0.81,0.42,1.2],
  [24.7,27,1.72,0.41,2.9],
  [84.3,99.6,1.61,0.31,1.8],
  [75.8,94.5,0.46,0.72,2],
  [14,10.2,1.58,0.26,0.4],
  [90.8,75.6,0.62,0.3,0.4],
  [47.5,20.3,0.53,0.59,2.9],
  [29.6,93.5,1.73,0.42,5.3],
  [77.8,88.1,0.55,0.45,2.2],
  [95.6,98.9,0.79,0.5,0.9],
  [41.7,69.3,0.61,0.36,3.8],
  [37.6,68.1,1.79,0.46,2.4],
  [43.5,62.5,1.03,0.5,6],
  [53.6,68.9,0.71,0.63,1.9],
  [95.8,21.9,0.64,0.47,0.4],
  [0.8,64.8,0.41,0.3,1.6],
  [30,92.7,1.71,0.78,5.7],
  [39.3,78.8,0.7,0.3,0.2],
  [58.4,9.2,1.62,0.71,4.9],
  [80.2,50.3,0.96,0.39,4.1],
  [89,83.1,1.44,0.73,0.5],
  [54.4,89.3,1.64,0.4,1.7],
  [86.4,67.2,0.93,0.58,1.8],
  [93,90.3,1.24,0.68,5.6],
  [26.6,9.7,1.67,0.48,4.7],
  [7.7,48.1,1.32,0.5,3.2],
  [6.4,66.5,0.98,0.58,3.2],
  [21.7,87.1,0.97,0.71,4],
  [91.9,52.2,1.45,0.25,4.5],
  [28.9,11.6,1.17,0.64,5.2],
  [98.3,10.1,0.96,0.28,3.7],
  [59.7,43.2,0.86,0.6,2],
  [75.6,50.1,1.54,0.26,4.2],
  [58.7,24.5,0.58,0.27,2.8],
  [20.5,64.6,0.98,0.55,4.1],
  [89.6,5.1,0.6,0.59,3.9],
  [22.1,17.8,0.63,0.44,5.7]
];

/**
 * Three comets in different lanes of the sky. They share the CSS travel
 * vector, so each one's `angle` matches that diagonal and its tail streams
 * out behind the head; `x`/`y` just place the lane. Their staggered periods
 * (27s, 34s, 43s) never line up, so you get one every several seconds
 * without them ever arriving as a pair.
 */
const COMETS = [
  { variant: "a", x: -70, y: 90, angle: 35, length: 120, width: 2.6 },
  { variant: "b", x: -110, y: 330, angle: 35, length: 92, width: 2 },
  { variant: "c", x: -40, y: -60, angle: 35, length: 145, width: 3 },
] as const;

function BrassArt() {
  return (
    <svg className="theme-art__svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        {/* Brass isn't flat — it needs a lit edge and a shadowed one to read as metal. */}
        <linearGradient id="brass-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0c37a" />
          <stop offset="45%" stopColor="#b8822f" />
          <stop offset="100%" stopColor="#6d4a18" />
        </linearGradient>
        <radialGradient id="brass-lamp" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffd89a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd89a" stopOpacity="0" />
        </radialGradient>
        <g id="brass-gear-12">
          <path d={GEAR_12} fill="url(#brass-face)" />
          <circle r="34" fill="none" stroke="#3a2612" strokeWidth="9" />
          <circle r="15" fill="#2a1b0c" />
          {/* Spokes, cut on the diagonals so the hub reads as cast rather than solid. */}
          {[0, 60, 120].map((a) => (
            <rect key={a} x="-6" y="-72" width="12" height="144" rx="4" fill="#3a2612" transform={`rotate(${a})`} />
          ))}
        </g>
        <g id="brass-gear-16">
          <path d={GEAR_16} fill="url(#brass-face)" />
          <circle r="42" fill="none" stroke="#3a2612" strokeWidth="11" />
          <circle r="18" fill="#2a1b0c" />
          {[30, 90, 150].map((a) => (
            <rect key={a} x="-7" y="-78" width="14" height="156" rx="4" fill="#3a2612" transform={`rotate(${a})`} />
          ))}
        </g>
      </defs>

      <ellipse cx="330" cy="70" rx="220" ry="170" fill="url(#brass-lamp)" />

      {/* Counter-rotating pair — meshed gears must turn opposite ways to look driven. */}
      <g className="theme-art__spin theme-art__spin--cw" style={{ transformOrigin: "330px 96px" }} opacity="0.4">
        <use href="#brass-gear-16" x="330" y="96" transform="translate(330 96) scale(0.92) translate(-330 -96)" />
      </g>
      <g className="theme-art__spin theme-art__spin--ccw" style={{ transformOrigin: "218px 188px" }} opacity="0.3">
        <use href="#brass-gear-12" x="218" y="188" transform="translate(218 188) scale(0.62) translate(-218 -188)" />
      </g>
      <g className="theme-art__spin theme-art__spin--cw-slow" style={{ transformOrigin: "48px 640px" }} opacity="0.3">
        <use href="#brass-gear-12" x="48" y="640" transform="translate(48 640) scale(0.8) translate(-48 -640)" />
      </g>

      {/* Riveted frame rails — the plating the app sits on. */}
      <g stroke="#d99a3c" fill="none" opacity="0.22">
        <path d="M14 150 V690" strokeWidth="2" />
        <path d="M22 150 V690" strokeWidth="1" strokeDasharray="3 7" />
        <path d="M386 150 V690" strokeWidth="2" />
        <path d="M378 150 V690" strokeWidth="1" strokeDasharray="3 7" />
      </g>
      <g fill="#d99a3c" opacity="0.3">
        {[190, 300, 410, 520, 630].map((y) => (
          <g key={y}>
            <circle cx="14" cy={y} r="3.4" />
            <circle cx="386" cy={y} r="3.4" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function NebulaArt() {
  return (
    <svg className="theme-art__svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        {/*
         * A real nebula is turbulence, not a gradient: fractal noise blurred
         * and tinted gives the wispy, uneven gas that layered ellipses can't.
         */}
        <filter id="neb-cloud" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="9" result="soft" />
          <feColorMatrix
            in="soft"
            type="matrix"
            values="0.9 0 0.5 0 0.05
                    0.1 0.4 0.6 0 0.02
                    1.0 0.2 0.9 0 0.12
                    0   0   0  0.85 -0.16"
          />
        </filter>
        <filter id="neb-cloud-2" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="21" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="14" result="soft" />
          <feColorMatrix
            in="soft"
            type="matrix"
            values="0.2 0.3 0.2 0 0
                    0.7 0.8 0.3 0 0.02
                    0.6 0.5 0.4 0 0.05
                    0   0   0  0.5 -0.12"
          />
        </filter>
        <radialGradient id="neb-core" cx="42%" cy="34%">
          <stop offset="0%" stopColor="#ffd9f5" stopOpacity="0.5" />
          <stop offset="38%" stopColor="#c77dff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3a1d63" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="neb-settle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0718" stopOpacity="0.1" />
          <stop offset="45%" stopColor="#0c0718" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#0c0718" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/*
       * Gas first, then the bright core, then stars on top — depth order matters.
       *
       * These two rects are deliberately motionless. They carry fractal-noise
       * filters over a 520x920 area, and animating a filtered element makes the
       * browser re-run the whole filter every frame: expensive enough to matter
       * on a phone someone leaves open mid-workout, and it can flicker as tiles
       * re-rasterise. Painted once, they cost nothing to keep on screen.
       */}
      <rect x="-60" y="-60" width="520" height="920" filter="url(#neb-cloud)" opacity="0.42" />
      <rect x="-40" y="-90" width="520" height="920" filter="url(#neb-cloud-2)" opacity="0.28" />
      <ellipse cx="168" cy="272" rx="260" ry="300" fill="url(#neb-core)" opacity="0.75" />
      {/*
       * Gas is prettiest where there is no text. Settle it back down behind the
       * body copy so the cloud never costs a line of reading contrast.
       */}
      <rect x="0" y="0" width="400" height="800" fill="url(#neb-settle)" />

      {/* Stars hold still. The only thing that moves in this sky is a comet. */}
      <g fill="#ffffff">
        {STARS.map(([x, y, r, o], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} opacity={o} />
        ))}
      </g>

    </svg>
  );
}

/**
 * Comets ride in their own layer, above the gas but painted separately.
 * Sharing a canvas with the filtered clouds would make every frame of a
 * comet's flight re-run those filters; alone, they are a handful of cheap
 * vector shapes.
 */
function NebulaComets() {
  return (
    <svg className="theme-art__svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        {/* Tail: bright at the head, gone by the end, so the streak tapers. */}
        <linearGradient id="comet-tail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="55%" stopColor="#e7cbff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="comet-glow">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#dcbcff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c77dff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {COMETS.map((c) => (
        <g key={c.variant} className={`theme-art__comet theme-art__comet--${c.variant}`}>
          {/* Rotated to its travel direction so the tail streams out behind the head. */}
          <g transform={`translate(${c.x} ${c.y}) rotate(${c.angle})`}>
            {/*
             * The tail is a tapered wedge, not a stroked line: it narrows to a
             * point the way a real one does, and a line would not paint at all
             * here — a horizontal path has a zero-height bounding box, and an
             * objectBoundingBox gradient is dropped on a degenerate box.
             */}
            <path
              d={`M0 ${-c.width * 2.6} L0 ${c.width * 2.6} L${-c.length * 1.15} 0 Z`}
              fill="url(#comet-tail)"
              opacity="0.3"
            />
            <path d={`M0 ${-c.width} L0 ${c.width} L${-c.length} 0 Z`} fill="url(#comet-tail)" />
            <circle r={c.width * 5} fill="url(#comet-glow)" />
            <circle r={c.width * 0.9} fill="#ffffff" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export function ThemeOrnament({ theme }: { theme: ThemeId }) {
  if (theme !== "brass" && theme !== "nebula") return null;
  return (
    <div className="theme-art" aria-hidden>
      {theme === "brass" ? (
        <BrassArt />
      ) : (
        <>
          <NebulaArt />
          <NebulaComets />
        </>
      )}
    </div>
  );
}
