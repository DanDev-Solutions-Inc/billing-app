import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listTransactions } from "@services/supabase/transaction";
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
import { deleteTransactionAction } from "./actions";
import { SummaryProps } from "@interfaces/components/SummaryProps";

export const metadata: Metadata = { title: "Transactions" };

const FILTERS = [
  { key: "all", label: "All", href: "/transactions" },
  { key: "review", label: "To review", href: "/transactions?type=review" },
  { key: "income", label: "Income", href: "/transactions?type=income" },
  { key: "expense", label: "Expenses", href: "/transactions?type=expense" },
];

const Summary = ({ label, value, tone }: SummaryProps) => {
  const color =
    tone === "income"
      ? "text-brand-green"
      : tone === "expense"
        ? "text-brand-red"
        : "text-foreground";
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>
        {formatMoney(value)}
      </p>
    </Card>
  );
};

const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) => {
  await getUserOrRedirect();
  const { type } = await searchParams;
  const supabase = await createClient();
  const all = await listTransactions(supabase);

  const income = all
    .filter((t) => t.direction === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = all
    .filter((t) => t.direction === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const pending = all.filter((t) => t.status === "pending").length;
  const active =
    type === "income" || type === "expense" || type === "review"
      ? type
      : "all";
  const rows =
    active === "all"
      ? all
      : active === "review"
        ? all.filter((t) => t.status === "pending")
        : all.filter((t) => t.direction === active);

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Money in and out of your business."
        action={
          <ButtonLink href="/transactions/new">+ New transaction</ButtonLink>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Summary label="Income" value={income} tone="income" />
        <Summary label="Expenses" value={expense} tone="expense" />
        <Summary label="Net" value={income - expense} tone="net" />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
              (active === f.key
                ? "bg-brand-accent text-white"
                : "border border-border bg-surface text-muted-foreground hover:bg-surface-muted")
            }
          >
            {f.label}
            {f.key === "review" && pending > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs font-semibold text-amber-600">
                {pending}
              </span>
            )}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Paid invoices and receipt expenses show up here automatically, or add one manually."
          action={
            <ButtonLink href="/transactions/new">+ New transaction</ButtonLink>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const linkLabel = t.invoice_id
                  ? `Invoice ${t.invoices?.invoice_number ?? ""}`.trim()
                  : t.receipt_id
                    ? t.receipts?.vendor
                      ? `Receipt · ${t.receipts.vendor}`
                      : "Receipt"
                    : null;
                const linkHref = t.invoice_id
                  ? `/invoices/${t.invoice_id}`
                  : t.receipt_id
                    ? `/receipts/${t.receipt_id}`
                    : null;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(t.txn_date)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/transactions/${t.id}`}
                        className="font-medium text-foreground hover:text-brand-accent hover:underline"
                      >
                        {t.description || "View transaction"}
                      </Link>
                      {linkLabel && linkHref && (
                        <Link
                          href={linkHref}
                          className="ml-2 text-xs text-brand-accent hover:underline"
                        >
                          · {linkLabel}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.category || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={t.direction} />
                    </TableCell>
                    <TableCell>
                      <StatusPill status={t.status} />
                    </TableCell>
                    <TableCell
                      className={
                        "text-right font-medium tabular-nums " +
                        (t.direction === "income"
                          ? "text-brand-green"
                          : "text-brand-red")
                      }
                    >
                      {t.direction === "income" ? "+" : "−"}
                      {formatMoney(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-brand-red/10 hover:text-brand-red"
                        >
                          Delete
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default TransactionsPage;
