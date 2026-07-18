"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Button, Modal, ModalFooter, Input, Field } from "@components/ui";
import { createFolder } from "@app/(app)/documents/actions";
import { NewFolderButtonProps } from "@interfaces/components/NewFolderButtonProps";

export const NewFolderButton = ({ parentId }: NewFolderButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* autoFocus is not enough here. Modal opens the dialog with showModal(),
     which focuses the first focusable node — the close button — and it does so
     from the Modal's own effect. Child effects run before parent ones, so any
     focus we set synchronously is taken back a moment later. A frame later is
     after both, and the field is where typing should go: opening this dialog
     to then click into its one input is a step nobody wants. */
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError("");
    const data = new FormData();
    data.set("name", name);
    if (parentId) data.set("parent_id", parentId);

    const result = await createFolder(data);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setName("");
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <FolderPlus />
        New folder
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New folder"
        size="sm"
      >
        <Field label="Name" htmlFor="folder-name">
          <Input
            id="folder-name"
            ref={inputRef}
            value={name}
            placeholder="e.g. FY2026 statements"
            onChange={(e) => setName(e.target.value)}
            /* Enter submits — this is a one-field dialog and reaching for the
               mouse to confirm a folder name is friction nobody wants. */
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !busy) submit();
            }}
          />
        </Field>
        {error && (
          <p role="alert" className="mt-2 text-sm text-brand-red">
            {error}
          </p>
        )}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !name.trim()}
            onClick={submit}
          >
            Create
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
