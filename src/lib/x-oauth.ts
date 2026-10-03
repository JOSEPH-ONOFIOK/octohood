import "server-only";

/**
 * Sign in with X (OAuth 2.0 authorization code + PKCE). Needs an app in the X developer portal
 * with OAuth 2.0 on, its client id/secret in X_CLIENT_ID / X_CLIENT_SECRET, and
 * `<site>/api/x/callback` registered as a callback URL.
 */
export const X_CLIENT_ID = process.env.X_CLIENT_ID ?? "";
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET ?? "";

export const OAUTH_COOKIE = "oh_x_oauth";

export const callbackUrl = (request: Request) => new URL("/api/x/callback", request.url).toString();

export function authorizeUrl(p: { redirectUri: string; state: string; challenge: string }) {
  return `https://x.com/i/oauth2/authorize?${new URLSearchParams({
    response_type: "code",
    client_id: X_CLIENT_ID,
    redirect_uri: p.redirectUri,
    scope: "users.read tweet.read",
    state: p.state,
    code_challenge: p.challenge,
    code_challenge_method: "S256",
  })}`;
}

/** Trade the callback's code for an access token, then ask X who it belongs to. */
export async function fetchXUser(p: { code: string; verifier: string; redirectUri: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (X_CLIENT_SECRET)
    headers.Authorization = `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString("base64")}`;

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers,
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: p.code,
      redirect_uri: p.redirectUri,
      code_verifier: p.verifier,
      client_id: X_CLIENT_ID,
    }),
  });
  if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
  const { access_token } = await tokenRes.json();

  const meRes = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!meRes.ok) throw new Error(`users/me ${meRes.status}`);
  const { data } = await meRes.json();
  if (!data?.id || !data?.username) throw new Error("users/me returned no user");
  return { id: String(data.id), username: String(data.username) };
}
