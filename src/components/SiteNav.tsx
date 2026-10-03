"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OctoFace } from "@/components/OctoFace";
import { PlayButton } from "@/components/PlayButton";
import { site } from "@/lib/site";

// The site's top bar. Desktop gets inline links; below md they move into a drop-down panel
// that closes on Escape, on a tap outside, or when you pick a page.

const LINKS = [
  { href: "/residents", label: "Residents" },
  { href: "/move-in", label: "Move in" },
  { href: "/traits", label: "Traits" },
  { href: "/faq", label: "FAQ" },
];

export function SiteNav() {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating away (links, back button) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const close = () => setOpenOn(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-40 bg-ink/15 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Main" className="glass flex h-14 items-center justify-between rounded-full pr-2 pl-3 sm:pl-4">
            <Link href="/" onClick={close} className="flex items-center gap-2">
              <OctoFace className="h-8 w-8" />
              <span className="font-display text-xl tracking-wide">octohood</span>
            </Link>

            <ul className="hidden items-center gap-1 text-[15px] font-medium md:flex">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={`relative rounded-full px-3.5 py-2 transition-colors ${
                      isActive(l.href) ? "text-ink" : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {l.label}
                    {isActive(l.href) && (
                      <span className="absolute inset-x-3.5 -bottom-0.5 h-[3px] rounded-full bg-coral" aria-hidden />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1">
              <a
                href={site.links.x}
                target="_blank"
                rel="noreferrer"
                aria-label="Octohood on X"
                className="hidden h-10 w-10 place-items-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink sm:grid"
              >
                <XIcon />
              </a>
              {pathname === "/play" ? (
                <span className="hidden items-center gap-2 px-3 text-sm font-semibold text-ink/70 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-[#34c759]" aria-hidden />
                  Allowlist open
                </span>
              ) : (
                <PlayButton className="h-10 px-4 text-sm" />
              )}
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpenOn(open ? null : pathname)}
                className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ink/5 md:hidden"
              >
                <span className="relative block h-3.5 w-[18px]" aria-hidden>
                  <span className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                  <span className={`absolute top-1.5 left-0 h-0.5 w-full rounded-full bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
                  <span className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
                </span>
              </button>
            </div>
          </nav>

          <div
            id="mobile-menu"
            inert={!open}
            className={`glass absolute inset-x-0 top-full mt-2 origin-top rounded-[1.75rem] p-2 transition duration-200 ease-out md:hidden ${
              open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
            }`}
          >
            <ul>
              {LINKS.map((l, i) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 font-display text-2xl transition-colors ${
                      isActive(l.href) ? "bg-ink text-cream" : "hover:bg-ink/5"
                    }`}
                    style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                  >
                    {l.label}
                    <span className={isActive(l.href) ? "text-coral" : "text-ink/30"} aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center gap-2 border-t border-ink/10 px-2 pt-3 pb-1">
              <a href={site.links.x} target="_blank" rel="noreferrer" className="btn btn-ghost h-11 flex-1 text-sm">
                <XIcon /> Follow on X
              </a>
              <PlayButton className="h-11 flex-1 text-sm" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
    </svg>
  );
}
