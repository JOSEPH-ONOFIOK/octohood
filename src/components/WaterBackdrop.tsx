"use client";

import { useEffect, useRef } from "react";

// Looking up from the bottom of the pool: light rays swaying down from the surface, a
// shimmering caustic net, bubbles drifting up. Tap or click the section to make a ripple.

export function WaterBackdrop({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 1;
    let H = 1;
    let raf = 0;
    let onScreen = false;
    let last = performance.now();

    const bubbles = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 2 + Math.random() * 6,
      v: 0.02 + Math.random() * 0.05,
      seed: Math.random() * 10,
    }));
    const rays = Array.from({ length: 5 }, (_, i) => ({ x: 0.1 + i * 0.2 + Math.random() * 0.08, w: 0.05 + Math.random() * 0.07, seed: Math.random() * 10 }));
    const ripples: { x: number; y: number; t: number }[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!raf) draw(performance.now());
    }

    function draw(now: number) {
      const t = now / 1000;
      const water = ctx!.createLinearGradient(0, 0, 0, H);
      water.addColorStop(0, "#dff4fb");
      water.addColorStop(0.55, "#b5e4f4");
      water.addColorStop(1, "#8fd0e8");
      ctx!.fillStyle = water;
      ctx!.fillRect(0, 0, W, H);

      // light rays from the surface
      for (const r of rays) {
        const sway = Math.sin(t * 0.4 + r.seed) * W * 0.04;
        const x = r.x * W + sway;
        const w = r.w * W;
        const g = ctx!.createLinearGradient(0, 0, 0, H * 0.9);
        g.addColorStop(0, "rgba(255,255,255,0.45)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(x - w * 0.3, 0);
        ctx!.lineTo(x + w * 0.3, 0);
        ctx!.lineTo(x + w + sway * 2, H * 0.9);
        ctx!.lineTo(x - w * 0.2 + sway * 2, H * 0.9);
        ctx!.closePath();
        ctx!.fill();
      }

      // caustic net: two families of wobbly lines crossing each other
      ctx!.lineWidth = 2;
      ctx!.lineCap = "round";
      for (let fam = 0; fam < 2; fam++) {
        const n = 11;
        for (let i = 0; i < n; i++) {
          ctx!.strokeStyle = `rgba(255,255,255,${0.18 + 0.12 * Math.sin(t * 1.3 + i * 2.1 + fam)})`;
          ctx!.beginPath();
          for (let s = 0; s <= 24; s++) {
            const u = s / 24;
            const base = (i + 0.5) / n;
            const x = fam ? base * W + Math.sin(u * 9 + t * 1.1 + i) * 14 : u * W;
            const y = fam ? u * H : base * H + Math.sin(u * 8 + t * 0.9 + i * 1.7) * 16;
            if (s === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
        }
      }

      for (const b of bubbles) {
        const x = b.x * W + Math.sin(t * 1.6 + b.seed) * 6;
        const y = b.y * H;
        ctx!.beginPath();
        ctx!.arc(x, y, b.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(255,255,255,0.28)";
        ctx!.fill();
        ctx!.strokeStyle = "rgba(47,147,184,0.45)";
        ctx!.lineWidth = 1.2;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(255,255,255,0.8)";
        ctx!.fill();
      }

      for (const r of ripples) {
        for (let k = 0; k < 3; k++) {
          const rad = r.t * 220 - k * 22;
          if (rad <= 0) continue;
          ctx!.beginPath();
          ctx!.ellipse(r.x, r.y, rad, rad * 0.55, 0, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.7 - r.t * 0.6)})`;
          ctx!.lineWidth = 2.5;
          ctx!.stroke();
        }
      }
    }

    function loop(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (const b of bubbles) {
        b.y -= b.v * dt;
        if (b.y < -0.05) {
          b.y = 1.05;
          b.x = Math.random();
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += dt;
        if (ripples[i].t > 1.2) ripples.splice(i, 1);
      }
      draw(now);
      raf = onScreen ? requestAnimationFrame(loop) : 0;
    }

    const onDown = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - box.left, y: e.clientY - box.top, t: 0 });
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting && motion;
      if (onScreen && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);
    host.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
