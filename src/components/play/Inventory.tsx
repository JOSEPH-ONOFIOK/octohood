"use client";

import { useEffect, useState } from "react";
import {
  CRATE_COST,
  GUARANTEED_SCORE,
  ITEMS,
  RARITIES,
  SCRAP_REFUND,
  SLOTS,
  type ItemId,
  type Rarity,
} from "@/lib/play/config";
import { collectionScore, openCrate, type CrateResult, type PlayState } from "@/lib/play/store";
import { ItemArt } from "./ItemArt";

const fmt = (n: number) => n.toLocaleString("en-US");

export function Inventory({ state }: { state: PlayState }) {
  const [reveal, setReveal] = useState<CrateResult | null>(null);
  const full = state.items.length >= SLOTS;
  const score = collectionScore(state.items);
  const canOpen = state.points >= CRATE_COST;
  const toNext = Math.min(state.points / CRATE_COST, 1);

  const open = () => {
    const result = openCrate();
    if (result) setReveal(result);
  };

  return (
    <section className="rounded-[2rem] bg-navy px-5 py-8 text-cream sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-sand uppercase">your inventory</p>
          <h2 className="mt-2 font-display text-4xl leading-none sm:text-5xl">One item per arm</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-5xl leading-none text-sand tabular-nums">{fmt(state.points)}</p>
          <p className="mt-1 text-sm text-cream/55">points</p>
        </div>
      </div>

      <ol className="mt-8 grid grid-cols-4 gap-2.5 sm:gap-4 lg:grid-cols-8">
        {Array.from({ length: SLOTS }, (_, i) => (
          <Slot key={i} index={i} item={state.items[i]} fresh={reveal?.slot === i} />
        ))}
      </ol>

      <div className="mt-8 grid gap-6 border-t border-cream/15 pt-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          {full ? (
            <p className="text-lg">
              <span className="font-semibold text-sand">Whitelisted</span> ·{" "}
              {score >= GUARANTEED_SCORE ? "Guaranteed tier" : "FCFS tier"}
            </p>
          ) : (
            <p className="text-lg">
              <span className="font-semibold text-sand">
                {state.items.length}/{SLOTS}
              </span>{" "}
              collected. Fill every arm to get whitelisted.
            </p>
          )}
          <p className="mt-1 text-sm text-cream/55">
            Collection score {score}
            {full && score < GUARANTEED_SCORE && ` / ${GUARANTEED_SCORE} for Guaranteed. Better pulls replace your weakest item.`}
            {!full && ` · reach ${GUARANTEED_SCORE} with a full set for the Guaranteed tier`}
          </p>
          <Odds />
        </div>

        <div className="md:w-64">
          <button type="button" onClick={open} disabled={!canOpen} className="btn btn-coral w-full disabled:opacity-40">
            <CrateIcon className="h-6 w-6" />
            Open a crate · {fmt(CRATE_COST)}
          </button>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/10">
            <div className="h-full rounded-full bg-sand transition-[width] duration-500" style={{ width: `${toNext * 100}%` }} />
          </div>
          <p className="mt-1.5 text-center text-xs text-cream/50">
            {canOpen
              ? `${Math.floor(state.points / CRATE_COST)} crate${state.points >= CRATE_COST * 2 ? "s" : ""} ready`
              : `${fmt(CRATE_COST - state.points)} pts to your next crate`}
          </p>
        </div>
      </div>

      {reveal && (
        <Reveal
          key={`${reveal.item}-${state.points}`}
          result={reveal}
          canOpenAnother={canOpen}
          onAgain={open}
          onClose={() => setReveal(null)}
        />
      )}
    </section>
  );
}

function Slot({ index, item, fresh }: { index: number; item?: ItemId; fresh: boolean }) {
  if (!item) {
    return (
      <li className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-cream/15 text-center">
        <span>
          <span className="block font-display text-2xl text-cream/20 sm:text-3xl">?</span>
          <span className="hidden font-mono text-[10px] tracking-widest text-cream/30 uppercase sm:block">arm {index + 1}</span>
        </span>
      </li>
    );
  }
  const rarity = RARITIES[ITEMS[item].rarity];
  return (
    <li
      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 bg-cream p-1.5 text-ink ${fresh ? "animate-[pop-in_500ms_ease-out]" : ""}`}
      style={{ borderColor: rarity.color, boxShadow: `0 0 0 3px ${rarity.color}33` }}
    >
      <ItemArt id={item} className="w-3/5" />
      <span className="mt-1 hidden text-center text-xs leading-tight font-semibold sm:block">{ITEMS[item].name}</span>
      <span
        className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full sm:static sm:mt-0.5 sm:h-auto sm:w-auto sm:rounded-none sm:font-mono sm:text-[10px] sm:tracking-widest sm:uppercase"
        style={{ backgroundColor: rarity.color }}
      >
        <span className="sr-only sm:not-sr-only sm:px-1.5 sm:text-ink">{rarity.label}</span>
      </span>
    </li>
  );
}

function Odds() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/60">
      {(Object.entries(RARITIES) as [Rarity, (typeof RARITIES)[Rarity]][]).map(([key, r]) => (
        <li key={key} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
          {r.label} {r.weight}% · {r.score} pt{r.score > 1 ? "s" : ""}
        </li>
      ))}
    </ul>
  );
}

function Reveal({
  result,
  canOpenAnother,
  onAgain,
  onClose,
}: {
  result: CrateResult;
  canOpenAnother: boolean;
  onAgain: () => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const item = ITEMS[result.item];
  const rarity = RARITIES[item.rarity];

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 900);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const message =
    result.outcome === "added"
      ? `Slotted into arm ${result.slot + 1}.`
      : result.outcome === "upgraded"
        ? `Swapped out your ${ITEMS[result.replaced!].name}. Collection score went up.`
        : `Nothing weaker left to replace. Scrapped for ${SCRAP_REFUND} pts.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crate opened"
      className="fixed inset-0 z-[70] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-[2rem] bg-cream p-7 text-center text-ink" onClick={(e) => e.stopPropagation()}>
        {!shown ? (
          <div className="grid h-64 place-items-center">
            <CrateIcon className="w-32 animate-[crate-shake_300ms_ease-in-out_infinite]" />
          </div>
        ) : (
          <div className="animate-[pop-in_450ms_cubic-bezier(.2,1.4,.4,1)]">
            <div
              className="mx-auto grid h-44 w-44 place-items-center rounded-full"
              style={{ background: `radial-gradient(circle, ${rarity.color}66 0%, ${rarity.color}00 70%)` }}
            >
              <ItemArt id={result.item} className="w-28" />
            </div>
            <p className="mt-2 font-mono text-[11px] tracking-[0.18em] uppercase" style={{ color: rarity.color }}>
              {rarity.label}
            </p>
            <h3 className="font-display text-4xl leading-tight">{item.name}</h3>
            <p className="mt-2 text-ink/65">{message}</p>
          </div>
        )}
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            Nice
          </button>
          {shown && canOpenAnother && (
            <button type="button" onClick={onAgain} className="btn btn-ink flex-1">
              Open another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CrateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke="#17130f" strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round">
        <path d="M8 26 H56 V56 H8 Z" fill="#eab676" />
        <path d="M5 16 H59 V27 H5 Z" fill="#e8503f" />
        <path d="M28 16 V56 M36 16 V56" fill="none" />
        <path d="M27 36 H37 V44 H27 Z" fill="#fbf6ee" />
      </g>
    </svg>
  );
}
