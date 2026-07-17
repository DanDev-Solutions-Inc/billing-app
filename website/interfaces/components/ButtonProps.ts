import { ComponentProps } from "react";
import { ButtonVariant } from "@typings/ui/ButtonVariant";
import { ButtonSize } from "@typings/ui/ButtonSize";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
