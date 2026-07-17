export interface ClearFiltersProps {
  /** The bare list path, e.g. "/invoices". */
  href: string;
  /** Whether any filter/search is applied — false renders nothing. */
  active: boolean;
  className?: string;
}
