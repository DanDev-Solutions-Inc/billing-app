/**
 * Where a receipt came from.
 *
 * A hand-written union, not `Enums["receipt_source"]`: `receipts.source` is a
 * plain text column with a default of 'upload', so there's no Postgres enum to
 * derive from. Only two writers exist — the uploader and the inbound webhook.
 */
export type ReceiptSource = "upload" | "email";
