"use client";

import { useEffect, useRef } from "react";

// The pool illustration as a living 2.5D diorama. scripts/split_hero.py cuts the artwork
// into layers (background plate, water, octopus cutout, eye mask) in public/hero/:
// each layer drifts with the cursor by its depth, the water ripples, the octopus
// bobs and lazily watches the cursor, and scrolling dives the camera in.

const ART = { w: 1820, h: 1514 };
const DECK = { y0: 318, y1: 920 };
const WATER_Y = 800;
const OCTO = { x: 605, y: 126, w: 749, h: 1388 };
const EYES = { x: 794, y: 293, w: 345, h: 70 };
const PUPILS = [
  { x: 885, y: 322, r: 12 },
  { x: 1086, y: 316, r: 13 },
];
const FACE = { x: 980, y: 330 };
const SKIN = "#e55445";

const DEPTH = { far: 0.12, deck: 0.35, water: 0.6, octo: 1 };

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PoolScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !stage || !ctx) return;

    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    let onScreen = true;
    let disposed = false;
    let W = 1;
    let H = 1;
    let DPR = 1;

    // damped inputs
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    let lastX = 0;
    let lastY = 0;
    const look = { x: 0, y: 0 };
    let scroll = 0;
    let scrollT = 0;
    let nextBlink = performance.now() + 2500;
    let blinkStart = -1;

    const glints = Array.from({ length: 22 }, () => ({
      u: Math.random(),
      v: 0.08 + Math.random() * 0.9,
      ph: Math.random() * 10,
      len: 10 + Math.random() * 22,
    }));
    const birds = Array.from({ length: 2 }, (_, i) => ({
      x: Math.random(),
      y: 0.02 + i * 0.035,
      v: 0.006 + Math.random() * 0.004,
      ph: Math.random() * 6,
    }));

    const eyeCanvas = document.createElement("canvas");
    eyeCanvas.width = EYES.w;
    eyeCanvas.height = EYES.h;
    const ectx = eyeCanvas.getContext("2d")!;

    function resize() {
      const r = stage!.getBoundingClientRect();
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, Math.round(r.width * DPR));
      H = Math.max(1, Math.round(r.height * DPR));
      canvas!.width = W;
      canvas!.height = H;
    }

    // cover the stage, keep the whole head in frame and centre on the octopus
    // (m leaves room so parallax and sway never reveal an edge)
    function layout() {
      const m = 20 * DPR;
      const sc = Math.max((W + 2 * m) / ART.w, (H + 2 * m) / ART.h);
      const iw = ART.w * sc;
      const ih = ART.h * sc;
      const focus = W > H * 1.2 ? 0.6 : 0.5;
      const left = Math.min(-m, Math.max(W - iw + m, W * focus - FACE.x * sc));
      const clearance = 84 * DPR;
      const top = Math.max(H - ih + m, Math.min(-m, clearance - (OCTO.y - 20) * sc));
      return { sc, left, top };
    }

    Promise.all([
      load("/hero/plate.webp"),
      load("/hero/water.webp"),
      load("/hero/octo.webp"),
      load("/hero/eyes.png"),
    ])
      .then(([plate, water, octo, eyes]) => {
        if (disposed) return;
        resize();

        const frame = (ts: number) => {
          const t = ts / 1000;
          const L = layout();
          const k = motion ? 0.06 : 1;
          ptr.x += (ptr.tx - ptr.x) * k;
          ptr.y += (ptr.ty - ptr.y) * k;
          scroll += (scrollT - scroll) * (motion ? 0.12 : 1);

          const fx = L.left + FACE.x * L.sc;
          const fy = L.top + FACE.y * L.sc;

          const place = (sx: number, sy: number, sw: number, sh: number, depth: number, ox = 0, oy = 0) => {
            const z = 1 + (motion ? scroll : 0) * depth * 0.45;
            const dx = -ptr.x * depth * 10 * DPR + ox;
            const dy = -ptr.y * depth * 5 * DPR + oy;
            const x = L.left + sx * L.sc;
            const y = L.top + sy * L.sc;
            return {
              x: fx + (x - fx) * z + dx,
              y: fy + (y - fy) * z + dy,
              w: sw * L.sc * z,
              h: sh * L.sc * z,
            };
          };

          ctx.clearRect(0, 0, W, H);

          // far: sky, hills, fence
          let p = place(0, 0, ART.w, ART.h, DEPTH.far);
          ctx.drawImage(plate, p.x, p.y, p.w, p.h);

          // birds, drawn in the same ink as the art
          ctx.strokeStyle = "#1d1a17";
          ctx.lineWidth = 2.4 * DPR;
          ctx.lineCap = "round";
          for (const b of birds) {
            if (motion) b.x = (b.x + b.v / 60) % 1.2;
            const bp = place((b.x - 0.1) * ART.w, b.y * ART.h + 40, 0, 0, DEPTH.far);
            const flap = Math.sin(t * 5 + b.ph) * 5 * DPR;
            const s = 11 * DPR;
            ctx.beginPath();
            ctx.moveTo(bp.x - s, bp.y - flap);
            ctx.quadraticCurveTo(bp.x - s / 2, bp.y - s / 2, bp.x, bp.y);
            ctx.quadraticCurveTo(bp.x + s / 2, bp.y - s / 2, bp.x + s, bp.y - flap);
            ctx.stroke();
          }

          // deck
          p = place(0, DECK.y0, ART.w, DECK.y1 - DECK.y0, DEPTH.deck);
          ctx.drawImage(plate, 0, DECK.y0, ART.w, DECK.y1 - DECK.y0, p.x, p.y, p.w, p.h);

          // water, redrawn in thin strips that sway
          const rows = ART.h - WATER_Y;
          const strip = 3;
          for (let r = 0; r < rows; r += strip) {
            const f = r / rows;
            const sway = motion ? Math.sin(t * 1.3 + r * 0.045) * (1.5 + 6 * f) * DPR : 0;
            const q = place(0, WATER_Y + r, ART.w, strip, DEPTH.water, sway);
            ctx.drawImage(water, 0, r, ART.w, strip, q.x, q.y, q.w, q.h + 1);
          }

          // glints
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2.5 * DPR;
          for (const g of glints) {
            const a = motion ? Math.max(0, Math.sin(t * 1.4 + g.ph)) : 0.5;
            if (a < 0.05) continue;
            const q = place(g.u * ART.w, 900 + g.v * (ART.h - 900), 0, 0, DEPTH.water);
            ctx.globalAlpha = a * 0.8;
            ctx.beginPath();
            ctx.moveTo(q.x, q.y);
            ctx.lineTo(q.x + g.len * DPR * a, q.y);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // octopus, floating with the water
          const bob = motion ? Math.sin(t * 1.3 + 380 * 0.045) * 3.5 * DPR : 0;
          p = place(OCTO.x, OCTO.y, OCTO.w, OCTO.h, DEPTH.octo, 0, bob);
          ctx.drawImage(octo, p.x, p.y, p.w, p.h);

          // eyes: pupils follow the cursor, or wander when there is none
          let lx: number;
          let ly: number;
          if (ptr.active) {
            lx = Math.max(-1, Math.min(1, (lastX * DPR - fx) / (W * 0.35)));
            ly = Math.max(-1, Math.min(1, (lastY * DPR - fy) / (H * 0.4)));
          } else {
            lx = Math.sin(t * 0.35) * 0.8;
            ly = Math.sin(t * 0.21) * 0.3;
          }
          look.x += (lx - look.x) * (motion ? 0.08 : 1);
          look.y += (ly - look.y) * (motion ? 0.08 : 1);

          ectx.globalCompositeOperation = "source-over";
          ectx.clearRect(0, 0, EYES.w, EYES.h);
          ectx.fillStyle = "#0e0c0b";
          for (const pu of PUPILS) {
            ectx.beginPath();
            ectx.arc(pu.x - EYES.x + look.x * 18, pu.y - EYES.y + look.y * 6 + 2, pu.r, 0, Math.PI * 2);
            ectx.fill();
          }
          if (motion && ts > nextBlink && blinkStart < 0) blinkStart = ts;
          if (blinkStart >= 0) {
            const bt = (ts - blinkStart) / 180;
            if (bt >= 1) {
              blinkStart = -1;
              nextBlink = ts + 2500 + Math.random() * 4500;
            } else {
              const lid = (1 - Math.abs(bt * 2 - 1)) * EYES.h;
              ectx.fillStyle = SKIN;
              ectx.fillRect(0, 0, EYES.w, lid);
              ectx.fillStyle = "#0e0c0b";
              ectx.fillRect(0, lid - 3, EYES.w, 5);
            }
          }
          ectx.globalCompositeOperation = "destination-in";
          ectx.drawImage(eyes, 0, 0);
          const e = place(EYES.x, EYES.y, EYES.w, EYES.h, DEPTH.octo, 0, bob);
          ctx.drawImage(eyeCanvas, e.x, e.y, e.w, e.h);

          stage!.style.setProperty("--p", scroll.toFixed(4));
          canvas!.dataset.ready = "1";
        };

        const loop = (ts: number) => {
          if (running && onScreen) frame(ts);
          raf = requestAnimationFrame(loop);
        };
        frame(performance.now());
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        // leave the static poster in place
      });

    const onPointer = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      lastX = e.clientX - r.left;
      lastY = e.clientY - r.top;
      ptr.tx = (lastX / r.width - 0.5) * 2;
      ptr.ty = (lastY / r.height - 0.5) * 2;
      ptr.active = e.pointerType === "mouse";
    };
    const onLeave = () => {
      ptr.tx = 0;
      ptr.ty = 0;
      ptr.active = false;
    };
    const onScroll = () => {
      scrollT = Math.max(0, Math.min(1, window.scrollY / Math.max(1, stage.offsetHeight)));
    };
    const onVisibility = () => {
      running = document.visibilityState === "visible";
    };
    let rz = 0;
    const onResize = () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(resize);
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    io.observe(stage);

    window.addEventListener("pointermove", onPointer, { passive: true });
    stage.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      stage.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
