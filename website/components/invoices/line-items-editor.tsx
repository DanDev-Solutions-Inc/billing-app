"use client";

import { useState } from "react";
import { X, WrapText, List } from "lucide-react";
import { formatMoney, computeTotals } from "@utils/money";
import { cn } from "@lib/utils";
import { inputClass } from "@components/ui/input-class";
import { Combobox } from "@components/ui/combobox";
import { LineItemsEditorProps } from "@interfaces/components/LineItemsEditorProps";
import { CurrencyCode } from "@typings/CurrencyCode";
import { chargesTax } from "@utils/currency";
import { LINE_ITEM_PRESETS, presetText } from "@utils/line-item-presets";

/* Presets as combobox options: the title is what you scan for, the full text
   is what gets inserted. */
const PRESET_OPTIONS = LINE_ITEM_PRESETS.map((p) => ({
  value: presetText(p),
  label: p.title,
  hint: presetText(p),
}));

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
  currency = "CAD",
}: LineItemsEditorProps) => {
  const taxable = chargesTax(currency);
  const totals = computeTotals(items, taxRate);

  /* Rows being written as free text. A row that already holds newlines starts
     there — a single-line combobox would silently flatten it. */
  const [freeText, setFreeText] = useState<Record<number, boolean>>({});
  const isFree = (i: number) =>
    freeText[i] ?? items[i]?.description?.includes("\n") ?? false;
  const toggleFree = (i: number) =>
    setFreeText((prev) => ({ ...prev, [i]: !isFree(i) }));

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
            className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:grid-cols-[1fr_90px_120px_120px_32px] sm:items-center sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
          >
            {/* Pick a preset, or switch to free text to write your own with
                line breaks. The first line renders as the bold title on the
                invoice and PDF; the rest is supporting detail. */}
            <div className="col-span-2 flex items-start gap-1.5 sm:col-span-1">
              {isFree(index) ? (
                <textarea
                  value={row.description}
                  onChange={(e) =>
                    onItemChange(index, "description", e.target.value)
                  }
                  rows={3}
                  placeholder={"Title\nSupporting detail…"}
                  aria-label="Description"
                  className={cn(inputClass, "min-h-[76px] py-2 leading-snug")}
                />
              ) : (
                <Combobox
                  options={PRESET_OPTIONS}
                  value={row.description}
                  onChange={(next) => onItemChange(index, "description", next)}
                  allowCustom
                  placeholder="Item or service"
                  aria-label="Description"
                  className="min-w-0 flex-1"
                />
              )}
              <button
                type="button"
                onClick={() => toggleFree(index)}
                aria-pressed={isFree(index)}
                title={
                  isFree(index)
                    ? "Use a preset instead"
                    : "Write free text with line breaks"
                }
                aria-label={
                  isFree(index) ? "Use a preset instead" : "Write free text"
                }
                className="mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground outline-none transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {isFree(index) ? (
                  <List className="size-4" />
                ) : (
                  <WrapText className="size-4" />
                )}
              </button>
            </div>
            {/* Labelled on mobile — the column headers are desktop-only, so
                without these Qty and Unit price are two unmarked boxes.
                `sm:contents` dissolves the wrapper from sm up, keeping the
                inputs as direct children of the row grid. */}
            <label className="flex flex-col gap-1 sm:contents">
              <span className="text-xs text-muted-foreground sm:hidden">Qty</span>
              <input
                type="number"
                min="0"
                step="any"
                value={row.quantity}
                onChange={(e) => onItemChange(index, "quantity", e.target.value)}
                aria-label="Quantity"
                className={cn(inputClass, "px-3 py-2 text-right tabular-nums")}
              />
            </label>
            <label className="flex flex-col gap-1 sm:contents">
              <span className="text-xs text-muted-foreground sm:hidden">
                Unit price
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.unit_price}
                onChange={(e) =>
                  onItemChange(index, "unit_price", e.target.value)
                }
                aria-label="Unit price"
                className={cn(inputClass, "px-3 py-2 text-right tabular-nums")}
              />
            </label>
            {/* Amount + remove share the last mobile row, labelled so the
                number isn't floating unexplained. */}
            <div className="col-span-2 flex items-center justify-between border-t border-white/[0.06] pt-2 sm:contents sm:border-0 sm:pt-0">
              <span className="text-xs text-muted-foreground sm:hidden">
                Amount
              </span>
              <span className="px-1 text-right text-sm font-medium tabular-nums text-foreground">
                {formatMoney(amount, currency)}
              </span>
            </div>
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
        {/* USD work isn't taxed, so there's no rate to set — the control is
            hidden rather than shown at a 0 you can't change. */}
        {taxable ? (
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
        ) : (
          <span className="text-sm text-muted-foreground">
            No tax on {currency} invoices
          </span>
        )}
      </div>

      {/* totals */}
      <div className="ml-auto w-full max-w-xs space-y-1 border-t border-border pt-3 text-sm">
        <TotalRow label="Subtotal" value={totals.subtotal} currency={currency} />
        {taxable && (
          <TotalRow
            label={`Tax (${taxRate || 0}%)`}
            value={totals.tax}
            currency={currency}
          />
        )}
        <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(totals.total, currency)}</span>
        </div>
      </div>
    </div>
  );
};

const TotalRow = ({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: CurrencyCode;
}) => (
  <div className="flex items-center justify-between text-muted-foreground">
    <span>{label}</span>
    <span className="tabular-nums">{formatMoney(value, currency)}</span>
  </div>
);
