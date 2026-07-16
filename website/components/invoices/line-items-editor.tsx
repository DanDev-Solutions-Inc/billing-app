"use client";

import { formatMoney, computeTotals } from "@utils/money";
import { LineItemsEditorProps } from "@interfaces/components/LineItemsEditorProps";

/** Presentational line-items grid — state is owned by the parent Formik form. */
export const LineItemsEditor = ({
  items,
  taxRate,
  onItemChange,
  onAddRow,
  onRemoveRow,
  onTaxRateChange,
}: LineItemsEditorProps) => {
  const totals = computeTotals(items, taxRate);

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <div className="hidden grid-cols-[1fr_90px_120px_120px_32px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {items.map((row, index) => {
        const amount =
          (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);
        return (
          <div
            key={index}
            className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_90px_120px_120px_32px] sm:items-center"
          >
            <input
              value={row.description}
              onChange={(e) => onItemChange(index, "description", e.target.value)}
              placeholder="Item or service"
              className="col-span-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-accent sm:col-span-1"
            />
            <input
              type="number"
              min="0"
              step="any"
              value={row.quantity}
              onChange={(e) => onItemChange(index, "quantity", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm outline-none focus:border-brand-accent"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.unit_price}
              onChange={(e) => onItemChange(index, "unit_price", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm outline-none focus:border-brand-accent"
            />
            <span className="px-1 text-right text-sm tabular-nums text-foreground">
              {formatMoney(amount)}
            </span>
            <button
              type="button"
              onClick={() => onRemoveRow(index)}
              aria-label="Remove line"
              className="justify-self-end rounded-md px-2 py-1 text-muted-foreground transition hover:bg-brand-red/10 hover:text-brand-red"
            >
              ✕
            </button>
          </div>
        );
      })}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onAddRow}
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          + Add line
        </button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Tax rate
          <input
            type="number"
            min="0"
            step="0.01"
            value={taxRate}
            onChange={(e) => onTaxRateChange(Number(e.target.value))}
            className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-right text-sm outline-none focus:border-brand-accent"
          />
          %
        </label>
      </div>

      {/* totals */}
      <div className="ml-auto w-full max-w-xs space-y-1 border-t border-border pt-3 text-sm">
        <TotalRow label="Subtotal" value={totals.subtotal} />
        <TotalRow label={`Tax (${taxRate || 0}%)`} value={totals.tax} />
        <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(totals.total)}</span>
        </div>
      </div>
    </div>
  );
};

const TotalRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-muted-foreground">
    <span>{label}</span>
    <span className="tabular-nums">{formatMoney(value)}</span>
  </div>
);
