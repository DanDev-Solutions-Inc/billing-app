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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Estimate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/estimates/${est.id}`}
                      className="text-brand-accent hover:underline"
                    >
                      {est.estimate_number || `#${est.id.slice(0, 8)}`}
                    </Link>
                  </TableCell>
                  <TableCell>{est.customers?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(est.issue_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(est.expiry_date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={est.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(est.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default EstimatesPage;
