"use client";

import { useState } from "react";
import { CheckCheck, Undo2, Pencil, X } from "lucide-react";
import {
  Button,
  Modal,
  ModalFooter,
  Field,
  Select,
  inputClass,
  Alert,
} from "@components/ui";
import { TRANSACTION_CATEGORIES } from "@utils/constants";
import {
  bulkSetStatusAction,
  bulkEditAction,
} from "@app/(app)/transactions/actions";

/* Bound at module scope so the identities stay stable across renders. Next
   serialises the bound argument into the form, so this survives no-JS submits
   the same way a hidden input would. */
const approveAction = bulkSetStatusAction.bind(null, "approved");
const reopenAction = bulkSetStatusAction.bind(null, "pending");

/**
 * Actions for the current selection. Rendered inside the same <form> as the
 * row checkboxes, so each submit posts the checked `ids` — no client-side id
 * plumbing, and it still works if JS hasn't hydrated.
 */
export const BulkBar = ({
  count,
  onClear,
}: {
  count: number;
  onClear: () => void;
}) => {
  const [editing, setEditing] = useState(false);

  if (count === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-brand-accent">
          {count} selected
        </span>
        {/* type="button": inside the bulk form, a bare button would submit it. */}
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium text-brand-accent/80 transition hover:bg-brand-accent/10 hover:text-brand-accent"
        >
          <X className="size-3.5" />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* The status is bound into the action rather than set as name/value on
            the button: React nulls the submitter when a button carries a
            function formAction, so a name/value here never reaches the server
            and the action silently no-ops. */}
        <Button type="submit" formAction={approveAction} size="sm">
          <CheckCheck />
          Mark reviewed
        </Button>
        <Button
          type="submit"
          formAction={reopenAction}
          variant="secondary"
          size="sm"
        >
          <Undo2 />
          Reopen
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setEditing(true)}
        >
          <Pencil />
          Edit
        </Button>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit ${count} transaction${count === 1 ? "" : "s"}`}
        description="Only the fields you fill in are changed."
      >
        {/* Kept inside the outer form so the checked ids post with it. */}
        <div className="flex flex-col gap-4">
          <Field label="Description" htmlFor="bulk_description">
            <input
              id="bulk_description"
              name="description"
              placeholder="Leave blank to keep each one's own"
              className={inputClass}
            />
          </Field>
          <Field label="Category" htmlFor="bulk_category">
            {/* "" is the no-change signal, so the blank row has to stay first —
                the action only writes the fields that came back filled. */}
            <Select id="bulk_category" name="category" defaultValue="">
              <option value="">Leave blank to keep each one&apos;s own</option>
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Alert tone="warning">
            This overwrites the filled fields on all {count} selected.
          </Alert>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" formAction={bulkEditAction}>
              Apply
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
};
