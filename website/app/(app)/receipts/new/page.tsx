import { Metadata } from "next";
import { getUserOrRedirect } from "@lib/dal";
import { PageHeader } from "@components/ui";
import { ReceiptUploader } from "@components/receipts/receipt-uploader";

export const metadata: Metadata = { title: "Add receipt" };

const NewReceiptPage = async () => {
  await getUserOrRedirect();

  return (
    <>
      <PageHeader
        title="Add receipt"
        subtitle="Snap a photo or upload an image of your receipt."
      />
      <ReceiptUploader />
    </>
  );
};

export default NewReceiptPage;
