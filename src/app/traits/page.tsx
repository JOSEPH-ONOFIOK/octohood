import type { Metadata } from "next";
import { Traits } from "@/components/Sections";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `Traits — ${site.name}`, description: "A peek in the wardrobe." };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="page-in flex-1">
        <Traits />
      </main>
      <SiteFooter />
    </>
  );
}
