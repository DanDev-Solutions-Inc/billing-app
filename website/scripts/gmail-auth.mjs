// One-time: mint a Gmail refresh token for the isolated receipts mailbox.
//
// Spins up a throwaway localhost listener, opens Google's consent screen, and
// prints the refresh token to paste into .env.local / Vercel. Read-only scope —
// the token can only read that one mailbox, and cannot send or delete.
//
// Prereq (Google Cloud console → the OAuth client in GOOGLE_CLIENT_ID):
//   • Gmail API enabled
//   • Authorised redirect URI: http://localhost:5599/oauth2callback
//   • Consent screen = External (a free @gmail.com account cannot grant access
//     to an "Internal" Workspace-only client). If it is in Testing mode, add the
//     receipts account under Test users first.
//
//   cd website && set -a; source .env.local; set +a
//   node scripts/gmail-auth.mjs
//   → sign in as the receipts mailbox (NOT your personal/owner account)
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
    // select_account forces the account picker — without it Google silently uses
    // whoever is already signed in, which is how you end up authorising the
    // wrong mailbox. consent forces a refresh token even if previously granted.
    prompt: "select_account consent",
    ...(process.env.GMAIL_RECEIPTS_MAILBOX
      ? { login_hint: process.env.GMAIL_RECEIPTS_MAILBOX }
      : {}),
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

  const address = who.emailAddress ?? "(unknown)";
  console.log(`\nAuthorised mailbox: ${address}  (${who.messagesTotal ?? "?"} messages)`);

  // Guard against consenting with the wrong Google account — pointing the poller
  // at a real inbox would scan every attachment in it (an AI call each).
  const expected = process.env.GMAIL_RECEIPTS_MAILBOX;
  if (expected && address.toLowerCase() !== expected.toLowerCase()) {
    res.end(`Wrong account: ${address}. Close this tab and see the terminal.`);
    console.error(
      `\n✗ Expected ${expected} but you signed in as ${address}.\n` +
        `  Nothing was saved. Re-run and pick the right account (use the\n` +
        `  account switcher on the consent screen, or an incognito window).\n`,
    );
    server.close();
    process.exit(1);
  }
  if (!expected) {
    console.log("  (set GMAIL_RECEIPTS_MAILBOX to have this checked automatically)");
  }

  res.end("Authorised. You can close this tab and return to the terminal.");
  console.log(`\nAdd to .env.local and Vercel:\n\nGMAIL_REFRESH_TOKEN="${token.refresh_token}"\n`);
  server.close();
});

server.listen(PORT, () => {
  console.log(`Opening Google consent…\nIf it doesn't open, visit:\n${authUrl}\n`);
  exec(`open "${authUrl}"`);
});
