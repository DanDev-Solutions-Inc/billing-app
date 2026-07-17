import "server-only";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Exchange the long-lived refresh token for a short-lived access token.
 *
 * The refresh token belongs to the isolated receipts mailbox only (a free Gmail
 * account that receives nothing but receipts forwarded from the
 * receipts@dandev.solutions alias), and carries a read-only scope — so it cannot
 * send, delete, or reach any other account. Uses the REST endpoint directly;
 * `googleapis` would be a very large dependency for two calls.
 */
/** The address the access token actually belongs to. */
export const getMailboxAddress = async (
  accessToken: string,
): Promise<string | null> => {
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { emailAddress?: string };
  return json.emailAddress ?? null;
};

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
