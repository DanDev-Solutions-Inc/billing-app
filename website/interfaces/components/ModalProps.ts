import { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /**
   * How much room the content needs — width follows content rather than every
   * modal sharing one box:
   * `sm` a confirmation, `md` a short form, `lg` a form with paired fields.
   */
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}
