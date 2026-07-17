"use client";

import { X } from "lucide-react";
import { formatMoney, computeTotals } from "@utils/money";
import { cn } from "@lib/utils";
import { inputClass } from "@components/ui/input-class";
import { LineItemsEditorProps } from "@interfaces/components/LineItemsEditorProps";
import { LINE_ITEM_PRESETS, presetText } from "@utils/line-item-presets";

const PRESET_LIST_ID = "line-item-presets";

/** Presentational line-items grid — state is owned by the parent Formik form.
 *  Fields use the shared `inputClass` so they inherit the kit's glass styling,
 *  focus ring, and native-spinner removal instead of drifting on their own. */
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
      {/* Shared preset list — every description field type-aheads against it.
          `label` shows the title, `value` is what gets inserted. */}
      <datalist id={PRESET_LIST_ID}>
        {LINE_ITEM_PRESETS.map((p) => (
          <option key={p.id} value={presetText(p)} label={p.title} />
        ))}
      </datalist>

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
            {/* `list` gives the field native type-ahead over the presets while
                staying fully free-text — a preset is a starting point, not a
                lock-in. */}
            <input
              list={PRESET_LIST_ID}
              value={row.description}
              onChange={(e) =>
                onItemChange(index, "description", e.target.value)
              }
              placeholder="Item or service"
              className={cn(inputClass, "col-span-2 py-2 sm:col-span-1")}
            />
            <input
              type="number"
              min="0"
              step="any"
              value={row.quantity}
              onChange={(e) => onItemChange(index, "quantity", e.target.value)}
              aria-label="Quantity"
              className={cn(inputClass, "px-3 py-2 text-right tabular-nums")}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.unit_price}
              onChange={(e) => onItemChange(index, "unit_price", e.target.value)}
              aria-label="Unit price"
              className={cn(inputClass, "px-3 py-2 text-right tabular-nums")}
            />
            <span className="px-1 text-right text-sm font-medium tabular-nums text-foreground">
              {formatMoney(amount)}
            </span>
            <button
              type="button"
              onClick={() => onRemoveRow(index)}
              aria-label="Remove line"
              title="Remove line"
              className="justify-self-end rounded-lg p-1.5 text-muted-foreground outline-none transition-colors hover:bg-brand-red/10 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onAddRow}
          className="rounded-lg text-sm font-medium text-brand-accent outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
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
            className={cn(inputClass, "w-20 px-3 py-1.5 text-right tabular-nums")}
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
