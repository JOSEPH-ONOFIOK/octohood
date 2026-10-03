import Link from "next/link";
import { OctoFace } from "@/components/OctoFace";
import { PlayButton } from "@/components/PlayButton";
import { SiteNav } from "@/components/SiteNav";
import { WaterBackdrop } from "@/components/WaterBackdrop";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="relative isolate flex min-h-[100svh] flex-1 items-center justify-center overflow-hidden px-4 pt-24 pb-12 text-center">
        <WaterBackdrop className="absolute inset-0 -z-10 h-full w-full" />
        <div className="max-w-md">
          <OctoFace skin="#2f93b8" shade="#1c2535" className="mx-auto w-40 sm:w-48" />
          <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-coral-deep uppercase">404 · page not found</p>
          <h1 className="mt-2 font-display text-5xl leading-none">This part of the pool is closed.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink/75">
            Whatever you were looking for swam off. Probably napping somewhere.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link href="/" className="btn btn-ghost bg-white/70">
              Back home
            </Link>
            <PlayButton />
          </div>
        </div>
      </main>
    </>
  );
}
