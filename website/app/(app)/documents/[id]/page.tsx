import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect, isOwner } from "@lib/dal";
import {
  getFolder,
  getFolderPath,
  listFolders,
  listDocuments,
} from "@services/supabase/document";
import { PageHeader, ButtonLink } from "@components/ui";
import { Download } from "lucide-react";
import { DocumentBrowser } from "@components/documents/document-browser";

export const metadata: Metadata = { title: "Documents" };

const FolderPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const user = await getUserOrRedirect();
  const supabase = await createClient();

  /* RLS-scoped, so a folder belonging to someone else is indistinguishable
     from one that doesn't exist. */
  const folder = await getFolder(supabase, id);
  if (!folder) notFound();

  const [crumbs, folders, documents] = await Promise.all([
    getFolderPath(supabase, id),
    listFolders(supabase, id),
    listDocuments(supabase, id),
  ]);

  return (
    <>
      <PageHeader
        title={folder.name}
        subtitle="Folders and files for your accountant."
        backHref="/documents"
        action={
          /* The whole point of the section: hand the accountant one file
             rather than forty. Plain <a> — a download is a navigation the
             router shouldn't intercept. */
          <ButtonLink
            href={`/api/documents/folders/${folder.id}/zip`}
            variant="secondary"
            size="sm"
            prefetch={false}
          >
            <Download />
            Download folder
          </ButtonLink>
        }
      />
      <DocumentBrowser
        folder={folder}
        crumbs={crumbs}
        folders={folders}
        documents={documents}
        userId={user.id}
        canEdit={isOwner(user.email)}
      />
    </>
  );
};

export default FolderPage;
