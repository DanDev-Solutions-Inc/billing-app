import { ComponentProps } from "react";
import { ButtonVariant, ButtonSize } from "@typings/ui/ButtonVariant";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
