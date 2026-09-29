import type { ReactNode } from "react";
import type { ItemId } from "@/lib/play/config";

// Little hand-drawn-ish props for the inventory, same ink outline as the residents.
const ART: Record<ItemId, ReactNode> = {
  shell: (
    <>
      <path d="M32 50 L11 30 C13 14 51 14 53 30 Z" fill="#eab676" />
      <path d="M32 50 L20 20 M32 50 L32 16 M32 50 L44 20" fill="none" />
      <path d="M26 49 H38 V56 H26 Z" fill="#eab676" />
    </>
  ),
  duck: (
    <>
      <path d="M12 38 C12 54 52 54 54 38 C55 31 48 30 44 33 C46 22 38 12 29 15 C21 18 21 29 27 33 C19 31 12 32 12 38 Z" fill="#fcd34d" />
      <path d="M22 22 L11 25 L22 28 Z" fill="#e8503f" />
      <circle cx="30" cy="21" r="1.8" fill="#17130f" stroke="none" />
    </>
  ),
  flipflop: (
    <>
      <path d="M24 7 C37 5 45 14 43 30 C41 44 43 56 32 58 C21 60 20 48 20 36 C18 22 13 9 24 7 Z" fill="#e8503f" />
      <path d="M31 21 L21 31 M31 21 L42 30" fill="none" strokeWidth={4.5} />
      <circle cx="31" cy="21" r="2.5" fill="#fbf6ee" />
    </>
  ),
  noodle: (
    <>
      <path d="M11 46 C18 18 46 18 53 46" fill="none" strokeWidth={15} />
      <path d="M11 46 C18 18 46 18 53 46" fill="none" stroke="#8fd16a" strokeWidth={9} />
      <path d="M20 30 L24 34 M32 22 V27 M44 30 L40 34" fill="none" strokeWidth={2} opacity={0.5} />
    </>
  ),
  tie: (
    <>
      <path d="M29 18 H35 L43 45 L32 57 L21 45 Z" fill="#e8503f" />
      <path d="M25 8 H39 L35 18 H29 Z" fill="#c63a2b" />
      <path d="M31 27 L38 34 M28 36 L40 46" fill="none" strokeWidth={2} opacity={0.45} />
    </>
  ),
  sharkhood: (
    <>
      <path d="M27 24 L36 5 L41 26" fill="#9aa5b0" />
      <path d="M8 50 C8 20 56 20 56 50 Z" fill="#9aa5b0" />
      <path d="M17 50 C17 35 47 35 47 50 Z" fill="#e8503f" />
      <path d="M19 42 l3.5 4 l3 -5 l3 5 l3.5 -5.5 l3.5 5.5 l3 -5 l3 5 l3.5 -4" fill="none" stroke="#fff" strokeWidth={2} />
    </>
  ),
  tophat: (
    <>
      <ellipse cx="32" cy="49" rx="25" ry="6" fill="#17130f" />
      <path d="M18 48 V15 C18 11 46 11 46 15 V48 Z" fill="#2c2621" />
      <path d="M18 37 H46 V44 H18 Z" fill="#e8503f" />
      <ellipse cx="32" cy="14" rx="14" ry="3" fill="#3b332c" />
    </>
  ),
  pearl: (
    <>
      <path d="M9 34 C13 10 51 10 55 34 Z" fill="#fdd5b1" />
      <path d="M7 40 C12 58 52 58 57 40 Z" fill="#fdd5b1" />
      <circle cx="32" cy="38" r="10" fill="#f2b632" />
      <circle cx="28.5" cy="34.5" r="2.8" fill="#fff" stroke="none" />
    </>
  ),
};

export function ItemArt({ id, className }: { id: ItemId; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke="#17130f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {ART[id]}
      </g>
    </svg>
  );
}
