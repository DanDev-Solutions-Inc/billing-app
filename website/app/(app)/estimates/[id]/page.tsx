import { Metadata } from "next";
import { Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getEstimate } from "@services/supabase/estimate";
import { listLineItems } from "@services/supabase/line-item";
import { DocumentDetail } from "@components/document-detail";
import { Button, ButtonLink, Card } from "@components/ui";
import { SendButton } from "@components/send-button";
import {
  setEstimateStatus,
  convertToInvoice,
  deleteEstimate,
  sendEstimate,
} from "../actions";
import { StatusButtonProps } from "@interfaces/components/StatusButtonProps";

export const metadata: Metadata = { title: "Estimate" };

const StatusButton = ({
  id,
  status,
  label,
  variant = "secondary",
}: StatusButtonProps) => (
  <form action={setEstimateStatus}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="status" value={status} />
    <Button type="submit" variant={variant}>
      {label}
    </Button>
  </form>
);

const EstimatePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const est = await getEstimate(supabase, id);
  if (!est) notFound();

  const items = await listLineItems(supabase, "estimate", id);
  const converted = Boolean(est.converted_invoice_id);

  return (
    <DocumentDetail
      backHref="/estimates"
      heading="Estimate"
      number={est.estimate_number}
      status={est.status}
      customer={est.customers}
      issueDate={est.issue_date}
      secondDateLabel="Expires"
      secondDate={est.expiry_date}
      items={items}
      subtotal={est.subtotal}
      tax={est.tax}
      total={est.total}
      notes={est.notes}
      banner={
        converted ? (
          <Card className="border-brand-green/30 bg-brand-green/5 px-5 py-3 text-sm text-brand-green">
            Converted to an invoice.{" "}
            <Link
              href={`/invoices/${est.converted_invoice_id}`}
              className="font-semibold underline"
            >
              View invoice
            </Link>
          </Card>
        ) : undefined
      }
      actionBar={
        <div className="flex flex-wrap items-center gap-2">
          {est.status === "draft" && (
            <StatusButton id={est.id} status="sent" label="Mark as sent" />
          )}
          {(est.status === "draft" || est.status === "sent") && (
            <>
              <StatusButton
                id={est.id}
                status="accepted"
                label="Accepted"
                variant="primary"
              />
              <StatusButton id={est.id} status="declined" label="Declined" />
            </>
          )}
          {est.status === "accepted" && !converted && (
            <form action={convertToInvoice}>
              <input type="hidden" name="id" value={est.id} />
              <Button type="submit" variant="primary">
                Convert to invoice
              </Button>
            </form>
          )}
          <SendButton id={est.id} action={sendEstimate} />
          <ButtonLink href={`/estimates/${est.id}/edit`} variant="secondary">
            <Pencil />
            Edit
          </ButtonLink>
          <ButtonLink
            href={`/estimates/${est.id}/pdf`}
            variant="secondary"
            target="_blank"
          >
            PDF
          </ButtonLink>
          <form action={deleteEstimate}>
            <input type="hidden" name="id" value={est.id} />
            <Button type="submit" variant="dangerGhost">
              <Trash2 />
              Delete
            </Button>
          </form>
        </div>
      }
    />
  );
};

export default EstimatePage;
