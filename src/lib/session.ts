import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** The X account a visitor connected, as X reported it. */
export type XUser = { id: string; username: string };

const COOKIE = "oh_x";
const MAX_AGE_S = 7 * 24 * 60 * 60;

// Every server instance must sign with the same key, or a cookie set by the X callback won't
// verify on the page. Without SESSION_SECRET, derive one from the X client secret (shared by all
// instances); only with neither (local dev) fall back to a per-process key that ends on restart.
const secret =
  process.env.SESSION_SECRET ||
  (process.env.X_CLIENT_SECRET
    ? createHash("sha256").update(`octohood-session:${process.env.X_CLIENT_SECRET}`).digest("hex")
    : randomBytes(32).toString("hex"));

const sign = (data: string) => createHmac("sha256", secret).update(data).digest("base64url");

/** Pack a value into a tamper-proof `data.signature` string. */
export function seal(value: unknown) {
  const data = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function unseal<T>(token: string | undefined): T | null {
  const [data, sig] = token?.split(".") ?? [];
  if (!data || !sig) return null;
  const want = Buffer.from(sign(data));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export async function getXUser(): Promise<XUser | null> {
  const s = unseal<XUser & { exp: number }>((await cookies()).get(COOKIE)?.value);
  return s && s.exp > Date.now() ? { id: s.id, username: s.username } : null;
}

/** The session cookie for a connected X account, to set on a response. */
export function xUserCookie(user: XUser) {
  return {
    name: COOKIE,
    value: seal({ ...user, exp: Date.now() + MAX_AGE_S * 1000 }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE_S,
    path: "/",
  };
}

export async function clearXUser() {
  (await cookies()).delete(COOKIE);
}
