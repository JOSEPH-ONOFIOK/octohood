"use client";

import { useState } from "react";
import { ITEMS_TO_CATCH, X_ACCOUNT, fastestRanks, formatTime, ordinal } from "@/lib/allowlist";
import { ITEMS, ITEM_ORDER, RARITIES } from "@/lib/items";
import { Board } from "./Board";
import { ItemArt } from "./ItemArt";
import { usePlay } from "./PlayProvider";
import { PoolCatch } from "./PoolCatch";
import { Restart } from "./Restart";
import { Tasks } from "./Tasks";
import { card, kicker, smallBtn } from "./ui";

// The /play flow: play Pool Catch → the X tasks appear → drop a wallet and move in. The live
// board sits alongside (below on phones) the whole time.

export function PlayApp({ xUser, xStatus }: { xUser: { id: string; username: string } | null; xStatus?: string }) {
  const { ready, run, me, residentOf } = usePlay();
  const played = run.timeMs != null;
  const joined = !!me && residentOf(me) > 0;

  return (
    <>
      <Stepper current={joined ? 3 : played ? 1 : 0} />
      <div className="mt-5 grid items-start gap-6 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
        <div className="min-w-0 space-y-6">
          {!ready ? (
            <div className={`${card} h-[34rem] animate-pulse`} />
          ) : played ? (
            <Result />
          ) : (
            <div className={card}>
              <PoolCatch key={run.restarts} />
              <div className="mt-4 px-1">
                <Restart />
              </div>
            </div>
          )}
          {ready && played && <Tasks xUser={xUser} xStatus={xStatus} />}
        </div>
        <aside className="lg:sticky lg:top-24">
          <Board />
        </aside>
      </div>
    </>
  );
}

const STEPS = ["Play Pool Catch", "Do the X tasks", "Move in"];

function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Your progress">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li
            key={label}
            aria-current={state === "active" ? "step" : undefined}
            className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition sm:px-4 sm:py-3 ${
              state === "active" ? "border-ink bg-white shadow-[0_3px_0_var(--color-ink)]" : "border-ink/10 bg-white/40"
            }`}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                state === "done" ? "bg-sage text-white" : state === "active" ? "bg-coral text-white" : "bg-ink/10 text-ink/50"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={`text-sm leading-tight font-semibold sm:text-[15px] ${state === "todo" ? "text-ink/45" : ""}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** The finished run: time, where it would place, share, and the (possibly paid) restart. */
function Result() {
  const { run, entries } = usePlay();
  const time = run.timeMs!;
  // Confetti only right after the last catch, not every time the page loads.
  const [fresh] = useState(() => !!run.startedAt && Date.now() - (run.startedAt + time - run.penaltyMs) < 4000);
  const place = fastestRanks([...entries, { address: "0xme", handle: "", timeMs: time, createdAt: "~" }]).get("0xme")!;
  const share = `https://x.com/intent/post?${new URLSearchParams({
    text: `Filled all ${ITEMS_TO_CATCH} arms in ${formatTime(time)} on the @${X_ACCOUNT} allowlist. Nobody here is in a hurry, except me.`,
    url: location.origin + "/play",
  })}`;

  return (
    <div className={`${card} relative overflow-hidden`}>
      {fresh && <Confetti />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`${kicker} text-sage`}>step 1 · done</p>
          <h2 className="mt-1 font-display text-3xl leading-none sm:text-4xl">All eight arms full</h2>
          <p className="mt-2 text-ink/65">
            That time would place you <b className="text-ink">{ordinal(place)}</b> of {entries.length + 1} on the board.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-5xl leading-none tabular-nums text-coral-deep">{formatTime(time)}</p>
          <p className="mt-1 text-xs text-ink/50">
            {run.penaltyMs ? `incl. +${formatTime(run.penaltyMs)} for junk` : "clean run, no junk"}
          </p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-8 gap-1.5 sm:gap-2">
        {ITEM_ORDER.map((id, i) => (
          <li
            key={id}
            title={ITEMS[id].name}
            className="grid aspect-square animate-[pop-in_400ms_ease-out_both] place-items-center rounded-xl border-2 bg-white"
            style={{ borderColor: RARITIES[ITEMS[id].rarity].color, animationDelay: fresh ? `${i * 60}ms` : "0ms" }}
          >
            <ItemArt id={id} className="w-3/4" />
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5">
        <a href="#tasks" className={`${smallBtn} btn-ink`}>
          Continue to the tasks ↓
        </a>
        <a href={share} target="_blank" rel="noopener noreferrer" className={`${smallBtn} btn-ghost`}>
          Post my time ↗
        </a>
        <div className="ml-auto">
          <Restart />
        </div>
      </div>
    </div>
  );
}

const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 29 + 7) % 100,
  delay: ((i * 0.13) % 0.9).toFixed(2),
  dur: (1.6 + ((i * 7) % 10) / 10).toFixed(2),
  spin: (i % 2 ? 1 : -1) * (360 + ((i * 47) % 360)),
  color: ["#e8503f", "#f2b632", "#2f93b8", "#8b6cf0", "#93d5ec", "#3f5a48"][i % 6],
}));

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI.map((c, i) => (
        <i
          key={i}
          className="confetti-bit"
          style={
            {
              left: `${c.left}%`,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
              "--spin": `${c.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
