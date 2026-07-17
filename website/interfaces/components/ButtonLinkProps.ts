import { ComponentProps } from "react";
import Link from "next/link";
import { ButtonVariant } from "@typings/ui/ButtonVariant";
import { ButtonSize } from "@typings/ui/ButtonSize";

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
