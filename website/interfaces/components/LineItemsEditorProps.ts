import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

import { CurrencyCode } from "@typings/CurrencyCode";

export interface LineItemsEditorProps {
  /** Decides money formatting and whether tax applies at all. */
  currency?: CurrencyCode;
  items: LineItemFormValues[];
  taxRate: number;
  onItemChange: (
    index: number,
    field: keyof LineItemFormValues,
    value: string,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onTaxRateChange: (value: number) => void;
}
