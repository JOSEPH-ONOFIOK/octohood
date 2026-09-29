import Image from "next/image";
import { PoolScene } from "@/components/PoolScene";
import { Typewriter } from "@/components/Typewriter";
import { site } from "@/lib/site";
import poolScene from "../../public/Untitled707_20260925073040.png";

export function Hero() {
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
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink/60 uppercase">
            Drop 001 · hand-drawn
          </p>
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
            <a href={site.links.waitlist} target="_blank" rel="noreferrer" className="btn btn-ink flex-1">
              Join the list
            </a>
            <a href="#residents" className="btn btn-ghost flex-1">
              Residents
            </a>
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

      <a
        href="#residents"
        aria-label="Scroll down"
        className="scroll-hint absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block"
      >
        <span className="block h-10 w-6 rounded-full border-2 border-cream/90">
          <span className="mx-auto mt-2 block h-2 w-1 animate-bounce rounded-full bg-cream" />
        </span>
      </a>
    </section>
  );
}
