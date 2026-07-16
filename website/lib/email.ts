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

  const { error } = await resend.emails.send({
    from: `${BUSINESS.name} <${from}>`,
    to: input.to,
    replyTo: from, // a real, monitored mailbox — helps deliverability
    subject,
    html: body.html,
    text: body.text, // plain-text alternative (multipart) — key spam-filter signal
    attachments,
  });

  if (error) return { error: error.message };
  return { ok: true as const };
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
  const preheader = `Your ${lower} ${number} from ${BUSINESS.name} — total ${total}. PDF attached.`;

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
              <h1 style="margin:20px 0 0;font-size:22px;line-height:1.2;color:${BLUE};font-weight:bold;">${label} ${number}</h1>
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
            <td style="padding:8px 32px 0;color:${MUTED};font-size:14px;line-height:1.55;">
              <p style="margin:12px 0;">${BUSINESS.defaultTerms}</p>
              <p style="margin:12px 0;">${BUSINESS.footerNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <hr style="border:none;border-top:1px solid ${LINE};margin:0 0 16px;" />
              <div style="color:${MUTED};font-size:12px;line-height:1.6;">
                <strong style="color:${INK};">${BUSINESS.name}</strong><br />
                ${address}<br />
                ${BUSINESS.phoneLabel}: ${BUSINESS.phone} &nbsp;·&nbsp;
                <a href="https://${url}" style="color:${ACCENT};text-decoration:none;">${url}</a>
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
    `${label} ${number} from ${BUSINESS.name}`,
    ``,
    `Hi,`,
    ``,
    `Please find your ${lower} from ${BUSINESS.name} attached as a PDF.`,
    ``,
    `Total due: ${total}`,
    ``,
    BUSINESS.defaultTerms,
    BUSINESS.footerNote,
    ``,
    `—`,
    BUSINESS.name,
    address,
    `${BUSINESS.phoneLabel}: ${BUSINESS.phone}`,
    `https://${url}`,
  ].join("\n");

  return { html, text };
};
