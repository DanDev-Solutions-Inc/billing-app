import * as React from "react";
import { cn } from "@lib/utils";

/**
 * Checkbox styled to the glass kit.
 *
 * `accent-color` alone only tints the *checked* box — unchecked still paints
 * the platform's grey square, which reads as beige on navy. The tick is drawn
 * by the `.vui-checkbox` rule in globals.css (a data-URI can't survive a
 * Tailwind arbitrary value — the quotes and parens get mangled), while this
 * stays a real <input type="checkbox">: keyboard, labels, form submission and
 * indeterminate all still work.
 */
export const Checkbox = ({
  className,
  ...props
}: React.ComponentProps<"input">) => (
  <input type="checkbox" className={cn("vui-checkbox", className)} {...props} />
);
