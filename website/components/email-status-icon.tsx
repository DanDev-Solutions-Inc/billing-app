import { Eye, CheckCheck, Send, AlertTriangle } from "lucide-react";
import { cn } from "@lib/utils";
import { formatDateTime } from "@utils/money";
import { EmailState } from "@interfaces/models/document-email/EmailState";

const ICONS = {
  opened: Eye,
  delivered: CheckCheck,
  sent: Send,
  bounced: AlertTriangle,
} as const;

/**
 * A single glance-icon for a document's email progress — a viewed eye, a
 * delivered double-check, a bounce warning. Renders nothing when the document
 * was never emailed, so an absent icon reads as "not sent yet", never as a
 * failure.
 *
 * The state is title-tipped ("Viewed · Jul 17, 9:49 AM") so hovering explains
 * the icon without a legend. Marked aria-hidden where a text label sits beside
 * it; standalone (the list) it carries an aria-label.
 */
export const EmailStatusIcon = ({
  state,
  className,
}: {
  state: EmailState | null;
  className?: string;
}) => {
  if (!state) return null;
  const Icon = ICONS[state.key];
  const title = `${state.label} · ${formatDateTime(state.at)}`;

  return (
    <span title={title} aria-label={title} className="inline-flex">
      <Icon className={cn("size-4", state.tone, className)} />
    </span>
  );
};
