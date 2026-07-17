import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { DocumentEmail } from "@typings/document-email/DocumentEmail";
import { DocumentEmailEvent } from "@interfaces/services/DocumentEmailEvent";
import { EmailState } from "@interfaces/models/document-email/EmailState";
import { latestEmailState } from "@utils/email-status";
import { fetchAllRows } from "@services/supabase/fetch-all";

export type DocumentParentType = "invoice" | "estimate";

/**
 * Record that a document was emailed, so Resend's webhook has something to
 * attach delivery events to. One row per send — a resend or a recurring run
 * gets its own row rather than overwriting the last one.
 *
 * Best-effort: tracking must never be the reason a send is reported as failed.
 * The email has already left by the time this runs.
 */
export const recordDocumentEmail = async (
  sb: SupabaseClient,
  input: {
    userId: string;
    parentType: DocumentParentType;
    parentId: string;
    resendEmailId: string;
    recipient: string;
  },
): Promise<void> => {
  const { error } = await sb.from("document_emails").insert({
    user_id: input.userId,
    parent_type: input.parentType,
    parent_id: input.parentId,
    resend_email_id: input.resendEmailId,
    recipient: input.recipient,
  });
  if (error) console.error("recordDocumentEmail failed", error.message);
};

/**
 * One glance-state per document of a kind, for a whole list at once.
 *
 * The listing needs "was this invoice viewed" per row; querying each invoice
 * would be an N+1. Instead this pulls every send for the kind in one go (RLS
 * scopes it to the user, and one row per send keeps the table small) and
 * reduces to the latest state per parent. Paged past the 1,000-row cap so a
 * busy account doesn't silently lose the oldest documents' markers.
 */
export const getEmailStates = async (
  sb: SupabaseClient,
  parentType: DocumentParentType,
): Promise<Map<string, EmailState>> => {
  const rows = await fetchAllRows<DocumentEmail>((from, to) =>
    sb
      .from("document_emails")
      .select("*")
      .eq("parent_type", parentType)
      .order("sent_at", { ascending: false })
      // Stable tiebreak: a recurring batch writes many rows at the same now(),
      // and fetchAllRows pages with two independent queries — without it, tied
      // rows can sort differently across the 1000-row boundary and a document's
      // newest send could be skipped, dropping its icon.
      .order("id", { ascending: false })
      .range(from, to),
  );

  const byParent = new Map<string, DocumentEmail[]>();
  for (const row of rows) {
    const list = byParent.get(row.parent_id);
    if (list) list.push(row);
    else byParent.set(row.parent_id, [row]);
  }

  const states = new Map<string, EmailState>();
  for (const [parentId, list] of byParent) {
    const state = latestEmailState(list);
    if (state) states.set(parentId, state);
  }
  return states;
};

/** Every send of one document, newest first. */
export const listDocumentEmails = async (
  sb: SupabaseClient,
  parentType: DocumentParentType,
  parentId: string,
): Promise<DocumentEmail[]> => {
  const { data } = await sb
    .from("document_emails")
    .select("*")
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("sent_at", { ascending: false });
  return data ?? [];
};

/**
 * Stamp a delivery event onto the matching send. Called by the Resend webhook
 * with the admin client (the request has no session).
 *
 * First event of each kind wins — the `is null` guard means a redelivered
 * webhook, or the third open of the same email, leaves the original timestamp
 * alone. Returns false when no send matches, which is normal: the account also
 * sends mail we don't track.
 */
export const stampDocumentEmailEvent = async (
  admin: SupabaseClient,
  resendEmailId: string,
  event: DocumentEmailEvent,
): Promise<boolean> => {
  const column = EVENT_COLUMNS[event.type];
  if (!column) return false;

  let query = admin
    .from("document_emails")
    .update(
      event.type === "bounced"
        ? { bounced_at: event.occurredAt, bounce_reason: event.reason ?? null }
        : { [column]: event.occurredAt },
    )
    .eq("resend_email_id", resendEmailId);

  // Don't let a webhook retry, or a later open, move the first timestamp.
  query = query.is(column, null);

  const { data, error } = await query.select("id");
  if (error) {
    console.error("stampDocumentEmailEvent failed", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
};

// Resend event type (minus the "email." prefix) → the column it stamps.
// Anything absent here is an event we don't track and is ignored.
const EVENT_COLUMNS: Record<string, string | undefined> = {
  delivered: "delivered_at",
  opened: "opened_at",
  bounced: "bounced_at",
};
