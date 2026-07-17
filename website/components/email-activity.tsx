import { Card, CardHeader, CardTitle, CardContent } from "@components/ui";
import { formatDateTime } from "@utils/money";
import { DocumentEmail } from "@typings/document-email/DocumentEmail";

/**
 * What happened to each emailed copy of a document, newest first.
 *
 * One row per send — a resend or a recurring run is its own row, because each
 * has its own fate. Renders nothing until the document has been emailed once.
 */
export const EmailActivity = ({ emails }: { emails: DocumentEmail[] }) => {
  if (emails.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          {emails.map((email) => {
            const state = describe(email);
            return (
              <li
                key={email.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <div className="min-w-0">
                  <span className={`font-medium ${state.tone}`}>
                    {state.label}
                  </span>
                  <span className="text-muted-foreground">
                    {" · "}
                    {email.recipient}
                  </span>
                  {state.detail && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {state.detail}
                    </span>
                  )}
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatDateTime(state.at)}
                </span>
              </li>
            );
          })}
        </ul>
        {emails.some((e) => e.opened_at) && (
          /* Open tracking is a pixel: Apple Mail loads it without the recipient
             doing anything, and a firewall that blocks images hides a real read.
             Saying so here is cheaper than someone chasing a phantom open. */
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            Opens are approximate — some mail apps load tracking images
            automatically, and others block them.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/* The furthest the message got. Ordered worst-to-best deliberately: a bounce
   outranks an open, since a bounce after an open means a later attempt failed
   and that's the part worth acting on. */
const describe = (email: DocumentEmail) => {
  if (email.bounced_at)
    return {
      label: "Bounced",
      at: email.bounced_at,
      tone: "text-brand-red",
      detail: email.bounce_reason,
    };
  if (email.opened_at)
    return { label: "Opened", at: email.opened_at, tone: "text-foreground" };
  if (email.delivered_at)
    return {
      label: "Delivered",
      at: email.delivered_at,
      tone: "text-foreground",
    };
  return { label: "Sent", at: email.sent_at, tone: "text-muted-foreground" };
};
