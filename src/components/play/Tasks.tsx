"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADDRESS_RE,
  PINNED_POST_ID,
  PINNED_POST_URL,
  X_ACCOUNT,
  checkPostLink,
  fastestRanks,
  formatTime,
  ordinal,
  residentNumber,
} from "@/lib/allowlist";
import { OctoFace } from "@/components/OctoFace";
import { usePlay } from "./PlayProvider";
import { card, input, kicker, smallBtn } from "./ui";

// Step 2 and 3, shown once the run is finished: the X tasks unlock one after another, then the
// wallet. Follow and like/repost can't be checked without the paid X API, so those are confirmed
// by the player after opening the link; quote and reply links are checked to be posts by the
// connected account (and re-checked by the server).

type Progress = {
  opened: Partial<Record<"follow" | "like" | "repost" | "quote" | "reply", boolean>>;
  followed: boolean;
  liked: boolean;
  quoteUrl: string;
  replyUrl: string;
};

const EMPTY: Progress = { opened: {}, followed: false, liked: false, quoteUrl: "", replyUrl: "" };
const STORAGE_KEY = "octohood:tasks";

const intent = (path: string, params: Record<string, string>) => `https://x.com/intent/${path}?${new URLSearchParams(params)}`;

const LINKS = {
  follow: intent("follow", { screen_name: X_ACCOUNT }),
  like: PINNED_POST_ID ? intent("like", { tweet_id: PINNED_POST_ID }) : PINNED_POST_URL,
  repost: PINNED_POST_ID ? intent("retweet", { tweet_id: PINNED_POST_ID }) : PINNED_POST_URL,
  quote: intent("post", { text: `Just filled all eight arms on the @${X_ACCOUNT} allowlist. Pool's open.`, url: PINNED_POST_URL }),
  reply: PINNED_POST_ID ? intent("post", { in_reply_to: PINNED_POST_ID, text: "Pool's open, get in: " }) : PINNED_POST_URL,
};

/** Why X sent the visitor back, from the callback's ?x= flag. */
const X_NOTES: Record<string, string> = {
  cancelled: "You cancelled the X connection. Connect to keep going.",
  failed: "X didn't connect. Try again in a moment.",
  unavailable: "Connecting X isn't set up on this site yet.",
};

export function Tasks({ xUser, xStatus }: { xUser: { id: string; username: string } | null; xStatus?: string }) {
  const router = useRouter();
  const { setEntries, residentOf, me, setMe, run } = usePlay();
  const [p, setP] = useState<Progress>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);

  // Restore progress after hydration (localStorage is browser-only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setP({ ...EMPTY, ...saved });
        setQuoteInput(saved.quoteUrl ?? "");
        setReplyInput(saved.replyUrl ?? "");
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {}
  }, [p, loaded]);

  const update = (patch: Partial<Progress>) => setP((prev) => ({ ...prev, ...patch }));
  const markOpened = (k: keyof Progress["opened"]) => setP((prev) => ({ ...prev, opened: { ...prev.opened, [k]: true } }));
  const setError = (k: string, v: string) => setErrors((e) => ({ ...e, [k]: v }));

  const handle = xUser?.username ?? "";
  const done = [!!xUser && p.followed, p.liked, !!p.quoteUrl, !!p.replyUrl];
  const unlocked = (i: number) => done.slice(0, i).every(Boolean);
  const tasksDone = done.every(Boolean);

  const n = me ? residentOf(me) : 0;
  if (n) return <Ticket n={n} />;

  function verify(kind: "quote" | "reply", value: string) {
    const res = checkPostLink(value, handle);
    if ("error" in res) return setError(kind, res.error);
    if (kind === "reply" && res.url === p.quoteUrl)
      return setError(kind, "That's your quote. Paste the link to your reply with the tags.");
    setError(kind, "");
    update(kind === "quote" ? { quoteUrl: res.url } : { replyUrl: res.url });
  }

  async function disconnect() {
    await fetch("/api/x/logout", { method: "POST" }).catch(() => {});
    // Quote and reply links belong to the old account, so they go too.
    setP((prev) => ({ ...prev, followed: false, quoteUrl: "", replyUrl: "" }));
    setQuoteInput("");
    setReplyInput("");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = wallet.trim().toLowerCase();
    if (!ADDRESS_RE.test(address)) return setError("wallet", "Paste a full EVM wallet address: 0x followed by 40 characters.");
    if (run.timeMs == null) return;
    setError("wallet", "");
    setBusy(true);
    try {
      const res = await fetch("/api/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          quoteUrl: p.quoteUrl,
          replyUrl: p.replyUrl,
          timeMs: run.timeMs,
          restarts: run.restarts,
          restartPosts: run.posts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries(data.entries);
      setMe(address);
    } catch (err) {
      setError("wallet", (err instanceof Error && err.message) || "The pool didn't answer. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const xLink = (k: keyof typeof LINKS, label = "Open X") => (
    <a className={`${smallBtn} btn-ghost`} href={LINKS[k]} target="_blank" rel="noopener noreferrer" onClick={() => markOpened(k)}>
      {label} ↗
    </a>
  );

  const linkField = (kind: "quote" | "reply", value: string, set: (v: string) => void) => (
    <>
      <div className="mt-3 flex gap-2">
        <input
          aria-label={kind === "quote" ? "Link to your quote post" : "Link to your reply"}
          autoComplete="off"
          spellCheck={false}
          placeholder={`https://x.com/${handle || "you"}/status/…`}
          value={value}
          onChange={(e) => set(e.target.value)}
          className={input}
        />
        <button type="button" onClick={() => verify(kind, value)} className={`${smallBtn} btn-ink`}>
          Verify
        </button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-coral-deep" aria-live="polite">
        {errors[kind]}
      </p>
    </>
  );

  return (
    <>
      <section id="tasks" className={`${card} scroll-mt-24 animate-[rise-in_600ms_cubic-bezier(.2,.8,.2,1)_both]`}>
        <p className={`${kicker} text-coral-deep`}>step 2 · x tasks</p>
        <h2 className="mt-1 font-display text-3xl leading-none sm:text-4xl">Four quick ones on X</h2>
        <p className="mt-2 text-ink/65">Each one unlocks the next. Takes about a minute.</p>

        <ol className="mt-6 space-y-3">
          <Task n={1} title={`Connect X and follow @${X_ACCOUNT}`} done={done[0]} unlocked summary={`Following as @${handle}`}>
            {!xUser ? (
              <>
                <p>Connect the X account you&apos;ll do the tasks with. We only read your handle.</p>
                <div className="mt-3">
                  <a className={`${smallBtn} btn-ink`} href="/api/x/login">
                    Connect X
                  </a>
                </div>
                {xStatus && X_NOTES[xStatus] && <p className="mt-2 text-sm text-coral-deep">{X_NOTES[xStatus]}</p>}
              </>
            ) : (
              <>
                <p>
                  Connected as <b>@{handle}</b>.{" "}
                  <button type="button" onClick={disconnect} className="text-ink/60 underline underline-offset-4">
                    Not you?
                  </button>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {xLink("follow", `Follow @${X_ACCOUNT}`)}
                  <button type="button" disabled={!p.opened.follow} onClick={() => update({ followed: true })} className={`${smallBtn} btn-ink disabled:opacity-35`}>
                    Done
                  </button>
                </div>
              </>
            )}
          </Task>

          <Task n={2} title="Like and repost the pinned post" done={done[1]} unlocked={unlocked(1)} summary="Liked and reposted">
            <div className="flex flex-wrap gap-2">
              {xLink("like", "Like")}
              {xLink("repost", "Repost")}
              <button
                type="button"
                disabled={!p.opened.like || !p.opened.repost}
                onClick={() => update({ liked: true })}
                className={`${smallBtn} btn-ink disabled:opacity-35`}
              >
                Done
              </button>
            </div>
          </Task>

          <Task n={3} title="Quote the pinned post" done={done[2]} unlocked={unlocked(2)} summary={<VerifiedLink href={p.quoteUrl} label="your quote" />}>
            <p>Post a quote, then paste the link to it here.</p>
            <div className="mt-3">{xLink("quote", "Quote on X")}</div>
            {linkField("quote", quoteInput, setQuoteInput)}
          </Task>

          <Task n={4} title="Tag 3 friends in the replies" done={done[3]} unlocked={unlocked(3)} summary={<VerifiedLink href={p.replyUrl} label="your reply" />}>
            <p>Reply to the pinned post tagging three friends, then paste the link to your reply.</p>
            <div className="mt-3">{xLink("reply", "Reply on X")}</div>
            {linkField("reply", replyInput, setReplyInput)}
          </Task>
        </ol>
      </section>

      <section
        className={`${card} transition ${tasksDone ? "" : "pointer-events-none opacity-50"}`}
      >
        <p className={`${kicker} ${tasksDone ? "text-coral-deep" : "text-ink/45"}`}>step 3 · move in</p>
        <h2 className="mt-1 font-display text-3xl leading-none sm:text-4xl">Drop your wallet</h2>
        <p className="mt-2 text-ink/65">
          {tasksDone ? "Last step. Your resident number is the order you moved in." : "Unlocks once the four tasks are done."}
        </p>
        <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Your EVM wallet address"
            autoComplete="off"
            spellCheck={false}
            placeholder="0x…"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            disabled={!tasksDone}
            className={`${input} font-mono text-sm`}
          />
          <button type="submit" disabled={!tasksDone || busy} className="btn btn-play h-11 shrink-0 px-6 text-sm disabled:opacity-60">
            {busy ? "Moving in…" : "Move in"}
          </button>
        </form>
        <p className="mt-2 text-xs text-ink/50">Double-check it: this is the wallet that goes on the allowlist. Wallets and handles are public on the board.</p>
        <p className="mt-1 min-h-5 text-sm text-coral-deep" aria-live="polite">
          {errors.wallet}
        </p>
      </section>
    </>
  );
}

function VerifiedLink({ href, label }: { href: string; label: string }) {
  return (
    <>
      Verified:{" "}
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
        {label} ↗
      </a>
    </>
  );
}

function Task({
  n,
  title,
  done,
  unlocked,
  summary,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  unlocked: boolean;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const state = done ? "done" : unlocked ? "active" : "locked";
  return (
    <li
      className={`flex gap-4 rounded-2xl border p-4 transition ${
        state === "active" ? "border-ink/20 bg-white" : state === "done" ? "border-sage/25 bg-sage/[0.06]" : "border-ink/5 bg-ink/[0.02]"
      }`}
    >
      <span
        aria-hidden
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
          state === "done" ? "bg-sage text-white" : state === "active" ? "bg-ink text-cream" : "bg-ink/10 text-ink/40"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <h3 className={`font-semibold ${state === "locked" ? "text-ink/40" : ""}`}>
          {title}
          <span className="sr-only"> ({state})</span>
        </h3>
        {state === "done" && <p className="mt-0.5 text-sm text-ink/60">{summary}</p>}
        {state === "locked" && <p className="mt-0.5 text-sm text-ink/40">Finish the one above first.</p>}
        {state === "active" && <div className="mt-2 text-[15px] leading-relaxed text-ink/75">{children}</div>}
      </div>
    </li>
  );
}

/** What a resident sees once they're in. */
function Ticket({ n }: { n: number }) {
  const { entries } = usePlay();
  const mine = entries[n - 1];
  const rank = fastestRanks(entries).get(mine.address)!;
  const share = `https://x.com/intent/post?${new URLSearchParams({
    text: `Resident ${residentNumber(n)} of the @${X_ACCOUNT} hood. Filled all eight arms in ${formatTime(mine.timeMs)}.`,
    url: location.origin,
  })}`;

  return (
    <section id="tasks" className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-navy p-6 text-cream sm:p-8">
      <OctoFace className="pointer-events-none absolute -right-10 -bottom-12 w-48 opacity-90 sm:w-60" />
      <p className={`${kicker} text-sand`}>you&apos;re in</p>
      <h2 className="mt-1 font-display text-4xl leading-none sm:text-5xl">Welcome to the hood</h2>
      <dl className="relative mt-6 grid max-w-md grid-cols-3 gap-4 border-t border-cream/15 pt-5">
        <div>
          <dt className="text-xs text-cream/50">Resident</dt>
          <dd className="font-display text-2xl text-sand">{residentNumber(n)}</dd>
        </div>
        <div>
          <dt className="text-xs text-cream/50">Time</dt>
          <dd className="font-display text-2xl">{formatTime(mine.timeMs)}</dd>
        </div>
        <div>
          <dt className="text-xs text-cream/50">Rank</dt>
          <dd className="font-display text-2xl">{ordinal(rank)}</dd>
        </div>
      </dl>
      <p className="relative mt-4 font-mono text-xs break-all text-cream/60">
        @{mine.handle} · {mine.address}
      </p>
      <a href={share} target="_blank" rel="noopener noreferrer" className="btn btn-play relative mt-6 h-11 px-5 text-sm">
        Tell the timeline
      </a>
    </section>
  );
}
