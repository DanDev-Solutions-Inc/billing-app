import { PAYMENT_METHODS } from "@utils/constants";
import { PaymentMethod } from "@typings/invoice-payment/PaymentMethod";

/** Narrows a posted form value to a method the column will accept. */
export const isPaymentMethod = (value: string): value is PaymentMethod =>
  PAYMENT_METHODS.some((m) => m.value === value);
