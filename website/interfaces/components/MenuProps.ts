import { ReactNode } from "react";

export interface MenuProps {
  children: ReactNode;
  label?: string;
  className?: string;
  /** Align the panel to the trigger's right edge (default) or left. */
  align?: "start" | "end";
}
