"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ITEMS_TO_CATCH, JUNK_PENALTY_MS, type PublicEntry } from "@/lib/allowlist";

// Everything the /play page shares: the live list of residents (polled), which wallet this
// browser moved in with, and the Pool Catch run. The run is saved in this browser, and its clock
// is wall time from the first dive, so reloading mid-run doesn't stop it.

export type Run = {
  caught: number;
  /** When the clock started (epoch ms), or null before the first dive. */
  startedAt: number | null;
  /** Time added for grabbing junk. */
  penaltyMs: number;
  /** Final time, set on the last catch. */
  timeMs: number | null;
  restarts: number;
  /** Links to the posts that paid for restarts past the free ones. */
  posts: string[];
};

type Ctx = {
  entries: PublicEntry[];
  setEntries: (entries: PublicEntry[]) => void;
  /** 1-based resident number for an address, or 0 if it isn't on the list. */
  residentOf: (address: string) => number;
  me: string | null;
  setMe: (address: string) => void;
  /** False until the saved run and wallet have been read from this browser. */
  ready: boolean;
  run: Run;
  start: () => void;
  catchItem: () => void;
  hitJunk: () => void;
  /** Wipe the run. Past the free restarts it takes the link to a post about us. */
  restart: (postUrl?: string) => void;
};

const RUN_KEY = "octohood:run";
const ME_KEY = "octohood:me";
const NEW_RUN: Run = { caught: 0, startedAt: null, penaltyMs: 0, timeMs: null, restarts: 0, posts: [] };
const REFRESH_MS = 8_000;

const PlayContext = createContext<Ctx | null>(null);

export function PlayProvider({ initial, children }: { initial: PublicEntry[]; children: React.ReactNode }) {
  const [entries, setEntries] = useState(initial);
  const [run, setRun] = useState(NEW_RUN);
  const [me, setMeState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the run and wallet after hydration (localStorage is browser-only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RUN_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setRun({ ...NEW_RUN, ...saved });
      setMeState(localStorage.getItem(ME_KEY));
    } catch {}
    setReady(true);
  }, []);

  const setMe = useCallback((address: string) => {
    setMeState(address);
    try {
      localStorage.setItem(ME_KEY, address);
    } catch {}
  }, []);

  const save = useCallback((next: (r: Run) => Run) => {
    setRun((r) => {
      const n = next(r);
      try {
        localStorage.setItem(RUN_KEY, JSON.stringify(n));
      } catch {}
      return n;
    });
  }, []);

  const start = useCallback(() => save((r) => (r.startedAt ? r : { ...r, startedAt: Date.now() })), [save]);

  const catchItem = useCallback(
    () =>
      save((r) => {
        if (r.caught >= ITEMS_TO_CATCH || !r.startedAt) return r;
        const caught = r.caught + 1;
        const timeMs = caught === ITEMS_TO_CATCH ? Date.now() - r.startedAt + r.penaltyMs : null;
        return { ...r, caught, timeMs };
      }),
    [save],
  );

  const hitJunk = useCallback(
    () => save((r) => (r.timeMs != null ? r : { ...r, penaltyMs: r.penaltyMs + JUNK_PENALTY_MS })),
    [save],
  );

  const restart = useCallback(
    (postUrl?: string) =>
      save((r) => ({ ...NEW_RUN, restarts: r.restarts + 1, posts: postUrl ? [...r.posts, postUrl] : r.posts })),
    [save],
  );

  // Live board: poll while the tab is visible, and catch up as soon as it comes back.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/allowlist", { cache: "no-store" });
        if (res.ok && !stop) setEntries((await res.json()).entries);
      } catch {}
    };
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stop = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const residentOf = useCallback(
    (address: string) => entries.findIndex((e) => e.address === address.toLowerCase()) + 1,
    [entries],
  );

  return (
    <PlayContext.Provider
      value={{ entries, setEntries, residentOf, me, setMe, ready, run, start, catchItem, hitJunk, restart }}
    >
      {children}
    </PlayContext.Provider>
  );
}

export function usePlay() {
  const ctx = useContext(PlayContext);
  if (!ctx) throw new Error("usePlay must be used inside <PlayProvider>");
  return ctx;
}
