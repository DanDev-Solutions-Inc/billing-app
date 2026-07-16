import "server-only";
import { isAnalyzable } from "@lib/ai/analyze-receipt";
import { GmailMessage } from "@interfaces/models/gmail/GmailMessage";
import { GmailAttachment } from "@interfaces/models/gmail/GmailAttachment";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface MessagePart {
  filename?: string;
  mimeType?: string;
  body?: { attachmentId?: string; size?: number };
  parts?: MessagePart[];
  headers?: { name: string; value: string }[];
}

/** Ids of messages with attachments, newest first. */
export const listMessageIds = async (
  accessToken: string,
  query: string,
  max = 25,
): Promise<string[]> => {
  const url = `${API}/messages?q=${encodeURIComponent(query)}&maxResults=${max}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { messages?: { id: string }[] };
  return (json.messages ?? []).map((m) => m.id);
};

export const getMessage = async (
  accessToken: string,
  id: string,
): Promise<GmailMessage | null> => {
  const res = await fetch(`${API}/messages/${id}?format=full`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    id: string;
    payload?: MessagePart;
  };

  const headers = json.payload?.headers ?? [];
  const header = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name)?.value ?? null;

  return {
    id: json.id,
    subject: header("subject"),
    from: header("from"),
    attachments: collectAttachments(json.payload),
  };
};

/** Download one attachment's bytes. */
export const getAttachmentBytes = async (
  accessToken: string,
  messageId: string,
  attachmentId: string,
): Promise<Buffer | null> => {
  const res = await fetch(
    `${API}/messages/${messageId}/attachments/${attachmentId}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: string };
  if (!json.data) return null;
  // Gmail returns base64url, which Buffer decodes natively.
  return Buffer.from(json.data, "base64url");
};

// Attachments can be nested arbitrarily deep (forwarded mail wraps parts in
// multipart/* containers), so walk the whole tree rather than the top level.
const collectAttachments = (part?: MessagePart): GmailAttachment[] => {
  if (!part) return [];
  const out: GmailAttachment[] = [];

  const walk = (p: MessagePart) => {
    const attachmentId = p.body?.attachmentId;
    const mimeType = (p.mimeType ?? "").toLowerCase();
    if (attachmentId && p.filename && isAnalyzable(mimeType)) {
      out.push({
        attachmentId,
        filename: p.filename,
        contentType: mimeType,
        size: p.body?.size ?? 0,
      });
    }
    p.parts?.forEach(walk);
  };

  walk(part);
  return out;
};
