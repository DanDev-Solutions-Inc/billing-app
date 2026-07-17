import { Metadata } from "next";
import { Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import {
  getTransaction,
  listDescriptions,
} from "@services/supabase/transaction";
import {
  PageHeader,
  Card,
  Button,
  ButtonLink,
  StatusPill,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isPdfReceipt } from "@utils/receipt-file";
import { TRANSACTION_CATEGORIES as CATEGORIES } from "@utils/constants";
import {
  setTransactionStatusAction,
  deleteTransactionAction,
} from "../actions";
import { TransactionEditForm } from "@components/transactions/edit-form";

export const metadata: Metadata = { title: "Transaction" };

const TransactionPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const [txn, descriptions] = await Promise.all([
    getTransaction(supabase, id),
    listDescriptions(supabase),
  ]);
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
        backHref="/transactions"
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
            <TransactionEditForm
              transaction={txn}
              categories={categoryOptions}
              descriptions={descriptions}
            />
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
                {/* A PDF receipt can't render in an <img> — that's what broke
                    the thumbnail. Same guard the receipts pages use. */}
                <div className="overflow-hidden rounded-xl border border-border bg-surface-muted">
                  {isPdfReceipt(txn.receipts?.image_url) ? (
                    <object
                      data={`/api/receipts/${txn.receipt_id}/file`}
                      type="application/pdf"
                      className="h-96 w-full"
                    >
                      <a
                        href={`/api/receipts/${txn.receipt_id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-96 items-center justify-center gap-2 text-sm text-brand-accent underline"
                      >
                        <FileText className="size-4" />
                        Open PDF
                      </a>
                    </object>
                  ) : txn.receipts?.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/receipts/${txn.receipt_id}/file`}
                      alt={txn.receipts?.vendor ?? "Receipt"}
                      className="max-h-96 w-full object-contain"
                    />
                  ) : (
                    <p className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                      No file attached
                    </p>
                  )}
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
