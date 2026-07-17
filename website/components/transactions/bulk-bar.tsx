"use client";

import { useState } from "react";
import { CheckCheck, Undo2, Pencil } from "lucide-react";
import {
  Button,
  Modal,
  Field,
  inputClass,
  Alert,
} from "@components/ui";
import {
  bulkSetStatusAction,
  bulkEditAction,
} from "@app/(app)/transactions/actions";

/**
 * Actions for the current selection. Rendered inside the same <form> as the
 * row checkboxes, so each submit posts the checked `ids` — no client-side id
 * plumbing, and it still works if JS hasn't hydrated.
 */
export const BulkBar = ({ count }: { count: number }) => {
  const [editing, setEditing] = useState(false);

  if (count === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-2.5">
      <span className="text-sm font-medium text-brand-accent">
        {count} selected
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          formAction={bulkSetStatusAction}
          name="status"
          value="approved"
          size="sm"
        >
          <CheckCheck />
          Mark reviewed
        </Button>
        <Button
          type="submit"
          formAction={bulkSetStatusAction}
          name="status"
          value="pending"
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
            <input
              id="bulk_category"
              name="category"
              placeholder="Leave blank to keep each one's own"
              className={inputClass}
            />
          </Field>
          <Alert tone="warning">
            This overwrites the filled fields on all {count} selected.
          </Alert>
          <div className="flex justify-end gap-2">
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
          </div>
        </div>
      </Modal>
    </div>
  );
};
