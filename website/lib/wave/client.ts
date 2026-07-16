import "server-only";
import { WAVE } from "@utils/constants";
import { WaveTokenResponse } from "@interfaces/integrations/WaveTokenResponse";

/** Build the Wave OAuth2 authorize URL for the given CSRF state. */
export const buildAuthorizeUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: process.env.WAVE_CLIENT_ID ?? "",
    redirect_uri: process.env.WAVE_REDIRECT_URI ?? "",
    response_type: "code",
    scope: WAVE.scopes.join(" "),
    state,
  });
  return `${WAVE.authorizeUrl}?${params.toString()}`;
};

/** Exchange an OAuth authorization code for an access token. */
export const exchangeCodeForToken = async (
  code: string,
): Promise<WaveTokenResponse> => {
  const res = await fetch(WAVE.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.WAVE_CLIENT_ID ?? "",
      client_secret: process.env.WAVE_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.WAVE_REDIRECT_URI ?? "",
    }),
  });
  if (!res.ok) throw new Error(`Wave token exchange failed (${res.status})`);
  return res.json();
};

/** Run a GraphQL query against the Wave public API. */
export const waveGraphql = async <T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> => {
  const res = await fetch(WAVE.graphqlUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) {
    throw new Error(`Wave API: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) throw new Error("Wave API returned no data");
  return json.data;
};
