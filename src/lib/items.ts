// The eight items that fill an octopus's arms. In Pool Catch they drop in this order, each one
// sinking faster than the last, so the Golden Pearl is the final (and quickest) catch.

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITIES: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Common", color: "#9aa5b0" },
  rare: { label: "Rare", color: "#2f93b8" },
  epic: { label: "Epic", color: "#8b6cf0" },
  legendary: { label: "Legendary", color: "#f2b632" },
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

export const ITEM_ORDER = Object.keys(ITEMS) as ItemId[];
