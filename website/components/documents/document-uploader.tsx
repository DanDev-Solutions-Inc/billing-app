"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Button } from "@components/ui";
import { recordUploads } from "@app/(app)/documents/actions";
import { UploadedDocument } from "@interfaces/forms/UploadedDocument";
import { DocumentUploaderProps } from "@interfaces/components/DocumentUploaderProps";

/**
 * Multi-file upload straight from the browser to Vercel Blob.
 *
 * The bytes never pass through a server action — tax documents routinely
 * exceed the 4.5 MB request limit that would impose. The action is called
 * afterwards with metadata only, and that row write is what makes the upload
 * real; a file in the bucket with no row is invisible.
 */
export const DocumentUploader = ({
  folderId,
  userId,
}: DocumentUploaderProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");

    const done: UploadedDocument[] = [];
    try {
      const list = Array.from(files);
      for (const [i, file] of list.entries()) {
        setProgress(`Uploading ${i + 1} of ${list.length}…`);
        /* Prefixed with the user id because the token route requires it —
           the client picks the pathname, so the server pins where it may
           write. addRandomSuffix (set server-side) keeps same-named files
           from overwriting each other. */
        const blob = await upload(`documents/${userId}/${file.name}`, file, {
          access: "private",
          handleUploadUrl: "/api/documents/upload",
        });
        done.push({
          name: file.name,
          url: blob.url,
          pathname: blob.pathname,
          size: file.size,
          contentType: file.type || undefined,
        });
      }
    } catch (e) {
      setError((e as Error).message || "Upload failed.");
    }

    /* Record whatever made it, even if a later file failed — re-uploading the
       ones that already landed would just duplicate them. */
    if (done.length > 0) {
      setProgress("Saving…");
      const result = await recordUploads(folderId, done);
      if (result.error) setError(result.error);
      else router.refresh();
    }

    setBusy(false);
    setProgress("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => onPick(e.target.files)}
      />
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {busy ? progress || "Uploading…" : "Upload files"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-brand-red">
          {error}
        </p>
      )}
    </>
  );
};
