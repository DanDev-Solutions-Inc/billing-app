"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import {
  Button,
  Modal,
  ModalFooter,
  ModalResult,
  Field,
  Select,
  Alert,
} from "@components/ui";
import { SendButtonProps } from "@interfaces/components/SendButtonProps";

/**
 * Sends the document by email from a modal: pick the address, watch it go, see
 * it land. It used to fire on click and report inline, which gave no chance to
 * choose a recipient and made the result easy to miss.
 */
export const SendButton = ({
  id,
  action,
  emails = [],
  label = "Email to customer",
  className,
}: SendButtonProps) => {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();

  /* Sending flips the status to sent — refresh so the badge and actions behind
     the modal catch up. */
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const hasEmail = emails.length > 0;

  return (
    <>
      {/* className lands here, not on a wrapper: the fragment is transparent,
          so this button is the direct child a parent grid/flex positions. */}
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Mail />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={state.ok ? "" : label}
        description={
          state.ok
            ? undefined
            : "The PDF is attached. Sending also marks it as sent."
        }
      >
        {state.ok ? (
          <ModalResult
            tone="success"
            icon={<CheckCircle2 />}
            title="Invoice sent"
            detail={state.ok}
            action={
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            }
          />
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={id} />

            {hasEmail ? (
              <Field label="Send to" htmlFor="to">
                <Select id="to" name="to" defaultValue={emails[0]}>
                  {emails.map((e, i) => (
                    <option key={e} value={e}>
                      {e}
                      {i === 0 ? " (primary)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Alert tone="error">
                This customer has no email address. Add one first.
              </Alert>
            )}

            {state.error && <Alert tone="error">{state.error}</Alert>}

            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !hasEmail}>
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail />
                    Send
                  </>
                )}
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </>
  );
};
