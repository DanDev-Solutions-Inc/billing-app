import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect, isOwner } from "@lib/dal";
import { listFolders, listDocuments } from "@services/supabase/document";
import { PageHeader } from "@components/ui";
import { DocumentBrowser } from "@components/documents/document-browser";

export const metadata: Metadata = { title: "Documents" };

const DocumentsPage = async () => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();
  const [folders, documents] = await Promise.all([
    listFolders(supabase, null),
    listDocuments(supabase, null),
  ]);

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Folders and files for your accountant."
      />
      <DocumentBrowser
        folder={null}
        crumbs={[]}
        folders={folders}
        documents={documents}
        userId={user.id}
        canEdit={isOwner(user.email)}
      />
    </>
  );
};

export default DocumentsPage;
