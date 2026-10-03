"use client";

import { useState } from "react";
import { FREE_RESTARTS, RESTART_POSTS, parseStatusUrl } from "@/lib/allowlist";
import { usePlay } from "./PlayProvider";
import { input, smallBtn } from "./ui";

/** Restart the run: free a couple of times, then each restart costs a post about us. */
export function Restart() {
  const { run, restart } = usePlay();
  const [asking, setAsking] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  const paid = run.restarts - FREE_RESTARTS;
  const freeLeft = FREE_RESTARTS - run.restarts;
  const postText = paid >= 0 ? RESTART_POSTS[paid] : undefined;
  // Nothing to restart before the first dive.
  if (!run.startedAt && !run.restarts) return null;

  if (freeLeft > 0) {
    return (
      <p className="text-sm text-ink/60">
        <button type="button" onClick={() => restart()} className="font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
          Restart
        </button>{" "}
        · {freeLeft} free {freeLeft === 1 ? "restart" : "restarts"} left
      </p>
    );
  }

  if (!postText) return <p className="text-sm text-ink/60">No restarts left. That time is your time.</p>;

  if (!asking) {
    return (
      <p className="text-sm text-ink/60">
        <button type="button" onClick={() => setAsking(true)} className="font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
          Restart
        </button>{" "}
        · costs a post on X ({RESTART_POSTS.length - paid} left)
      </p>
    );
  }

  const intent = `https://x.com/intent/post?${new URLSearchParams({ text: postText, url: location.origin })}`;

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    const post = parseStatusUrl(link);
    if (!post) return setError("Paste the full link to your post, like https://x.com/you/status/123…");
    if (run.posts.includes(post.url)) return setError("You already used that post. Post the new one.");
    setError("");
    setLink("");
    setAsking(false);
    restart(post.url);
  }

  return (
    <form onSubmit={confirm} noValidate className="rounded-2xl border border-ink/10 bg-cream/70 p-4">
      <p className="text-sm font-semibold">Out of free restarts. Post this on X, then paste the link:</p>
      <blockquote className="mt-2 border-l-2 border-coral pl-3 text-sm text-ink/70">{postText}</blockquote>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className={`${smallBtn} btn-ghost`} href={intent} target="_blank" rel="noopener noreferrer">
          Post on X ↗
        </a>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          aria-label="Link to your post"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://x.com/you/status/…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className={input}
        />
        <button type="submit" className={`${smallBtn} btn-ink`}>
          Restart
        </button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-coral-deep" aria-live="polite">
        {error}
      </p>
      <button type="button" onClick={() => setAsking(false)} className="text-sm text-ink/60 underline underline-offset-4">
        Keep my run
      </button>
    </form>
  );
}
