import {
  ADDRESS_RE,
  ITEMS_TO_CATCH,
  MAX_TIME_MS,
  MIN_TIME_MS,
  RESTART_POSTS,
  checkPostLink,
  parseStatusUrl,
  toPublic,
  type Entry,
} from "@/lib/allowlist";
import { DuplicateError, duplicateOf, orderedEntries, store } from "@/lib/store";
import { getXUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await orderedEntries();
  // Quest links are for the team's export, not the public board.
  return Response.json({ entries: entries.map(toPublic) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = String(body?.address ?? "").toLowerCase();
  // The handle comes from the connected X account, never from the form.
  const xUser = await getXUser();
  if (!xUser) return error("Connect your X account first.", 401);
  const handle = xUser.username;
  const timeMs = Number(body?.timeMs);
  const restarts = Number(body?.restarts ?? 0);
  const restartPosts: string[] = Array.isArray(body?.restartPosts)
    ? body.restartPosts.map((u: unknown) => parseStatusUrl(String(u))?.url).filter(Boolean)
    : [];

  if (!ADDRESS_RE.test(address)) return error("That isn't a valid EVM wallet address.");

  const quote = checkPostLink(String(body?.quoteUrl ?? ""), handle);
  if ("error" in quote) return error(`Quote: ${quote.error}`);
  const reply = checkPostLink(String(body?.replyUrl ?? ""), handle);
  if ("error" in reply) return error(`Reply: ${reply.error}`);
  if (quote.url === reply.url) return error("Your quote and your reply need to be different posts.");
  if (!Number.isInteger(timeMs) || timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS)
    return error(`Catch all ${ITEMS_TO_CATCH} items in Pool Catch first.`);
  if (!Number.isInteger(restarts) || restarts < 0 || restarts > 100)
    return error("That restart count doesn't look right.");

  // One resident per wallet and one per X account. Nothing proves wallet ownership, so a wallet
  // that's already in can't be re-submitted to change its details.
  const duplicate = duplicateOf(await store.all(), { address: address as Entry["address"], handle, xId: xUser.id });
  if (duplicate) return error(duplicate, 409);

  const entry: Entry = {
    address: address as Entry["address"],
    handle,
    xId: xUser.id,
    quoteUrl: quote.url,
    replyUrl: reply.url,
    timeMs,
    restarts,
    restartPosts: restartPosts.slice(0, RESTART_POSTS.length),
    createdAt: new Date().toISOString(),
  };
  try {
    await store.put(entry);
  } catch (err) {
    if (err instanceof DuplicateError) return error(err.message, 409);
    throw err;
  }

  const entries = await orderedEntries();
  return Response.json({ entry: toPublic(entry), entries: entries.map(toPublic) });
}

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
