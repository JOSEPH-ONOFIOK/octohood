import type { Metadata } from "next";
import { Faq, PoolsOpen } from "@/components/Sections";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `FAQ — ${site.name}`, description: "Questions, asked lazily." };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="page-in flex-1">
        <Faq />
      </main>
      <PoolsOpen />
      <SiteFooter />
    </>
  );
}
