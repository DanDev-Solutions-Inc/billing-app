import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** When set, renders a back link above the title. */
  backHref?: string;
  /** Label for the back link. Defaults to "Back". */
  backLabel?: string;
}
