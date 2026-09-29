"use client";

import { useState, type ReactNode } from "react";

// Hover or tap and the whole group slips out of your hand and turns a full circle like a wheel:
// a little wind-up, a spin that overshoots, then a wobble back into place. Direct children
// counter-rotate so they stay upright. The spin always finishes, even if you move away.
export function SlipSpin({ className = "", children }: { className?: string; children: ReactNode }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <div
      data-cursor
      className={`${className} ${spinning ? "slip-orbit" : ""}`}
      onPointerEnter={() => setSpinning(true)}
      onPointerDown={() => setSpinning(true)}
      onAnimationEnd={(e) => e.animationName === "slip-orbit" && setSpinning(false)}
    >
      {children}
    </div>
  );
}
