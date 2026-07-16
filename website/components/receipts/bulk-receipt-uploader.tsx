"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createReceiptsFromUploads } from "@app/(app)/receipts/actions";
import { UploadedReceipt } from "@interfaces/forms/UploadedReceipt";
import { Card, Button } from "@components/ui";

export const BulkReceiptUploader = () => {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string>();
  const [savedCount, setSavedCount] = useState<number>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setBusy(true);
    setError(undefined);
    setDone(0);
    setSavedCount(undefined);
    try {
      const uploaded: UploadedReceipt[] = [];
      for (const file of files) {
        const blob = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/receipts/upload",
        });
        uploaded.push({ url: blob.url, pathname: blob.pathname, filename: file.name });
        setDone((n) => n + 1);
      }
      const result = await createReceiptsFromUploads(uploaded);
      if (result.error) setError(result.error);
      else {
        setSavedCount(result.count);
        setFiles([]);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Select all the receipt images you exported from Wave. Each becomes a
          receipt you can label with a vendor and amount afterward.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-blue"
        />
        {files.length > 0 && (
          <p className="text-sm text-foreground">
            {files.length} image{files.length === 1 ? "" : "s"} selected
          </p>
        )}
        {busy && (
          <p className="text-sm text-muted">
            Uploading… {done}/{files.length}
          </p>
        )}
        {error && <p className="text-sm text-brand-red">{error}</p>}
        {savedCount !== undefined && (
          <p className="rounded-lg bg-brand-green/10 px-4 py-2 text-sm text-brand-green">
            Saved {savedCount} receipt{savedCount === 1 ? "" : "s"}.
          </p>
        )}
        <div>
          <Button type="submit" disabled={busy || files.length === 0}>
            {busy ? "Uploading…" : `Upload ${files.length || ""} receipts`.trim()}
          </Button>
        </div>
      </form>
    </Card>
  );
};
