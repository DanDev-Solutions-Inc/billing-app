import { FilterOption } from "@interfaces/components/FilterOption";

export interface FilterSelectProps {
  /** Query-string key this control drives (e.g. "status"). */
  param: string;
  options: FilterOption[];
  value: string;
  /** Option key treated as "no filter" — removed from the URL. */
  allKey?: string;
  className?: string;
  "aria-label"?: string;
}
