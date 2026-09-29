import { useSyncExternalStore } from "react";
import {
  CRATE_COST,
  GAME_DAILY_CAP,
  ITEMS,
  RARITIES,
  SCRAP_REFUND,
  SLOTS,
  type ItemId,
  type Rarity,
} from "./config";

// The player's points and inventory. For now this lives in the browser's localStorage, so it's
// per-device and easy to tamper with. Swap load/save for API calls before whitelist spots are real.

export type PlayState = {
  points: number;
  items: ItemId[];
  claimed: string[];
  day: string; // UTC day that gamePoints counts toward
  gamePoints: number;
  best: number;
};

export type CrateResult = {
  item: ItemId;
  outcome: "added" | "upgraded" | "scrapped";
  slot: number;
  replaced?: ItemId;
};

const KEY = "octohood:arcade:v1";
const EMPTY: PlayState = { points: 0, items: [], claimed: [], day: "", gamePoints: 0, best: 0 };

let cache: PlayState | undefined;
const listeners = new Set<() => void>();

function load(): PlayState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = { ...EMPTY, ...JSON.parse(raw) } as PlayState;
      return { ...s, items: s.items.filter((id) => id in ITEMS).slice(0, SLOTS) };
    }
  } catch {}
  return EMPTY;
}

function get() {
  return (cache ??= load());
}

function set(next: PlayState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = load();
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// null during server render and hydration, then the saved state.
export function usePlay() {
  return useSyncExternalStore(subscribe, get, () => null);
}

const today = () => new Date().toISOString().slice(0, 10);

export function gameAllowance(s: PlayState) {
  return GAME_DAILY_CAP - (s.day === today() ? s.gamePoints : 0);
}

// Credits a finished round, up to what's left of today's cap. Returns the points added.
export function finishRound(score: number) {
  const s = get();
  const day = today();
  const used = s.day === day ? s.gamePoints : 0;
  const credit = Math.max(0, Math.min(score, GAME_DAILY_CAP - used));
  set({ ...s, points: s.points + credit, day, gamePoints: used + credit, best: Math.max(s.best, score) });
  return credit;
}

export function claimTask(key: string, reward: number) {
  const s = get();
  if (s.claimed.includes(key)) return;
  set({ ...s, points: s.points + reward, claimed: [...s.claimed, key] });
}

export const itemScore = (id: ItemId) => RARITIES[ITEMS[id].rarity].score;

export const collectionScore = (items: ItemId[]) => items.reduce((sum, id) => sum + itemScore(id), 0);

function roll(): ItemId {
  const tiers = Object.entries(RARITIES) as [Rarity, (typeof RARITIES)[Rarity]][];
  let r = Math.random() * tiers.reduce((sum, [, t]) => sum + t.weight, 0);
  const rarity = tiers.find(([, t]) => (r -= t.weight) < 0)?.[0] ?? "common";
  const pool = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Fills the next empty slot. When the inventory is full, a better pull replaces the weakest
// item and anything else is scrapped for a partial refund.
export function openCrate(): CrateResult | null {
  const s = get();
  if (s.points < CRATE_COST) return null;
  const item = roll();
  const items = [...s.items];
  const points = s.points - CRATE_COST;

  if (items.length < SLOTS) {
    items.push(item);
    set({ ...s, points, items });
    return { item, outcome: "added", slot: items.length - 1 };
  }

  const worst = items.reduce((w, id, i) => (itemScore(id) < itemScore(items[w]) ? i : w), 0);
  if (itemScore(item) > itemScore(items[worst])) {
    const replaced = items[worst];
    items[worst] = item;
    set({ ...s, points, items });
    return { item, outcome: "upgraded", slot: worst, replaced };
  }

  set({ ...s, points: points + SCRAP_REFUND });
  return { item, outcome: "scrapped", slot: -1 };
}
