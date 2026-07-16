export interface IngestAttachmentInput {
  userId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
  subject: string | null;
  /** Mailbox message id — makes ingestion idempotent. Null for direct uploads. */
  sourceMessageId?: string | null;
}
