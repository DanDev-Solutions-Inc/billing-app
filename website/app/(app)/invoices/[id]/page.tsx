import { Metadata } from "next";
import { Trash2, Pencil, FileDown } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getInvoice } from "@services/supabase/invoice";
import { listLineItems } from "@services/supabase/line-item";
import { listInvoicePayments } from "@services/supabase/invoice-payment";
import { listDocumentEmails } from "@services/supabase/document-email";
import { DocumentDetail } from "@components/document-detail";
import { EmailActivity } from "@components/email-activity";
import { EmailStatusIcon } from "@components/email-status-icon";
import { PaymentHistory } from "@components/invoices/payment-history";
import { RecordPaymentButton } from "@components/invoices/record-payment-button";
import { latestEmailState } from "@utils/email-status";
import { balanceOf, paidOf, paymentStatus } from "@utils/invoice";
import { toCurrency } from "@utils/currency";
import {
  Button,
  ButtonLink,
  Menu,
  MenuItem,
  MenuSeparator,
} from "@components/ui";
import { SendButton } from "@components/send-button";
import { setInvoiceStatus, deleteInvoice, sendInvoice } from "../actions";
import { StatusButtonProps } from "@interfaces/components/StatusButtonProps";

export const metadata: Metadata = { title: "Invoice" };

const StatusButton = ({
  id,
  status,
  label,
  variant = "secondary",
}: StatusButtonProps) => (
  <form action={setInvoiceStatus}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="status" value={status} />
    <Button type="submit" variant={variant}>
      {label}
    </Button>
  </form>
);

const InvoicePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const inv = await getInvoice(supabase, id);
  if (!inv) notFound();

  /* Primary first, then any extras — the picker's order is the fallback order. */
  const customerEmails = [
    inv.customers?.email,
    ...(inv.customers?.secondary_emails ?? []),
  ].filter(Boolean) as string[];

  const items = await listLineItems(supabase, "invoice", id);
  const emails = await listDocumentEmails(supabase, "invoice", id);
  const payments = await listInvoicePayments(supabase, id);

  const balance = balanceOf(inv);
  const currency = toCurrency(inv.currency);

  return (
    <DocumentDetail
      emailActivity={<EmailActivity emails={emails} />}
      payments={
        <PaymentHistory
          payments={payments}
          total={inv.total}
          paid={paidOf(inv)}
          balance={balance}
          currency={currency}
        />
      }
      emailStatus={<EmailStatusIcon state={latestEmailState(emails)} />}
      backHref="/invoices"
      heading="Invoice"
      number={inv.invoice_number}
      /* Not inv.status: "partial" and "overdue" are what the numbers say, and
         the enum has neither. */
      status={paymentStatus(inv)}
      customer={inv.customers}
      issueDate={inv.issue_date}
      secondDateLabel="Due"
      secondDate={inv.due_date}
      items={items}
      subtotal={inv.subtotal}
      tax={inv.tax}
      total={inv.total}
      notes={inv.notes}
      /* Two actions carry the invoice forward — get paid, and send it. The
         rest are occasional, so they live behind the overflow rather than
         competing as six equal buttons. */
      actionBar={
        /* Mobile: primary + overflow share the top row (the menu pinned to the
           right so it can't be pushed off-screen), and the long "Email to
           customer" takes the full row beneath. Inline from sm.
           Previously one nowrap row — "Email to customer" pushed the menu past
           the edge and it was unreachable. */
        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap [&>form]:flex-1 [&>form>button]:w-full sm:[&>form]:flex-none sm:[&>form>button]:w-auto">
          {/* Was "Mark as paid", which could only mean all of it. The modal
              defaults to the full balance, so settling an invoice is still one
              button and one confirm — a deposit is now expressible too. */}
          {balance > 0 && (
            <RecordPaymentButton
              id={inv.id}
              balance={balance}
              currency={currency}
              className="w-full sm:w-auto"
            />
          )}
          <SendButton
            id={inv.id}
            action={sendInvoice}
            emails={customerEmails}
            className="order-last col-span-2 sm:order-none sm:col-auto"
          />

          <Menu className="shrink-0">
            {inv.status === "draft" && (
              <MenuItem>
                <StatusButton
                  id={inv.id}
                  status="sent"
                  label="Mark as sent"
                  variant="ghost"
                />
              </MenuItem>
            )}
            {/* Reopening is deleting the payment that closed it — that's in
                the Payments card, where the amount and date being undone are
                visible. This is only for an invoice marked paid with nothing
                recorded against it, which the backfill left none of but a
                zero-dollar invoice can still be. */}
            {inv.status === "paid" && payments.length === 0 && (
              <MenuItem>
                <StatusButton
                  id={inv.id}
                  status="sent"
                  label="Reopen"
                  variant="ghost"
                />
              </MenuItem>
            )}
            <MenuItem>
              <ButtonLink href={`/invoices/${inv.id}/edit`} variant="ghost">
                <Pencil />
                Edit
              </ButtonLink>
            </MenuItem>
            <MenuItem>
              <ButtonLink
                href={`/invoices/${inv.id}/pdf`}
                variant="ghost"
                target="_blank"
              >
                <FileDown />
                Download PDF
              </ButtonLink>
            </MenuItem>
            <MenuSeparator />
            <MenuItem>
              <form action={deleteInvoice}>
                <input type="hidden" name="id" value={inv.id} />
                <Button type="submit" variant="dangerGhost">
                  <Trash2 />
                  Delete
                </Button>
              </form>
            </MenuItem>
          </Menu>
        </div>
      }
    />
  );
};

export default InvoicePage;
