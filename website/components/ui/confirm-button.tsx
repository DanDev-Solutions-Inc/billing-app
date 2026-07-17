"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Modal, ModalFooter } from "@components/ui/modal";
import { ConfirmButtonProps } from "@interfaces/components/ConfirmButtonProps";

/**
 * Destructive action behind a confirmation step.
 *
 * The trigger is a muted icon that only turns red on hover — a row full of red
 * trash cans reads as an alarm; the danger belongs on the confirm, which is the
 * click that actually destroys something.
 *
 * `standalone` controls how the action is submitted:
 * - true  (default): renders its own <form>.
 * - false: renders a bare submit button carrying `formAction` + `name`/`value`,
 *   for rows that already sit inside a form (e.g. transactions' bulk-select).
 *   A nested <form> is invalid HTML — the parser drops the inner one and the
 *   click would submit the *outer* form instead of deleting anything.
 */
export const ConfirmButton = ({
  action,
  id,
  title,
  description,
  confirmLabel = "Delete",
  triggerLabel = "Delete",
  standalone = true,
  className,
}: ConfirmButtonProps) => {
  const [open, setOpen] = useState(false);

  const confirm = (
    <Button
      type="submit"
      variant="danger"
      formAction={standalone ? undefined : action}
      name={standalone ? undefined : "id"}
      value={standalone ? undefined : id}
      onClick={() => setOpen(false)}
    >
      <Trash2 />
      {confirmLabel}
    </Button>
  );

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title={triggerLabel}
        aria-label={triggerLabel}
        className={`hover:text-brand-red ${className ?? ""}`}
      >
        <Trash2 />
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        size="sm"
      >
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          {standalone ? (
            <form action={action}>
              <input type="hidden" name="id" value={id} />
              {confirm}
            </form>
          ) : (
            confirm
          )}
        </ModalFooter>
      </Modal>
    </>
  );
};
