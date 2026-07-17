/** A document's email progress, reduced to one glance-state. */
export interface EmailState {
  key: "sent" | "delivered" | "opened" | "bounced";
  /** Human label — "Viewed", "Delivered", etc. */
  label: string;
  /** Tailwind text-colour class for the label/icon. */
  tone: string;
  /** ISO timestamp of that milestone. */
  at: string;
  /** Extra context, e.g. a bounce reason. */
  detail?: string | null;
}
