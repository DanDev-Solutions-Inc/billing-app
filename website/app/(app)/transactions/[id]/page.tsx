import { Metadata } from "next";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getTransaction } from "@services/supabase/transaction";
import {
  PageHeader,
  Card,
  Field,
  inputClass,
  Button,
  ButtonLink,
  StatusPill,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { TRANSACTION_CATEGORIES as CATEGORIES } from "@utils/constants";
import {
  updateTransactionAction,
  setTransactionStatusAction,
  deleteTransactionAction,
} from "../actions";

export const metadata: Metadata = { title: "Transaction" };

const TransactionPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const txn = await getTransaction(supabase, id);
  if (!txn) notFound();

  const approved = txn.status === "approved";
  // Preserve imported Wave categories that aren't in our standard list.
  const categoryOptions =
    txn.category && !(CATEGORIES as readonly string[]).includes(txn.category)
      ? [txn.category, ...CATEGORIES]
      : CATEGORIES;

  return (
    <>
      <PageHeader
        title="Transaction"
        subtitle={formatDate(txn.txn_date)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={txn.status} />
            <StatusPill status={txn.direction} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Review / approve bar */}
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">
                {approved ? "Reviewed" : "Awaiting review"}
              </p>
              <p className="text-xs text-muted-foreground">
                {approved
                  ? "This transaction has been approved."
                  : "Check the details below, then approve it."}
              </p>
            </div>
            <form
              action={setTransactionStatusAction}
              className="flex items-center gap-2"
            >
              <input type="hidden" name="id" value={txn.id} />
              <input
                type="hidden"
                name="status"
                value={approved ? "pending" : "approved"}
              />
              <Button type="submit" variant={approved ? "secondary" : "primary"}>
                {approved ? "Reopen" : "Approve"}
              </Button>
            </form>
          </Card>

          {/* Editable details */}
          <Card className="p-6">
            <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
              Details
            </h2>
            <form
              action={updateTransactionAction}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="id" value={txn.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" htmlFor="direction">
                  <select
                    id="direction"
                    name="direction"
                    defaultValue={txn.direction}
                    className={inputClass}
                  >
                    <option value="expense">Expense (money out)</option>
                    <option value="income">Income (money in)</option>
                  </select>
                </Field>
                <Field label="Amount (CAD)" htmlFor="amount">
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={txn.amount}
                    className={inputClass}
                  />
                </Field>
                <Field label="Date" htmlFor="txn_date">
                  <input
                    id="txn_date"
                    name="txn_date"
                    type="date"
                    defaultValue={txn.txn_date}
                    className={inputClass}
                  />
                </Field>
                <Field label="Category" htmlFor="category">
                  <select
                    id="category"
                    name="category"
                    defaultValue={txn.category ?? ""}
                    className={inputClass}
                  >
                    <option value="">— None —</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Description" htmlFor="description">
                <input
                  id="description"
                  name="description"
                  defaultValue={txn.description ?? ""}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="secondary">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {txn.invoices && (
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Linked invoice
              </p>
              <Link
                href={`/invoices/${txn.invoices.id}`}
                className="mt-1 inline-block font-medium text-brand-accent hover:underline"
              >
                Invoice {txn.invoices.invoice_number ?? txn.invoices.id.slice(0, 8)}
              </Link>
            </Card>
          )}
        </div>

        {/* Attached receipt */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attached receipt
            </p>
            {txn.receipt_id ? (
              <div className="mt-3 flex flex-col gap-3">
                <div className="overflow-hidden rounded-xl border border-border bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/receipts/${txn.receipt_id}/file`}
                    alt={txn.receipts?.vendor ?? "Receipt"}
                    className="max-h-96 w-full object-contain"
                  />
                </div>
                <ButtonLink
                  href={`/receipts/${txn.receipt_id}`}
                  variant="secondary"
                >
                  Open receipt
                </ButtonLink>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No receipt attached. Add one from the receipt page, or upload an
                image when creating a transaction.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p
              className={
                "text-2xl font-semibold tabular-nums " +
                (txn.direction === "income"
                  ? "text-brand-green"
                  : "text-brand-red")
              }
            >
              {txn.direction === "income" ? "+" : "−"}
              {formatMoney(txn.amount)}
            </p>
          </Card>

          <form action={deleteTransactionAction}>
            <input type="hidden" name="id" value={txn.id} />
            <Button type="submit" variant="dangerGhost">
              <Trash2 />
              Delete transaction
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default TransactionPage;
