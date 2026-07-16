import { WaveMoney } from "@interfaces/models/wave/WaveMoney";
import { WaveInvoiceItem } from "@interfaces/models/wave/WaveInvoiceItem";

export interface WaveInvoiceNode {
  id: string;
  invoiceNumber: string | null;
  status: string;
  invoiceDate: string | null;
  dueDate: string | null;
  memo: string | null;
  subtotal: WaveMoney;
  taxTotal: WaveMoney;
  total: WaveMoney;
  amountDue: WaveMoney;
  customer: { id: string } | null;
  items: WaveInvoiceItem[];
}
