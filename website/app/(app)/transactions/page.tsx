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
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { deleteTransactionAction } from "./actions";
import { SummaryProps } from "@interfaces/components/SummaryProps";

export const metadata: Metadata = { title: "Transactions" };

const FILTERS = [
  { key: "all", label: "All", href: "/transactions" },
  { key: "income", label: "Income", href: "/transactions?type=income" },
  { key: "expense", label: "Expenses", href: "/transactions?type=expense" },
];

const Summary = ({ label, value, tone }: SummaryProps) => {
  const color =
    tone === "income"
      ? "text-brand-green"
      : tone === "expense"
        ? "text-brand-red"
        : "text-brand-black";
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
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

  const active = type === "income" || type === "expense" ? type : "all";
  const rows = active === "all" ? all : all.filter((t) => t.direction === active);

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
                : "border border-border bg-surface text-muted hover:bg-surface-muted")
            }
          >
            {f.label}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => {
                  const linked =
                    t.invoices?.invoice_number ??
                    (t.invoice_id ? "Invoice" : null) ??
                    t.receipts?.vendor ??
                    (t.receipt_id ? "Receipt" : null);
                  return (
                    <tr key={t.id}>
                      <td className="px-5 py-3 text-muted">
                        {formatDate(t.txn_date)}
                      </td>
                      <td className="px-5 py-3">
                        {t.description || "—"}
                        {linked && (
                          <span className="ml-2 text-xs text-muted">
                            · {linked}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {t.category || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={t.direction} />
                      </td>
                      <td
                        className={
                          "px-5 py-3 text-right font-medium tabular-nums " +
                          (t.direction === "income"
                            ? "text-brand-green"
                            : "text-brand-red")
                        }
                      >
                        {t.direction === "income" ? "+" : "−"}
                        {formatMoney(t.amount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <form action={deleteTransactionAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            type="submit"
                            className="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-brand-red/10 hover:text-brand-red"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
};

export default TransactionsPage;
