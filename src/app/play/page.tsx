import type { Metadata } from "next";
import Link from "next/link";
import { OctoFace } from "@/components/OctoFace";
import { Arcade } from "@/components/play/Arcade";
import { CRATE_COST, SLOTS, TASK_HOURS } from "@/lib/play/config";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `The Arcade — ${site.name}`,
  description: "Play, do social tasks, open crates and fill all eight arms to get whitelisted.",
};

const steps = [
  { title: "Earn points", body: `Play Pool Catch and knock out social tasks. New tasks every ${TASK_HOURS} hours.` },
  { title: "Open crates", body: `Every ${CRATE_COST.toLocaleString("en-US")} points opens a crate: common, rare, epic or, if you're lucky, legendary.` },
  { title: "Get whitelisted", body: `Fill all ${SLOTS} arms to lock a spot. Rarer collections land the Guaranteed tier.` },
];

export default function PlayPage() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-3 sm:pl-4">
          <Link href="/" className="flex items-center gap-2">
            <OctoFace className="h-8 w-8" />
            <span className="font-display text-xl tracking-wide">octohood</span>
          </Link>
          <Link href="/" className="btn btn-ghost h-10 px-4 text-sm">
            ← Back to the pool
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-[11px] tracking-[0.18em] text-coral-deep uppercase">the arcade</p>
            <h1 className="mt-2 font-display text-5xl leading-none sm:text-6xl">Eight arms. Eight items. One whitelist.</h1>
          </div>
          <ol className="mb-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-ink pt-4">
                <span className="font-mono text-sm text-coral-deep">0{i + 1}</span>
                <h2 className="mt-1 font-display text-2xl">{s.title}</h2>
                <p className="mt-1 leading-relaxed text-ink/65">{s.body}</p>
              </li>
            ))}
          </ol>
          <Arcade />
        </div>
      </main>
    </>
  );
}
