import { ComponentProps, ReactNode } from "react";
import { AlertTone } from "@typings/ui/AlertTone";

export interface AlertProps extends ComponentProps<"div"> {
  tone?: AlertTone;
  /** Optional trailing content, e.g. an amount or an action link. */
  trailing?: ReactNode;
}
