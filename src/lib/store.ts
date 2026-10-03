import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appendRow, hasSheets, readRows } from "./sheets";
import type { Entry } from "./allowlist";

/**
 * Allowlist storage. Uses the Google Sheet's Apps Script when SHEET_SCRIPT_URL is set
 * (production), otherwise a JSON file in .data/ so local dev works with zero setup.
 */
type Store = {
  all(): Promise<Entry[]>;
  /** Save a new entry. Throws DuplicateError if its wallet or X account is already in. */
  put(entry: Entry): Promise<void>;
};

export class DuplicateError extends Error {}

/** The same checks the API runs up front, repeated at write time so two quick joins can't race. */
export function duplicateOf(existing: Entry[], entry: Pick<Entry, "address" | "handle" | "xId">) {
  if (existing.some((e) => e.address === entry.address)) return "That wallet is already in the hood.";
  if (existing.some((e) => e.xId === entry.xId || e.handle.toLowerCase() === entry.handle.toLowerCase()))
    return `@${entry.handle} already lives in the hood.`;
  return null;
}

/** A row in the sheet's column order (see COLUMNS in google-apps-script/Code.gs). */
const toRow = (e: Entry) => [
  e.address,
  e.handle,
  e.xId,
  e.quoteUrl,
  e.replyUrl,
  String(e.timeMs),
  String(e.restarts),
  e.restartPosts.join(" "),
  e.createdAt,
];

function fromRow(r: string[]): Entry | null {
  const [address, handle, xId, quoteUrl, replyUrl, timeMs, restarts, posts, createdAt] = r;
  if (!address?.startsWith("0x") || !timeMs) return null;
  return {
    address: address.toLowerCase() as Entry["address"],
    handle: handle ?? "",
    xId: xId ?? "",
    quoteUrl: quoteUrl ?? "",
    replyUrl: replyUrl ?? "",
    timeMs: Number(timeMs),
    restarts: Number(restarts) || 0,
    restartPosts: posts ? posts.split(" ") : [],
    createdAt: createdAt ?? "",
  };
}

/** How long a read of the sheet is reused. Every visitor polls, and Sheets allows ~300 reads/min. */
const SHEET_CACHE_MS = 4_000;

function sheetStore(): Store {
  let cache: { at: number; entries: Promise<Entry[]> } | null = null;

  const load = async () => (await readRows()).map(fromRow).filter((e): e is Entry => !!e);

  function all() {
    if (!cache || Date.now() - cache.at > SHEET_CACHE_MS) {
      const entries = load();
      cache = { at: Date.now(), entries };
      entries.catch(() => (cache = null));
    }
    return cache.entries;
  }

  return {
    all,
    async put(entry) {
      // The script re-checks duplicates under a lock, across every server instance.
      const { duplicate } = await appendRow(toRow(entry));
      if (duplicate) throw new DuplicateError(duplicate);
      cache = null;
    },
  };
}

function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "allowlist.json");
  let queue = Promise.resolve();

  async function read(): Promise<Entry[]> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return [];
    }
  }

  return {
    all: read,
    put(entry) {
      // Serialize writes so concurrent joins don't clobber each other.
      const job = queue.then(async () => {
        const data = await read();
        const duplicate = duplicateOf(data, entry);
        if (duplicate) throw new DuplicateError(duplicate);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify([...data, entry], null, 2));
      });
      queue = job.catch(() => {});
      return job;
    },
  };
}

export const store: Store = hasSheets ? sheetStore() : fileStore();

/** Everyone in the order they moved in, so the index + 1 is their resident number. */
export async function orderedEntries() {
  return [...(await store.all())].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.address.localeCompare(b.address),
  );
}
