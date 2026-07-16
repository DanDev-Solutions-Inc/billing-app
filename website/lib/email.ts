import "server-only";
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

export const sendDocumentEmail = async (input: SendDocEmailInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  if (!apiKey || !from) {
    return { error: "Email is not configured (RESEND_API_KEY / INVOICE_FROM_EMAIL)." };
  }

  const resend = new Resend(apiKey);
  const label = input.kind === "invoice" ? "Invoice" : "Estimate";
  const subject = `${label} ${input.number} from ${BUSINESS.name}`;

  const { error } = await resend.emails.send({
    from: `${BUSINESS.name} <${from}>`,
    to: input.to,
    subject,
    html: emailHtml(label, input.number, input.total),
    attachments: [{ filename: input.filename, content: input.pdf }],
  });

  if (error) return { error: error.message };
  return { ok: true as const };
};

const emailHtml = (label: string, number: string, total: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#151515;max-width:520px">
    <h2 style="color:#144783;margin:0 0 12px">${label} ${number}</h2>
    <p>Hi,</p>
    <p>Please find your ${label.toLowerCase()} from <strong>${BUSINESS.name}</strong> attached as a PDF.</p>
    <p style="font-size:18px;margin:16px 0"><strong>Total: ${total}</strong></p>
    <p style="color:#64707d">${BUSINESS.defaultTerms}</p>
    <p style="color:#64707d">${BUSINESS.footerNote}</p>
    <hr style="border:none;border-top:1px solid #e3e7ec;margin:20px 0" />
    <p style="color:#64707d;font-size:13px">${BUSINESS.name} · ${BUSINESS.website}</p>
  </div>`;
