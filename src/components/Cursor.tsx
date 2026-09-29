"use client";

import { useEffect, useRef } from "react";

// A coral dot with a ring that lazily trails it, puffing little bubbles as it moves.
// The ring swells over anything clickable and squishes on press.
// Mouse/trackpad only; touch and reduced-motion users keep the normal cursor.

const HOVERABLE = "a, button, summary, label, [data-cursor]";

type Bubble = { x: number; y: number; r: number; vy: number; seed: number; t: number; life: number };

export function Cursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("custom-cursor");

    const p = { x: -100, y: -100 };
    const ring = { x: -100, y: -100, r: 14 };
    const bubbles: Bubble[] = [];
    let visible = false;
    let hover = false;
    let down = false;
    let lastSpawn = 0;
    let raf = 0;
    let last = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(innerWidth * dpr);
      canvas!.height = Math.round(innerHeight * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(x: number, y: number, big = false) {
      bubbles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        r: (big ? 3 : 1.5) + Math.random() * (big ? 4 : 2.5),
        vy: 25 + Math.random() * 35,
        seed: Math.random() * 10,
        t: 0,
        life: 0.7 + Math.random() * 0.6,
      });
      if (bubbles.length > 40) bubbles.shift();
    }

    function loop(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const follow = 1 - Math.pow(0.0005, dt);
      const targetR = (hover ? 24 : 14) * (down ? 0.75 : 1);
      ring.x += (p.x - ring.x) * follow;
      ring.y += (p.y - ring.y) * follow;
      ring.r += (targetR - ring.r) * (1 - Math.pow(0.00001, dt));

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.t += dt;
        b.y -= b.vy * dt;
        b.x += Math.sin(b.t * 7 + b.seed) * 0.4;
        if (b.t > b.life) bubbles.splice(i, 1);
      }

      ctx!.clearRect(0, 0, innerWidth, innerHeight);
      for (const b of bubbles) {
        const a = 1 - b.t / b.life;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(147, 213, 236, ${a * 0.45})`;
        ctx!.fill();
        ctx!.strokeStyle = `rgba(23, 19, 15, ${a * 0.55})`;
        ctx!.lineWidth = 1.2;
        ctx!.stroke();
      }

      if (visible) {
        ctx!.beginPath();
        ctx!.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        if (hover) {
          ctx!.fillStyle = "rgba(232, 80, 63, 0.16)";
          ctx!.fill();
        }
        ctx!.strokeStyle = "rgba(251, 246, 238, 0.9)";
        ctx!.lineWidth = 4;
        ctx!.stroke();
        ctx!.strokeStyle = "#17130f";
        ctx!.lineWidth = 1.8;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, down ? 3 : 4.5, 0, Math.PI * 2);
        ctx!.fillStyle = "#e8503f";
        ctx!.fill();
        ctx!.strokeStyle = "#17130f";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
      }

      const settled = Math.hypot(p.x - ring.x, p.y - ring.y) < 0.3 && Math.abs(ring.r - targetR) < 0.2;
      raf = bubbles.length || (visible && !settled) ? requestAnimationFrame(loop) : 0;
    }

    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        ring.x = e.clientX;
        ring.y = e.clientY;
      }
      const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      p.x = e.clientX;
      p.y = e.clientY;
      visible = true;
      hover = !!(e.target as Element | null)?.closest?.(HOVERABLE);
      const now = performance.now();
      if (moved > 4 && now - lastSpawn > 55) {
        lastSpawn = now;
        spawn(p.x, p.y);
      }
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      for (let i = 0; i < 5; i++) spawn(p.x, p.y, true);
      kick();
    };
    const onUp = () => {
      down = false;
      kick();
    };
    const onLeave = () => {
      visible = false;
      kick();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("custom-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[100] h-full w-full" />;
}
