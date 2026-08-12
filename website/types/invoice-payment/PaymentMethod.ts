import { PAYMENT_METHODS } from "@utils/constants";

/** How a payment arrived — the values allowed in invoice_payments.method. */
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
