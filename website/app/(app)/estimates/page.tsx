import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listEstimates } from "@services/supabase/estimate";
import {
  PageHeader,
  Card,
  ButtonLink,
  StatusPill,
  EmptyState,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";

export const metadata: Metadata = { title: "Estimates" };

const EstimatesPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const estimates = await listEstimates(supabase);

  return (
    <>
      <PageHeader
        title="Estimates"
        subtitle="Quote work before it becomes an invoice."
        action={<ButtonLink href="/estimates/new">+ New estimate</ButtonLink>}
      />

      {estimates.length === 0 ? (
        <EmptyState
          title="No estimates yet"
          description="Send a quote, then convert it to an invoice when accepted."
          action={
            <ButtonLink href="/estimates/new">+ New estimate</ButtonLink>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-3">Estimate</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {estimates.map((est) => (
                  <tr
                    key={est.id}
                    className="transition hover:bg-surface-muted/40"
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/estimates/${est.id}`}
                        className="text-brand-accent hover:underline"
                      >
                        {est.estimate_number || `#${est.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{est.customers?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted">
                      {formatDate(est.issue_date)}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {formatDate(est.expiry_date)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={est.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">
                      {formatMoney(est.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
};

export default EstimatesPage;
