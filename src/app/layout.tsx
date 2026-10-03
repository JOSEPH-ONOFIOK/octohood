import type { Metadata } from "next";
import { Geist_Mono, Lilita_One, Nunito } from "next/font/google";
import { Cursor } from "@/components/Cursor";
import { site } from "@/lib/site";
import "./globals.css";

const display = Lilita_One({
  variable: "--font-lilita",
  weight: "400",
  subsets: ["latin"],
});

// Rounded and friendly to match the drawings, and easy to read at small sizes.
const sans = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Absolute URLs for link previews: NEXT_PUBLIC_SITE_URL, else Vercel's production domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${site.name} — nobody here is in a hurry`,
  description: site.description,
  openGraph: { siteName: site.name, type: "website" },
  twitter: { card: "summary_large_image", site: `@${site.xHandle}` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Cursor />
      </body>
    </html>
  );
}
