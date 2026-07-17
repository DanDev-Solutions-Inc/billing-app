import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusPill,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  BackButton,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { splitLineItem } from "@utils/line-item-presets";
import { DocumentDetailProps } from "@interfaces/components/DocumentDetailProps";
import { MetaProps } from "@interfaces/components/MetaProps";
import { TotalRowProps } from "@interfaces/components/TotalRowProps";

export const DocumentDetail = ({
  heading,
  status,
  number,
  customer,
  issueDate,
  secondDateLabel,
  secondDate,
  items,
  subtotal,
  tax,
  total,
  notes,
  actionBar,
  banner,
  emailActivity,
  emailStatus,
  backHref,
  backLabel = "Back",
}: DocumentDetailProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          {backHref && (
            <BackButton fallbackHref={backHref} label={backLabel} />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {heading}
              {number ? ` ${number}` : ""}
            </h1>
            <StatusPill status={status} />
            {emailStatus}
          </div>
        </div>
        {/* Full-bleed on mobile — this header sits outside PageHeader, so it
            needs the same rule. */}
        {actionBar && <div className="w-full sm:w-auto">{actionBar}</div>}
      </div>

      {banner}

      <Card className="p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <Meta label="Bill to">
            {customer ? (
              <>
                <p className="font-medium text-foreground">{customer.name}</p>
                {customer.email && <p>{customer.email}</p>}
                {customer.phone && <p>{customer.phone}</p>}
                {customer.address && (
                  <p className="whitespace-pre-line">{customer.address}</p>
                )}
              </>
            ) : (
              <p>—</p>
            )}
          </Meta>
          <Meta label="Issued">{formatDate(issueDate)}</Meta>
          <Meta label={secondDateLabel}>{formatDate(secondDate)}</Meta>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-full">Description</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Qty</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Unit price
              </TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                {/* whitespace-normal: TableCell is nowrap by default, so a long
                    description couldn't wrap and spilled across Qty/Unit price.
                    align-top keeps a wrapped description level with Amount. */}
                <TableCell className="w-full max-w-0 whitespace-normal align-top">
                  {/* Title bold, detail as supporting text — matching the PDF. */}
                  {(() => {
                    const { title, detail } = splitLineItem(it.description);
                    return (
                      <>
                        <span className="font-medium text-foreground">
                          {title}
                        </span>
                        {detail && (
                          <span className="mt-0.5 block whitespace-pre-line text-xs text-muted-foreground">
                            {detail}
                          </span>
                        )}
                      </>
                    );
                  })()}
                  {/* Qty/price fold under the description on mobile, where
                      three number columns don't fit beside it. */}
                  <span className="mt-1 block text-xs tabular-nums text-muted-foreground sm:hidden">
                    {it.quantity} × {formatMoney(it.unit_price)}
                  </span>
                </TableCell>
                <TableCell className="hidden text-right align-top tabular-nums sm:table-cell">
                  {it.quantity}
                </TableCell>
                <TableCell className="hidden text-right align-top tabular-nums sm:table-cell">
                  {formatMoney(it.unit_price)}
                </TableCell>
                <TableCell className="text-right align-top font-medium tabular-nums">
                  {formatMoney(it.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end border-t border-border px-5 py-4">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <TotalRow label="Subtotal" value={subtotal} />
            <TotalRow label="Tax" value={tax} />
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-foreground">
              {notes}
            </p>
          </CardContent>
        </Card>
      )}

      {emailActivity}
    </div>
  );
};

const Meta = ({ label, children }: MetaProps) => (
  <div className="text-sm text-muted-foreground">
    <p className="mb-1 text-xs font-medium uppercase tracking-wide">{label}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const TotalRow = ({ label, value }: TotalRowProps) => (
  <div className="flex items-center justify-between text-muted-foreground">
    <span>{label}</span>
    <span className="tabular-nums">{formatMoney(value)}</span>
  </div>
);
