import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_COOKIE, callbackUrl, fetchXUser } from "@/lib/x-oauth";
import { unseal, xUserCookie } from "@/lib/session";

/** X sends the visitor back here after they approve (or cancel) the connection. */
export async function GET(request: NextRequest) {
  const back = (result: string) => {
    const res = NextResponse.redirect(new URL(`/play?x=${result}#tasks`, request.url));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/x" });
    return res;
  };

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const saved = unseal<{ state: string; verifier: string }>(request.cookies.get(OAUTH_COOKIE)?.value);
  if (!code || !saved || params.get("state") !== saved.state)
    return back(params.get("error") === "access_denied" ? "cancelled" : "failed");

  try {
    const user = await fetchXUser({ code, verifier: saved.verifier, redirectUri: callbackUrl(request) });
    const res = back("connected");
    res.cookies.set(xUserCookie(user));
    return res;
  } catch (err) {
    console.error("X sign-in failed:", err);
    return back("failed");
  }
}
