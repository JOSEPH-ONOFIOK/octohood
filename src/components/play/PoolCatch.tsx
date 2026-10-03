"use client";

import { useEffect, useRef, useState } from "react";
import { ITEMS_TO_CATCH, JUNK_PENALTY_MS, formatTime } from "@/lib/allowlist";
import { ITEMS, ITEM_ORDER, RARITIES } from "@/lib/items";
import { ItemArt } from "./ItemArt";
import { usePlay } from "./PlayProvider";

// Pool Catch: the eight items sink one at a time, each faster and wobblier than the last. Steer
// the octopus under them; grabbing junk (anchors, boots) adds JUNK_PENALTY_MS to the clock, and a
// missed item floats back to the top. The clock is wall time from the first dive.

type Junk = { kind: "anchor" | "boot"; x: number; y: number; vy: number; a: number; spin: number };
type Pop = { x: number; y: number; text: string; color: string; t: number };

const INK = "#17130f";
const SKIN = "#e8503f";
const JUNK_R = 15;
const ITEM_R = 22;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function PoolCatch() {
  const { run, start, catchItem, hitJunk } = usePlay();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  // The loop reads the latest run and actions through refs, so it never restarts mid-game.
  const live = useRef({ run, active, catchItem, hitJunk });
  useEffect(() => {
    live.current = { run, active, catchItem, hitJunk };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let W = 1;
    let H = 1;
    let raf = 0;
    let last = performance.now();
    let onScreen = true;

    // Item art as images, drawn from the same SVGs the inventory uses.
    const art = new Map<string, HTMLImageElement>();
    artRef.current?.querySelectorAll<SVGSVGElement>("svg[data-item]").forEach((svg) => {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", "128");
      clone.setAttribute("height", "128");
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      art.set(svg.dataset.item!, img);
    });

    const g = {
      x: 0,
      tx: 0,
      item: null as null | { k: number; x: number; y: number; vy: number; seed: number; t: number },
      wait: 0.4,
      junk: [] as Junk[],
      junkIn: 1.2,
      pops: [] as Pop[],
      hurt: 0,
    };
    const keys = new Set<string>();
    const bubbles = Array.from({ length: 16 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 3.5,
      v: 0.03 + Math.random() * 0.05,
    }));

    const R = () => clamp(W * 0.06, 24, 36);
    const headY = () => H - R() * 1.45 - 10;
    const scale = () => H / 520;

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

    function dropItem(k: number) {
      g.item = {
        k,
        x: 40 + Math.random() * (W - 80),
        y: -ITEM_R - 10,
        // each item sinks faster than the last; the pearl is properly quick
        vy: (95 + k * 30) * scale(),
        seed: Math.random() * 10,
        t: 0,
      };
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
      g.pops = g.pops.filter((p) => (p.t += dt) < 1);
      g.x += (g.tx - g.x) * Math.min(1, dt * 14);

      const { run, active } = live.current;
      const playing = active && run.startedAt != null && run.timeMs == null;
      if (!playing) return;

      const r = R();
      const dir = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      if (dir) g.tx += dir * W * 0.9 * dt;
      g.tx = clamp(g.tx, r, W - r);
      const hy = headY();

      // the current item
      if (!g.item) {
        g.wait -= dt;
        if (g.wait <= 0) dropItem(run.caught);
      } else {
        const it = g.item;
        it.t += dt;
        it.y += it.vy * dt;
        // later items wobble side to side as they sink
        it.x = clamp(it.x + Math.sin(it.t * (1.5 + it.k * 0.25) + it.seed) * it.k * 14 * dt * 3, ITEM_R, W - ITEM_R);
        if (Math.hypot(it.x - g.x, it.y - hy) < r * 0.95 + ITEM_R * 0.8) {
          const name = ITEMS[ITEM_ORDER[it.k]].name;
          g.pops.push({ x: it.x, y: it.y, text: name, color: RARITIES[ITEMS[ITEM_ORDER[it.k]].rarity].color, t: 0 });
          g.item = null;
          g.wait = 0.45;
          live.current.catchItem();
        } else if (it.y > H + ITEM_R + 10) {
          g.pops.push({ x: it.x, y: H - 30, text: "missed, it's back up top", color: "#fbf6ee", t: 0 });
          dropItem(it.k);
        }
      }

      // junk: more of it, and faster, the further along you are
      g.junkIn -= dt;
      if (g.junkIn <= 0) {
        g.junkIn = Math.max(0.45, 1.5 - run.caught * 0.13) * (0.7 + Math.random() * 0.6);
        g.junk.push({
          kind: Math.random() < 0.5 ? "anchor" : "boot",
          x: 20 + Math.random() * (W - 40),
          y: -24,
          vy: (140 + run.caught * 14 + Math.random() * 60) * scale(),
          a: 0,
          spin: (Math.random() - 0.5) * 3,
        });
      }
      g.junk = g.junk.filter((j) => {
        j.y += j.vy * dt;
        j.a += j.spin * dt;
        if (Math.hypot(j.x - g.x, j.y - hy) < r * 0.9 + JUNK_R) {
          g.hurt = 0.5;
          g.pops.push({ x: j.x, y: j.y, text: `+${JUNK_PENALTY_MS / 1000}s`, color: "#ff8a7a", t: 0 });
          live.current.hitJunk();
          return false;
        }
        return j.y < H + 30;
      });
    }

    function drawJunk(j: Junk) {
      const r = JUNK_R;
      ctx!.save();
      ctx!.translate(j.x, j.y);
      ctx!.rotate(j.a);
      ctx!.strokeStyle = INK;
      ctx!.lineWidth = 2.5;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      if (j.kind === "anchor") {
        ctx!.strokeStyle = "#1c2535";
        ctx!.lineWidth = 4;
        ctx!.arc(0, -r * 0.72, r * 0.24, 0, Math.PI * 2);
        ctx!.moveTo(0, -r * 0.48);
        ctx!.lineTo(0, r * 0.85);
        ctx!.moveTo(-r * 0.5, -r * 0.25);
        ctx!.lineTo(r * 0.5, -r * 0.25);
        ctx!.moveTo(-r * 0.8, r * 0.2);
        ctx!.quadraticCurveTo(-r * 0.6, r * 0.95, 0, r * 0.85);
        ctx!.quadraticCurveTo(r * 0.6, r * 0.95, r * 0.8, r * 0.2);
        ctx!.stroke();
      } else {
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
      }
      ctx!.restore();
    }

    function drawItem(now: number) {
      const it = g.item;
      if (!it) return;
      const id = ITEM_ORDER[it.k];
      const color = RARITIES[ITEMS[id].rarity].color;
      ctx!.save();
      ctx!.translate(it.x, it.y);
      // a glow so the item reads against the water and junk
      const glow = ctx!.createRadialGradient(0, 0, 4, 0, 0, ITEM_R * 1.7);
      glow.addColorStop(0, `${color}aa`);
      glow.addColorStop(1, `${color}00`);
      ctx!.fillStyle = glow;
      ctx!.beginPath();
      ctx!.arc(0, 0, ITEM_R * 1.7, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.rotate(Math.sin(now * 0.004 + it.seed) * 0.25);
      const img = art.get(id);
      if (img?.complete) ctx!.drawImage(img, -ITEM_R, -ITEM_R, ITEM_R * 2, ITEM_R * 2);
      ctx!.restore();
    }

    function drawOcto(now: number) {
      const r = R();
      const target = g.item;
      const look = target ? clamp((target.x - g.x) / 60, -1, 1) * r * 0.1 : 0;
      const skin = g.hurt > 0 && Math.floor(g.hurt * 16) % 2 === 0 ? "#f6a193" : SKIN;

      ctx!.save();
      ctx!.translate(g.x, headY() + Math.sin(now * 0.003) * 2);
      ctx!.rotate(clamp(((g.tx - g.x) / W) * 1.5, -0.25, 0.25));
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      for (const pass of [0, 1]) {
        ctx!.strokeStyle = pass ? skin : INK;
        ctx!.lineWidth = r * 0.26 + (pass ? 0 : 5);
        for (let i = 0; i < 6; i++) {
          const bx = (-0.62 + i * 0.25) * r;
          const sway = Math.sin(now * 0.006 + i * 1.3) * r * 0.18;
          ctx!.beginPath();
          ctx!.moveTo(bx, r * 0.4);
          ctx!.quadraticCurveTo(bx + sway, r * 0.95, bx * 1.2 - sway * 0.5, r * 1.35);
          ctx!.stroke();
        }
      }
      ctx!.fillStyle = skin;
      ctx!.strokeStyle = INK;
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.ellipse(0, 0, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.stroke();
      for (const ex of [-0.4 * r, 0.4 * r]) {
        ctx!.fillStyle = "#fff7f0";
        ctx!.lineWidth = 2.5;
        ctx!.beginPath();
        ctx!.ellipse(ex, -0.05 * r, 0.3 * r, 0.24 * r, 0, 0, Math.PI);
        ctx!.closePath();
        ctx!.fill();
        ctx!.stroke();
        ctx!.fillStyle = INK;
        ctx!.beginPath();
        ctx!.arc(ex + look, 0.06 * r, 0.09 * r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.lineWidth = 4;
        ctx!.beginPath();
        ctx!.moveTo(ex - 0.36 * r, -0.05 * r);
        ctx!.lineTo(ex + 0.36 * r, -0.05 * r);
        ctx!.stroke();
      }
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      ctx!.moveTo(-0.12 * r, 0.45 * r);
      ctx!.quadraticCurveTo(0, 0.38 * r, 0.12 * r, 0.45 * r);
      ctx!.stroke();
      ctx!.restore();
    }

    function draw(now: number) {
      const water = ctx!.createLinearGradient(0, 0, 0, H);
      water.addColorStop(0, "#93d5ec");
      water.addColorStop(1, "#2f93b8");
      ctx!.fillStyle = water;
      ctx!.fillRect(0, 0, W, H);

      ctx!.strokeStyle = "rgba(255,255,255,0.2)";
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

      g.junk.forEach(drawJunk);
      drawItem(now);
      drawOcto(now);

      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.font = `600 15px ${getComputedStyle(document.body).fontFamily}`;
      for (const p of g.pops) {
        ctx!.globalAlpha = 1 - p.t;
        ctx!.lineWidth = 4;
        ctx!.strokeStyle = INK;
        ctx!.strokeText(p.text, p.x, p.y - p.t * 46);
        ctx!.fillStyle = p.color;
        ctx!.fillText(p.text, p.x, p.y - p.t * 46);
      }
      ctx!.globalAlpha = 1;
      if (g.hurt > 0) {
        ctx!.fillStyle = `rgba(232,80,63,${g.hurt * 0.35})`;
        ctx!.fillRect(0, 0, W, H);
      }

      // the running clock lives in the card header, written straight to the DOM
      const { run } = live.current;
      if (clockRef.current) {
        const ms = run.startedAt ? Date.now() - run.startedAt + run.penaltyMs : 0;
        clockRef.current.textContent = formatTime(run.timeMs ?? ms);
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
      if (!live.current.active || !["arrowleft", "arrowright", "a", "d"].includes(k)) return;
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

  const resuming = !active && run.startedAt != null;
  const next = run.caught < ITEMS_TO_CATCH ? ITEMS[ITEM_ORDER[run.caught]] : null;

  function dive() {
    start();
    setActive(true);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink/50 uppercase">step 1 · pool catch</p>
          <h2 className="mt-1 font-display text-3xl leading-none sm:text-4xl">Fill all eight arms</h2>
        </div>
        <div className="text-right">
          <span ref={clockRef} className="block font-display text-3xl leading-none tabular-nums sm:text-4xl">
            0.0s
          </span>
          <span className="text-xs text-ink/50">
            {run.penaltyMs ? `incl. +${formatTime(run.penaltyMs)} junk` : "your time"}
          </span>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-8 gap-1.5 sm:gap-2" aria-label={`${run.caught} of ${ITEMS_TO_CATCH} items caught`}>
        {ITEM_ORDER.map((id, i) => {
          const got = i < run.caught;
          const color = RARITIES[ITEMS[id].rarity].color;
          return (
            <li
              key={id}
              title={ITEMS[id].name}
              className={`relative grid aspect-square place-items-center rounded-xl border-2 transition-all duration-300 ${
                got ? "bg-white" : i === run.caught && active ? "animate-pulse border-dashed bg-white/40" : "border-dashed bg-white/30"
              }`}
              style={{ borderColor: got ? color : "rgb(23 19 15 / 0.15)" }}
            >
              <ItemArt id={id} className={`w-3/4 transition duration-300 ${got ? "scale-100" : "scale-90 opacity-15 grayscale"}`} />
            </li>
          );
        })}
      </ol>

      <div className="relative mt-3 overflow-hidden rounded-3xl border-[3px] border-ink bg-pool">
        <canvas
          ref={canvasRef}
          className="block aspect-[4/5] w-full select-none sm:aspect-[16/11]"
          style={{ touchAction: active ? "none" : "auto" }}
          aria-label="Pool Catch. Move the octopus with the mouse, touch, or the arrow keys."
        />
        {!active && (
          <div className="absolute inset-0 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]">
            <div className="glass w-full max-w-sm rounded-3xl p-6 text-center">
              {resuming ? (
                <>
                  <h3 className="font-display text-3xl leading-none">Your run is still going</h3>
                  <p className="mt-2 text-[15px] leading-snug text-ink/70">
                    {run.caught}/{ITEMS_TO_CATCH} caught, and the clock kept running while you were away.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-display text-3xl leading-none">Catch the eight items</h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-left text-[15px] leading-snug text-ink/75 marker:text-coral">
                    <li>They sink one at a time, each faster than the last.</li>
                    <li>Grab junk and it costs you {JUNK_PENALTY_MS / 1000}s.</li>
                    <li>The clock starts when you dive. Fastest times top the board.</li>
                  </ul>
                </>
              )}
              <button type="button" onClick={dive} className="btn btn-play mt-5 w-full">
                {resuming ? "Jump back in" : "Dive in"}
              </button>
              <p className="mt-2 text-xs text-ink/50">Mouse, touch, or ← → to move</p>
            </div>
          </div>
        )}
        {active && next && (
          <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-cream">
            Next: {next.name}
          </p>
        )}
      </div>

      {/* source SVGs for the canvas, so items look the same in the pool and the inventory */}
      <div ref={artRef} hidden>
        {ITEM_ORDER.map((id) => (
          <ItemArt key={id} id={id} data-item={id} />
        ))}
      </div>
    </div>
  );
}
