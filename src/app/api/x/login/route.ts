import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { OAUTH_COOKIE, X_CLIENT_ID, authorizeUrl, callbackUrl } from "@/lib/x-oauth";
import { seal } from "@/lib/session";

/** Start "Connect X": remember a PKCE verifier and state, then send the visitor to X. */
export async function GET(request: Request) {
  if (!X_CLIENT_ID) return NextResponse.redirect(new URL("/play?x=unavailable#tasks", request.url));

  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const res = NextResponse.redirect(authorizeUrl({ redirectUri: callbackUrl(request), state, challenge }));
  res.cookies.set(OAUTH_COOKIE, seal({ state, verifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/x",
  });
  return res;
}
