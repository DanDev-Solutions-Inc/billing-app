import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getInvoice } from "@services/supabase/invoice";
import { listLineItems } from "@services/supabase/line-item";
import { DocumentDetail } from "@components/document-detail";
import { Button, ButtonLink } from "@components/ui";
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

  const items = await listLineItems(supabase, "invoice", id);

  return (
    <DocumentDetail
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
      actionBar={
        <div className="flex flex-wrap items-center gap-2">
          {inv.status === "draft" && (
            <StatusButton id={inv.id} status="sent" label="Mark as sent" />
          )}
          {inv.status !== "paid" && (
            <StatusButton
              id={inv.id}
              status="paid"
              label="Mark as paid"
              variant="primary"
            />
          )}
          {inv.status === "paid" && (
            <StatusButton id={inv.id} status="sent" label="Reopen" />
          )}
          <SendButton id={inv.id} action={sendInvoice} />
          <ButtonLink
            href={`/invoices/${inv.id}/pdf`}
            variant="secondary"
            target="_blank"
          >
            PDF
          </ButtonLink>
          <form action={deleteInvoice}>
            <input type="hidden" name="id" value={inv.id} />
            <Button type="submit" variant="ghost">
              Delete
            </Button>
          </form>
        </div>
      }
    />
  );
};

export default InvoicePage;
