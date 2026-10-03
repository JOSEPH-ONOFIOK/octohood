import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { orderedEntries } from "@/lib/store";

export const alt = "Octohood: a hand-drawn neighborhood of unbothered octopuses. Allowlist open.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Refresh the resident count every few minutes.
export const revalidate = 300;

// A small copy of the hero artwork (the original is 5 MB), read once.
const art = `data:image/jpeg;base64,${await readFile(join(process.cwd(), "src/assets/og-pool.jpg"), "base64")}`;

/** The link preview: the pool scene, the pitch, and how many residents have moved in. */
export default async function Image() {
  const count = (await orderedEntries().catch(() => [])).length;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#93d5ec" }}>
        <img src={art} alt="" width={1200} height={998} style={{ position: "absolute", top: -60, left: 0, width: 1200, height: 998, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "36px 44px",
            width: 620,
            borderRadius: 40,
            background: "rgba(251,246,238,0.94)",
            border: "4px solid #17130f",
            color: "#17130f",
          }}
        >
          <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>octohood</div>
          <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.25, color: "rgba(23,19,15,0.75)" }}>
            {`${site.tagline} Fill all eight arms to get on the list.`}
          </div>
          <div style={{ display: "flex", marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: 999,
                background: "#e8503f",
                border: "3px solid #17130f",
                color: "#fff",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {count ? `${count.toLocaleString("en-US")} residents · allowlist open` : "Allowlist open"}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
