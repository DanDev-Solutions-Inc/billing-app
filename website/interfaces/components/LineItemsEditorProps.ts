import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

export interface LineItemsEditorProps {
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
