import "server-only";
import { getAccessToken } from "@services/gmail/client";
import {
  listMessageIds,
  getMessage,
  getAttachmentBytes,
} from "@services/gmail/messages";
import { ingestAttachment } from "@services/receipts/ingest-attachment";
import { SupabaseClient } from "@typings/SupabaseClient";
import { PollReceiptsResult } from "@interfaces/services/PollReceiptsResult";

// Only messages that could carry a receipt. Gmail's own query does the filtering
// so we never download unrelated mail.
const QUERY = "has:attachment";

/**
 * Poll the dedicated receipts mailbox and ingest any new attachments.
 *
 * Every receipt is filed against GMAIL_RECEIPTS_USER_ID (the mailbox is shared
 * business-wide, not per-user). Idempotent: receipts.source_message_id is unique,
 * so a re-run — or a retry after a partial failure — skips what already landed.
 */
export const pollReceiptsMailbox = async (
  admin: SupabaseClient,
): Promise<PollReceiptsResult> => {
  const userId = process.env.GMAIL_RECEIPTS_USER_ID;
  if (!userId) return { error: "GMAIL_RECEIPTS_USER_ID is not set." };

  const accessToken = await getAccessToken();
  if (!accessToken)
    return { error: "Gmail is not authorised (check GMAIL_REFRESH_TOKEN)." };

  const ids = await listMessageIds(accessToken, QUERY);
  let created = 0;
  let skipped = 0;

  for (const id of ids) {
    const message = await getMessage(accessToken, id);
    if (!message || message.attachments.length === 0) continue;

    for (const [index, att] of message.attachments.entries()) {
      // One message can hold several receipts — key each attachment separately.
      const sourceMessageId = `gmail:${id}:${index}`;
      const bytes = await getAttachmentBytes(accessToken, id, att.attachmentId);
      if (!bytes) continue;

      const result = await ingestAttachment(admin, {
        userId,
        filename: att.filename,
        contentType: att.contentType,
        bytes,
        subject: message.subject,
        sourceMessageId,
      });
      if (result) created += 1;
      else skipped += 1;
    }
  }

  return { scanned: ids.length, created, skipped };
};
