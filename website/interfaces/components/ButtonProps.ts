import { ComponentProps } from "react";
import { ButtonVariant } from "@typings/ui/ButtonVariant";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}
