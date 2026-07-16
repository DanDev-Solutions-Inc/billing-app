// One-time: mint a Gmail refresh token for the dedicated receipts@ mailbox.
//
// Spins up a throwaway localhost listener, opens Google's consent screen, and
// prints the refresh token to paste into .env.local / Vercel. Read-only scope —
// the token can only read that one mailbox, and cannot send or delete.
//
// Prereq (Google Cloud console → the OAuth client in GOOGLE_CLIENT_ID):
//   • Gmail API enabled
//   • Authorised redirect URI: http://localhost:5599/oauth2callback
//
//   cd website && set -a; source .env.local; set +a
//   node scripts/gmail-auth.mjs
//   → sign in as receipts@dandev.solutions (NOT your personal account)
import { createServer } from "node:http";
import { exec } from "node:child_process";

const PORT = 5599;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) {
  console.error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in the environment.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: id,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // required to get a refresh token
    prompt: "consent", // force one even if previously granted
  });

const exchange = async (code) => {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: id,
      client_secret: secret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  return res.json();
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (!url.pathname.startsWith("/oauth2callback")) return res.end("…");

  const error = url.searchParams.get("error");
  if (error) {
    res.end(`Failed: ${error}. You can close this tab.`);
    console.error("Consent denied:", error);
    server.close();
    return;
  }

  const token = await exchange(url.searchParams.get("code"));
  if (!token.refresh_token) {
    res.end("No refresh token returned. Close this tab and see the terminal.");
    console.error("No refresh_token in response:", token);
    server.close();
    process.exit(1);
  }

  // Confirm which mailbox was actually authorised — signing in with the wrong
  // account is the easiest mistake to make here.
  const who = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { authorization: `Bearer ${token.access_token}` },
  }).then((r) => r.json());

  res.end("Authorised. You can close this tab and return to the terminal.");
  console.log(`\nAuthorised mailbox: ${who.emailAddress}`);
  if (!/^receipts@/i.test(who.emailAddress ?? "")) {
    console.log("⚠️  That is NOT the receipts@ mailbox — re-run and pick the right account.");
  }
  console.log(`\nAdd to .env.local and Vercel:\n\nGMAIL_REFRESH_TOKEN="${token.refresh_token}"\n`);
  server.close();
});

server.listen(PORT, () => {
  console.log(`Opening Google consent…\nIf it doesn't open, visit:\n${authUrl}\n`);
  exec(`open "${authUrl}"`);
});
