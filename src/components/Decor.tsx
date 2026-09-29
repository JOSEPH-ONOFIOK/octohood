import type { CSSProperties } from "react";
import { ItemArt } from "@/components/play/ItemArt";
import type { ItemId } from "@/lib/play/config";

// Background props for the homepage pages. Pure SVG + CSS animation (see the decor-* classes in
// globals.css), all behind the content and ignored by pointers and screen readers.

const vars = (o: Record<string, string | number>) => o as CSSProperties;

function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" className={`decor-twinkle ${className}`} style={style} aria-hidden>
      <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill="currentColor" />
    </svg>
  );
}

// "How to move in": the page ends at the pool's edge, with a float and a beach ball bobbing.
export function PoolEdgeDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-x-0 bottom-0 h-[26%] min-h-36">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute -top-[39px] left-0 h-10 w-[110%]">
          <g className="decor-slosh">
            <path d="M0 30 C150 5 300 55 450 30 S750 5 900 30 S1150 55 1200 25 L1200 61 L0 61 Z" fill="#93d5ec" />
            <path d="M0 30 C150 5 300 55 450 30 S750 5 900 30 S1150 55 1200 25" fill="none" stroke="#17130f" strokeWidth="3" />
          </g>
        </svg>
        <div className="h-full bg-pool bg-[linear-gradient(rgb(47_147_184/0.18)_2px,transparent_2px),linear-gradient(90deg,rgb(47_147_184/0.18)_2px,transparent_2px)] bg-[size:44px_44px]" />
      </div>

      <svg viewBox="-40 -40 80 80" className="decor-bob absolute right-[9%] bottom-[calc(26%-34px)] w-20 sm:w-28" style={vars({ "--d": "4.6s" })}>
        <g stroke="#17130f" strokeWidth="3">
          <circle r="34" fill="#e8503f" />
          <circle r="25" fill="none" stroke="#fbf6ee" strokeWidth="14" strokeDasharray="13 13" />
          <circle r="34" fill="none" />
          <circle r="15" fill="#93d5ec" />
        </g>
      </svg>

      <svg viewBox="-34 -34 68 68" className="decor-bob absolute bottom-[calc(26%-22px)] left-[7%] w-14 sm:w-20" style={vars({ "--d": "3.8s", "--delay": "-1.4s", "--r0": "8deg", "--r1": "-10deg" })}>
        <g stroke="#17130f" strokeWidth="3" strokeLinejoin="round">
          <circle r="30" fill="#fbf6ee" />
          <path d="M0 -30 A30 30 0 0 1 26 15 L0 0 Z" fill="#e8503f" />
          <path d="M26 15 A30 30 0 0 1 -26 15 L0 0 Z" fill="#fbf6ee" />
          <path d="M-26 15 A30 30 0 0 1 0 -30 L0 0 Z" fill="#2f93b8" />
          <circle r="6" fill="#eab676" />
        </g>
      </svg>

      <Sparkle className="absolute bottom-[14%] left-[34%] w-4 text-cream" style={vars({ "--delay": "-0.4s" })} />
      <Sparkle className="absolute bottom-[8%] left-[58%] w-3 text-cream" style={vars({ "--delay": "-1.3s" })} />
      <Sparkle className="absolute bottom-[18%] left-[74%] w-5 text-cream" style={vars({ "--delay": "-2.1s" })} />
      <Sparkle className="absolute top-[22%] right-[12%] w-5 text-sand" style={vars({ "--delay": "-0.9s" })} />
    </div>
  );
}

// Traits: a clothesline across the top with pieces of the wardrobe pegged to it, swaying.
const LINE: { id: ItemId; at: number; d: string }[] = [
  { id: "tie", at: 0.1, d: "3.1s" },
  { id: "flipflop", at: 0.28, d: "3.7s" },
  { id: "sharkhood", at: 0.5, d: "3.3s" },
  { id: "tophat", at: 0.71, d: "4s" },
  { id: "duck", at: 0.9, d: "3.5s" },
];

export function ClotheslineDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgb(23_19_15/0.07)_1.5px,transparent_1.5px)] bg-[size:22px_22px]">
      <div className="absolute inset-x-0 top-[70px] h-[120px]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M-10 10 Q600 130 1210 10" fill="none" stroke="#17130f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        {LINE.map((it, i) => (
          // the rope sags as a parabola: y = 10 + 120·t·(1 − t) in a 120px-tall box;
          // the sway keyframes also centre each item on its peg
          <div
            key={it.id}
            className="decor-sway absolute w-10 sm:w-14"
            style={vars({ left: `${it.at * 100}%`, top: `${6 + 120 * it.at * (1 - it.at)}px`, "--d": it.d, "--delay": `${-i * 0.7}s` })}
          >
            <span className="mx-auto block h-3 w-1.5 rounded-sm border-2 border-ink bg-sand" />
            <ItemArt id={it.id} className="-mt-1 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ: question marks drifting around, and a tentacle curling up out of the corner.
const MARKS = [
  { cls: "top-[18%] left-[6%] text-[7rem]", d: "9s", delay: "0s" },
  { cls: "top-[12%] right-[14%] text-[5rem]", d: "11s", delay: "-3s" },
  { cls: "bottom-[16%] right-[6%] text-[9rem]", d: "13s", delay: "-6s" },
  { cls: "top-[55%] left-[42%] text-[4rem]", d: "10s", delay: "-2s" },
];

export function FaqDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {MARKS.map((m) => (
        <span key={m.cls} className={`decor-drift absolute font-display leading-none text-pool-deep/10 ${m.cls}`} style={vars({ "--d": m.d, "--delay": m.delay })}>
          ?
        </span>
      ))}
      <svg viewBox="0 0 160 320" className="decor-sway-base absolute -bottom-6 -left-4 w-24 sm:w-32 md:w-40">
        <path
          d="M40 330 C30 250 20 190 55 140 C85 98 120 110 118 70 C116 40 90 30 76 44 C66 54 74 66 84 62"
          fill="none"
          stroke="#17130f"
          strokeWidth="34"
          strokeLinecap="round"
        />
        <path
          d="M40 330 C30 250 20 190 55 140 C85 98 120 110 118 70 C116 40 90 30 76 44 C66 54 74 66 84 62"
          fill="none"
          stroke="#e8503f"
          strokeWidth="27"
          strokeLinecap="round"
        />
        <g fill="#fdd5b1" stroke="#17130f" strokeWidth="2">
          <circle cx="52" cy="270" r="6" />
          <circle cx="44" cy="225" r="5.5" />
          <circle cx="50" cy="180" r="5" />
          <circle cx="72" cy="140" r="4.5" />
          <circle cx="102" cy="112" r="4" />
          <circle cx="112" cy="80" r="3.5" />
        </g>
      </svg>
      <Sparkle className="absolute top-[30%] right-[30%] w-4 text-coral" style={vars({ "--delay": "-1s" })} />
      <Sparkle className="absolute bottom-[26%] left-[30%] w-3 text-pool-deep" style={vars({ "--delay": "-2.2s" })} />
    </div>
  );
}

// Last page: slow sun rays behind the octopus, bubbles rising, a bit of sparkle.
const BUBBLES = [
  { left: "8%", size: 18, d: "9s", delay: "0s" },
  { left: "22%", size: 10, d: "7s", delay: "-3s" },
  { left: "41%", size: 24, d: "11s", delay: "-5s" },
  { left: "63%", size: 12, d: "8s", delay: "-1.5s" },
  { left: "78%", size: 20, d: "10s", delay: "-6.5s" },
  { left: "92%", size: 9, d: "6.5s", delay: "-2.5s" },
];

export function SunburstDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute bottom-[-35rem] left-1/2 h-[70rem] w-[70rem] -translate-x-1/2 md:right-[-24rem] md:left-auto md:translate-x-0">
        <div className="decor-spin h-full w-full rounded-full bg-[repeating-conic-gradient(rgb(255_255_255/0.13)_0deg_7deg,transparent_7deg_20deg)] [mask-image:radial-gradient(circle,#000_20%,transparent_68%)]" />
      </div>
      {BUBBLES.map((b) => (
        <span
          key={b.left}
          className="decor-rise absolute bottom-0 rounded-full border-2 border-white/60 bg-white/15"
          style={vars({ left: b.left, width: `${b.size}px`, height: `${b.size}px`, "--d": b.d, "--delay": b.delay })}
        />
      ))}
      <Sparkle className="absolute top-[24%] left-[12%] w-5 text-sand" style={vars({ "--delay": "-0.6s" })} />
      <Sparkle className="absolute top-[40%] right-[40%] w-3 text-white" style={vars({ "--delay": "-1.8s" })} />
      <Sparkle className="absolute top-[18%] right-[18%] w-6 text-white" style={vars({ "--delay": "-2.6s" })} />
    </div>
  );
}
