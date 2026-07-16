import { ReactNode } from "react";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}
