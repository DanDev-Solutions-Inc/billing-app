import { createClient } from "@lib/supabase/server";
import { getUser } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { getEstimate } from "@services/supabase/estimate";
import { listLineItems } from "@services/supabase/line-item";

export const runtime = "nodejs";

export const GET = async (
  _req: Request,
  ctx: RouteContext<"/estimates/[id]/pdf">,
) => {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const estimate = await getEstimate(supabase, id);
  if (!estimate) return new Response("Not found", { status: 404 });

  const items = await listLineItems(supabase, "estimate", id);
  const pdf = await renderDocumentPdf({
    kind: "ESTIMATE",
    currency: estimate.currency,
    number: estimate.estimate_number,
    issueDate: estimate.issue_date,
    secondLabel: "Expires",
    secondDate: estimate.expiry_date,
    amountDue: estimate.total,
    customer: estimate.customers,
    items,
    subtotal: estimate.subtotal,
    tax: estimate.tax,
    total: estimate.total,
    notes: estimate.notes,
  });

  const filename = `Estimate_${estimate.estimate_number ?? id.slice(0, 8)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
};
