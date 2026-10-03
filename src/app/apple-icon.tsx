import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home screens want a PNG on a solid background, so the SVG favicon goes on cream.
const icon = `data:image/svg+xml;base64,${await readFile(join(process.cwd(), "src/app/icon.svg"), "base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf6ee" }}>
        <img src={icon} alt="" width={140} height={133} />
      </div>
    ),
    size,
  );
}
