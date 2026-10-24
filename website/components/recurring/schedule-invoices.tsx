import {
  Card,
  StatusPill,
  SortableHead,
  Pagination,
  RowLink,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@components/ui";
import { formatDate, formatMoney, round2 } from "@utils/money";
import { balanceOf, isOverdue, paidOf, paymentStatus } from "@utils/invoice";
import { ScheduleInvoicesProps } from "@interfaces/components/ScheduleInvoicesProps";

/* Keys match the page's sort accessors. */
const COLUMNS = [
  { key: "invoice_number", label: "Invoice", className: "w-full" },
  { key: "issue_date", label: "Issued", className: "hidden sm:table-cell" },
  { key: "due_date", label: "Due", className: "hidden sm:table-cell" },
  { key: "total", label: "Total", className: "text-right" },
  {
    key: "amount_paid",
    label: "Paid",
    className: "hidden text-right sm:table-cell",
  },
  { key: "status", label: "Status" },
];

/**
 * What a schedule has billed so far: each invoice it raised, whether it went
 * out, and what's been paid. Only invoices the cron created are linked —
 * hand-made and Wave-imported ones for the same customer aren't listed.
 */
export const ScheduleInvoices = ({
  invoices,
  result,
  sort,
  dir,
  sortHref,
  pageHref,
  currency,
  plannedCount,
}: ScheduleInvoicesProps) => {
  const sent = invoices.filter((inv) => inv.status !== "draft").length;
  const paid = invoices.filter((inv) => inv.status === "paid").length;
  const received = round2(invoices.reduce((sum, inv) => sum + paidOf(inv), 0));
  const outstanding = round2(
    invoices
      .filter((inv) => inv.status !== "draft")
      .reduce((sum, inv) => sum + balanceOf(inv), 0),
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Invoices from this schedule
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {invoices.length === 0
            ? plannedCount
              ? `None raised yet — ${plannedCount} planned.`
              : "None raised yet."
            : [
                plannedCount
                  ? `${invoices.length} of ${plannedCount} raised`
                  : `${invoices.length} raised`,
                `${sent} sent`,
                `${paid} paid`,
                `${formatMoney(received, currency)} received`,
                outstanding > 0
                  ? `${formatMoney(outstanding, currency)} outstanding`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
      </div>
      {invoices.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <SortableHead
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    activeKey={sort}
                    activeDir={dir}
                    href={sortHref(col.key)}
                    className={col.className}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="w-full">
                    <RowLink href={`/invoices/${inv.id}`}>
                      #{inv.invoice_number ?? inv.id.slice(0, 8)}
                    </RowLink>
                    <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                      {formatDate(inv.issue_date)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDate(inv.issue_date)}
                  </TableCell>
                  <TableCell
                    className={
                      "hidden sm:table-cell " +
                      (isOverdue(inv)
                        ? "font-medium text-brand-red"
                        : "text-muted-foreground")
                    }
                  >
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(inv.total, inv.currency)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {formatMoney(paidOf(inv), inv.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={paymentStatus(inv)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination {...result} hrefFor={pageHref} noun="invoice" />
        </>
      )}
    </Card>
  );
};
