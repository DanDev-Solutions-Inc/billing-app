export interface DocumentUploaderProps {
  /** Folder the files land in; null is the root. */
  folderId: string | null;
  /** Owner id — the Blob pathname prefix the upload token requires. */
  userId: string;
}
