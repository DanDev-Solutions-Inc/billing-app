import Link from "next/link";
import { ButtonLinkProps } from "@interfaces/components/ButtonLinkProps";
import { cx } from "@components/ui/cx";
import { buttonBase, buttonVariants } from "@components/ui/button-styles";

export const ButtonLink = ({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) => (
  <Link
    {...props}
    className={cx(buttonBase, buttonVariants[variant], className)}
  />
);
