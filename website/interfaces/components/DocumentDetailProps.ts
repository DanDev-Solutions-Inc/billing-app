import { ReactNode } from "react";
import { Customer } from "@typings/customer/Customer";
import { LineItem } from "@typings/line-item/LineItem";

export interface DocumentDetailProps {
  heading: string;
  status: string;
  number: string | null;
  customer: Customer | null;
  issueDate: string;
  secondDateLabel: string;
  secondDate: string | null;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  actionBar?: ReactNode;
  banner?: ReactNode;
  /** When set, renders a back link above the heading. */
  backHref?: string;
  /** Label for the back link. Defaults to "Back". */
  backLabel?: string;
}
