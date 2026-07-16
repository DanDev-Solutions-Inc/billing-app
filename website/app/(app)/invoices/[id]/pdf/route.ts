import { createClient } from "@lib/supabase/server";
import { getUser } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { getInvoice } from "@services/supabase/invoice";
import { listLineItems } from "@services/supabase/line-item";

export const runtime = "nodejs";

export const GET = async (
  _req: Request,
  ctx: RouteContext<"/invoices/[id]/pdf">,
) => {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const invoice = await getInvoice(supabase, id);
  if (!invoice) return new Response("Not found", { status: 404 });

  const items = await listLineItems(supabase, "invoice", id);
  const pdf = await renderDocumentPdf({
    kind: "INVOICE",
    number: invoice.invoice_number,
    issueDate: invoice.issue_date,
    secondLabel: "Payment Due",
    secondDate: invoice.due_date,
    amountDue: invoice.status === "paid" ? 0 : invoice.total,
    customer: invoice.customers,
    items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    notes: invoice.notes,
  });

  const filename = `Invoice_${invoice.invoice_number ?? id.slice(0, 8)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
};
