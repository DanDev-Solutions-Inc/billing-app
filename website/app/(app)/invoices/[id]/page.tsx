import { Metadata } from "next";
import { Trash2, Pencil, FileDown } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getInvoice } from "@services/supabase/invoice";
import { listLineItems } from "@services/supabase/line-item";
import { listDocumentEmails } from "@services/supabase/document-email";
import { DocumentDetail } from "@components/document-detail";
import { EmailActivity } from "@components/email-activity";
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

  return (
    <DocumentDetail
      emailActivity={<EmailActivity emails={emails} />}
      backHref="/invoices"
      heading="Invoice"
      number={inv.invoice_number}
      status={inv.status}
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
        /* Mobile: the two actions share the row and stretch; the overflow keeps
           its natural width at the end. */
        <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-wrap [&>form]:flex-1 [&>form>button]:w-full sm:[&>form]:flex-none sm:[&>form>button]:w-auto">
          {inv.status !== "paid" && (
            <StatusButton
              id={inv.id}
              status="paid"
              label="Mark as paid"
              variant="primary"
            />
          )}
          <SendButton
            id={inv.id}
            action={sendInvoice}
            emails={customerEmails}
          />

          <Menu>
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
            {inv.status === "paid" && (
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
