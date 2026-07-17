import { SortDir } from "@utils/table";

export interface SortableHeadProps {
  label: string;
  /** Column key this header sorts by. */
  sortKey: string;
  /** Currently active sort key + direction. */
  activeKey: string;
  activeDir: SortDir;
  /** Href for sorting by this column in the given direction. */
  href: string;
  className?: string;
  /** Right-align (money columns) — flips the icon to the left of the label. */
  align?: "left" | "right";
}
