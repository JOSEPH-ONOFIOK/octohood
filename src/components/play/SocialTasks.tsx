"use client";

import { useEffect, useState, type ReactNode } from "react";
import { POSTS, TASKS, TASK_HOURS, campaignClock, intentUrl, postUrl, taskKey, type TaskKind } from "@/lib/play/config";
import { claimTask } from "@/lib/play/store";

// X doesn't tell us whether someone actually liked or reposted without the paid API, so for now
// a task unlocks its claim a few seconds after the intent link is opened.
const CLAIM_DELAY = 8000;

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

export function SocialTasks({ claimed }: { claimed: string[] }) {
  const now = useNow();
  const [opened, setOpened] = useState<Record<string, number>>({});
  const clock = campaignClock(now);

  return (
    <div className="rounded-3xl border-[3px] border-ink bg-white/60 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-3xl leading-none">Social tasks</h3>
        <span className="font-mono text-xs text-ink/55 tabular-nums">new in {countdown(clock.nextWindow - now)}</span>
      </div>

      <a
        href={postUrl(clock.postId)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-pool/40 px-4 py-3 hover:bg-pool/60"
      >
        <span>
          <span className="block text-sm font-semibold">
            Post {clock.postIndex + 1} of {POSTS.length} ↗
          </span>
          <span className="block text-xs text-ink/60">
            {clock.nextPost ? `Next post in ${countdown(clock.nextPost - now)}` : "The current post to boost"}
          </span>
        </span>
        <XIcon />
      </a>

      <ul className="mt-3 divide-y divide-ink/10">
        {TASKS.map((task) => {
          const key = taskKey(task, clock);
          const done = claimed.includes(key);
          const openedAt = opened[key];
          const wait = openedAt ? CLAIM_DELAY - (now - openedAt) : null;
          return (
            <li key={task.kind} className="flex items-center gap-3 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/5">{ICONS[task.kind]}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{task.label}</span>
                <span className="block text-xs text-ink/55">
                  +{task.reward} pts ·{" "}
                  {task.every === "once" ? "one time" : task.every === "post" ? "once per post" : `every ${TASK_HOURS}h`}
                </span>
              </span>
              {done ? (
                <span className="btn h-9 px-3 text-sm text-sage">Done ✓</span>
              ) : wait === null ? (
                <a
                  href={intentUrl(task.kind, clock.postId)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpened((o) => ({ ...o, [key]: Date.now() }))}
                  className="btn btn-ink h-9 px-4 text-sm"
                >
                  Go
                </a>
              ) : wait > 0 ? (
                <span className="btn btn-ghost h-9 px-3 text-sm text-ink/50 tabular-nums">Claim in {Math.ceil(wait / 1000)}s</span>
              ) : (
                <button type="button" onClick={() => claimTask(key, task.reward)} className="btn btn-coral h-9 px-3 text-sm">
                  Claim +{task.reward}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
    </svg>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const ICONS: Record<TaskKind, ReactNode> = {
  follow: (
    <Icon>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-7 7-7s7 3 7 7M19 8v6M16 11h6" />
    </Icon>
  ),
  like: (
    <Icon>
      <path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z" />
    </Icon>
  ),
  retweet: (
    <Icon>
      <path d="M4 10V8a3 3 0 0 1 3-3h12l-3-3M20 14v2a3 3 0 0 1-3 3H5l3 3" />
    </Icon>
  ),
  comment: (
    <Icon>
      <path d="M4 5h16v11H9l-5 4z" />
    </Icon>
  ),
  quote: (
    <Icon>
      <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />
    </Icon>
  ),
};
