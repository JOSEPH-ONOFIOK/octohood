import Link from "next/link";
import { OctoFace } from "@/components/OctoFace";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/residents", label: "Residents" },
  { href: "/move-in", label: "Move in" },
  { href: "/traits", label: "Traits" },
  { href: "/faq", label: "FAQ" },
  { href: "/play", label: "Play" },
];

/** The slim footer on every page except the homepage. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-cream px-4 pt-10 pb-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <OctoFace className="h-10 w-10" />
          <span>
            <span className="block font-display text-2xl leading-none">octohood</span>
            <span className="text-sm text-ink/60">{site.tagline}</span>
          </span>
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold text-ink/70">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.links.x} target="_blank" rel="noreferrer" className="hover:text-ink">
                X ↗
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-1 border-t border-ink/10 pt-5 text-xs text-ink/50 sm:flex-row">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>Not financial advice. Not really advice at all.</span>
      </div>
    </footer>
  );
}
