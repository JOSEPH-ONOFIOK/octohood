import Image, { type StaticImageData } from "next/image";
import { ClotheslineDecor, FaqDecor, PoolEdgeDecor, SunburstDecor } from "@/components/Decor";
import { Flipbook } from "@/components/Flipbook";
import { Hero } from "@/components/Hero";
import { OctoFace } from "@/components/OctoFace";
import { PlayButton } from "@/components/PlayButton";
import { SlipSpin } from "@/components/SlipSpin";
import { WaterBackdrop } from "@/components/WaterBackdrop";
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
    title: "Get on the list",
    body: "Follow us on X and reply to the pinned post. We're not going to make you do a quiz.",
  },
  {
    title: "Mint your octopus",
    body: "Every resident is hand-drawn and trait-mixed. You get who you get, and they don't mind.",
  },
  {
    title: "Move in",
    body: "Change your PFP, grab a pool chair. Holders get the keys to whatever we build next.",
  },
];

const traits = [
  { group: "Headwear", items: ["Top hat", "Shark hood", "Nothing (bold)"] },
  { group: "Fits", items: ["Suit & red tie", "Button-up", "Bathrobe, open"] },
  { group: "Skin", items: ["Coral", "Cocoa", "???"] },
  { group: "Vibe", items: ["Unbothered", "Very unbothered", "Asleep"] },
];

const faqs = [
  {
    q: "What is Octohood?",
    a: "A collection of hand-drawn octopuses who have collectively decided that nothing is that serious. Art first, everything else second.",
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

export default function Home() {
  return (
    <>
      <Nav />
      <Flipbook
        pages={[
          { id: "top", label: "The pool", node: <Hero /> },
          { id: "residents", label: "Residents", node: <Residents /> },
          { id: "how", label: "Move in", node: <Steps /> },
          { id: "traits", label: "Traits", node: <Traits /> },
          { id: "faq", label: "FAQ", node: <Faq /> },
          { id: "open", label: "Pool's open", node: <Footer /> },
        ]}
      />
    </>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-3 sm:pl-4">
        <a href="#" className="flex items-center gap-2">
          <OctoFace className="h-8 w-8" />
          <span className="font-display text-xl tracking-wide">octohood</span>
        </a>
        <div className="hidden items-center gap-7 text-[15px] font-medium text-ink/70 md:flex">
          <a href="#residents" className="hover:text-ink">Residents</a>
          <a href="#how" className="hover:text-ink">Move in</a>
          <a href="#traits" className="hover:text-ink">Traits</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={site.links.x}
            target="_blank"
            rel="noreferrer"
            aria-label="Octohood on X"
            className="grid h-10 w-10 place-items-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            <XIcon />
          </a>
          <PlayButton className="h-10 px-4 text-sm" />
        </div>
      </nav>
    </header>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
    </svg>
  );
}

// Every page fills the screen, clears the nav, and centres its content vertically.
const page = "flex min-h-full items-center px-4 pt-24 pb-10 sm:px-6";

function SectionHeading({ kicker, title, body, className = "mb-12" }: { kicker: string; title: string; body?: string; className?: string }) {
  return (
    <div className={`max-w-xl ${className}`}>
      <p className="font-mono text-[11px] tracking-[0.18em] text-coral-deep uppercase">{kicker}</p>
      <h2 className="mt-2 font-display text-5xl leading-none">{title}</h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-ink/65">{body}</p>}
    </div>
  );
}

function Residents() {
  return (
    <section className={`${page} relative isolate overflow-hidden`}>
      <WaterBackdrop className="absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.4fr]">
        <SectionHeading
          className=""
          kicker="the neighbors"
          title="Meet the residents"
          body="Hand-drawn, one outline at a time. Same stare, very different life choices. Give them a poke."
        />
        {/* a triangle: the first resident on top, everyone else below; sized so it fits one screen */}
        <SlipSpin className="mx-auto grid w-full max-w-[min(100%,calc(100svh-17rem))] grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-6">
          {residents.map((r, i) => (
            <article key={r.unit} className={i === 0 ? "col-span-2 w-[calc(50%-0.5rem)] justify-self-center sm:w-[calc(50%-0.75rem)]" : ""}>
              <div className="slip-tile relative aspect-square overflow-hidden rounded-3xl border-[3px] border-ink bg-cream shadow-[0_18px_40px_-18px_rgb(28_37_53/0.6)]">
                <Image
                  src={r.image}
                  alt={`${r.name}, an Octohood resident`}
                  placeholder="blur"
                  sizes="(min-width: 768px) 370px, 50vw"
                  className="h-full w-full object-cover object-top"
                />
                <span className="glass absolute top-3 left-3 rounded-full px-2.5 py-0.5 font-mono text-[11px]">
                  {r.unit}
                </span>
              </div>
              <ResidentMeta name={r.name} job={r.job} mood={r.mood} />
            </article>
          ))}

          <article>
            <div className="slip-tile relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-[3px] border-dashed border-ink/40 bg-cream/50 shadow-[0_18px_40px_-18px_rgb(28_37_53/0.6)]">
              <OctoFace skin="#2f93b8" shade="#1c2535" className="w-1/2" />
              <span className="absolute top-3 left-3 rounded-full border border-ink/15 bg-cream px-2.5 py-0.5 font-mono text-[11px]">
                #????
              </span>
            </div>
            <ResidentMeta name="Vacancy" job="Could be you" mood="Watching your cursor" />
          </article>
        </SlipSpin>
      </div>
    </section>
  );
}

function ResidentMeta({ name, job, mood }: { name: string; job: string; mood: string }) {
  return (
    <div className="mt-3 flex flex-col gap-0.5 px-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <h3 className="font-display text-2xl">{name}</h3>
      <p className="text-sm text-ink/70 sm:text-right">
        {job}
        <span className="block text-ink/50">{mood}</span>
      </p>
    </div>
  );
}

function Steps() {
  return (
    <section className={`${page} relative isolate overflow-hidden`}>
      <PoolEdgeDecor />
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading kicker="the octopus way" title="How to move in" />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t border-ink pt-5">
              <span className="font-mono text-sm text-coral-deep">0{i + 1}</span>
              <h3 className="mt-3 font-display text-3xl">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/65">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Traits() {
  return (
    <section className={`${page.replace("pt-24", "pt-44")} relative isolate overflow-hidden`}>
      <ClotheslineDecor />
      <div className="mx-auto w-full max-w-6xl rounded-[2rem] bg-navy px-6 py-16 text-cream sm:px-12 md:py-20">
        <div className="mb-10 max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-sand uppercase">sneak peek</p>
          <h2 className="mt-2 font-display text-5xl leading-none">What&apos;s in the wardrobe</h2>
        </div>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {traits.map((t) => (
            <div key={t.group} className="border-t border-cream/15 pt-5">
              <h3 className="text-sm font-semibold text-sand">{t.group}</h3>
              <ul className="mt-3 space-y-1.5 text-cream/80">
                {t.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 text-sm text-cream/45">+ a lot more we&apos;re not showing yet.</p>
      </div>
    </section>
  );
}

function Faq() {
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
              <p className="-mt-1 pb-6 leading-relaxed text-ink/65">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative isolate flex min-h-full flex-col overflow-hidden bg-coral px-4 pt-24 text-white sm:px-6">
      <SunburstDecor />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end gap-10 md:flex-row md:items-center md:justify-between">
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
      <div className="relative -mx-4 border-t border-ink/15 bg-coral px-4 py-5 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-1 text-xs text-white/75 sm:flex-row">
          <span>© {new Date().getFullYear()} Octohood</span>
          <span>Not financial advice. Not really advice at all.</span>
        </div>
      </div>
    </footer>
  );
}
