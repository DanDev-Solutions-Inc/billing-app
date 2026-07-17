import { ComboboxOption } from "@interfaces/components/ComboboxOption";

export interface FilterComboboxProps {
  /** Query-string key this control drives (e.g. "customer"). */
  param: string;
  options: ComboboxOption[];
  value: string;
  /** Option key treated as "no filter" — removed from the URL. */
  allKey?: string;
  /** Label for the clear/no-filter row. */
  allLabel?: string;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}
