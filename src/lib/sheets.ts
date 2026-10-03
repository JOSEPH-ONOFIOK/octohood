import "server-only";

/**
 * The Google Sheet, reached through the Apps Script web app in google-apps-script/Code.gs.
 * The script keeps the header row and refuses duplicate residents. It has no secret, so the URL
 * stays server-side.
 */
const SCRIPT_URL = process.env.SHEET_SCRIPT_URL ?? "";

export const hasSheets = !!SCRIPT_URL;

async function call(init?: RequestInit) {
  const res = await fetch(SCRIPT_URL, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet script ${res.status}`);
  const data = await res.json();
  if (data.error === "bad_request") throw new Error("Sheet script rejected the row");
  return data;
}

/** Every resident row, without the header, columns in Code.gs COLUMNS order. */
export async function readRows(): Promise<string[][]> {
  return (await call()).rows ?? [];
}

/** Append a row. Returns the script's message if the wallet or X account is already in. */
export async function appendRow(row: string[]): Promise<{ duplicate?: string }> {
  // Apps Script answers a POST with a redirect to the result, which fetch follows as a GET.
  const data = await call({
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ row }),
  });
  return data.error === "duplicate" ? { duplicate: data.message } : {};
}
