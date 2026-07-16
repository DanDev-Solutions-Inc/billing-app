import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listRecurring } from "@services/supabase/recurring-invoice";
import {
  PageHeader,
  Card,
  ButtonLink,
  StatusPill,
  EmptyState,
  Button,
} from "@components/ui";
import { formatMoney, formatDate, computeTotals } from "@utils/money";
import { cadenceLabel } from "@utils/cadence";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { toggleRecurring, deleteRecurringAction } from "./actions";

export const metadata: Metadata = { title: "Recurring invoices" };

const RecurringPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const schedules = await listRecurring(supabase);

  return (
    <>
      <PageHeader
        title="Recurring invoices"
        subtitle="Invoices that generate and send themselves on a cadence."
        action={<ButtonLink href="/recurring/new">+ New schedule</ButtonLink>}
      />

      {schedules.length === 0 ? (
        <EmptyState
          title="No recurring invoices yet"
          description="Set up a schedule to bill a customer automatically — weekly, monthly, or any interval."
          action={<ButtonLink href="/recurring/new">+ New schedule</ButtonLink>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-3">Schedule</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Cadence</th>
                  <th className="px-5 py-3">Next invoice</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schedules.map((s) => {
                  const items =
                    (s.line_items as unknown as LineItemFormValues[]) ?? [];
                  const { total } = computeTotals(items, Number(s.tax_rate));
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-3 font-medium text-brand-black">
                        {s.title || "Untitled"}
                        {s.auto_send && (
                          <span className="ml-2 text-xs font-normal text-muted">
                            auto-emails
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">{s.customers?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-muted">
                        {cadenceLabel(s.frequency, s.interval)}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {formatDate(s.next_run)}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">
                        {formatMoney(total)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={s.active ? "sent" : "draft"} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <form action={toggleRecurring}>
                            <input type="hidden" name="id" value={s.id} />
                            <input
                              type="hidden"
                              name="active"
                              value={String(!s.active)}
                            />
                            <Button type="submit" variant="ghost">
                              {s.active ? "Pause" : "Resume"}
                            </Button>
                          </form>
                          <form action={deleteRecurringAction}>
                            <input type="hidden" name="id" value={s.id} />
                            <button
                              type="submit"
                              className="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-brand-red/10 hover:text-brand-red"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
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

export default RecurringPage;
