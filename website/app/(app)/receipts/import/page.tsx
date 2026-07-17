import { Metadata } from "next";
import { getUserOrRedirect } from "@lib/dal";
import { PageHeader } from "@components/ui";
import { BulkReceiptUploader } from "@components/receipts/bulk-receipt-uploader";

export const metadata: Metadata = { title: "Import receipts" };

const ImportReceiptsPage = async () => {
  await getUserOrRedirect();

  return (
    <>
      <PageHeader
        backHref="/receipts"
        title="Import receipts"
        subtitle="Bulk-upload receipt images exported from Wave."
      />
      <BulkReceiptUploader />
    </>
  );
};

export default ImportReceiptsPage;
