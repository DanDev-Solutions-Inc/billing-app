import Link from "next/link";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  Download,
  ChevronRight,
  House,
} from "lucide-react";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
  ConfirmButton,
  RowAction,
} from "@components/ui";
import { DocumentUploader } from "@components/documents/document-uploader";
import { NewFolderButton } from "@components/documents/new-folder-button";
import { deleteDocument, deleteFolder } from "@app/(app)/documents/actions";
import { formatBytes } from "@utils/bytes";
import { formatDate } from "@utils/money";
import { DocumentBrowserProps } from "@interfaces/components/DocumentBrowserProps";

/* A rough icon per family — enough to tell a scan from a spreadsheet at a
   glance, without pretending to be a full MIME table. */
const iconFor = (contentType: string | null, name: string) => {
  const kind = `${contentType ?? ""} ${name.toLowerCase()}`;
  if (/image|\.jpe?g|\.png|\.heic|\.webp|\.tiff?/.test(kind)) return FileImage;
  if (/sheet|excel|csv|\.xlsx?|\.csv/.test(kind)) return FileSpreadsheet;
  return FileText;
};

export const DocumentBrowser = ({
  folder,
  crumbs,
  folders,
  documents,
  userId,
  canEdit,
}: DocumentBrowserProps) => {
  const empty = folders.length === 0 && documents.length === 0;

  return (
    <>
      {/* Breadcrumbs are the only way back up — there's no tree sidebar, and a
          folder five deep otherwise strands you on the browser Back button. */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 outline-none transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <House className="size-4" />
          Documents
        </Link>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="size-4 shrink-0 opacity-50" />
              {last ? (
                <span aria-current="page" className="px-2 py-1 font-medium text-foreground">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={`/documents/${crumb.id}`}
                  className="rounded-lg px-2 py-1 outline-none transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {crumb.name}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {canEdit && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <DocumentUploader folderId={folder?.id ?? null} userId={userId} />
          <NewFolderButton parentId={folder?.id ?? null} />
        </div>
      )}

      {empty ? (
        <EmptyState
          title={folder ? `${folder.name} is empty` : "No documents yet"}
          description={
            canEdit
              ? "Make a folder, or upload the statements and receipts your accountant asks for."
              : "Nothing has been filed here yet."
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Folders first, as every file manager does — they're the
                  navigation, and burying them among files makes the tree
                  hard to walk. */}
              {folders.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link
                      href={`/documents/${f.id}`}
                      className="inline-flex items-center gap-2.5 font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <Folder className="size-4 shrink-0 text-brand-accent" />
                      {f.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    —
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(f.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowAction className="justify-end">
                      <a
                        href={`/api/documents/folders/${f.id}/zip`}
                        title={`Download ${f.name} as a zip`}
                        aria-label={`Download ${f.name} as a zip`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                      >
                        <Download className="size-4" />
                      </a>
                      {canEdit && (
                        <ConfirmButton
                          action={deleteFolder}
                          id={f.id}
                          title={`Delete “${f.name}”?`}
                          description="Everything inside it — subfolders and files — is deleted too. This cannot be undone."
                          triggerLabel={`Delete ${f.name}`}
                        />
                      )}
                    </RowAction>
                  </TableCell>
                </TableRow>
              ))}

              {documents.map((d) => {
                const Icon = iconFor(d.content_type, d.name);
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      {/* Opens in a new tab rather than downloading: most of
                          these are PDFs you want to glance at, and the
                          download arrow is right there when you mean it. */}
                      <a
                        href={`/api/documents/${d.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2.5 text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        {d.name}
                      </a>
                    </TableCell>
                    <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                      {formatBytes(d.size)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(d.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowAction className="justify-end">
                        <a
                          href={`/api/documents/${d.id}/file?download=1`}
                          title={`Download ${d.name}`}
                          aria-label={`Download ${d.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                        >
                          <Download className="size-4" />
                        </a>
                        {canEdit && (
                          <ConfirmButton
                            action={deleteDocument}
                            id={d.id}
                            title={`Delete “${d.name}”?`}
                            description="The file is removed from storage. This cannot be undone."
                            triggerLabel={`Delete ${d.name}`}
                          />
                        )}
                      </RowAction>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
};
