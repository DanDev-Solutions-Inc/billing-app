"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Combobox } from "@components/ui/combobox";
import { FilterComboboxProps } from "@interfaces/components/FilterComboboxProps";

/**
 * Searchable filter that writes its value to the URL — FilterSelect's combobox
 * twin, for lists too long to scan in a native dropdown (customers).
 */
export const FilterCombobox = ({
  param,
  options,
  value,
  allKey = "all",
  allLabel = "All",
  placeholder,
  className,
  "aria-label": ariaLabel,
}: FilterComboboxProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!next || next === allKey) params.delete(param);
    else params.set(param, next);
    // A new filter invalidates the current page.
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <Combobox
      options={options}
      value={value === allKey ? "" : value}
      onChange={onChange}
      emptyLabel={allLabel}
      placeholder={placeholder ?? allLabel}
      aria-label={ariaLabel}
      className={className}
    />
  );
};
