"use client";

import { useActionState } from "react";
import { Button } from "@components/ui";
import { SendButtonProps } from "@interfaces/components/SendButtonProps";

export const SendButton = ({
  id,
  action,
  label = "Email to customer",
}: SendButtonProps) => {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Sending…" : label}
      </Button>
      {state.error && (
        <span className="text-xs text-brand-red">{state.error}</span>
      )}
      {state.ok && (
        <span className="text-xs text-brand-green">{state.ok}</span>
      )}
    </form>
  );
};
