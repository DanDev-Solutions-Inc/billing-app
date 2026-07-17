import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Resend } from "resend";
import { BUSINESS } from "@utils/constants";

export interface SendDocEmailInput {
  to: string;
  kind: "invoice" | "estimate";
  number: string;
  total: string; // formatted money
  filename: string;
  pdf: Buffer;
}

// Black wordmark, loaded once and embedded inline (cid:) so it renders for
// every recipient without depending on a public asset URL.
let logoCache: Buffer | null = null;
const loadLogo = (): Buffer | undefined => {
  if (logoCache) return logoCache;
  try {
    logoCache = readFileSync(
      path.join(process.cwd(), "public", "brand", "DavdevSolutionsDark.png"),
    );
    return logoCache;
  } catch {
    return undefined;
  }
};

export const sendDocumentEmail = async (input: SendDocEmailInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  if (!apiKey || !from) {
    return { error: "Email is not configured (RESEND_API_KEY / INVOICE_FROM_EMAIL)." };
  }

  const resend = new Resend(apiKey);
  const label = input.kind === "invoice" ? "Invoice" : "Estimate";
  const subject = `${label} #${input.number} from ${BUSINESS.name}`;

  const logo = loadLogo();
  const body = documentEmail(label, input.number, input.total, !!logo);

  const attachments: {
    filename: string;
    content: Buffer;
    contentType?: string;
    contentId?: string;
  }[] = [{ filename: input.filename, content: input.pdf }];
  if (logo) {
    attachments.push({
      filename: "dandev-logo.png",
      content: logo,
      contentType: "image/png",
      contentId: "brand-logo", // referenced in the HTML as cid:brand-logo
    });
  }

  const { data, error } = await resend.emails.send({
    from: `${BUSINESS.name} <${from}>`,
    to: input.to,
    // No replyTo: `from` is a no-reply address on the inbound domain, so a
    // reply would land on the receipts webhook rather than a mailbox. The
    // template points clients at BUSINESS.contactEmail instead.
    subject,
    html: body.html,
    text: body.text, // plain-text alternative (multipart) — key spam-filter signal
    attachments,
  });

  if (error) return { error: error.message };
  // Resend's id for this message. Every delivery webhook echoes it back as
  // `data.email_id`, so it's the only way to tie an open or a bounce to the
  // document that was sent — see recordDocumentEmail().
  return { ok: true as const, emailId: data?.id ?? null };
};

export interface SendInviteEmailInput {
  to: string;
  role: "viewer" | "editor";
  /** The person doing the inviting — their name or email, for the copy. */
  invitedBy: string;
  /** Absolute URL of the signup page. */
  signupUrl: string;
}

/**
 * Tell someone they've been granted access to the owner's books.
 *
 * The access grant is a pre-authorization keyed by email: it only takes effect
 * once they sign up with *this* address. So the email's whole job is to say
 * that and link them to signup — the mismatch (grant exists, no account) is
 * exactly what leaves people waiting for an email that never came.
 */
export const sendAccessInviteEmail = async (
  input: SendInviteEmailInput,
): Promise<{ ok?: true; error?: string }> => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  if (!apiKey || !from) {
    return {
      error: "Email is not configured (RESEND_API_KEY / INVOICE_FROM_EMAIL).",
    };
  }

  const canEdit = input.role === "editor";
  const access = canEdit
    ? "view and edit the books"
    : "view the books (read-only)";
  const body = inviteEmail(input.invitedBy, access, input.signupUrl, input.to);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${BUSINESS.name} <${from}>`,
    to: input.to,
    subject: `You've been given access to ${BUSINESS.name}'s billing`,
    html: body.html,
    text: body.text,
  });
  if (error) return { error: error.message };
  return { ok: true };
};

// Brand tokens — mirror app/globals.css (:root).
const BLUE = "#144783"; // --brand-blue
const ACCENT = "#2f6fc4"; // --brand-accent (links)
const INK = "#151515"; // --foreground
const MUTED = "#64707d"; // --muted-foreground
const LINE = "#e3e7ec"; // --border
const CANVAS = "#f5f6f8"; // --background
const PANEL = "#eaf0f8"; // --accent (subtle blue tint)

/**
 * Access-invite email. Same table-based, inline-styled, plain-text-twin shape
 * as the document email so it renders and lands the same way, but pared down to
 * one message and one call-to-action.
 */
const inviteEmail = (
  invitedBy: string,
  access: string,
  signupUrl: string,
  email: string,
) => {
  const preheader = `You've been given access to ${BUSINESS.name}'s billing on DanDev Billing.`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
        <tr><td style="background:${BLUE};padding:20px 32px;">
          <span style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;">DanDev Billing</span>
        </td></tr>
        <tr><td style="padding:28px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:${INK};font-size:16px;line-height:1.55;">
          <p style="margin:0 0 14px;">${invitedBy} has invited you to <strong>${access}</strong> for ${BUSINESS.name}.</p>
          <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Create an account using <strong style="color:${INK};">${email}</strong> — this exact address — and you'll see their books as soon as you're signed in.</p>
        </td></tr>
        <tr><td style="padding:4px 32px 28px;">
          <a href="${signupUrl}" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px;">Create your account</a>
        </td></tr>
        <tr><td style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;color:${MUTED};font-size:12px;line-height:1.5;border-top:1px solid ${LINE};padding-top:16px;">
          If you weren't expecting this, you can ignore it — no account is created until you sign up. Questions? <a href="mailto:${BUSINESS.contactEmail}" style="color:${ACCENT};text-decoration:none;">${BUSINESS.contactEmail}</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const text = [
    `${invitedBy} has invited you to ${access} for ${BUSINESS.name}.`,
    "",
    `Create an account using ${email} (this exact address) and you'll see their books once you're signed in:`,
    signupUrl,
    "",
    "If you weren't expecting this, you can ignore it — no account is created until you sign up.",
    `Questions? ${BUSINESS.contactEmail}`,
  ].join("\n");

  return { html, text };
};

/**
 * Transactional invoice/estimate email, styled to the DanDev brand. Table-based
 * with inline styles and a plain-text twin — the layout most resilient across
 * mail clients and least likely to trip spam filters. Includes the physical
 * mailing address, which inbox providers treat as a legitimacy signal.
 */
const documentEmail = (
  label: string,
  number: string,
  total: string,
  hasLogo: boolean,
) => {
  const lower = label.toLowerCase();
  const address = BUSINESS.addressLines.join(", ");
  const url = BUSINESS.website.replace(/^https?:\/\//, "");
  const preheader = `Your ${lower} #${number} from ${BUSINESS.name} — total ${total}. PDF attached.`;

  const brandmark = hasLogo
    ? `<img src="cid:brand-logo" width="168" alt="${BUSINESS.name}" style="display:block;border:0;outline:none;text-decoration:none;width:168px;max-width:60%;height:auto;" />`
    : `<div style="font-size:20px;font-weight:bold;color:${INK};">${BUSINESS.name}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>${label} ${number}</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CANVAS};">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:8px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${BLUE};background:linear-gradient(90deg,#2f6fd0,#3b3f63,#d0533f);">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 6px;">
              ${brandmark}
              <h1 style="margin:20px 0 0;font-size:22px;line-height:1.2;color:${BLUE};font-weight:bold;">${label} #${number}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;color:${INK};font-size:15px;line-height:1.55;">
              <p style="margin:12px 0;">Hi,</p>
              <p style="margin:12px 0;">Please find your ${lower} from <strong>${BUSINESS.name}</strong> attached as a PDF.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PANEL};border:1px solid ${LINE};border-radius:6px;">
                <tr>
                  <td style="padding:14px 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <span style="color:${MUTED};font-size:13px;">Total due</span><br />
                    <span style="color:${INK};font-size:22px;font-weight:bold;">${total}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px 0;">
              <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Payment options</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${INK};line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                <tr>
                  <td style="padding:3px 0;width:90px;color:${MUTED};vertical-align:top;">Cheque</td>
                  <td style="padding:3px 0;">Payable to ${BUSINESS.payment.chequePayableTo}</td>
                </tr>
                <tr>
                  <td style="padding:3px 0;color:${MUTED};vertical-align:top;">e-Transfer</td>
                  <td style="padding:3px 0;"><a href="mailto:${BUSINESS.payment.etransferEmail}" style="color:${ACCENT};text-decoration:none;">${BUSINESS.payment.etransferEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:3px 0;color:${MUTED};vertical-align:top;">Wire / EFT</td>
                  <td style="padding:3px 0;">
                    ${BUSINESS.bank.name}<br />
                    Institution ${BUSINESS.bank.institution} &nbsp;·&nbsp; Transit ${BUSINESS.bank.transit} &nbsp;·&nbsp; Account ${BUSINESS.bank.account}<br />
                    <span style="color:${MUTED};">SWIFT/BIC ${BUSINESS.bank.swift} (international)</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 0;color:${INK};font-size:15px;line-height:1.55;">
              <p style="margin:6px 0;">${BUSINESS.footerNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <hr style="border:none;border-top:1px solid ${LINE};margin:0 0 16px;" />
              <div style="color:${MUTED};font-size:12px;line-height:1.6;">
                <strong style="color:${INK};">${BUSINESS.name}</strong><br />
                ${address}<br />
                ${BUSINESS.phoneLabel}: ${BUSINESS.phone} &nbsp;·&nbsp;
                <a href="https://${url}" style="color:${ACCENT};text-decoration:none;">${url}</a><br />
                Questions? <a href="mailto:${BUSINESS.contactEmail}" style="color:${ACCENT};text-decoration:none;">${BUSINESS.contactEmail}</a>
              </div>
              <div style="color:${MUTED};font-size:11px;line-height:1.5;margin-top:12px;">
                Sent from an unmonitored address — replies to this message aren't received.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `${label} #${number} from ${BUSINESS.name}`,
    ``,
    `Hi,`,
    ``,
    `Please find your ${lower} from ${BUSINESS.name} attached as a PDF.`,
    ``,
    `Total due: ${total}`,
    ``,
    `Payment options:`,
    `  Cheque      Payable to ${BUSINESS.payment.chequePayableTo}`,
    `  e-Transfer  ${BUSINESS.payment.etransferEmail}`,
    `  Wire / EFT  ${BUSINESS.bank.name}`,
    `              Institution ${BUSINESS.bank.institution} · Transit ${BUSINESS.bank.transit} · Account ${BUSINESS.bank.account}`,
    `              SWIFT/BIC ${BUSINESS.bank.swift} (international)`,
    ``,
    BUSINESS.footerNote,
    ``,
    `—`,
    BUSINESS.name,
    address,
    `${BUSINESS.phoneLabel}: ${BUSINESS.phone}`,
    `https://${url}`,
    `Questions? ${BUSINESS.contactEmail}`,
    ``,
    `Sent from an unmonitored address — replies to this message aren't received.`,
  ].join("\n");

  return { html, text };
};
