import "server-only";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Exchange the long-lived refresh token for a short-lived access token.
 *
 * The refresh token belongs to the dedicated receipts@ mailbox only, so this
 * grants no access to any other account. Uses the REST endpoint directly —
 * `googleapis` would pull in a very large dependency for two calls.
 */
export const getAccessToken = async (): Promise<string | null> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
};
