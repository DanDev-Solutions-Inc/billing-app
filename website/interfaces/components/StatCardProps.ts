import { ReactNode } from "react";

export type StatTone = "neutral" | "accent" | "income" | "expense";

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  /** Brand tone for the value. Defaults to neutral (white, Vision UI style). */
  tone?: StatTone;
  /** Signed delta shown beside the value, e.g. "+55%". Green up / red down. */
  delta?: string;
  /** Icon rendered in the brand-gradient tile on the right. */
  icon?: ReactNode;
  className?: string;
}
