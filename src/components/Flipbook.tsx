"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The homepage as a stack of pages, one screen each. Scrolling, swiping or the arrow keys swap
// pages: the next one glides in over the current one (riding a little wave of pool water) while
// the one underneath sinks back and dims. Large screens swap sideways, phones swap up and down. Everything runs on a spring, and on touch the page
// follows your finger until you let go. Pages taller than the screen scroll on their own first.
// Links like href="#faq" anywhere on the page jump straight to that page.

type Page = { id: string; label: string; node: ReactNode };

const STIFFNESS = 110;
const DAMPING = 2 * Math.sqrt(STIFFNESS); // critically damped: glides in, no bounce

// Keep in sync with the lg breakpoint used for the dots and the .flip-page styles in globals.css.
const WIDE = "(min-width: 1024px)";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function Flipbook({ pages }: { pages: Page[] }) {
  const [current, setCurrent] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const scrollers = useRef<(HTMLDivElement | null)[]>([]);
  const goRef = useRef<(to: number) => void>(() => {});
  const ids = pages.map((p) => p.id).join(" ");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const list = ids.split(" ");
    const last = list.length - 1;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = { pos: 0, vel: 0, target: 0, dragging: false };
    const wide = matchMedia(WIDE);
    let axis: "x" | "y" = wide.matches ? "x" : "y";
    let shown = 0;
    let raf = 0;
    let prev = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // o = how far a page is from the one in front: 0 is on screen, 0..1 is sliding in from
    // below, -1..0 is sinking back underneath. Anything further away is parked off-screen so
    // its canvases pause.
    function render() {
      frames.current.forEach((el, i) => {
        if (!el) return;
        const o = i - s.pos;
        let shade = 0;
        const move = (pct: number) => (axis === "x" ? `translate3d(${pct}%, 0, 0)` : `translate3d(0, ${pct}%, 0)`);
        if (o >= 1 || o <= -1) {
          el.style.transform = move(o > 0 ? 100 : -100);
          el.style.visibility = "hidden";
        } else {
          el.style.visibility = "visible";
          if (o >= 0) el.style.transform = move(o * 100);
          else {
            el.style.transform = `${move(o * 30)} scale(${1 + o * 0.08})`;
            shade = -o;
          }
        }
        el.style.setProperty("--shade", shade.toFixed(3));
      });
      const r = Math.round(s.pos);
      if (r !== shown) {
        shown = r;
        setCurrent(r);
      }
    }

    function step(now: number) {
      const dt = Math.min((now - prev) / 1000, 1 / 30);
      prev = now;
      if (!s.dragging) {
        s.vel += ((s.target - s.pos) * STIFFNESS - s.vel * DAMPING) * dt;
        s.pos += s.vel * dt;
        if (Math.abs(s.target - s.pos) < 0.0005 && Math.abs(s.vel) < 0.002) {
          s.pos = s.target;
          s.vel = 0;
          render();
          raf = 0;
          return;
        }
      }
      render();
      raf = requestAnimationFrame(step);
    }

    const kick = () => {
      if (raf) return;
      prev = performance.now();
      raf = requestAnimationFrame(step);
    };

    const go = (to: number) => {
      s.target = clamp(Math.round(to), 0, last);
      s.dragging = false;
      history.replaceState(null, "", s.target === 0 ? location.pathname + location.search : `#${list[s.target]}`);
      if (reduced) {
        s.pos = s.target;
        s.vel = 0;
        render();
      } else kick();
    };
    goRef.current = go;

    const canScroll = (dy: number) => {
      const el = scrollers.current[Math.round(s.pos)];
      if (!el) return false;
      return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 4 : el.scrollTop > 4;
    };

    // Wheel. Keep scrolling and pages keep turning, one at a time as each lands. Trackpad
    // momentum (a stream of shrinking deltas after the fingers lift) shouldn't fling through
    // several pages, so after a turn the wheel only re-arms once the page has nearly landed
    // and the input is a new push: a pause, deltas growing again, or still-strong deltas.
    // A page taller than the screen scrolls first; at its end there's a short hold before it turns.
    // Sideways: a vertical wheel still turns pages, so plain mouse wheels work too.
    let lastWheel = 0;
    let lastAbs = 0;
    let acc = 0;
    let edgeAt = 0;
    let mode: "ready" | "inner" | "edge" | "spent" = "ready";
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const raw = axis === "x" && sideways ? e.deltaX : e.deltaY;
      const d = e.deltaMode === 1 ? raw * 16 : raw;
      const abs = Math.abs(d);
      const now = performance.now();
      const fresh = now - lastWheel > 200;
      const surge = abs > lastAbs * 1.5 + 4;
      const landing = Math.abs(s.pos - s.target) < 0.12;
      lastWheel = now;
      lastAbs = abs;

      if (fresh || (mode === "spent" && landing && (surge || abs >= 20)) || (mode === "edge" && now - edgeAt > 300)) {
        mode = "ready";
        acc = 0;
      }
      if (mode === "ready" && landing && !sideways && canScroll(e.deltaY)) mode = "inner";
      if (mode === "inner") {
        if (canScroll(e.deltaY)) return;
        mode = "edge";
        edgeAt = now;
      }
      e.preventDefault();
      if (mode !== "ready") return;
      acc += d;
      if (Math.abs(acc) > 24) {
        mode = "spent";
        acc = 0;
        go(s.target + Math.sign(d));
      }
    };

    // Touch: once a drag heads past the edge of the current page, the page follows the finger.
    let startX = 0;
    let startY = 0;
    let startPos = 0;
    let lastY = 0;
    let lastT = 0;
    let flick = 0;
    let touch: "none" | "page" | "inner" = "none";
    let edgeDown = false;
    let edgeUp = false;
    const along = (t: Touch) => (axis === "x" ? t.clientX : t.clientY);
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      lastY = along(e.touches[0]);
      lastT = performance.now();
      startPos = Math.round(s.pos);
      flick = 0;
      touch = "none";
      edgeDown = !canScroll(1);
      edgeUp = !canScroll(-1);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const y = along(t);
      const dy = (axis === "x" ? startX : startY) - y;
      if (touch === "none") {
        const dx = startX - t.clientX;
        const dv = startY - t.clientY;
        if (Math.hypot(dx, dv) < 6) return;
        if (axis === "x") touch = Math.abs(dx) > Math.abs(dv) ? "page" : "inner";
        else touch = (dy > 0 ? edgeDown : edgeUp) ? "page" : "inner";
        if (touch === "page") {
          s.dragging = true;
          s.vel = 0;
          kick();
        }
      }
      if (touch !== "page") return;
      e.preventDefault();
      const h = axis === "x" ? root.clientWidth : root.clientHeight;
      const now = performance.now();
      const v = (lastY - y) / h / Math.max((now - lastT) / 1000, 0.001);
      flick = flick * 0.6 + v * 0.4;
      lastY = y;
      lastT = now;
      s.pos = clamp(startPos + dy / h, Math.max(0, startPos - 1), Math.min(last, startPos + 1));
      render();
    };
    const onTouchEnd = () => {
      if (touch !== "page") return;
      touch = "none";
      const moved = s.pos - startPos;
      const to = Math.abs(flick) > 0.5 ? startPos + Math.sign(flick) : Math.abs(moved) > 0.25 ? startPos + Math.sign(moved) : startPos;
      s.vel = clamp(flick, -4, 4);
      go(to);
    };

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.defaultPrevented || el.closest("input, textarea, select, [contenteditable]")) return;
      const space = e.key === " " && !el.closest("a, button, summary");
      if (e.key === "ArrowRight") go(s.target + 1);
      else if (e.key === "ArrowLeft") go(s.target - 1);
      else if (e.key === "ArrowDown" || e.key === "PageDown" || space) {
        if (canScroll(1)) return;
        e.preventDefault();
        go(s.target + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        if (canScroll(-1)) return;
        e.preventDefault();
        go(s.target - 1);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(last);
    };

    const indexOf = (hash: string) => (hash.replace("#", "") ? list.indexOf(hash.replace("#", "")) : 0);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const i = indexOf(a.getAttribute("href")!);
      if (i < 0) return;
      e.preventDefault();
      go(i);
    };
    const onHash = () => {
      const i = indexOf(location.hash);
      if (i >= 0) go(i);
    };

    const initial = indexOf(location.hash);
    if (initial > 0) {
      timers.push(
        setTimeout(() => {
          s.pos = s.target = initial;
          render();
        }),
      );
    }

    const onAxis = () => {
      axis = wide.matches ? "x" : "y";
      render();
    };
    wide.addEventListener("change", onAxis);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      wide.removeEventListener("change", onAxis);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, [ids]);

  return (
    <main ref={rootRef} className="relative h-[100svh] overflow-hidden bg-navy">
      {pages.map((p, i) => (
        <div
          key={p.id}
          ref={(el) => {
            frames.current[i] = el;
          }}
          role="region"
          aria-label={p.label}
          inert={i !== current}
          className="flip-page absolute inset-0"
          style={i ? PARKED : undefined}
        >
          <div
            ref={(el) => {
              scrollers.current[i] = el;
            }}
            className="h-full overflow-y-auto overscroll-contain"
          >
            {p.node}
          </div>
          <div aria-hidden className="flip-shade" />
          {i > 0 && <WaveLip />}
          {i > 0 && <WaveLip side />}
        </div>
      ))}

      <nav
        aria-label="Pages"
        className="absolute top-1/2 right-2 z-40 flex -translate-y-1/2 flex-col items-center gap-2.5 sm:right-5 lg:top-auto lg:right-8 lg:bottom-7 lg:translate-y-0 lg:flex-row"
      >
        <StepButton dir="prev" disabled={current === 0} onClick={() => goRef.current(current - 1)} />
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => goRef.current(i)}
            aria-label={p.label}
            title={p.label}
            aria-current={i === current ? "page" : undefined}
            className="group relative flex items-center py-0.5"
          >
            <span className="glass pointer-events-none absolute right-full mr-2 hidden translate-x-1 rounded-full whitespace-nowrap px-2.5 py-0.5 text-xs font-semibold opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:block lg:hidden">
              {p.label}
            </span>
            <span
              className={`block w-2.5 rounded-full border-2 border-cream bg-ink shadow-[0_0_0_1px_rgb(23_19_15/0.25)] transition-all duration-300 ${
                i === current ? "h-7 bg-coral lg:h-2.5 lg:w-7" : "h-2.5 opacity-60 group-hover:opacity-100"
              }`}
            />
          </button>
        ))}
        <StepButton dir="next" disabled={current === pages.length - 1} onClick={() => goRef.current(current + 1)} />
      </nav>
    </main>
  );
}

// Up/down on phones, left/right on large screens, matching the direction pages move.
function StepButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous page" : "Next page"}
      className="glass grid h-9 w-9 place-items-center rounded-full text-ink transition hover:scale-110 hover:bg-coral hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35"
    >
      <svg
        viewBox="0 0 16 16"
        className={`h-4 w-4 ${dir === "prev" ? "-rotate-90 lg:rotate-180" : "rotate-90 lg:rotate-0"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 3 L11 8 L6 13" />
      </svg>
    </button>
  );
}

// Matches what render() does to pages below the first, so the server HTML doesn't flash.
const PARKED = { transform: "translate3d(0, 100%, 0)", visibility: "hidden" } as const;

// The water line riding on top of each incoming page. It sits just above the page's top edge,
// so it's only ever visible while that page is sliding.
function WaveLip({ side = false }: { side?: boolean }) {
  if (side) {
    return (
      <svg aria-hidden viewBox="0 0 80 1200" preserveAspectRatio="none" className="flip-lip-side">
        <g className="flip-lip-slosh">
          <path d="M40 0 C5 150 70 300 35 450 S0 750 35 900 S70 1150 30 1200 L81 1200 L81 0 Z" fill="#2f93b8" opacity="0.5" />
          <path d="M52 0 C22 200 80 350 48 600 S20 1000 55 1200 L81 1200 L81 0 Z" fill="#93d5ec" />
          <path d="M52 0 C22 200 80 350 48 600 S20 1000 55 1200" fill="none" stroke="#fbf6ee" strokeWidth="4" />
        </g>
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 1200 80" preserveAspectRatio="none" className="flip-lip">
      <g className="flip-lip-slosh">
        <path d="M0 40 C150 5 300 70 450 35 S750 0 900 35 S1150 70 1200 30 L1200 81 L0 81 Z" fill="#2f93b8" opacity="0.5" />
        <path d="M0 52 C200 22 350 80 600 48 S1000 20 1200 55 L1200 81 L0 81 Z" fill="#93d5ec" />
        <path d="M0 52 C200 22 350 80 600 48 S1000 20 1200 55" fill="none" stroke="#fbf6ee" strokeWidth="4" />
      </g>
    </svg>
  );
}
