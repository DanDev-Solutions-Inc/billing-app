import { ButtonProps } from "@interfaces/components/ButtonProps";
import { cx } from "@components/ui/cx";
import { buttonBase, buttonVariants } from "@components/ui/button-styles";

export const Button = ({
  variant = "primary",
  className,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={cx(buttonBase, buttonVariants[variant], className)}
  />
);
