/**
 * Every address on file for a customer, primary first.
 *
 * One definition because it's a security rule as much as a convenience: a
 * recipient chosen on a form is only honoured if it appears in this list, so a
 * stale form can't email someone who has since been removed.
 */
export const customerEmails = (
  customer: { email: string | null; secondary_emails: string[] } | null,
): string[] =>
  [customer?.email, ...(customer?.secondary_emails ?? [])].filter(
    (e): e is string => Boolean(e),
  );
