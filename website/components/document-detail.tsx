import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
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
  backHref,
  backLabel = "Back",
}: DocumentDetailProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="-ml-1 mb-2 inline-flex items-center gap-1 rounded-md py-1 pr-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ChevronLeft className="size-4" />
              {backLabel}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {heading}
              {number ? ` ${number}` : ""}
            </h1>
            <StatusPill status={status} />
          </div>
        </div>
        {actionBar}
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
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.description}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {it.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(it.unit_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
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
