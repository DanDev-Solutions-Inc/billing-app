import { DocumentEmail } from "@typings/document-email/DocumentEmail";
import { EmailState } from "@interfaces/models/document-email/EmailState";

/**
 * The furthest a single emailed copy got.
 *
 * Ordered worst-to-best deliberately: a bounce outranks an open, because a
 * bounce recorded after an open means a later attempt failed, and the failure
 * is the part worth acting on.
 */
export const documentEmailState = (email: DocumentEmail): EmailState => {
  if (email.bounced_at)
    return {
      key: "bounced",
      label: "Bounced",
      tone: "text-brand-red",
      at: email.bounced_at,
      detail: email.bounce_reason,
    };
  if (email.opened_at)
    return {
      key: "opened",
      label: "Viewed",
      tone: "text-brand-green",
      at: email.opened_at,
    };
  if (email.delivered_at)
    return {
      key: "delivered",
      label: "Delivered",
      tone: "text-foreground",
      at: email.delivered_at,
    };
  return {
    key: "sent",
    label: "Sent",
    tone: "text-muted-foreground",
    at: email.sent_at,
  };
};

/**
 * One glance-state for a document from all its sends.
 *
 * Uses the most recent send: a resend or reminder supersedes the last one, so
 * the newest attempt is the current truth of "did this reach the customer".
 * Returns null when the document has never been emailed — the caller shows
 * nothing rather than a misleading "not sent" marker.
 */
export const latestEmailState = (
  emails: DocumentEmail[],
): EmailState | null => {
  if (emails.length === 0) return null;
  const latest = emails.reduce((a, b) =>
    a.sent_at >= b.sent_at ? a : b,
  );
  return documentEmailState(latest);
};
