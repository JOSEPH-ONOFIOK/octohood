import { Hero } from "@/components/Hero";
import { SiteNav } from "@/components/SiteNav";
import { orderedEntries } from "@/lib/store";

// Re-read the resident count for the hero at most once a minute.
export const revalidate = 60;

export default async function Home() {
  const residents = (await orderedEntries().catch(() => [])).length;
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero residents={residents} />
      </main>
    </>
  );
}
