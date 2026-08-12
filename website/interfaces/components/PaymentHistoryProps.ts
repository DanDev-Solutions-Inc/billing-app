import { CurrencyCode } from "@typings/CurrencyCode";
import { InvoicePayment } from "@typings/invoice-payment/InvoicePayment";

export interface PaymentHistoryProps {
  payments: InvoicePayment[];
  total: number;
  paid: number;
  balance: number;
  currency: CurrencyCode;
}
