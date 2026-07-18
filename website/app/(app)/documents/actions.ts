"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import * as documents from "@services/supabase/document";
import { UploadedDocument } from "@interfaces/forms/UploadedDocument";
import { DocumentActionState } from "@interfaces/forms/DocumentActionState";

/* Every write here is owner-only at the database level ("modify own"), so a
   shared viewer — the accountant — reaching these actions gets an RLS error
   rather than a changed file. The UI hides the controls; this is what enforces
   it. */

const emptyToNull = (value: FormDataEntryValue | null): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : text;
};

/** Where to send the browser back to after a mutation. */
const pathFor = (folderId: string | null): string =>
  folderId ? `/documents/${folderId}` : "/documents";

export const createFolder = async (
  formData: FormData,
): Promise<DocumentActionState> => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();

  const name = emptyToNull(formData.get("name"));
  if (!name) return { error: "Give the folder a name." };
  const parentId = emptyToNull(formData.get("parent_id"));

  const { error } = await documents.createFolder(supabase, {
    user_id: user.id,
    parent_id: parentId,
    name,
  });
  /* 23505 is the unique index on (user, parent, lower(name)). Postgres phrases
     that as a constraint violation; the person just picked a name that's
     already there. */
  if (error)
    return {
      error: error.includes("duplicate key")
        ? `“${name}” already exists here.`
        : error,
    };

  revalidatePath(pathFor(parentId));
  return { ok: true };
};

export const renameFolder = async (
  formData: FormData,
): Promise<DocumentActionState> => {
  await getUserOrRedirect();
  const supabase = await createClient();

  const id = emptyToNull(formData.get("id"));
  const name = emptyToNull(formData.get("name"));
  if (!id || !name) return { error: "Give the folder a name." };

  const { error } = await documents.renameFolder(supabase, id, name);
  if (error)
    return {
      error: error.includes("duplicate key")
        ? `“${name}” already exists here.`
        : error,
    };

  revalidatePath(`/documents/${id}`);
  const folder = await documents.getFolder(supabase, id);
  revalidatePath(pathFor(folder?.parent_id ?? null));
  return { ok: true };
};

/**
 * Record documents whose bytes are already in the bucket.
 *
 * The browser uploads straight to Blob (see /api/documents/upload), so what
 * arrives here is metadata. A file that uploaded but failed to record would be
 * invisible in the UI while still costing storage, so the row write is the
 * step that "completes" an upload.
 */
export const recordUploads = async (
  folderId: string | null,
  uploads: UploadedDocument[],
): Promise<DocumentActionState> => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();

  const { error } = await documents.createDocuments(
    supabase,
    uploads.map((u) => ({
      user_id: user.id,
      folder_id: folderId,
      name: u.name,
      blob_url: u.url,
      blob_pathname: u.pathname,
      size: u.size,
      content_type: u.contentType ?? null,
    })),
  );
  if (error) return { error };

  revalidatePath(pathFor(folderId));
  return { ok: true };
};

/* The two deletes redirect rather than returning state, matching every other
   delete in the app: they're driven by ConfirmButton, which posts a plain form
   and expects the navigation to carry the result. redirect() throws, so it must
   stay outside any try/catch — catching it surfaces NEXT_REDIRECT as an error. */

export const deleteDocument = async (formData: FormData): Promise<void> => {
  await getUserOrRedirect();
  const supabase = await createClient();

  const id = emptyToNull(formData.get("id"));
  if (!id) return;

  const doc = await documents.getDocument(supabase, id);
  if (!doc) return;

  await documents.deleteDocument(supabase, id);
  /* Row first, then the object: a failed blob delete costs storage, whereas a
     failed row delete would leave a document listed that can't be opened. */
  try {
    await del(doc.blob_pathname);
  } catch {
    // Already gone, or no token configured — the row is what mattered.
  }

  const back = pathFor(doc.folder_id);
  revalidatePath(back);
  redirect(`${back}?toast=document-deleted`);
};

export const deleteFolder = async (formData: FormData): Promise<void> => {
  await getUserOrRedirect();
  const supabase = await createClient();

  const id = emptyToNull(formData.get("id"));
  if (!id) return;

  const folder = await documents.getFolder(supabase, id);
  if (!folder) return;

  /* Returns the whole subtree's blob keys, gathered before the rows go. */
  const orphaned = await documents.deleteFolderCascade(supabase, id);
  if (orphaned.length > 0) {
    try {
      await del(orphaned);
    } catch {
      // Storage left behind; the tree is gone, which is what was asked for.
    }
  }

  const back = pathFor(folder.parent_id);
  revalidatePath(back);
  redirect(`${back}?toast=folder-deleted`);
};
