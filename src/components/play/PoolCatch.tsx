"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_DAILY_CAP } from "@/lib/play/config";
import { finishRound } from "@/lib/play/store";

// Pool Catch: steer the octopus along the bottom of the pool, catch what sinks, dodge the junk.
// Drops speed up and junk gets more common the longer you last. Three hits ends the round.

type Kind = "pearl" | "shell" | "gold" | "anchor" | "boot";
type Drop = { kind: Kind; x: number; y: number; vy: number; spin: number; a: number };
type Pop = { x: number; y: number; text: string; color: string; t: number };
type Phase = "ready" | "playing" | "over";

const DROPS: Record<Kind, { value: number; r: number; hazard?: boolean }> = {
  pearl: { value: 10, r: 10 },
  shell: { value: 5, r: 13 },
  gold: { value: 50, r: 12 },
  anchor: { value: 0, r: 16, hazard: true },
  boot: { value: 0, r: 14, hazard: true },
};
const LIVES = 3;
const INK = "#17130f";
const SKIN = "#e8503f";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function PoolCatch({ allowance, best }: { allowance: number; best: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<{ score: number; credit: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const font = getComputedStyle(document.body).getPropertyValue("--font-lilita").trim() || "sans-serif";
    let W = 1;
    let H = 1;
    let raf = 0;
    let last = performance.now();
    let onScreen = true;

    const g = {
      playing: false,
      x: 0,
      tx: 0,
      score: 0,
      lives: LIVES,
      t: 0,
      spawn: 0,
      hurt: 0,
      drops: [] as Drop[],
      pops: [] as Pop[],
    };
    const keys = new Set<string>();
    const bubbles = Array.from({ length: 18 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 3.5,
      v: 0.03 + Math.random() * 0.05,
    }));

    const radius = () => clamp(W * 0.06, 24, 36);
    const headY = () => H - radius() * 1.45 - 10;

    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.x = W > 1 ? (g.x / W) * w : w / 2;
      g.tx = W > 1 ? (g.tx / W) * w : w / 2;
      W = w;
      H = h;
      if (!raf) draw(performance.now());
    }

    startRef.current = () => {
      Object.assign(g, { playing: true, score: 0, lives: LIVES, t: 0, spawn: 0.6, hurt: 0, drops: [], pops: [] });
      g.tx = g.x = W / 2;
      setResult(null);
      setPhase("playing");
    };

    function end() {
      g.playing = false;
      g.drops = [];
      keys.clear();
      const credit = finishRound(g.score);
      setResult({ score: g.score, credit });
      setPhase("over");
    }

    function spawn() {
      const hazard = Math.min(0.12 + g.t * 0.005, 0.38);
      const r = Math.random();
      const kind: Kind =
        r < hazard ? (Math.random() < 0.5 ? "anchor" : "boot") : r < hazard + 0.04 ? "gold" : r < hazard + 0.34 ? "shell" : "pearl";
      const speed = (150 + g.t * 4 + Math.random() * 60) * (H / 520) * (kind === "gold" ? 1.25 : 1);
      g.drops.push({ kind, x: 20 + Math.random() * (W - 40), y: -24, vy: speed, spin: (Math.random() - 0.5) * 3, a: 0 });
    }

    function update(dt: number) {
      for (const b of bubbles) {
        b.y -= b.v * dt;
        if (b.y < -0.05) {
          b.y = 1.05;
          b.x = Math.random();
        }
      }
      g.hurt = Math.max(0, g.hurt - dt);
      g.pops = g.pops.filter((p) => (p.t += dt) < 0.9);
      g.x += (g.tx - g.x) * Math.min(1, dt * 14);
      if (!g.playing) return;

      const R = radius();
      const dir = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      if (dir) g.tx += dir * W * 0.9 * dt;
      g.tx = clamp(g.tx, R, W - R);

      g.t += dt;
      g.spawn -= dt;
      if (g.spawn <= 0) {
        spawn();
        g.spawn = Math.max(0.32, 0.95 - g.t * 0.012) * (0.7 + Math.random() * 0.6);
      }

      const hy = headY();
      const kept: Drop[] = [];
      for (const d of g.drops) {
        d.y += d.vy * dt;
        d.a += d.spin * dt;
        const spec = DROPS[d.kind];
        if (Math.hypot(d.x - g.x, d.y - hy) < R * 0.95 + spec.r) {
          if (spec.hazard) {
            g.lives -= 1;
            g.hurt = 0.5;
            g.pops.push({ x: d.x, y: d.y, text: "ouch", color: "#c63a2b", t: 0 });
          } else {
            g.score += spec.value;
            g.pops.push({ x: d.x, y: d.y, text: `+${spec.value}`, color: d.kind === "gold" ? "#f2b632" : "#fbf6ee", t: 0 });
          }
        } else if (d.y < H + 30) kept.push(d);
      }
      g.drops = kept;
      if (g.lives <= 0) end();
    }

    function drawDrop(d: Drop) {
      const r = DROPS[d.kind].r;
      ctx!.save();
      ctx!.translate(d.x, d.y);
      ctx!.rotate(d.a);
      ctx!.strokeStyle = INK;
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      switch (d.kind) {
        case "pearl":
        case "gold": {
          const gr = ctx!.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
          gr.addColorStop(0, d.kind === "gold" ? "#fff4c2" : "#ffffff");
          gr.addColorStop(1, d.kind === "gold" ? "#f2b632" : "#e4dcef");
          ctx!.fillStyle = gr;
          ctx!.arc(0, 0, r, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.stroke();
          if (d.kind === "gold") {
            ctx!.strokeStyle = "#fff4c2";
            ctx!.lineWidth = 2;
            ctx!.beginPath();
            for (let i = 0; i < 4; i++) {
              const a = (i * Math.PI) / 2;
              ctx!.moveTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
              ctx!.lineTo(Math.cos(a) * (r + 9), Math.sin(a) * (r + 9));
            }
            ctx!.stroke();
          }
          break;
        }
        case "shell":
          ctx!.fillStyle = "#eab676";
          ctx!.moveTo(0, r);
          ctx!.lineTo(-r, -r * 0.2);
          ctx!.bezierCurveTo(-r, -r * 1.3, r, -r * 1.3, r, -r * 0.2);
          ctx!.closePath();
          ctx!.fill();
          ctx!.stroke();
          ctx!.beginPath();
          for (const k of [-0.5, 0, 0.5]) {
            ctx!.moveTo(0, r);
            ctx!.lineTo(k * r, -r * 0.75);
          }
          ctx!.stroke();
          break;
        case "anchor":
          ctx!.strokeStyle = "#1c2535";
          ctx!.lineWidth = 4;
          ctx!.lineCap = "round";
          ctx!.arc(0, -r * 0.72, r * 0.24, 0, Math.PI * 2);
          ctx!.moveTo(0, -r * 0.48);
          ctx!.lineTo(0, r * 0.85);
          ctx!.moveTo(-r * 0.5, -r * 0.25);
          ctx!.lineTo(r * 0.5, -r * 0.25);
          ctx!.moveTo(-r * 0.8, r * 0.2);
          ctx!.quadraticCurveTo(-r * 0.6, r * 0.95, 0, r * 0.85);
          ctx!.quadraticCurveTo(r * 0.6, r * 0.95, r * 0.8, r * 0.2);
          ctx!.stroke();
          break;
        case "boot":
          ctx!.fillStyle = "#3f5a48";
          ctx!.moveTo(-r * 0.55, -r);
          ctx!.lineTo(r * 0.15, -r);
          ctx!.lineTo(r * 0.15, r * 0.15);
          ctx!.lineTo(r * 0.85, r * 0.35);
          ctx!.quadraticCurveTo(r * 1.1, r, r * 0.6, r);
          ctx!.lineTo(-r * 0.55, r);
          ctx!.closePath();
          ctx!.fill();
          ctx!.stroke();
          break;
      }
      ctx!.restore();
    }

    function drawOcto(now: number) {
      const R = radius();
      const target = g.drops.reduce<Drop | null>(
        (best, d) => (!DROPS[d.kind].hazard && (!best || d.y > best.y) ? d : best),
        null,
      );
      const look = target ? clamp((target.x - g.x) / 60, -1, 1) * R * 0.1 : 0;
      const flash = g.hurt > 0 && Math.floor(g.hurt * 16) % 2 === 0;
      const skin = flash ? "#f6a193" : SKIN;

      ctx!.save();
      ctx!.translate(g.x, headY() + Math.sin(now * 0.003) * 2);
      ctx!.rotate(clamp(((g.tx - g.x) / W) * 1.5, -0.25, 0.25));
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";

      // arms: an ink stroke with a thinner skin stroke on top reads as an outlined tube
      for (const pass of [0, 1]) {
        ctx!.strokeStyle = pass ? skin : INK;
        ctx!.lineWidth = R * 0.26 + (pass ? 0 : 5);
        for (let i = 0; i < 6; i++) {
          const bx = (-0.62 + i * 0.25) * R;
          const sway = Math.sin(now * 0.006 + i * 1.3) * R * 0.18;
          ctx!.beginPath();
          ctx!.moveTo(bx, R * 0.4);
          ctx!.quadraticCurveTo(bx + sway, R * 0.95, bx * 1.2 - sway * 0.5, R * 1.35);
          ctx!.stroke();
        }
      }

      ctx!.fillStyle = skin;
      ctx!.strokeStyle = INK;
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.ellipse(0, 0, R * 1.05, R * 0.95, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.stroke();

      ctx!.strokeStyle = "rgba(198,58,43,0.55)";
      ctx!.lineWidth = R * 0.16;
      ctx!.beginPath();
      ctx!.arc(0, R * 0.1, R * 0.72, Math.PI * 1.15, Math.PI * 1.55);
      ctx!.stroke();

      // half-lidded eyes, as unbothered as ever
      for (const ex of [-0.4 * R, 0.4 * R]) {
        ctx!.fillStyle = "#fff7f0";
        ctx!.strokeStyle = INK;
        ctx!.lineWidth = 2.5;
        ctx!.beginPath();
        ctx!.ellipse(ex, -0.05 * R, 0.3 * R, 0.24 * R, 0, 0, Math.PI);
        ctx!.closePath();
        ctx!.fill();
        ctx!.stroke();
        ctx!.fillStyle = INK;
        ctx!.beginPath();
        ctx!.arc(ex + look, 0.06 * R, 0.09 * R, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.lineWidth = 4;
        ctx!.beginPath();
        ctx!.moveTo(ex - 0.36 * R, -0.05 * R);
        ctx!.lineTo(ex + 0.36 * R, -0.05 * R);
        ctx!.stroke();
      }
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      ctx!.moveTo(-0.12 * R, 0.45 * R);
      ctx!.quadraticCurveTo(0, 0.38 * R, 0.12 * R, 0.45 * R);
      ctx!.stroke();
      ctx!.restore();
    }

    function drawHud() {
      ctx!.fillStyle = INK;
      ctx!.font = `26px ${font}`;
      ctx!.textAlign = "left";
      ctx!.textBaseline = "top";
      ctx!.fillText(String(g.score), 16, 14);
      for (let i = 0; i < LIVES; i++) {
        const x = W - 22 - i * 26;
        ctx!.beginPath();
        ctx!.moveTo(x, 34);
        ctx!.bezierCurveTo(x - 12, 26, x - 10, 14, x, 20);
        ctx!.bezierCurveTo(x + 10, 14, x + 12, 26, x, 34);
        ctx!.fillStyle = i < g.lives ? SKIN : "rgba(23,19,15,0.12)";
        ctx!.fill();
        ctx!.strokeStyle = INK;
        ctx!.lineWidth = 2;
        ctx!.stroke();
      }
    }

    function draw(now: number) {
      const water = ctx!.createLinearGradient(0, 0, 0, H);
      water.addColorStop(0, "#93d5ec");
      water.addColorStop(1, "#2f93b8");
      ctx!.fillStyle = water;
      ctx!.fillRect(0, 0, W, H);

      ctx!.strokeStyle = "rgba(255,255,255,0.22)";
      ctx!.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const y0 = ((i + 0.5) * H) / 7;
        ctx!.beginPath();
        for (let x = 0; x <= W + 16; x += 16) {
          const y = y0 + Math.sin(x * 0.02 + now * 0.0012 + i * 1.7) * 6 + Math.sin(x * 0.007 - now * 0.0007 + i) * 8;
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      ctx!.fillStyle = "rgba(255,255,255,0.35)";
      for (const b of bubbles) {
        ctx!.beginPath();
        ctx!.arc(b.x * W + Math.sin(now * 0.002 + b.r * 3) * 4, b.y * H, b.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      g.drops.forEach(drawDrop);
      drawOcto(now);

      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.font = `22px ${font}`;
      for (const p of g.pops) {
        ctx!.globalAlpha = 1 - p.t / 0.9;
        ctx!.lineWidth = 4;
        ctx!.strokeStyle = INK;
        ctx!.strokeText(p.text, p.x, p.y - p.t * 50);
        ctx!.fillStyle = p.color;
        ctx!.fillText(p.text, p.x, p.y - p.t * 50);
      }
      ctx!.globalAlpha = 1;

      if (g.playing) drawHud();
      if (g.hurt > 0) {
        ctx!.fillStyle = `rgba(232,80,63,${g.hurt * 0.35})`;
        ctx!.fillRect(0, 0, W, H);
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      draw(now);
      raf = onScreen ? requestAnimationFrame(loop) : 0;
    };

    const onPointer = (e: PointerEvent) => {
      g.tx = e.clientX - canvas.getBoundingClientRect().left;
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!g.playing || !["arrowleft", "arrowright", "a", "d"].includes(k)) return;
      e.preventDefault();
      if (e.type === "keydown") keys.add(k);
      else keys.delete(k);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  const capped = allowance <= 0;

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border-[3px] border-ink bg-pool">
        <canvas
          ref={canvasRef}
          className="block aspect-[4/5] w-full select-none sm:aspect-[16/11]"
          style={{ touchAction: phase === "playing" ? "none" : "auto" }}
          aria-label="Pool Catch game"
        />
        {phase !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-ink/15 p-4">
            <div className="glass w-full max-w-xs rounded-3xl p-6 text-center">
              {phase === "ready" || !result ? (
                <>
                  <h3 className="font-display text-4xl leading-none">Pool Catch</h3>
                  <p className="mt-2 text-[15px] leading-snug text-ink/70">
                    Catch what sinks. Dodge anchors and old boots. Three hits and you&apos;re out.
                  </p>
                  <ul className="mt-4 flex justify-center gap-4 text-sm">
                    <Legend color="#ffffff" label="10" />
                    <Legend color="#eab676" label="5" />
                    <Legend color="#f2b632" label="50" />
                  </ul>
                </>
              ) : (
                <>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-ink/55 uppercase">round over</p>
                  <h3 className="font-display text-6xl leading-none">{result.score}</h3>
                  <p className="mt-2 text-[15px] leading-snug text-ink/70">
                    {result.credit > 0 ? (
                      <>
                        <span className="font-semibold text-coral-deep">+{result.credit} pts</span> added
                        {result.credit < result.score && ", and that's today's game cap"}.
                      </>
                    ) : result.score > 0 ? (
                      "Today's game cap is used up. Tasks still pay."
                    ) : (
                      "Not a single pearl. Very on brand."
                    )}
                  </p>
                </>
              )}
              <button type="button" onClick={() => startRef.current()} className="btn btn-ink mt-5 w-full">
                {phase === "ready" ? "Dive in" : "Play again"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 px-1 text-sm text-ink/55">
        <span>Mouse, touch, or ← → to move</span>
        <span>
          {capped ? "Game points maxed for today" : `${allowance.toLocaleString("en-US")} / ${GAME_DAILY_CAP.toLocaleString("en-US")} game pts left today`}
          {best > 0 && ` · best ${best}`}
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5 font-semibold">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-ink" style={{ backgroundColor: color }} />
      {label}
    </li>
  );
}
