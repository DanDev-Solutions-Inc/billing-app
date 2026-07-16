import { formatMoney } from "@utils/money";

/* Low-color invoice status breakdown: neutral proportional bars with a single
   small status dot for identity. Reads as one restrained system, not a rainbow. */

const DOT: Record<string, string> = {
  paid: "bg-brand-green",
  sent: "bg-brand-accent",
  overdue: "bg-brand-red",
  draft: "bg-muted-foreground",
};

export interface InvoiceStatusRow {
  status: string;
  count: number;
  total: number;
}

export const InvoiceStatusBars = ({ rows }: { rows: InvoiceStatusRow[] }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));

  if (rows.every((r) => r.count === 0)) {
    return (
      <p className="py-3 text-sm text-muted-foreground">No invoices yet.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.status} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 capitalize">
              <span
                className={`size-1.5 rounded-full ${DOT[r.status] ?? "bg-muted-foreground"}`}
              />
              {r.status}
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="tabular-nums">{r.count}</span>
              <span className="tabular-nums">{formatMoney(r.total)}</span>
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/25"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};
