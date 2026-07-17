"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Mail } from "lucide-react";
import {
  Button,
  Modal,
  ModalFooter,
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
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Mail />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={state.ok ? "Sent" : label}
        description={
          state.ok
            ? undefined
            : "The PDF is attached. Sending also marks it as sent."
        }
      >
        {state.ok ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-3">
              <CheckCircle2 className="size-5 shrink-0 text-brand-green" />
              <span className="text-sm text-foreground">{state.ok}</span>
            </div>
            <ModalFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </ModalFooter>
          </div>
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
