import { ButtonVariant } from "@typings/ui/ButtonVariant";

export interface StatusButtonProps {
  id: string;
  status: string;
  label: string;
  /** Reuses the kit's variants so this can't drift from <Button>. */
  variant?: ButtonVariant;
}
