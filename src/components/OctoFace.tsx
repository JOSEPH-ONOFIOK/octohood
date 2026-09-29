"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  skin?: string;
  shade?: string;
  className?: string;
};

// A vector take on the Octohood face: half-lidded eyes that lazily follow the cursor.
export function OctoFace({
  skin = "#e8503f",
  shade = "#c63a2b",
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const box = svg.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height * 0.5);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(dist / 300, 1);
      setLook({ x: (dx / dist) * 9 * reach, y: (dy / dist) * 4 * reach });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const pupil = (cx: number) => (
    <circle
      cx={cx}
      cy={100}
      r={7}
      fill="#17130f"
      style={{
        transform: `translate(${look.x}px, ${Math.max(look.y, -1)}px)`,
        transition: "transform 180ms ease-out",
      }}
    />
  );

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 190"
      className={className}
      role="img"
      aria-label="An unbothered octopus watching your cursor"
    >
      <defs>
        <clipPath id={`${id}l`}>
          <path d="M48 92 A25 21 0 0 0 98 92 Z" />
        </clipPath>
        <clipPath id={`${id}r`}>
          <path d="M104 92 A25 21 0 0 0 154 92 Z" />
        </clipPath>
      </defs>

      <g stroke="#17130f" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        {/* head */}
        <path
          d="M100 12 C152 12 188 52 190 104 C192 150 152 176 100 176 C48 176 8 150 10 104 C12 52 48 12 100 12Z"
          fill={skin}
        />
        <path
          d="M40 60 C60 34 96 26 126 30"
          fill="none"
          stroke={shade}
          strokeWidth={10}
          opacity={0.5}
        />

        {/* eyes */}
        <g className="origin-[100px_92px] animate-[octo-blink_6s_infinite]">
          <path d="M48 92 A25 21 0 0 0 98 92 Z" fill="#fff7f0" />
          <path d="M104 92 A25 21 0 0 0 154 92 Z" fill="#fff7f0" />
          <g clipPath={`url(#${id}l)`} stroke="none">
            {pupil(76)}
          </g>
          <g clipPath={`url(#${id}r)`} stroke="none">
            {pupil(130)}
          </g>
        </g>
        <path d="M42 92 H102 M100 92 H160" strokeWidth={6} />
        <path d="M54 76 L96 79 M108 79 L148 76" strokeWidth={3} />

        {/* nose + tentacle mustache */}
        <path d="M92 124 C98 119 108 119 114 124" fill="none" strokeWidth={3} />
        <path d="M99 128 L107 129 L102 133Z" fill="#17130f" strokeWidth={2} />
        <g fill={skin} strokeWidth={3.5}>
          <path d="M84 134 C80 150 70 166 76 176 C84 186 96 170 96 150" />
          <path d="M97 140 C94 158 94 180 104 182 C114 184 114 160 108 140" />
          <path d="M116 136 C124 150 132 166 126 176 C118 186 108 170 110 150" />
        </g>
      </g>
    </svg>
  );
}
