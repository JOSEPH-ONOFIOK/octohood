import { orderedEntries } from "@/lib/store";

export const dynamic = "force-dynamic";

/** CSV of the full allowlist, quest links included. Requires ?key=<ADMIN_KEY>. */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return new Response("Not found", { status: 404 });
  }

  const entries = await orderedEntries();
  const rows = [
    ["resident", "wallet", "x_handle", "x_id", "quote_url", "reply_url", "time_ms", "restarts", "restart_posts", "joined_at"],
    ...entries.map((e, i) => [
      String(i + 1),
      e.address,
      e.handle,
      e.xId,
      e.quoteUrl,
      e.replyUrl,
      String(e.timeMs),
      String(e.restarts),
      e.restartPosts.join(" "),
      e.createdAt,
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="octohood-allowlist.csv"',
    },
  });
}
