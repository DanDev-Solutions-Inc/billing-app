import { ToastTone } from "@typings/ui/ToastTone";

/**
 * Messages a Server Action can flash after redirecting, keyed by a short token
 * it appends as `?toast=`. Keys rather than free text so a redirect can't be
 * used to inject arbitrary content into the page.
 */
export const TOAST_MESSAGES: Record<string, { message: string; tone: ToastTone }> = {
  "invoice-created": { message: "Invoice created.", tone: "success" },
  "invoice-saved": { message: "Invoice updated.", tone: "success" },
  "invoice-deleted": { message: "Invoice deleted.", tone: "success" },
  "estimate-saved": { message: "Estimate updated.", tone: "success" },
  "estimate-created": { message: "Estimate created.", tone: "success" },
  "estimate-deleted": { message: "Estimate deleted.", tone: "success" },
  "estimate-converted": { message: "Estimate converted to an invoice.", tone: "success" },
  "receipt-saved": { message: "Receipt saved.", tone: "success" },
  "receipt-deleted": { message: "Receipt deleted.", tone: "success" },
  "transaction-saved": { message: "Transaction saved.", tone: "success" },
  "transaction-updated": { message: "Changes saved.", tone: "success" },
  "transaction-approved": { message: "Transaction approved.", tone: "success" },
  "transaction-reopened": { message: "Transaction reopened.", tone: "info" },
  "transaction-deleted": {
    message: "Transaction and its receipt deleted.",
    tone: "success",
  },
  "transactions-approved": { message: "Transactions reviewed.", tone: "success" },
  "transactions-reopened": { message: "Transactions reopened.", tone: "info" },
  "transactions-updated": { message: "Transactions updated.", tone: "success" },
  "customer-saved": { message: "Customer saved.", tone: "success" },
  "customer-deleted": { message: "Customer deleted.", tone: "success" },
  "recurring-created": { message: "Schedule created.", tone: "success" },
  "recurring-saved": { message: "Schedule saved.", tone: "success" },
  "recurring-deleted": { message: "Schedule deleted.", tone: "success" },
};
