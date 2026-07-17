import { ReactNode } from "react";

export interface MetricProps {
  label: string;
  value: string;
  icon?: ReactNode;
  /** Text class for the value, e.g. "text-brand-green". */
  tone?: string;
  className?: string;
}
