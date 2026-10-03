import type { Metadata } from "next";
import { Steps } from "@/components/Sections";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `Move in — ${site.name}`, description: "Play Pool Catch, do the X tasks, move in." };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="page-in flex-1">
        <Steps />
      </main>
      <SiteFooter />
    </>
  );
}
