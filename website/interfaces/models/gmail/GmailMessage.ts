import { GmailAttachment } from "@interfaces/models/gmail/GmailAttachment";

export interface GmailMessage {
  id: string;
  subject: string | null;
  from: string | null;
  attachments: GmailAttachment[];
}
