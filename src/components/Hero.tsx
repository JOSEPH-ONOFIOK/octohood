import Image from "next/image";
import Link from "next/link";
import { PlayButton } from "@/components/PlayButton";
import { PoolScene } from "@/components/PoolScene";
import { Typewriter } from "@/components/Typewriter";
import { site } from "@/lib/site";
import poolScene from "../../public/Untitled707_20260925073040.png";

/** `residents` is how many have moved in so far, shown as a live chip linking to the board. */
export function Hero({ residents }: { residents: number }) {
  const facts = [
    { label: "Supply", value: site.mint.supply },
    { label: "Chain", value: site.mint.chain },
    { label: "Price", value: site.mint.price },
    { label: "Mint", value: site.mint.date },
  ];

  return (
    <section className="hero-stage relative isolate h-[100svh] min-h-[640px] overflow-hidden bg-pool">
      {/* static poster until the layered scene is ready */}
      <Image
        src={poolScene}
        alt=""
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover object-[54%_0%] blur-xl"
      />
      <PoolScene className="scene absolute inset-0 -z-10 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink/35 to-transparent md:hidden" />

      <div className="hero-copy flex h-full flex-col justify-end px-4 pb-6 sm:px-6 md:pb-12 lg:px-10">
        <div className="glass pointer-events-auto w-full max-w-[26rem] rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] tracking-[0.18em] text-ink/60 uppercase">Drop 001 · hand-drawn</p>
            <Link
              href="/play#board"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-ink shadow-sm transition hover:bg-white"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34c759] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34c759]" />
              </span>
              {residents ? `${residents.toLocaleString("en-US")} residents` : "Allowlist open"}
            </Link>
          </div>
          <h1 className="mt-2 font-display text-6xl leading-[0.9] sm:text-7xl">octohood</h1>
          <p className="mt-3 text-lg leading-snug">
            Nobody here is in a{" "}
            <span className="font-semibold text-coral-deep">
              <Typewriter words={["hurry.", "rush.", "meeting.", "mood.", "hurry."]} />
            </span>
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/70">
            A neighborhood of deeply unbothered octopuses. Eight arms, zero plans.
          </p>
          <div className="mt-5 flex gap-2">
            <PlayButton className="flex-1" />
            <Link href="/residents" className="btn btn-ghost flex-1">
              Residents
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-4 border-t border-ink/10 pt-4">
            {facts.map((f, i) => (
              <div key={f.label} className={i ? "border-l border-ink/10 pl-3" : ""}>
                <dt className="text-[11px] text-ink/50">{f.label}</dt>
                <dd className="font-display text-lg leading-tight">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
