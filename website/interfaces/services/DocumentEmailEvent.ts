/** A Resend delivery webhook, reduced to the part we store. */
export interface DocumentEmailEvent {
  /** Resend's event type with the "email." prefix stripped: delivered | opened | bounced. */
  type: string;
  /** When Resend recorded it — the event's own timestamp, not our receipt time. */
  occurredAt: string;
  /** Why it bounced. Only present on a bounce. */
  reason?: string | null;
}
