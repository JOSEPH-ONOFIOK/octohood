import type { Metadata } from "next";
import { PlayApp } from "@/components/play/PlayApp";
import { PlayProvider } from "@/components/play/PlayProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ITEMS_TO_CATCH, toPublic } from "@/lib/allowlist";
import { getXUser } from "@/lib/session";
import { site } from "@/lib/site";
import { orderedEntries } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Get on the list — ${site.name}`,
  description: "Play Pool Catch, do a few quick X tasks, and move into the hood.",
};

export default async function PlayPage({ searchParams }: PageProps<"/play">) {
  const entries = (await orderedEntries()).map(toPublic);
  const xUser = await getXUser();
  const { x } = await searchParams;

  return (
    <PlayProvider initial={entries}>
      <SiteNav />

      <main className="page-in flex-1 px-4 pt-24 pb-20 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] tracking-[0.18em] text-coral-deep uppercase">get on the list</p>
            <h1 className="mt-2 font-display text-4xl leading-[0.95] sm:text-6xl">Three steps to the hood.</h1>
            <p className="mt-3 hidden text-lg leading-relaxed text-ink/70 sm:block">
              Catch all {ITEMS_TO_CATCH} items in Pool Catch, knock out four quick tasks on X, then drop your wallet.
              Your time goes on the board.
            </p>
          </div>
          <div className="mt-5 sm:mt-8">
            <PlayApp xUser={xUser} xStatus={typeof x === "string" ? x : undefined} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </PlayProvider>
  );
}
