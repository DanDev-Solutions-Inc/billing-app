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

const SLOW_SEND_MS = 15_000;

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

  /* A send normally resolves in a second or two. If it hangs, the email has
     usually already gone — on Sep 18 the server finished in ~1s but the modal
     sat on "Sending…" — so say that rather than invite a second send. Keyed
     off `pending` flipping; the flag resets whenever a send settles. */
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setSlow(true), SLOW_SEND_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [pending]);

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

            {pending && slow && (
              <Alert tone="info">
                This is taking longer than usual. The email has most likely
                already gone — close this, reload the page and check the Email
                section before sending again.
              </Alert>
            )}

            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={pending && !slow}
              >
                {pending && slow ? "Close" : "Cancel"}
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
