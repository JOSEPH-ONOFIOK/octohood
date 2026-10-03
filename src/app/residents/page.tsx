import type { Metadata } from "next";
import { Residents } from "@/components/Sections";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `Residents — ${site.name}`, description: "Meet the residents: hand-drawn, one outline at a time." };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="page-in flex-1">
        <Residents />
      </main>
      <SiteFooter />
    </>
  );
}
