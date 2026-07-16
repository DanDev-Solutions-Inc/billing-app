import Link from "next/link";
import { ButtonLinkProps } from "@interfaces/components/ButtonLinkProps";
import { cn } from "@lib/utils";
import {
  buttonBase,
  buttonVariants,
  buttonSizes,
} from "@components/ui/button-styles";

export const ButtonLink = ({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) => (
  <Link
    {...props}
    className={cn(
      buttonBase,
      buttonVariants[variant],
      buttonSizes[size],
      className,
    )}
  />
);
