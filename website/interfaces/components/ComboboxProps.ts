export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional second line, e.g. a customer's email. */
  hint?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Label for the "no selection" row. Omit to require a choice. */
  emptyLabel?: string;
  /**
   * Allow any typed text, not just the listed options — the options become
   * suggestions (used by line-item descriptions).
   */
  allowCustom?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
}
