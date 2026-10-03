// Allowlist rules and helpers shared by the /play page and the API.

import { site } from "./site";

export type Entry = {
  address: `0x${string}`;
  handle: string;
  /** The connected X account's id; handles can change, ids don't. */
  xId: string;
  quoteUrl: string;
  replyUrl: string;
  /** How long Pool Catch took, penalties included. */
  timeMs: number;
  /** Restarts used, and the posts that paid for the ones past the free restarts. */
  restarts: number;
  restartPosts: string[];
  createdAt: string;
};

/** What the public board sees: quest links stay in the team's export. */
export type PublicEntry = Pick<Entry, "address" | "handle" | "timeMs" | "createdAt">;
export const toPublic = ({ address, handle, timeMs, createdAt }: Entry): PublicEntry => ({
  address,
  handle,
  timeMs,
  createdAt,
});

export const ITEMS_TO_CATCH = 8;
export const FREE_RESTARTS = 2;
/** Each piece of junk the octopus grabs adds this to the clock. */
export const JUNK_PENALTY_MS = 2_000;

/** Times outside this range (ms) aren't a real run. */
export const MIN_TIME_MS = 3_000;
export const MAX_TIME_MS = 24 * 60 * 60 * 1000;

/** 1st, 2nd, 3rd, 4th… */
export function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
}

/** Rank per wallet by time (1 = fastest); ties go to whoever moved in first. */
export function fastestRanks(entries: PublicEntry[]) {
  const sorted = [...entries].sort((a, b) => a.timeMs - b.timeMs || a.createdAt.localeCompare(b.createdAt));
  return new Map(sorted.map((e, i) => [e.address, i + 1]));
}

/** 12.4s, or 1:05.3 past a minute. */
export function formatTime(ms: number) {
  const tenths = Math.floor(ms / 100);
  const s = (tenths % 600) / 10;
  const m = Math.floor(tenths / 600);
  return m ? `${m}:${s.toFixed(1).padStart(4, "0")}` : `${s.toFixed(1)}s`;
}

export const ADDRESS_RE = /^0x[a-f0-9]{40}$/;

/** The project's X account (set in src/lib/site.ts). */
export const X_ACCOUNT = site.xHandle;

/**
 * The pinned post people like, repost, quote and reply to. Set NEXT_PUBLIC_PINNED_POST to its
 * link (https://x.com/octohood/status/123…) or just the digits after /status/.
 */
export const PINNED_POST_ID =
  /(\d{5,25})\/?(?:[?#].*)?$/.exec((process.env.NEXT_PUBLIC_PINNED_POST || "").trim())?.[1] ?? "";
export const PINNED_POST_URL = PINNED_POST_ID
  ? `https://x.com/${X_ACCOUNT}/status/${PINNED_POST_ID}`
  : `https://x.com/${X_ACCOUNT}`;

/**
 * What a player posts to buy a restart once the free ones are used, one per restart, in order.
 * So the list length is also the cap on paid restarts.
 */
export const RESTART_POSTS = [
  `Got out-swum by a pool noodle. Running it back on the @${X_ACCOUNT} allowlist.`,
  `Eight arms and I still dropped the Golden Pearl. Round two on @${X_ACCOUNT}.`,
  `The items sink faster every catch and so does my dignity. Retrying @${X_ACCOUNT}.`,
  `Grabbed an anchor instead of a top hat. Classic me. Back in the pool with @${X_ACCOUNT}.`,
  `Paid for this restart with a post. Worth it. Unbothered octopuses only: @${X_ACCOUNT}.`,
  `This octopus has better reflexes than me and I'm not okay. @${X_ACCOUNT}, again.`,
  `If you see an octopus holding a boot, that's me. Still grinding the @${X_ACCOUNT} allowlist.`,
  `Another restart, another shot at a faster time on @${X_ACCOUNT}. Nobody here is in a hurry. Except me.`,
  `Pool Catch is harder than it looks and that's all I'll say. @${X_ACCOUNT}.`,
  `Last restart, I promise. (It's not.) Fill all eight arms: @${X_ACCOUNT}.`,
];

const STATUS_RE =
  /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})\/?(?:[?#].*)?$/i;

/** Parse a post link like https://x.com/name/status/123 into its author and id. */
export function parseStatusUrl(url: string) {
  const m = STATUS_RE.exec(url.trim());
  return m ? { user: m[1], id: m[2], url: `https://x.com/${m[1]}/status/${m[2]}` } : null;
}

/**
 * Check a post link for a task: it must be a post by `handle`, and not the pinned post itself.
 * Returns the canonical URL, or an error message.
 */
export function checkPostLink(url: string, handle: string): { url: string } | { error: string } {
  const post = parseStatusUrl(url);
  if (!post) return { error: "Paste the full link to your post, like https://x.com/you/status/123…" };
  if (post.user.toLowerCase() !== handle.toLowerCase())
    return { error: `That post is by @${post.user}, not @${handle}.` };
  if (PINNED_POST_ID && post.id === PINNED_POST_ID)
    return { error: "That's the pinned post. Paste the link to your own post." };
  return { url: post.url };
}

export const shortAddress = (a: string) => a.slice(0, 6) + "…" + a.slice(-4);
export const residentNumber = (n: number) => "#" + String(n).padStart(4, "0");

/** "just now", "4m ago", "2h ago", "3d ago". */
export function timeAgo(iso: string, now: number) {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
