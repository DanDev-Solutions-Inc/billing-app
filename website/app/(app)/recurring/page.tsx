import { Metadata } from "next";
import { Pencil, FileText, Pause, Play } from "lucide-react";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell, ConfirmButton } from "@components/ui";
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {/* Mobile keeps Schedule + Amount; customer, cadence, next run
                    and status fold under the title. */}
                <TableHead className="w-full">Schedule</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead className="hidden lg:table-cell">Cadence</TableHead>
                <TableHead className="hidden sm:table-cell">Next invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => {
                const items =
                  (s.line_items as unknown as LineItemFormValues[]) ?? [];
                const { total } = computeTotals(items, Number(s.tax_rate));
                return (
                  <TableRow key={s.id}>
                    <TableCell className="w-full max-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {s.title || "Untitled"}
                        {s.auto_send && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            auto-emails
                          </span>
                        )}
                      </span>
                      {/* The columns hidden on small screens, folded into one
                          line so the row still says who/when/how often. */}
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground md:hidden">
                        {[
                          s.customers?.name,
                          cadenceLabel(s.frequency, s.interval),
                          `Next ${formatDate(s.next_run)}`,
                          s.active ? null : "Paused",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="mt-0.5 hidden truncate text-xs text-muted-foreground md:block lg:hidden">
                        {cadenceLabel(s.frequency, s.interval)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {s.customers?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {cadenceLabel(s.frequency, s.interval)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(s.next_run)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(total, s.currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusPill status={s.active ? "sent" : "draft"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ButtonLink
                          href={`/recurring/${s.id}/pdf`}
                          variant="ghost"
                          size="icon"
                          target="_blank"
                          title="Preview next invoice"
                          aria-label={`Preview the next invoice for ${s.title || "this schedule"}`}
                        >
                          <FileText />
                        </ButtonLink>
                        <ButtonLink
                          href={`/recurring/${s.id}/edit`}
                          variant="ghost"
                          size="icon"
                          title="Edit schedule"
                          aria-label={`Edit ${s.title || "schedule"}`}
                        >
                          <Pencil />
                        </ButtonLink>
                        <form action={toggleRecurring}>
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={String(!s.active)}
                          />
                          {/* Icon, like the actions either side of it — it was
                              the one text button in a row of icons. */}
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            title={s.active ? "Pause schedule" : "Resume schedule"}
                            aria-label={
                              s.active
                                ? `Pause ${s.title || "schedule"}`
                                : `Resume ${s.title || "schedule"}`
                            }
                          >
                            {s.active ? <Pause /> : <Play />}
                          </Button>
                        </form>
                        <ConfirmButton
                          action={deleteRecurringAction}
                          id={s.id}
                          title={`Delete ${s.title || "this schedule"}?`}
                          description="It stops generating invoices. Invoices it already created are kept."
                          triggerLabel="Delete schedule"
                        />
                      </div>
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

export default RecurringPage;
