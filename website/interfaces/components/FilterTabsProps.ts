import { FilterTab } from "@interfaces/components/FilterTab";

export interface FilterTabsProps {
  tabs: FilterTab[];
  active: string;
  /**
   * `chips`     — borderless, free-flowing filters (status / source).
   * `segmented` — compact enclosed switch (the period window).
   */
  variant?: "chips" | "segmented";
  className?: string;
  "aria-label"?: string;
}
