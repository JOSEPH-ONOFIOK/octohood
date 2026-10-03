"use client";

import { useEffect, useRef, useState } from "react";
import { fastestRanks, formatTime, ordinal, residentNumber, shortAddress, timeAgo } from "@/lib/allowlist";
import { usePlay } from "./PlayProvider";
import { card, kicker } from "./ui";

// The live board: everyone who's moved in, fastest Pool Catch time first, plus a feed of the
// latest arrivals. New residents slide in as the list refreshes.

const MEDALS = ["#f2b632", "#9aa5b0", "#c8834a"];

function useNow(every: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}

export function Board() {
  const { entries, me } = usePlay();
  const now = useNow(15_000);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark residents who arrive after the page loaded, so they animate in once.
  const seen = useRef<Set<string> | null>(null);
  if (seen.current === null) seen.current = new Set(entries.map((e) => e.address));
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const arrived = entries.filter((e) => !seen.current!.has(e.address)).map((e) => e.address);
    if (!arrived.length) return;
    arrived.forEach((a) => seen.current!.add(a));
    setFresh(new Set(arrived));
  }, [entries]);

  const ranks = fastestRanks(entries);
  const numbered = entries.map((e, i) => ({ ...e, n: i + 1, rank: ranks.get(e.address)! }));
  const ranked = [...numbered].sort((a, b) => a.rank - b.rank);
  const latest = [...numbered].reverse().slice(0, 4);
  const q = query.trim().toLowerCase().replace(/^@/, "");
  const shown = q ? ranked.filter((e) => e.handle.toLowerCase().includes(q) || e.address.includes(q)) : ranked;
  const mine = me && entries.some((e) => e.address === me) ? me : null;

  function jumpToMe() {
    if (!mine) return;
    setQuery("");
    requestAnimationFrame(() => {
      const box = scrollRef.current;
      const row = box?.querySelector<HTMLElement>(`[data-address="${mine}"]`);
      if (!box || !row) return;
      box.scrollTo({ top: row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2, behavior: "smooth" });
      setFlash(mine);
      setTimeout(() => setFlash(null), 1800);
    });
  }

  return (
    <section id="board" className={`${card} scroll-mt-24 !p-0`} aria-labelledby="board-title">
      <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 pt-5 pb-4">
        <div>
          <p className={`${kicker} flex items-center gap-2 text-sage`}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34c759] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34c759]" />
            </span>
            live
          </p>
          <h2 id="board-title" className="mt-1 font-display text-3xl leading-none">
            The hood
          </h2>
        </div>
        <dl className="flex gap-5 text-right">
          <div>
            <dt className="text-[11px] text-ink/50">Residents</dt>
            <dd className="font-display text-2xl leading-none tabular-nums">{entries.length.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink/50">Fastest</dt>
            <dd className="font-display text-2xl leading-none tabular-nums">{ranked[0] ? formatTime(ranked[0].timeMs) : "–"}</dd>
          </div>
        </dl>
      </header>

      {latest.length > 0 && (
        <ul className="border-b border-ink/10 px-5 py-3" aria-label="Latest arrivals" aria-live="polite">
          {latest.map((e) => (
            <li key={e.address} className={`flex items-center gap-2 py-1 text-sm ${fresh.has(e.address) ? "animate-[rise-in_500ms_ease-out_both]" : ""}`}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
              <span className="min-w-0 flex-1 truncate">
                <b>@{e.handle}</b> <span className="text-ink/55">moved in · {formatTime(e.timeMs)}</span>
              </span>
              <span className="shrink-0 text-xs text-ink/40">{timeAgo(e.createdAt, now)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 px-5 pt-4">
        <input
          type="search"
          aria-label="Find a resident by X handle or wallet"
          placeholder="Find @handle or 0x…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full min-w-0 rounded-full border border-ink/15 bg-white px-4 text-sm outline-none transition placeholder:text-ink/35 focus:border-pool-deep focus:ring-4 focus:ring-pool/40"
        />
        {mine && (
          <button type="button" onClick={jumpToMe} className="btn btn-ghost h-10 shrink-0 px-3 text-sm">
            Find me
          </button>
        )}
      </div>

      <div ref={scrollRef} tabIndex={0} aria-label="Residents, fastest first" className="relative mt-3 max-h-[26rem] overflow-y-auto px-3 pb-3 lg:max-h-[calc(100svh-26rem)] lg:min-h-64">
        {!entries.length ? (
          <p className="px-2 py-10 text-center text-sm text-ink/55">Nobody&apos;s moved in yet. The first resident gets the best chair.</p>
        ) : !shown.length ? (
          <p className="px-2 py-10 text-center text-sm text-ink/55">No resident matches “{query.trim()}”.</p>
        ) : (
          <ol>
            {shown.map((e) => {
              const medal = e.rank <= 3 ? MEDALS[e.rank - 1] : null;
              const isMe = e.address === mine;
              return (
                <li
                  key={e.address}
                  data-address={e.address}
                  className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors ${
                    isMe ? "bg-coral/10 ring-1 ring-coral/40" : "hover:bg-ink/[0.03]"
                  } ${flash === e.address ? "animate-pulse" : ""} ${fresh.has(e.address) ? "animate-[rise-in_500ms_ease-out_both]" : ""}`}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums"
                    style={medal ? { background: medal, color: "#17130f" } : { background: "rgb(23 19 15 / 0.06)", color: "rgb(23 19 15 / 0.6)" }}
                    title={`${ordinal(e.rank)} fastest`}
                  >
                    {e.rank}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      @{e.handle}
                      {isMe && <span className="ml-1.5 rounded-full bg-coral px-1.5 py-px text-[10px] font-bold text-white">YOU</span>}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-ink/45" title={e.address}>
                      {residentNumber(e.n)} · {shortAddress(e.address)}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-lg tabular-nums">{formatTime(e.timeMs)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
