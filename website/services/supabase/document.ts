import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { DocumentFolder } from "@typings/document/DocumentFolder";
import { DocumentFile } from "@typings/document/DocumentFile";
import { FolderCrumb } from "@interfaces/models/document/FolderCrumb";

/* Root is represented as a null parent_id/folder_id in the database, and as an
   absent id in the URL. is() rather than eq() — Postgres never matches NULL
   with =, so eq("parent_id", null) silently returns nothing. */
const atLevel = <T extends { is: (c: string, v: null) => T; eq: (c: string, v: string) => T }>(
  query: T,
  column: string,
  parent: string | null,
): T => (parent ? query.eq(column, parent) : query.is(column, null));

/** Folders directly inside `parent` (null = root), A–Z. */
export const listFolders = async (
  sb: SupabaseClient,
  parent: string | null,
): Promise<DocumentFolder[]> => {
  const { data } = await atLevel(
    sb.from("document_folders").select("*"),
    "parent_id",
    parent,
  ).order("name");
  return data ?? [];
};

/** Files directly inside `folder` (null = root), A–Z. */
export const listDocuments = async (
  sb: SupabaseClient,
  folder: string | null,
): Promise<DocumentFile[]> => {
  const { data } = await atLevel(
    sb.from("documents").select("*"),
    "folder_id",
    folder,
  ).order("name");
  return data ?? [];
};

export const getFolder = async (
  sb: SupabaseClient,
  id: string,
): Promise<DocumentFolder | null> => {
  const { data } = await sb
    .from("document_folders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
};

export const getDocument = async (
  sb: SupabaseClient,
  id: string,
): Promise<DocumentFile | null> => {
  const { data } = await sb
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
};

/**
 * The breadcrumb trail from the root down to `id`, inclusive.
 *
 * Walks up parent by parent — one round trip per level, which is fine for a
 * hierarchy a person types by hand and keeps the query trivially RLS-scoped.
 * The depth guard is a cycle stop: parent_id is only ever set to an existing
 * folder so a loop shouldn't be constructible, but an unbounded `while` that
 * trusts that would hang the request rather than render a wrong breadcrumb.
 */
export const getFolderPath = async (
  sb: SupabaseClient,
  id: string,
): Promise<FolderCrumb[]> => {
  const crumbs: FolderCrumb[] = [];
  let current: string | null = id;
  for (let depth = 0; current && depth < 32; depth++) {
    const folder: DocumentFolder | null = await getFolder(sb, current);
    if (!folder) break;
    crumbs.unshift({ id: folder.id, name: folder.name });
    current = folder.parent_id;
  }
  return crumbs;
};

export const createFolder = async (
  sb: SupabaseClient,
  values: { user_id: string; parent_id: string | null; name: string },
): Promise<{ id?: string; error?: string }> => {
  const { data, error } = await sb
    .from("document_folders")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};

export const renameFolder = async (
  sb: SupabaseClient,
  id: string,
  name: string,
): Promise<{ error?: string }> => {
  const { error } = await sb
    .from("document_folders")
    .update({ name })
    .eq("id", id);
  return { error: error?.message };
};

export const createDocuments = async (
  sb: SupabaseClient,
  values: Array<{
    user_id: string;
    folder_id: string | null;
    name: string;
    blob_url: string;
    blob_pathname: string;
    size: number;
    content_type: string | null;
  }>,
): Promise<{ count: number; error?: string }> => {
  if (values.length === 0) return { count: 0 };
  const { data, error } = await sb.from("documents").insert(values).select("id");
  return { count: data?.length ?? 0, error: error?.message };
};

export const deleteDocument = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("documents").delete().eq("id", id);
};

/**
 * Every document at or beneath `folder`, each with its path relative to that
 * folder — what the zip download walks, and what the delete needs in order to
 * clear the bucket. Recursive in SQL; see the folder_documents migration.
 */
export const listFolderTree = async (
  sb: SupabaseClient,
  folder: string,
): Promise<
  Array<{
    id: string;
    name: string;
    blob_url: string;
    blob_pathname: string;
    size: number;
    content_type: string | null;
    rel_path: string;
  }>
> => {
  const { data } = await sb.rpc("folder_documents", { root: folder });
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    blob_url: r.blob_url,
    blob_pathname: r.blob_pathname,
    size: Number(r.size),
    content_type: r.content_type,
    rel_path: r.rel_path,
  }));
};

/**
 * Delete a folder subtree, returning the now-orphaned blob keys so the caller
 * can clear them from the bucket. The rows go first, in one transaction — see
 * the migration for why that order and not the other.
 */
export const deleteFolderCascade = async (
  sb: SupabaseClient,
  folder: string,
): Promise<string[]> => {
  const { data } = await sb.rpc("delete_folder_cascade", { folder });
  return (data ?? []).map((r) => r.blob_pathname).filter(Boolean);
};
