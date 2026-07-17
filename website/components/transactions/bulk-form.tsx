"use client";

import { useRef, useState } from "react";
import { BulkBar } from "@components/transactions/bulk-bar";

/**
 * Wraps the table in a form and tracks how many rows are checked.
 *
 * Selection is read from the form itself (change events bubble up) rather than
 * lifting every row into client state — so the rows stay server components and
 * the checked ids post natively with whichever bulk action is submitted.
 */
export const BulkForm = ({ children }: { children: React.ReactNode }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [count, setCount] = useState(0);

  /* React types a form's onChange target as the form, but the event is
     delegated — the real target is whichever input changed. */
  const onChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const form = formRef.current;
    if (!form) return;

    // The header checkbox mirrors its state onto every row.
    const target = e.target as unknown as HTMLInputElement;
    if (target?.dataset?.selectAll !== undefined) {
      form
        .querySelectorAll<HTMLInputElement>('input[name="ids"]')
        .forEach((box) => {
          box.checked = target.checked;
        });
    }

    setCount(new FormData(form).getAll("ids").length);
  };

  /* Uncheck everything, including the header box — the DOM is the source of
     truth for the selection, so clearing it is just unchecking the inputs. */
  const onClear = () => {
    const form = formRef.current;
    if (!form) return;
    form
      .querySelectorAll<HTMLInputElement>(
        'input[name="ids"], input[data-select-all]',
      )
      .forEach((box) => {
        box.checked = false;
      });
    setCount(0);
  };

  return (
    <form ref={formRef} onChange={onChange}>
      <BulkBar count={count} onClear={onClear} />
      {children}
    </form>
  );
};
