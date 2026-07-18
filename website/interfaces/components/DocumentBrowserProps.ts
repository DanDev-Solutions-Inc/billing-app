import { DocumentFolder } from "@typings/document/DocumentFolder";
import { DocumentFile } from "@typings/document/DocumentFile";
import { FolderCrumb } from "@interfaces/models/document/FolderCrumb";

export interface DocumentBrowserProps {
  /** The open folder, or null at the root. */
  folder: DocumentFolder | null;
  crumbs: FolderCrumb[];
  folders: DocumentFolder[];
  documents: DocumentFile[];
  userId: string;
  /**
   * Owner-only. A shared viewer (the accountant) browses and downloads but
   * sees no upload, new-folder or delete controls. RLS enforces the same thing
   * server-side — this only keeps the UI from offering what would fail.
   */
  canEdit: boolean;
}
