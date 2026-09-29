// Everything that tunes the arcade lives here: prices, odds, rewards, and which post to boost.

export const X_HANDLE = "octohood"; // TODO: your X handle, without the @

// Posts to boost, oldest first (the number at the end of the post URL). A new one takes over
// every POST_DAYS days from CAMPAIGN_START; once the list runs out, the last one stays up.
export const POSTS: string[] = [
  "1234567890123456789", // TODO: real post IDs
];
export const CAMPAIGN_START = Date.parse("2026-09-29T00:00:00Z");
export const POST_DAYS = 3;
export const TASK_HOURS = 6;

export const SLOTS = 8;
export const CRATE_COST = 1000;
// Once all slots are full, a crate that can't beat your weakest item is scrapped for this much.
export const SCRAP_REFUND = 250;
// Most points the game can pay out per UTC day, so tasks stay worth doing.
export const GAME_DAILY_CAP = 1000;
// A full inventory whose rarity scores add up to this gets the Guaranteed tier instead of FCFS.
export const GUARANTEED_SCORE = 24;

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITIES: Record<Rarity, { label: string; color: string; weight: number; score: number }> = {
  common: { label: "Common", color: "#9aa5b0", weight: 60, score: 1 },
  rare: { label: "Rare", color: "#2f93b8", weight: 28, score: 3 },
  epic: { label: "Epic", color: "#8b6cf0", weight: 10, score: 8 },
  legendary: { label: "Legendary", color: "#f2b632", weight: 2, score: 20 },
};

export const ITEMS = {
  shell: { name: "Seashell", rarity: "common" },
  duck: { name: "Rubber Duck", rarity: "common" },
  flipflop: { name: "Flip-Flop", rarity: "common" },
  noodle: { name: "Pool Noodle", rarity: "common" },
  tie: { name: "Red Tie", rarity: "rare" },
  sharkhood: { name: "Shark Hood", rarity: "rare" },
  tophat: { name: "Top Hat", rarity: "epic" },
  pearl: { name: "Golden Pearl", rarity: "legendary" },
} as const satisfies Record<string, { name: string; rarity: Rarity }>;

export type ItemId = keyof typeof ITEMS;

export type TaskKind = "follow" | "like" | "retweet" | "comment" | "quote";

// every: "once" pays one time ever, "post" once per boosted post, "window" once every TASK_HOURS.
export const TASKS: { kind: TaskKind; label: string; reward: number; every: "once" | "post" | "window" }[] = [
  { kind: "follow", label: `Follow @${X_HANDLE}`, reward: 300, every: "once" },
  { kind: "like", label: "Like the post", reward: 100, every: "post" },
  { kind: "retweet", label: "Repost it", reward: 150, every: "post" },
  { kind: "comment", label: "Reply to it", reward: 200, every: "window" },
  { kind: "quote", label: "Quote it", reward: 250, every: "window" },
];

const HOUR = 3_600_000;

export function campaignClock(now: number) {
  const since = now - CAMPAIGN_START;
  const window = Math.floor(since / (TASK_HOURS * HOUR));
  const round = Math.floor(since / (POST_DAYS * 24 * HOUR));
  const postIndex = Math.max(0, Math.min(round, POSTS.length - 1));
  return {
    window,
    nextWindow: CAMPAIGN_START + (window + 1) * TASK_HOURS * HOUR,
    postIndex,
    postId: POSTS[postIndex],
    nextPost: round < POSTS.length - 1 ? CAMPAIGN_START + (round + 1) * POST_DAYS * 24 * HOUR : null,
  };
}

export type CampaignClock = ReturnType<typeof campaignClock>;

export function taskKey(task: (typeof TASKS)[number], c: CampaignClock) {
  if (task.every === "once") return task.kind;
  if (task.every === "post") return `${task.kind}:${c.postId}`;
  return `${task.kind}:${c.postId}:${c.window}`;
}

export const postUrl = (id: string) => `https://x.com/${X_HANDLE}/status/${id}`;

export function intentUrl(kind: TaskKind, postId: string) {
  switch (kind) {
    case "follow":
      return `https://x.com/intent/follow?screen_name=${X_HANDLE}`;
    case "like":
      return `https://x.com/intent/like?tweet_id=${postId}`;
    case "retweet":
      return `https://x.com/intent/retweet?tweet_id=${postId}`;
    case "comment":
      return `https://x.com/intent/post?in_reply_to=${postId}`;
    case "quote":
      return `https://x.com/intent/post?url=${encodeURIComponent(postUrl(postId))}`;
  }
}
