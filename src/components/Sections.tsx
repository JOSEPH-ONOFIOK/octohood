// The site's content sections, one per page (see src/app/*/page.tsx).

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ClotheslineDecor, FaqDecor, PoolEdgeDecor, SunburstDecor } from "@/components/Decor";
import { OctoFace } from "@/components/OctoFace";
import { PlayButton } from "@/components/PlayButton";
import { SlipSpin } from "@/components/SlipSpin";
import { WaterBackdrop } from "@/components/WaterBackdrop";
import { ItemArt } from "@/components/play/ItemArt";
import { site } from "@/lib/site";
import sharkHood from "../../public/Untitled736_20260925042801.png";
import topHat from "../../public/Untitled737_20260925050502.png";

type Resident = {
  name: string;
  unit: string;
  image: StaticImageData;
  job: string;
  mood: string;
};

const residents: Resident[] = [
  { name: "Reginald", unit: "#0001", image: topHat, job: "Old money", mood: "Mildly disappointed in you" },
  { name: "Finn", unit: "#0002", image: sharkHood, job: "Undercover shark", mood: "Fooling absolutely no one" },
];

const steps = [
  {
    title: "Play Pool Catch",
    body: "Catch all eight items as they sink, each faster than the last. Fastest times top the board.",
  },
  {
    title: "Do the X tasks",
    body: "Follow, like, repost, quote and tag three friends. About a minute, we timed it.",
  },
  {
    title: "Move in",
    body: "Drop your wallet and you're a resident. Your number is the order you moved in.",
  },
];

type Trait = { label: string; swatch?: string };

const traits: { group: string; icon: React.ReactNode; items: Trait[] }[] = [
  {
    group: "Headwear",
    icon: <ItemArt id="tophat" className="h-full w-full" />,
    items: [{ label: "Top hat" }, { label: "Shark hood" }, { label: "Nothing (bold)" }],
  },
  {
    group: "Fits",
    icon: <ItemArt id="tie" className="h-full w-full" />,
    items: [{ label: "Suit & red tie" }, { label: "Button-up" }, { label: "Bathrobe, open" }],
  },
  {
    group: "Skin",
    icon: <ItemArt id="pearl" className="h-full w-full" />,
    items: [
      { label: "Coral", swatch: "#e8503f" },
      { label: "Cocoa", swatch: "#8a5a44" },
      { label: "???", swatch: "conic-gradient(#e8503f, #f2b632, #93d5ec, #8b6cf0, #e8503f)" },
    ],
  },
  {
    group: "Vibe",
    icon: <ItemArt id="duck" className="h-full w-full" />,
    items: [{ label: "Unbothered" }, { label: "Very unbothered" }, { label: "Asleep" }],
  },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Octohood?",
    a: "A collection of hand-drawn octopuses who have collectively decided that nothing is that serious. Art first, everything else second.",
  },
  {
    q: "How do I get on the list?",
    a: (
      <>
        Head to <Link href="/play" className="font-semibold text-coral-deep underline underline-offset-4">Play</Link>,
        catch all eight items in Pool Catch, knock out four quick tasks on X, then drop your wallet. About five
        minutes, start to finish.
      </>
    ),
  },
  {
    q: "Can I use more than one wallet?",
    a: "One spot per X account and one per wallet. Spare wallets can sit this one out.",
  },
  {
    q: "What does my Pool Catch time do?",
    a: "It ranks you on the live board, and that's bragging rights. Restarts are free twice, then each one costs a post on X.",
  },
  {
    q: "How do I check I'm on the list?",
    a: (
      <>
        Search your @handle or wallet on the live board on the{" "}
        <Link href="/play#board" className="font-semibold text-coral-deep underline underline-offset-4">Play page</Link>.
      </>
    ),
  },
  {
    q: "When is mint?",
    a: `${site.mint.date}. We'll announce the date, price and chain on X first. Get on the list so you don't miss it.`,
  },
  {
    q: "Is the art hand-drawn?",
    a: "Every line. Same outlines, same half-lidded stare, dozens of outfits and moods.",
  },
  {
    q: "Is there a roadmap?",
    a: "There's a pool. We'll figure out the rest when we get out of it.",
  },
];

// Every page fills the screen, clears the nav, and centres its content vertically.
const page = "flex min-h-[100svh] items-start px-4 pt-28 pb-10 sm:px-6 md:items-center md:pt-24";

function SectionHeading({ kicker, title, body, className = "mb-12" }: { kicker: string; title: string; body?: string; className?: string }) {
  return (
    <div className={`max-w-xl ${className}`}>
      <p className="font-mono text-[11px] tracking-[0.18em] text-coral-deep uppercase">{kicker}</p>
      <h1 className="mt-2 font-display text-5xl leading-none">{title}</h1>
      {body && <p className="mt-4 text-lg leading-relaxed text-ink/75">{body}</p>}
    </div>
  );
}

export function Residents() {
  return (
    <section className={`${page} relative isolate overflow-hidden`}>
      <WaterBackdrop className="absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHeading
            className=""
            kicker="the neighbors"
            title="Meet the residents"
            body="Hand-drawn, one outline at a time. Same stare, very different life choices."
          />
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-ink/80 shadow-sm">
            <span aria-hidden>👆</span> Hover or tap them for a spin
          </p>
        </div>
        {/* a triangle: the first resident on top, everyone else below; sized so it fits one screen */}
        <SlipSpin className="mx-auto grid w-full max-w-[min(100%,calc(100svh-22rem))] min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-5 md:min-w-[26rem]">
          {residents.map((r, i) => (
            <article key={r.unit} className={i === 0 ? "col-span-2 w-[calc(50%-0.375rem)] justify-self-center sm:w-[calc(50%-0.625rem)]" : ""}>
              <ResidentCard unit={r.unit} name={r.name} job={r.job} mood={r.mood}>
                <Image
                  src={r.image}
                  alt={`${r.name}, an Octohood resident`}
                  placeholder="blur"
                  sizes="(min-width: 768px) 300px, 50vw"
                  className="h-full w-full object-cover object-top"
                />
              </ResidentCard>
            </article>
          ))}

          <article>
            <Link href="/play" className="group block">
              <ResidentCard unit="#????" name="Vacancy" job="Could be you" mood="Play to claim it →" vacant>
                <div className="grid h-full w-full place-items-center bg-pool/30">
                  <OctoFace skin="#2f93b8" shade="#1c2535" className="w-1/2 transition-transform duration-300 group-hover:scale-110" />
                </div>
              </ResidentCard>
            </Link>
          </article>
        </SlipSpin>
      </div>
    </section>
  );
}

// A collectible card: art on top, the resident's details on a solid panel below so they read
// cleanly over the moving water.
function ResidentCard({
  unit,
  name,
  job,
  mood,
  vacant = false,
  children,
}: {
  unit: string;
  name: string;
  job: string;
  mood: string;
  vacant?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.4rem] border-[3px] bg-cream p-1.5 shadow-[0_5px_0_var(--color-ink),0_22px_40px_-20px_rgb(28_37_53/0.55)] sm:p-2 ${
        vacant ? "border-dashed border-ink/60" : "border-ink"
      }`}
    >
      <div className="slip-tile relative aspect-square overflow-hidden rounded-[1rem] bg-ink/5">
        {children}
        <span className="absolute top-2 left-2 rounded-full bg-cream/95 px-2 py-0.5 font-mono text-[10px] font-medium text-ink shadow-sm sm:text-[11px]">
          {unit}
        </span>
      </div>
      <div className="px-1.5 pt-2.5 pb-1 sm:px-2">
        <h2 className="font-display text-xl leading-none sm:text-2xl">{name}</h2>
        <p className="mt-1.5 text-sm font-bold text-ink/85 sm:text-[15px]">{job}</p>
        <p className={`mt-0.5 text-[13px] leading-snug sm:text-sm ${vacant ? "font-semibold text-coral-deep" : "text-ink/65"}`}>
          {vacant ? mood : `“${mood}”`}
        </p>
      </div>
    </div>
  );
}

export function Steps() {
  return (
    // Bottom padding keeps the steps clear of the pool edge drawn by PoolEdgeDecor.
    <section className={`${page} relative isolate overflow-hidden pb-[max(11rem,30svh)]`}>
      <PoolEdgeDecor />
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          kicker="the octopus way"
          title="How to move in"
          body="Three steps, about five minutes. Nobody here is in a hurry."
          className="mb-10"
        />
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-3xl border border-ink/10 bg-white/90 p-6 shadow-[0_1px_0_rgb(23_19_15/0.04),0_24px_50px_-30px_rgb(23_19_15/0.4)] sm:p-7"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-coral font-display text-xl text-white">
                {i + 1}
              </span>
              <h2 className="mt-4 font-display text-3xl leading-tight">{s.title}</h2>
              <p className="mt-2 text-[17px] leading-relaxed text-ink/80">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <PlayButton>Start with Pool Catch</PlayButton>
        </div>
      </div>
    </section>
  );
}

export function Traits() {
  return (
    <section className={`${page.replace("pt-28", "pt-48").replace("md:pt-24", "md:pt-44")} relative isolate overflow-hidden`}>
      <ClotheslineDecor />
      <div className="mx-auto w-full max-w-6xl rounded-[2rem] bg-navy px-5 py-10 text-cream sm:px-12 md:py-16">
        <div className="mb-8 max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-sand uppercase">sneak peek</p>
          <h1 className="mt-2 font-display text-5xl leading-none">What&apos;s in the wardrobe</h1>
          <p className="mt-3 text-lg text-cream/75">Mix and match. You get who you get, and they don&apos;t mind.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {traits.map((t) => (
            <div key={t.group} className="rounded-2xl border border-cream/10 bg-cream/[0.06] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream p-1.5">{t.icon}</span>
                <h2 className="font-display text-2xl leading-none text-sand">{t.group}</h2>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {t.items.map((item) => (
                  <li
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 text-sm font-semibold text-cream sm:text-[15px]"
                  >
                    {item.swatch && (
                      <span className="h-3.5 w-3.5 rounded-full ring-2 ring-cream/40" style={{ background: item.swatch }} />
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-cream/60">+ a lot more we&apos;re not showing yet.</p>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className={`${page} relative isolate overflow-hidden`}>
      <FaqDecor />
      <div className="mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-[1fr_1.6fr]">
        <SectionHeading kicker="questions, asked lazily" title="FAQ" />
        <div className="border-b border-ink/10">
          {faqs.map((f) => (
            <details key={f.q} className="group border-t border-ink/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-2xl font-normal text-ink/40 transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="-mt-1 pb-6 text-[17px] leading-relaxed text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The coral "Pool's open" band that closes the FAQ page. */
export function PoolsOpen() {
  return (
    <section className="relative isolate overflow-hidden bg-coral px-4 pt-20 text-white sm:px-6">
      <SunburstDecor />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="pb-4">
          <p className="font-display text-5xl text-ink sm:text-6xl">Pool&apos;s open.</p>
          <p className="mt-3 max-w-sm text-lg text-white/90">Get on the list before the good chairs are gone.</p>
          <div className="mt-7 flex gap-2">
            <PlayButton />
            <a href={site.links.x} target="_blank" rel="noreferrer" className="btn border border-white/40 hover:border-white">
              Follow on X
            </a>
          </div>
        </div>
        <OctoFace className="-mb-20 w-56 self-center sm:w-64 md:self-end" />
      </div>
    </section>
  );
}
