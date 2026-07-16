import { ButtonProps } from "@interfaces/components/ButtonProps";
import { cn } from "@lib/utils";
import {
  buttonBase,
  buttonVariants,
  buttonSizes,
} from "@components/ui/button-styles";

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={cn(
      buttonBase,
      buttonVariants[variant],
      buttonSizes[size],
      className,
    )}
  />
);
