import { useEffect, useRef } from "react";
import { BOARD_ROWS, SLOT_POINTS } from "@/lib/arcade/plinko";

/**
 * The peg board.
 *
 * The outcome is never computed here. The server has already derived the path
 * and the landing slot; this canvas only animates the ball along that exact
 * sequence of left/right decisions. Drawing the physics locally and hoping it
 * agreed with the server would put the display and the score out of step, and
 * would make the provable-fairness record meaningless.
 */

export type BallRun = { id: string; path: string; slot: number; points: number };

const PEG_RADIUS = 3.2;
const BALL_RADIUS = 6.5;
const STEP_MS = 78;

type Ball = { run: BallRun; startedAt: number };

function slotHue(slot: number): string {
  // Distance from centre drives the colour: the rare, high-paying outer slots
  // read hot, the common centre reads cool.
  const distance = Math.abs(slot - BOARD_ROWS / 2) / (BOARD_ROWS / 2);
  if (distance > 0.85) return "#f97316";
  if (distance > 0.6) return "#f59e0b";
  if (distance > 0.35) return "#38bdf8";
  return "#334155";
}

export function DropBoard({
  runs,
  onLanded,
}: {
  runs: BallRun[];
  onLanded?: (run: BallRun) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const landedRef = useRef(new Set<string>());
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  // Feed new runs into the animation pool without restarting the loop.
  useEffect(() => {
    for (const run of runs) {
      if (ballsRef.current.some((b) => b.run.id === run.id)) continue;
      if (landedRef.current.has(run.id)) continue;
      ballsRef.current.push({ run, startedAt: performance.now() });
    }
  }, [runs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;

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

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (width === 0 || height === 0) return;

      const slotBandHeight = 26;
      const topPad = 14;
      const usableHeight = height - slotBandHeight - topPad - 8;
      const rowSpacing = usableHeight / BOARD_ROWS;
      const pegSpacing = Math.min(width / (BOARD_ROWS + 2), rowSpacing * 1.25);
      const centreX = width / 2;

      ctx.clearRect(0, 0, width, height);

      // Pegs. Row r carries r+1 pegs, centred.
      ctx.fillStyle = "#475569";
      for (let row = 1; row <= BOARD_ROWS; row += 1) {
        for (let peg = 0; peg <= row; peg += 1) {
          const x = centreX + (peg - row / 2) * pegSpacing;
          const y = topPad + row * rowSpacing;
          ctx.beginPath();
          ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Landing slots.
      const slotWidth = pegSpacing;
      const slotY = topPad + BOARD_ROWS * rowSpacing + 8;
      for (let slot = 0; slot <= BOARD_ROWS; slot += 1) {
        const x = centreX + (slot - BOARD_ROWS / 2) * slotWidth;
        ctx.fillStyle = slotHue(slot);
        ctx.globalAlpha = 0.9;
        const w = slotWidth - 2;
        ctx.beginPath();
        ctx.roundRect(x - w / 2, slotY, w, slotBandHeight - 6, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Only label the wider slots; at phone width the centre ones collide.
        if (slotWidth > 22) {
          ctx.fillStyle = "#0b1120";
          ctx.font = "600 9px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(SLOT_POINTS[slot] ?? 0), x, slotY + (slotBandHeight - 6) / 2);
        }
      }

      // Balls.
      const remaining: Ball[] = [];
      for (const ball of ballsRef.current) {
        const elapsed = now - ball.startedAt;
        const step = elapsed / STEP_MS;

        if (step >= BOARD_ROWS) {
          if (!landedRef.current.has(ball.run.id)) {
            landedRef.current.add(ball.run.id);
            onLandedRef.current?.(ball.run);
          }
          // Hold the ball in its slot briefly so the landing is readable.
          if (elapsed < BOARD_ROWS * STEP_MS + 450) {
            remaining.push(ball);
            const x = centreX + (ball.run.slot - BOARD_ROWS / 2) * slotWidth;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(x, slotY + 6, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
          }
          continue;
        }

        remaining.push(ball);
        const whole = Math.floor(step);
        const t = step - whole;
        const rightsBefore = countRights(ball.run.path, whole);
        const goesRight = ball.run.path[whole] === "1";
        const rightsAfter = rightsBefore + (goesRight ? 1 : 0);

        const xFrom = centreX + (2 * rightsBefore - whole) * (pegSpacing / 2);
        const xTo = centreX + (2 * rightsAfter - (whole + 1)) * (pegSpacing / 2);
        const yFrom = topPad + whole * rowSpacing;
        const yTo = topPad + (whole + 1) * rowSpacing;

        const x = xFrom + (xTo - xFrom) * t;
        // Gravity-ish easing plus a small hop off each peg.
        const y = yFrom + (yTo - yFrom) * (t * t) - Math.sin(t * Math.PI) * rowSpacing * 0.18;

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      ballsRef.current = remaining;
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
      className="h-[360px] w-full touch-none sm:h-[440px]"
      aria-label="Drop board"
    />
  );
}

function countRights(path: string, upTo: number): number {
  let rights = 0;
  for (let i = 0; i < upTo && i < path.length; i += 1) {
    if (path[i] === "1") rights += 1;
  }
  return rights;
}
