import { ComponentProps } from "react";
import Link from "next/link";
import { ButtonVariant, ButtonSize } from "@typings/ui/ButtonVariant";

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
