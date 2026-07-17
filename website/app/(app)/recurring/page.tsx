import { Metadata } from "next";
import { Trash2, Pencil } from "lucide-react";
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
  TableCell,
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Schedule</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cadence</TableHead>
                <TableHead>Next invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell className="font-medium text-foreground">
                      {s.title || "Untitled"}
                      {s.auto_send && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          auto-emails
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{s.customers?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cadenceLabel(s.frequency, s.interval)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(s.next_run)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(total)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={s.active ? "sent" : "draft"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
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
                          <Button type="submit" variant="ghost">
                            {s.active ? "Pause" : "Resume"}
                          </Button>
                        </form>
                        <form action={deleteRecurringAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <Button
                            type="submit"
                            variant="dangerGhost"
                            size="icon"
                            title="Delete schedule"
                            aria-label="Delete schedule"
                          >
                            <Trash2 />
                          </Button>
                        </form>
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
